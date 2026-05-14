import "dotenv/config";

import crypto from "node:crypto";
import http from "node:http";

import { openDatabase } from "./db.js";
import { readDeviceTemplateSeed } from "./deviceTemplates.js";
import { createDefaultGatewayConfig, validateGatewayConfig } from "./validation.js";
import { renderDashboardPage, renderLoginPage } from "./ui.js";

const config = {
  host: process.env.HOST || "0.0.0.0",
  port: Number.parseInt(process.env.PORT || "8080", 10),
  publicUrl: process.env.PUBLIC_URL || "https://server.eletricbird.vn",
  dbPath: process.env.DB_PATH || "data/hardware-server.sqlite",
  deviceTemplatesPath: process.env.DEVICE_TEMPLATES_PATH || "config/device-templates.yml",
  adminUsername: process.env.ADMIN_USERNAME || "admin",
  adminPassword: process.env.ADMIN_PASSWORD || "admin",
  sessionSecret: process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || "development-session-secret",
  tokenHashSecret: process.env.TOKEN_HASH_SECRET || process.env.ADMIN_PASSWORD || "development-token-secret",
  provisioningToken: process.env.PROVISIONING_TOKEN || "replace-me",
  autoRegisterGateways: String(process.env.AUTO_REGISTER_GATEWAYS || "true").toLowerCase() === "true",
};

const store = await openDatabase(config.dbPath, config.tokenHashSecret);
const templateSeed = readDeviceTemplateSeed(config.deviceTemplatesPath);
store.seedDeviceTemplates(templateSeed.templates);

const server = http.createServer(async (req, res) => {
  try {
    const pathname = requestPath(req);

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
        "Set-Cookie": buildSessionCookie(),
      });
    }

    if (req.method === "POST" && pathname === "/api/logout") {
      return sendJson(res, 200, {
        ok: true,
      }, {
        "Set-Cookie": clearSessionCookie(),
      });
    }

    if (req.method === "POST" && pathname === "/api/gateway/heartbeat") {
      const body = await readJsonBody(req);
      authenticateGateway(req, body.gateway_id);
      const gateway = store.markHeartbeat(body.gateway_id, body.app_version || "");

      return sendJson(res, 200, {
        ok: true,
        gateway,
      });
    }

    if (req.method === "POST" && pathname === "/api/gateway/config/check") {
      const body = await readJsonBody(req);
      authenticateGateway(req, body.gateway_id);
      const latest = store.getLatestConfig(body.gateway_id);

      if (!latest) {
        return sendJson(res, 200, {
          ok: true,
          changed: false,
        });
      }

      const currentVersion = Number.parseInt(body.current_version || "0", 10);
      const currentHash = String(body.current_hash || "");
      const changed = latest.version > currentVersion || latest.configHash !== currentHash;

      return sendJson(res, 200, {
        ok: true,
        changed,
        ...(changed ? {
          version: latest.version,
          config_hash: latest.configHash,
          restart_required: latest.restartRequired,
          config: latest.config,
        } : {}),
      });
    }

    if (req.method === "POST" && pathname === "/api/gateway/config/status") {
      const body = await readJsonBody(req);
      authenticateGateway(req, body.gateway_id);
      const gateway = store.updateConfigStatus({
        gatewayId: body.gateway_id,
        version: Number.parseInt(body.config_version || "0", 10),
        status: String(body.status || ""),
        message: body.message || "",
        appVersion: body.app_version || "",
      });

      return sendJson(res, 200, {
        ok: true,
        gateway,
      });
    }

    if (req.method === "POST" && pathname === "/api/gateway/device-templates") {
      const body = await readJsonBody(req);
      authenticateGateway(req, body.gateway_id);
      const templates = store.listDeviceTemplates();

      return sendJson(res, 200, {
        ok: true,
        templates,
        count: templates.length,
      });
    }

    if (req.method === "POST" && pathname === "/api/telemetry") {
      const body = await readJsonBody(req);
      authenticateGateway(req, body.gateway_id);

      if (!Array.isArray(body.records)) {
        return sendJson(res, 400, {
          ok: false,
          error: "Request body must include a records array",
        });
      }

      const telemetryResult = store.insertTelemetry(body.gateway_id, body.records);

      return sendJson(res, 200, {
        ok: true,
        accepted: body.records.length,
        inserted: telemetryResult.inserted,
        ignored: telemetryResult.ignored,
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

    if (req.method === "GET" && pathname === "/api/device-templates") {
      const templates = store.listDeviceTemplates();

      return sendJson(res, 200, {
        ok: true,
        seedPath: templateSeed.resolvedPath,
        templates,
        count: templates.length,
      });
    }

    if (req.method === "PUT" && pathname === "/api/device-templates") {
      const body = await readJsonBody(req);

      if (!Array.isArray(body.templates)) {
        return sendJson(res, 400, {
          ok: false,
          error: "Request body must include a templates array",
        });
      }

      const templates = store.saveDeviceTemplates(body.templates);

      return sendJson(res, 200, {
        ok: true,
        templates,
        count: templates.length,
      });
    }

    if (req.method === "GET" && pathname === "/api/gateways") {
      return sendJson(res, 200, {
        ok: true,
        gateways: redactGatewaySecrets(store.listGateways()),
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

      const gateway = store.upsertGateway({
        id,
        name: String(body.name || id).trim(),
        site: String(body.site || "").trim(),
        token: String(body.token || ""),
      });

      const latest = store.getLatestConfig(id);
      if (!latest) {
        const defaultConfig = createDefaultGatewayConfig(id, config.publicUrl);
        store.addConfigVersion({
          gatewayId: id,
          config: defaultConfig,
          restartRequired: true,
          createdBy: config.adminUsername,
        });
      }

      return sendJson(res, 200, {
        ok: true,
        gateway: redactGatewaySecrets(gateway),
      });
    }

    const gatewayConfigMatch = pathname.match(/^\/api\/gateways\/([^/]+)\/config$/);
    if (gatewayConfigMatch && req.method === "GET") {
      const gatewayId = decodeURIComponent(gatewayConfigMatch[1]);
      const latest = store.getLatestConfig(gatewayId);

      return sendJson(res, 200, {
        ok: true,
        ...(latest ? {
          version: latest.version,
          configHash: latest.configHash,
          restartRequired: latest.restartRequired,
          config: latest.config,
        } : {
          version: null,
          config: null,
        }),
      });
    }

    if (gatewayConfigMatch && req.method === "PUT") {
      const gatewayId = decodeURIComponent(gatewayConfigMatch[1]);
      const body = await readJsonBody(req);

      if (!store.getGateway(gatewayId)) {
        return sendJson(res, 404, {
          ok: false,
          error: "Gateway not found",
        });
      }

      validateGatewayConfig(body.config, gatewayId);
      const latest = store.addConfigVersion({
        gatewayId,
        config: body.config,
        restartRequired: body.restart_required !== false,
        createdBy: config.adminUsername,
      });

      return sendJson(res, 200, {
        ok: true,
        version: latest.version,
        configHash: latest.configHash,
        restartRequired: latest.restartRequired,
      });
    }

    const telemetryMatch = pathname.match(/^\/api\/gateways\/([^/]+)\/telemetry\/latest$/);
    if (telemetryMatch && req.method === "GET") {
      const gatewayId = decodeURIComponent(telemetryMatch[1]);
      return sendJson(res, 200, {
        ok: true,
        records: store.latestTelemetry(gatewayId, 100),
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

function authenticateGateway(req, gatewayId) {
  if (!gatewayId) throw httpError(400, "gateway_id is required");

  const token = bearerToken(req);
  const existing = store.getGateway(gatewayId);

  if (!existing && canAutoRegisterGateway(token)) {
    store.autoRegisterGateway(gatewayId, token);
    ensureDefaultGatewayConfig(gatewayId, "auto-provision");
    return;
  }

  if (!store.verifyGatewayToken(gatewayId, token)) {
    throw httpError(401, "Invalid gateway token");
  }

  ensureDefaultGatewayConfig(gatewayId, "server");
}

function canAutoRegisterGateway(token) {
  if (!config.autoRegisterGateways || !token) return false;
  if (!config.provisioningToken) return true;
  return safeEqual(token, config.provisioningToken);
}

function ensureDefaultGatewayConfig(gatewayId, createdBy) {
  if (store.getLatestConfig(gatewayId)) return;

  const defaultConfig = createDefaultGatewayConfig(gatewayId, config.publicUrl);
  store.addConfigVersion({
    gatewayId,
    config: defaultConfig,
    restartRequired: true,
    createdBy,
  });
}

async function readJsonBody(req) {
  const chunks = [];
  let size = 0;

  for await (const chunk of req) {
    size += chunk.length;
    if (size > 5 * 1024 * 1024) {
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

function buildSessionCookie() {
  const payload = Buffer.from(JSON.stringify({
    username: config.adminUsername,
    expiresAt: Date.now() + 12 * 60 * 60 * 1000,
  })).toString("base64url");
  const token = `${payload}.${sign(payload, config.sessionSecret)}`;

  return [
    `hardware_server_session=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=43200",
  ].join("; ");
}

function clearSessionCookie() {
  return "hardware_server_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0";
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

function bearerToken(req) {
  const header = String(req.headers.authorization || "");
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
}

function requestPath(req) {
  return new URL(req.url || "/", "http://localhost").pathname;
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

function redactGatewaySecrets(gatewayOrGateways) {
  if (Array.isArray(gatewayOrGateways)) return gatewayOrGateways.map(redactGatewaySecrets);
  if (!gatewayOrGateways) return gatewayOrGateways;
  const { tokenHash, ...gateway } = gatewayOrGateways;
  return gateway;
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
