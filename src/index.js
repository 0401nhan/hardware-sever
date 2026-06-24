import "dotenv/config";

import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";

import { openDatabase } from "./db.js";
import { gatewayRemoteAccessFromBody, normalizeRemoteAccess } from "./remoteAccess.js";
import { gatewayTailscaleBaseUrl, getGatewayPublicJson } from "./tailscaleGatewayClient.js";
import { readTailscaleStatusJson, syncTailscaleGateways } from "./tailscaleDiscovery.js";
import { renderDashboardPage, renderLoginPage } from "./ui.js";

const PUBLIC_DIR = new URL("../public/", import.meta.url);
const PUBLIC_ASSETS = new Map([
  ["/favicon.ico", "logo/logo-login-mark.png"],
  ["/logo/logo-login-mark.png", "logo/logo-login-mark.png"],
  ["/logo/logo-smallsize.png", "logo/logo-smallsize.png"],
]);
const config = {
  host: process.env.HOST || "0.0.0.0",
  port: Number.parseInt(process.env.PORT || "8080", 10),
  publicUrl: process.env.PUBLIC_URL || "https://server.electricbird.vn",
  dbPath: process.env.DB_PATH || "data/hardware-server.sqlite",
  adminUsername: process.env.ADMIN_USERNAME || "admin",
  adminPassword: process.env.ADMIN_PASSWORD || "admin",
  sessionSecret: process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || "development-session-secret",
  sessionTtlMs: positiveIntegerEnv("ADMIN_SESSION_TTL_MS", 7 * 24 * 60 * 60 * 1000),
  gatewayOfflineAfterMs: positiveIntegerEnv("GATEWAY_OFFLINE_AFTER_MS", 90_000),
  tailscaleGatewayTimeoutMs: positiveIntegerEnv("TAILSCALE_GATEWAY_TIMEOUT_MS", 10000),
  tailscaleSyncEnabled: booleanEnv("TAILSCALE_SYNC_ENABLED", true),
  tailscaleSyncIntervalMs: positiveIntegerEnv("TAILSCALE_SYNC_INTERVAL_MS", 30000),
  tailscaleSyncTimeoutMs: positiveIntegerEnv("TAILSCALE_SYNC_TIMEOUT_MS", 5000),
  tailscaleSyncCliPath: process.env.TAILSCALE_CLI_PATH || "",
  tailscaleSyncStatusJson: process.env.TAILSCALE_STATUS_JSON || "",
  tailscaleSyncIncludeOffline: booleanEnv("TAILSCALE_SYNC_INCLUDE_OFFLINE", false),
  tailscaleSyncAllowedOs: stringListEnv("TAILSCALE_SYNC_OS", ["linux"]),
  tailscaleSyncUiPort: positiveIntegerEnv("TAILSCALE_SYNC_UI_PORT", 80),
  tailscaleSyncSshPort: positiveIntegerEnv("TAILSCALE_SYNC_SSH_PORT", 22),
  tailscaleSyncTag: process.env.TAILSCALE_SYNC_TAG || "tag:gateway",
};

let store;
let server;
let tailscaleSyncTimer;
let tailscaleSyncPromise;

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function main() {
  store = await openDatabase(config.dbPath, {
    offlineAfterMs: config.gatewayOfflineAfterMs,
  });
  startTailscaleSyncLoop();

  server = http.createServer(async (req, res) => {
    try {
      const pathname = requestPath(req);

      if ((req.method === "GET" || req.method === "HEAD") && PUBLIC_ASSETS.has(pathname)) {
        return sendFile(res, new URL(PUBLIC_ASSETS.get(pathname), PUBLIC_DIR), "image/png", req.method === "HEAD");
      }

      if (req.method === "GET" && pathname === "/api/health") {
        return sendJson(res, 200, {
          ok: true,
          time: new Date().toISOString(),
        });
      }

      if (req.method === "GET" && pathname === "/login") {
        if (isAdminAuthenticated(req)) return redirect(res, "/");
        return sendHtml(res, renderLoginPage());
      }

      if (req.method === "POST" && pathname === "/api/login") {
        const body = await readJsonBody(req);

        if (!isValidLogin(body)) {
          return sendJson(res, 401, {
            ok: false,
            error: "Invalid username or password",
          });
        }

        return sendJson(res, 200, {
          ok: true,
        }, {
          "Set-Cookie": buildSessionCookie(req),
        });
      }

      if (req.method === "POST" && pathname === "/api/logout") {
        return sendJson(res, 200, {
          ok: true,
        }, {
          "Set-Cookie": clearSessionCookie(req),
        });
      }

      if (!isAdminAuthenticated(req)) {
        if (pathname.startsWith("/api/")) {
          return sendJson(res, 401, {
            ok: false,
            error: "Authentication required",
          });
        }

        return redirect(res, "/login");
      }

      if (req.method === "GET" && pathname === "/") {
        return sendHtml(res, renderDashboardPage({ publicUrl: config.publicUrl }));
      }

      const gatewayRemoteProxyMatch = pathname.match(/^\/gateways\/([^/]+)\/remote(\/.*)?$/);
      if (gatewayRemoteProxyMatch) {
        const gatewayId = decodeURIComponent(gatewayRemoteProxyMatch[1]);
        const gateway = await store.getGateway(gatewayId);

        if (!gateway) {
          return sendJson(res, 404, {
            ok: false,
            error: "Gateway not found",
          });
        }

        const url = new URL(req.url || "/", "http://localhost");
        const proxyBasePath = `/gateways/${encodeURIComponent(gatewayId)}/remote`;
        const remotePath = gatewayRemoteProxyMatch[2] || "/";

        if (!gatewayRemoteProxyMatch[2]) {
          return redirect(res, `${proxyBasePath}/${url.search}`);
        }

        return proxyGatewayRemote(req, res, {
          gateway,
          proxyBasePath,
          remotePath,
          search: url.search,
        });
      }

      if (req.method === "GET" && pathname === "/api/gateways") {
        await syncTailscaleGatewaysIfEnabled("list");
        return sendJson(res, 200, {
          ok: true,
          gateways: await store.listGateways(),
        });
      }

      if (req.method === "POST" && pathname === "/api/tailscale/sync") {
        const result = await syncTailscaleGatewaysIfEnabled("manual", { force: true });
        return sendJson(res, 200, {
          ok: true,
          ...(result || { skipped: true }),
        });
      }

      if (req.method === "POST" && pathname === "/api/gateways") {
        const body = await readJsonBody(req);
        const id = String(body.id || body.gateway_id || "").trim();

        if (!id) {
          return sendJson(res, 400, {
            ok: false,
            error: "Gateway ID is required",
          });
        }

        const gateway = await store.upsertGateway({
          id,
          name: String(body.name || id).trim(),
          site: String(body.site || "").trim(),
          remoteAccess: gatewayRemoteAccessFromBody(body),
        });

        return sendJson(res, 200, {
          ok: true,
          gateway,
        });
      }

      const gatewayMatch = pathname.match(/^\/api\/gateways\/([^/]+)$/);
      if (gatewayMatch && req.method === "GET") {
        const gateway = await store.getGateway(decodeURIComponent(gatewayMatch[1]));

        if (!gateway) {
          return sendJson(res, 404, {
            ok: false,
            error: "Gateway not found",
          });
        }

        return sendJson(res, 200, {
          ok: true,
          gateway,
        });
      }

      if (gatewayMatch && (req.method === "PUT" || req.method === "PATCH")) {
        const gatewayId = decodeURIComponent(gatewayMatch[1]);
        const body = await readJsonBody(req);
        const gateway = await store.updateGatewayRemoteAccess(gatewayId, normalizeRemoteAccess(body.remoteAccess ?? body));

        if (!gateway) {
          return sendJson(res, 404, {
            ok: false,
            error: "Gateway not found",
          });
        }

        return sendJson(res, 200, {
          ok: true,
          gateway,
        });
      }

      if (gatewayMatch && req.method === "DELETE") {
        const gatewayId = decodeURIComponent(gatewayMatch[1]);
        const gateway = await store.deleteGateway(gatewayId);

        if (!gateway) {
          return sendJson(res, 404, {
            ok: false,
            error: "Gateway not found",
          });
        }

        return sendJson(res, 200, {
          ok: true,
          gateway,
        });
      }

      const gatewayTailscaleHealthMatch = pathname.match(/^\/api\/gateways\/([^/]+)\/tailscale\/health$/);
      if (gatewayTailscaleHealthMatch && req.method === "GET") {
        const gatewayId = decodeURIComponent(gatewayTailscaleHealthMatch[1]);
        const gateway = await store.getGateway(gatewayId);

        if (!gateway) {
          return sendJson(res, 404, {
            ok: false,
            error: "Gateway not found",
          });
        }

        const result = await getGatewayPublicJson({
          gateway,
          path: "/api/health",
          timeoutMs: config.tailscaleGatewayTimeoutMs,
        });

        return sendJson(res, 200, {
          ok: true,
          mode: "tailscale_proxy",
          gatewayBaseUrl: result.baseUrl,
          gateway: result.payload,
        });
      }

      sendJson(res, 404, {
        ok: false,
        error: "Not found",
      });
    } catch (error) {
      const status = error.statusCode || 500;
      console.error(error);
      sendJson(res, status, {
        ok: false,
        error: error.message,
      });
    }
  });

  server.listen(config.port, config.host, () => {
    console.log(`Hardware server listening on http://${config.host}:${config.port}`);
  });
}

async function proxyGatewayRemote(req, res, { gateway, proxyBasePath, remotePath, search = "" }) {
  const gatewayBaseUrl = gatewayTailscaleBaseUrl(gateway);
  const targetUrl = new URL(`${remotePath}${search}`, `${gatewayBaseUrl}/`);
  const body = ["GET", "HEAD"].includes(req.method || "") ? undefined : await readRawBody(req);
  const response = await fetch(targetUrl, {
    method: req.method,
    headers: proxyRequestHeaders(req, body),
    body,
    redirect: "manual",
    ...(body === undefined ? {} : { duplex: "half" }),
  });

  const responseHeaders = proxyResponseHeaders(response, {
    gatewayBaseUrl,
    proxyBasePath,
  });
  const contentType = response.headers.get("content-type") || "";
  const payload = Buffer.from(await response.arrayBuffer());

  if (req.method === "HEAD") {
    res.writeHead(response.status, responseHeaders);
    return res.end();
  }

  if (contentType.includes("text/html")) {
    const html = rewriteGatewayProxyHtml(payload.toString("utf8"), proxyBasePath);
    responseHeaders["Content-Length"] = Buffer.byteLength(html);
    res.writeHead(response.status, responseHeaders);
    return res.end(html);
  }

  responseHeaders["Content-Length"] = payload.length;
  res.writeHead(response.status, responseHeaders);
  return res.end(payload);
}

async function readRawBody(req) {
  const chunks = [];
  let size = 0;

  for await (const chunk of req) {
    size += chunk.length;
    if (size > 20 * 1024 * 1024) {
      throw httpError(413, "Request body is too large");
    }
    chunks.push(chunk);
  }

  return chunks.length ? Buffer.concat(chunks) : undefined;
}

function proxyRequestHeaders(req, body) {
  const headers = {};
  const skip = new Set([
    "accept-encoding",
    "connection",
    "content-length",
    "host",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
  ]);

  for (const [key, value] of Object.entries(req.headers)) {
    const lower = key.toLowerCase();
    if (skip.has(lower)) continue;
    if (lower === "cookie") {
      const cookie = proxyCookieHeader(value);
      if (cookie) headers[key] = cookie;
      continue;
    }
    headers[key] = Array.isArray(value) ? value.join(", ") : String(value);
  }

  if (body) headers["Content-Length"] = String(body.length);
  return headers;
}

function proxyCookieHeader(value) {
  return String(Array.isArray(value) ? value.join("; ") : value || "")
    .split(";")
    .map((item) => item.trim())
    .filter((item) => item && !item.toLowerCase().startsWith("hardware_server_session="))
    .join("; ");
}

function proxyResponseHeaders(response, { gatewayBaseUrl, proxyBasePath }) {
  const headers = {};
  const skip = new Set([
    "connection",
    "content-encoding",
    "content-length",
    "keep-alive",
    "set-cookie",
    "transfer-encoding",
  ]);

  for (const [key, value] of response.headers) {
    const lower = key.toLowerCase();
    if (skip.has(lower)) continue;
    if (lower === "location") {
      headers.Location = rewriteGatewayProxyLocation(value, gatewayBaseUrl, proxyBasePath);
      continue;
    }
    headers[key] = value;
  }

  const setCookie = proxySetCookieHeaders(response.headers, proxyBasePath);
  if (setCookie.length) headers["Set-Cookie"] = setCookie;
  return headers;
}

function proxySetCookieHeaders(headers, proxyBasePath) {
  const cookies = typeof headers.getSetCookie === "function"
    ? headers.getSetCookie()
    : [headers.get("set-cookie")].filter(Boolean);

  return cookies.map((cookie) => {
    let next = cookie.replace(/;\s*Domain=[^;]*/gi, "");
    next = /;\s*Path=/i.test(next)
      ? next.replace(/;\s*Path=[^;]*/i, `; Path=${proxyBasePath}`)
      : `${next}; Path=${proxyBasePath}`;
    return next;
  });
}

function rewriteGatewayProxyLocation(location, gatewayBaseUrl, proxyBasePath) {
  if (!location) return location;

  try {
    const gatewayUrl = new URL(gatewayBaseUrl);
    const nextUrl = new URL(location, `${gatewayBaseUrl}/`);
    if (nextUrl.origin === gatewayUrl.origin) {
      return `${proxyBasePath}${nextUrl.pathname === "/" ? "/" : nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
    }
  } catch {
    // Fall through to relative rewrite.
  }

  if (location.startsWith("/")) return `${proxyBasePath}${location}`;
  if (!/^[a-z][a-z\d+.-]*:\/\//i.test(location)) return `${proxyBasePath}/${location}`;
  return location;
}

function rewriteGatewayProxyHtml(html, proxyBasePath) {
  const base = proxyBasePath.replace(/\/+$/, "");
  return html
    .replace(/window\.location\.assign\((["'])\/([^"']*)\1\)/g, (_match, quote, path) => {
      return `window.location.assign(${quote}${base}/${path}${quote})`;
    })
    .replace(/(["'])\/(api|assets)(?=\/|\?)/g, `$1${base}/$2`)
    .replace(/(["'])\/favicon\.ico(["'])/g, `$1${base}/favicon.ico$2`)
    .replace(/(["'])\/login(["'])/g, `$1${base}/login$2`);
}

async function readJsonBody(req) {
  const chunks = [];
  let size = 0;

  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1024 * 1024) {
      throw httpError(413, "Request body is too large");
    }
    chunks.push(chunk);
  }

  if (chunks.length === 0) return {};

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw httpError(400, "Invalid JSON body");
  }
}

function isValidLogin(body) {
  return safeEqual(body?.username, config.adminUsername) && safeEqual(body?.password, config.adminPassword);
}

function isAdminAuthenticated(req) {
  const token = parseCookies(req).hardware_server_session;
  if (!token) return false;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expected = sign(payload, config.sessionSecret);
  if (!safeEqual(signature, expected)) return false;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return session.username === config.adminUsername && session.expiresAt > Date.now();
  } catch {
    return false;
  }
}

function buildSessionCookie(req) {
  const payload = Buffer.from(JSON.stringify({
    username: config.adminUsername,
    expiresAt: Date.now() + config.sessionTtlMs,
  })).toString("base64url");
  const token = `${payload}.${sign(payload, config.sessionSecret)}`;
  const secure = secureCookieAttribute(req);

  return [
    `hardware_server_session=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${Math.floor(config.sessionTtlMs / 1000)}`,
    secure,
  ].filter(Boolean).join("; ");
}

function clearSessionCookie(req) {
  return [
    "hardware_server_session=",
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
    secureCookieAttribute(req),
  ].filter(Boolean).join("; ");
}

function secureCookieAttribute(req) {
  if (String(process.env.COOKIE_SECURE || "").toLowerCase() === "false") return "";
  if (String(process.env.COOKIE_SECURE || "").toLowerCase() === "true") return "Secure";
  if (String(req?.headers?.["x-forwarded-proto"] || "").split(",")[0].trim() === "https") return "Secure";
  if (String(req?.headers?.["x-forwarded-ssl"] || "").toLowerCase() === "on") return "Secure";
  return config.publicUrl.startsWith("https://") ? "Secure" : "";
}

function sign(payload, secret) {
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

function parseCookies(req) {
  return String(req.headers.cookie || "").split(";").reduce((cookies, item) => {
    const [rawKey, ...rawValue] = item.trim().split("=");
    if (!rawKey) return cookies;
    cookies[decodeURIComponent(rawKey)] = decodeURIComponent(rawValue.join("="));
    return cookies;
  }, {});
}

function requestPath(req) {
  return new URL(req.url || "/", "http://localhost").pathname;
}

function startTailscaleSyncLoop() {
  if (!config.tailscaleSyncEnabled) return;

  syncTailscaleGatewaysIfEnabled("startup").catch((error) => {
    console.warn("Tailscale gateway sync failed:", error.message);
  });

  tailscaleSyncTimer = setInterval(() => {
    syncTailscaleGatewaysIfEnabled("interval").catch((error) => {
      console.warn("Tailscale gateway sync failed:", error.message);
    });
  }, config.tailscaleSyncIntervalMs);
  tailscaleSyncTimer.unref?.();
}

async function syncTailscaleGatewaysIfEnabled(_reason, { force = false } = {}) {
  if (!config.tailscaleSyncEnabled) return null;
  if (tailscaleSyncPromise && !force) return tailscaleSyncPromise;

  tailscaleSyncPromise = syncTailscaleGateways({
    store,
    includeOffline: config.tailscaleSyncIncludeOffline,
    allowedOs: config.tailscaleSyncAllowedOs,
    uiPort: config.tailscaleSyncUiPort,
    sshPort: config.tailscaleSyncSshPort,
    tag: config.tailscaleSyncTag,
    readStatus: () => readTailscaleStatusJson({
      cliPath: config.tailscaleSyncCliPath,
      statusJson: config.tailscaleSyncStatusJson,
      timeoutMs: config.tailscaleSyncTimeoutMs,
    }),
  }).catch((error) => ({
    ok: false,
    synced: 0,
    gateways: [],
    error: error.message,
  })).finally(() => {
    tailscaleSyncPromise = null;
  });

  const result = await tailscaleSyncPromise;
  if (result?.ok === false) {
    console.warn("Tailscale gateway sync failed:", result.error);
  }
  return result;
}

function sendJson(res, statusCode, payload, headers = {}) {
  send(res, statusCode, JSON.stringify(payload), {
    "Content-Type": "application/json; charset=utf-8",
    ...headers,
  });
}

function sendHtml(res, html, headers = {}) {
  send(res, 200, html, {
    "Content-Type": "text/html; charset=utf-8",
    ...headers,
  });
}

function sendFile(res, fileUrl, contentType, headOnly = false) {
  fs.readFile(fileUrl, (error, data) => {
    if (error) {
      res.writeHead(404, {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      });
      res.end("Not found");
      return;
    }

    res.writeHead(200, {
      "Content-Type": contentType,
      "Content-Length": data.length,
      "Cache-Control": "public, max-age=3600",
    });
    res.end(headOnly ? undefined : data);
  });
}

function send(res, statusCode, body, headers = {}) {
  res.writeHead(statusCode, {
    "Cache-Control": "no-store",
    ...headers,
  });
  res.end(body);
}

function redirect(res, location) {
  res.writeHead(302, {
    Location: location,
    "Cache-Control": "no-store",
  });
  res.end();
}

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function safeEqual(input, expected) {
  const inputHash = crypto.createHash("sha256").update(String(input ?? "")).digest();
  const expectedHash = crypto.createHash("sha256").update(String(expected ?? "")).digest();

  return crypto.timingSafeEqual(inputHash, expectedHash);
}

function positiveIntegerEnv(name, fallback) {
  const value = Number.parseInt(process.env[name] || "", 10);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function booleanEnv(name, fallback) {
  const value = String(process.env[name] || "").trim().toLowerCase();
  if (!value) return fallback;
  if (["1", "true", "yes", "on"].includes(value)) return true;
  if (["0", "false", "no", "off"].includes(value)) return false;
  return fallback;
}

function stringListEnv(name, fallback = []) {
  const value = String(process.env[name] || "").trim();
  if (!value) return fallback;
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}
