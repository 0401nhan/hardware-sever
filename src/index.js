import "dotenv/config";

import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";

import { openDatabase } from "./db.js";
import { readDeviceTemplateSeed } from "./deviceTemplates.js";
import { normalizeCommandSchedule } from "./schedule.js";
import { createDefaultGatewayConfig, validateGatewayConfig } from "./validation.js";
import { renderDashboardPage, renderLoginPage } from "./ui.js";

const PUBLIC_DIR = new URL("../public/", import.meta.url);
const PUBLIC_ASSETS = new Map([
  ["/logo/logo-bigsize.png", "logo/logo-bigsize.png"],
  ["/logo/logo-login-full.png", "logo/logo-login-full.png"],
  ["/logo/logo-login-mark.png", "logo/logo-login-mark.png"],
  ["/logo/logo-mediumsize.png", "logo/logo-mediumsize.png"],
  ["/logo/logo-smallsize.png", "logo/logo-smallsize.png"],
]);
const PUBLIC_TEXT_ASSETS = new Map([
  ["/assets/admin-tailwind.css", "assets/admin-tailwind.css"],
]);

const config = {
  host: process.env.HOST || "0.0.0.0",
  port: Number.parseInt(process.env.PORT || "8080", 10),
  publicUrl: process.env.PUBLIC_URL || "https://server.electricbird.vn",
  dbPath: process.env.DB_PATH || "data/hardware-server.sqlite",
  deviceTemplatesPath: process.env.DEVICE_TEMPLATES_PATH || "config/device-templates.yml",
  adminUsername: process.env.ADMIN_USERNAME || "admin",
  adminPassword: process.env.ADMIN_PASSWORD || "admin",
  sessionSecret: process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || "development-session-secret",
  sessionTtlMs: positiveIntegerEnv("ADMIN_SESSION_TTL_MS", 7 * 24 * 60 * 60 * 1000),
  tokenHashSecret: process.env.TOKEN_HASH_SECRET || process.env.ADMIN_PASSWORD || "development-token-secret",
  provisioningToken: process.env.PROVISIONING_TOKEN || "replace-me",
  autoRegisterGateways: String(process.env.AUTO_REGISTER_GATEWAYS || "true").toLowerCase() === "true",
  gatewayOfflineAfterMs: positiveIntegerEnv("GATEWAY_OFFLINE_AFTER_MS", 90_000),
  telemetryRetentionMs: nonNegativeIntegerEnv("TELEMETRY_RETENTION_MS", 30 * 24 * 60 * 60 * 1000),
  telemetryPruneIntervalMs: nonNegativeIntegerEnv("TELEMETRY_PRUNE_INTERVAL_MS", 60 * 60 * 1000),
};

let store;
let templateSeed;
let server;

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function main() {
store = await openDatabase(config.dbPath, config.tokenHashSecret, {
  offlineAfterMs: config.gatewayOfflineAfterMs,
  telemetryRetentionMs: config.telemetryRetentionMs,
  telemetryPruneIntervalMs: config.telemetryPruneIntervalMs,
});
templateSeed = readDeviceTemplateSeed(config.deviceTemplatesPath);
await store.seedDeviceTemplates(templateSeed.templates);

server = http.createServer(async (req, res) => {
  try {
    const pathname = requestPath(req);

    if ((req.method === "GET" || req.method === "HEAD") && PUBLIC_ASSETS.has(pathname)) {
      return sendFile(res, new URL(PUBLIC_ASSETS.get(pathname), PUBLIC_DIR), "image/png", req.method === "HEAD");
    }

    if ((req.method === "GET" || req.method === "HEAD") && PUBLIC_TEXT_ASSETS.has(pathname)) {
      return sendFile(res, new URL(PUBLIC_TEXT_ASSETS.get(pathname), PUBLIC_DIR), "text/css; charset=utf-8", req.method === "HEAD");
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

    if (req.method === "POST" && pathname === "/api/gateway/heartbeat") {
      const body = await readJsonBody(req);
      await authenticateGateway(req, body.gateway_id);
      const gateway = await store.markHeartbeat(body.gateway_id, body.app_version || "");

      return sendJson(res, 200, {
        ok: true,
        gateway,
      });
    }

    if (req.method === "POST" && pathname === "/api/gateway/config/check") {
      const body = await readJsonBody(req);
      await authenticateGateway(req, body.gateway_id);
      const latest = await store.getLatestConfig(body.gateway_id);

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
      await authenticateGateway(req, body.gateway_id);
      const gateway = await store.updateConfigStatus({
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

    if (req.method === "POST" && pathname === "/api/gateway/commands/check") {
      const body = await readJsonBody(req);
      await authenticateGateway(req, body.gateway_id);
      const command = await store.nextGatewayCommand(body.gateway_id);

      return sendJson(res, 200, {
        ok: true,
        command: command ? gatewayCommandPayload(command) : null,
      });
    }

    if (req.method === "POST" && pathname === "/api/gateway/commands/status") {
      const body = await readJsonBody(req);
      await authenticateGateway(req, body.gateway_id);
      const status = String(body.status || "").trim();

      if (!body.command_id) {
        return sendJson(res, 400, {
          ok: false,
          error: "command_id is required",
        });
      }

      if (!["running", "applied", "failed"].includes(status)) {
        return sendJson(res, 400, {
          ok: false,
          error: "status must be running, applied, or failed",
        });
      }

      const command = await store.updateGatewayCommandStatus({
        gatewayId: body.gateway_id,
        commandId: String(body.command_id),
        status,
        message: body.message || "",
        result: body.result ?? null,
        appVersion: body.app_version || "",
      });

      if (!command) {
        return sendJson(res, 404, {
          ok: false,
          error: "Command not found",
        });
      }

      return sendJson(res, 200, {
        ok: true,
        command,
      });
    }

    if (req.method === "POST" && pathname === "/api/gateway/device-templates") {
      const body = await readJsonBody(req);
      await authenticateGateway(req, body.gateway_id);
      const templates = await store.listDeviceTemplates();

      return sendJson(res, 200, {
        ok: true,
        templates,
        count: templates.length,
      });
    }

    if (req.method === "POST" && pathname === "/api/telemetry") {
      const body = await readJsonBody(req);
      await authenticateGateway(req, body.gateway_id);

      if (!Array.isArray(body.records)) {
        return sendJson(res, 400, {
          ok: false,
          error: "Request body must include a records array",
        });
      }

      const telemetryResult = await store.insertTelemetry(body.gateway_id, body.records);

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
      const templates = await store.listDeviceTemplates();

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

      const templates = await store.saveDeviceTemplates(body.templates);

      return sendJson(res, 200, {
        ok: true,
        templates,
        count: templates.length,
      });
    }

    if (req.method === "GET" && pathname === "/api/gateways") {
      return sendJson(res, 200, {
        ok: true,
        gateways: redactGatewaySecrets(await store.listGateways()),
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
        token: String(body.token || ""),
      });

      const latest = await store.getLatestConfig(id);
      if (!latest) {
        const defaultConfig = createDefaultGatewayConfig(id, config.publicUrl);
        await store.addConfigVersion({
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

    const gatewayMatch = pathname.match(/^\/api\/gateways\/([^/]+)$/);
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
        gateway: redactGatewaySecrets(gateway),
      });
    }

    const gatewayConfigMatch = pathname.match(/^\/api\/gateways\/([^/]+)\/config$/);
    if (gatewayConfigMatch && req.method === "GET") {
      const gatewayId = decodeURIComponent(gatewayConfigMatch[1]);
      const latest = await store.getLatestConfig(gatewayId);

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

      if (!await store.getGateway(gatewayId)) {
        return sendJson(res, 404, {
          ok: false,
          error: "Gateway not found",
        });
      }

      validateGatewayConfig(body.config, gatewayId);
      const latest = await store.addConfigVersion({
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

    const gatewayCommandsMatch = pathname.match(/^\/api\/gateways\/([^/]+)\/commands$/);
    if (gatewayCommandsMatch && req.method === "GET") {
      const gatewayId = decodeURIComponent(gatewayCommandsMatch[1]);

      if (!await store.getGateway(gatewayId)) {
        return sendJson(res, 404, {
          ok: false,
          error: "Gateway not found",
        });
      }

      return sendJson(res, 200, {
        ok: true,
        commands: await store.listGatewayCommands(gatewayId, 100),
      });
    }

    const gatewayCommandMatch = pathname.match(/^\/api\/gateways\/([^/]+)\/commands\/([^/]+)$/);
    if (gatewayCommandMatch && req.method === "DELETE") {
      const gatewayId = decodeURIComponent(gatewayCommandMatch[1]);
      const commandId = decodeURIComponent(gatewayCommandMatch[2]);

      if (!await store.getGateway(gatewayId)) {
        return sendJson(res, 404, {
          ok: false,
          error: "Gateway not found",
        });
      }

      const result = await store.cancelGatewayCommand({ gatewayId, commandId });
      if (!result) {
        return sendJson(res, 404, {
          ok: false,
          error: "Command not found",
        });
      }

      return sendJson(res, 200, {
        ok: true,
        ...result,
      });
    }

    const gatewayControlMatch = pathname.match(/^\/api\/gateways\/([^/]+)\/control$/);
    if (gatewayControlMatch && req.method === "POST") {
      const gatewayId = decodeURIComponent(gatewayControlMatch[1]);
      const body = await readJsonBody(req);

      if (!await store.getGateway(gatewayId)) {
        return sendJson(res, 404, {
          ok: false,
          error: "Gateway not found",
        });
      }

      const payload = normalizeInverterControlPayload(body);
      const schedule = normalizeCommandSchedule(body.schedule || body);
      const command = await store.createGatewayCommand({
        gatewayId,
        action: payload.action,
        payload,
        createdBy: config.adminUsername,
        schedule: schedule?.schedule || null,
        nextRunAt: schedule?.nextRunAt || null,
      });

      return sendJson(res, 200, {
        ok: true,
        command,
      });
    }

    const telemetryMatch = pathname.match(/^\/api\/gateways\/([^/]+)\/telemetry\/latest$/);
    if (telemetryMatch && req.method === "GET") {
      const gatewayId = decodeURIComponent(telemetryMatch[1]);
      return sendJson(res, 200, {
        ok: true,
        records: await store.latestTelemetry(gatewayId, 100),
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

async function authenticateGateway(req, gatewayId) {
  if (!gatewayId) throw httpError(400, "gateway_id is required");

  const token = bearerToken(req);
  const existing = await store.getGateway(gatewayId);

  if (!existing && canAutoRegisterGateway(token)) {
    await store.autoRegisterGateway(gatewayId, token);
    await ensureDefaultGatewayConfig(gatewayId, "auto-provision");
    return;
  }

  if (!await store.verifyGatewayToken(gatewayId, token)) {
    throw httpError(401, "Invalid gateway token");
  }

  await ensureDefaultGatewayConfig(gatewayId, "server");
}

function canAutoRegisterGateway(token) {
  if (!config.autoRegisterGateways || !token) return false;
  if (!config.provisioningToken) return true;
  return safeEqual(token, config.provisioningToken);
}

async function ensureDefaultGatewayConfig(gatewayId, createdBy) {
  if (await store.getLatestConfig(gatewayId)) return;

  const defaultConfig = createDefaultGatewayConfig(gatewayId, config.publicUrl);
  await store.addConfigVersion({
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

function redactGatewaySecrets(gatewayOrGateways) {
  if (Array.isArray(gatewayOrGateways)) return gatewayOrGateways.map(redactGatewaySecrets);
  if (!gatewayOrGateways) return gatewayOrGateways;
  const { tokenHash, ...gateway } = gatewayOrGateways;
  return gateway;
}

function gatewayCommandPayload(command) {
  return {
    id: command.id,
    action: command.action,
    payload: command.payload,
    schedule: command.schedule,
    scheduledAt: command.scheduledAt,
    nextRunAt: command.nextRunAt,
    createdAt: command.createdAt,
  };
}

function normalizeInverterControlPayload(body) {
  const deviceName = stringField(body.deviceName ?? body.device);
  const action = normalizeControlAction(body.action);

  if (!deviceName) throw httpError(400, "deviceName is required");
  if (!action) throw httpError(400, "action is required");

  const payload = {
    deviceName,
    action,
  };

  for (const field of ["value", "percent", "kw", "watts", "durationSeconds", "durationMinutes", "durationHours", "delayMs", "rebootDelayMs"]) {
    if (body[field] !== undefined) {
      payload[field] = finiteNumber(body[field], field);
    }
  }

  return payload;
}

function normalizeControlAction(action) {
  const normalized = stringField(action).toLowerCase().replace(/[\s-]+/g, "_");
  const aliases = {
    on: "start",
    start: "start",
    startup: "start",
    boot: "start",
    off: "stop",
    stop: "stop",
    shutdown: "stop",
    restart: "reboot",
    reboot: "reboot",
    limit_power: "limit_power",
    power_limit: "limit_power",
    set_power_limit: "limit_power",
    clear_power_limit: "clear_power_limit",
    remove_power_limit: "clear_power_limit",
    unlimit: "clear_power_limit",
  };
  const actionName = aliases[normalized] || normalized;

  if (!["start", "stop", "reboot", "limit_power", "clear_power_limit"].includes(actionName)) {
    throw httpError(400, `Unsupported inverter control action '${action}'`);
  }

  return actionName;
}

function finiteNumber(value, field) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw httpError(400, `${field} must be a finite number`);
  }

  return value;
}

function stringField(value) {
  return typeof value === "string" ? value.trim() : "";
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

function nonNegativeIntegerEnv(name, fallback) {
  const value = Number.parseInt(process.env[name] || "", 10);
  return Number.isInteger(value) && value >= 0 ? value : fallback;
}
