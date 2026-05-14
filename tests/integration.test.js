import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const ROOT_DIR = path.resolve(import.meta.dirname, "..");

test("admin login protects API and issues a usable session", async (t) => {
  const app = await startTestServer(t);

  const rejected = await requestJson(app.baseUrl, "/api/gateways");
  assert.equal(rejected.status, 401);
  assert.equal(rejected.body.ok, false);

  const badLogin = await requestJson(app.baseUrl, "/api/login", {
    method: "POST",
    body: {
      username: "admin",
      password: "wrong",
    },
  });
  assert.equal(badLogin.status, 401);

  const sessionCookie = await login(app);
  const gateways = await requestJson(app.baseUrl, "/api/gateways", {
    cookie: sessionCookie,
  });

  assert.equal(gateways.status, 200);
  assert.deepEqual(gateways.body.gateways, []);
});

test("gateway token auth rejects bad bearer tokens and accepts registered tokens", async (t) => {
  const app = await startTestServer(t);
  const sessionCookie = await login(app);

  await createGateway(app, sessionCookie, {
    id: "GW-AUTH-001",
    token: "gateway-secret",
  });

  const rejected = await requestJson(app.baseUrl, "/api/gateway/heartbeat", {
    method: "POST",
    token: "wrong-token",
    body: {
      gateway_id: "GW-AUTH-001",
      app_version: "0.1.0",
    },
  });
  assert.equal(rejected.status, 401);
  assert.equal(rejected.body.error, "Invalid gateway token");

  const accepted = await requestJson(app.baseUrl, "/api/gateway/heartbeat", {
    method: "POST",
    token: "gateway-secret",
    body: {
      gateway_id: "GW-AUTH-001",
      app_version: "0.1.0",
    },
  });

  assert.equal(accepted.status, 200);
  assert.equal(accepted.body.ok, true);
  assert.equal(accepted.body.gateway.id, "GW-AUTH-001");
  assert.equal(accepted.body.gateway.status, "online");
});

test("auto provisioning creates the gateway and default config", async (t) => {
  const app = await startTestServer(t);
  const sessionCookie = await login(app);

  const heartbeat = await requestJson(app.baseUrl, "/api/gateway/heartbeat", {
    method: "POST",
    token: "provisioning-token",
    body: {
      gateway_id: "GW-AUTO-001",
      app_version: "0.2.0",
    },
  });
  assert.equal(heartbeat.status, 200);
  assert.equal(heartbeat.body.gateway.id, "GW-AUTO-001");

  const gateways = await requestJson(app.baseUrl, "/api/gateways", {
    cookie: sessionCookie,
  });
  assert.equal(gateways.status, 200);
  assert.equal(gateways.body.gateways.length, 1);
  assert.equal(gateways.body.gateways[0].id, "GW-AUTO-001");
  assert.equal(gateways.body.gateways[0].latestConfigVersion, 1);

  const latestConfig = await requestJson(app.baseUrl, "/api/gateways/GW-AUTO-001/config", {
    cookie: sessionCookie,
  });
  assert.equal(latestConfig.status, 200);
  assert.equal(latestConfig.body.version, 1);
  assert.equal(latestConfig.body.config.gateway.id, "GW-AUTO-001");
  assert.equal(latestConfig.body.config.server.url, `${app.baseUrl}/api/telemetry`);
});

test("gateway config check and status report use the latest admin config", async (t) => {
  const app = await startTestServer(t);
  const sessionCookie = await login(app);

  await createGateway(app, sessionCookie, {
    id: "GW-CONFIG-001",
    token: "gateway-secret",
  });

  const original = await requestJson(app.baseUrl, "/api/gateways/GW-CONFIG-001/config", {
    cookie: sessionCookie,
  });
  assert.equal(original.status, 200);
  assert.equal(original.body.version, 1);

  const nextConfig = structuredClone(original.body.config);
  nextConfig.gateway.pollLoopDelayMs = 300;

  const update = await requestJson(app.baseUrl, "/api/gateways/GW-CONFIG-001/config", {
    method: "PUT",
    cookie: sessionCookie,
    body: {
      config: nextConfig,
      restart_required: false,
    },
  });
  assert.equal(update.status, 200);
  assert.equal(update.body.version, 2);
  assert.equal(update.body.restartRequired, false);

  const unchanged = await requestJson(app.baseUrl, "/api/gateway/config/check", {
    method: "POST",
    token: "gateway-secret",
    body: {
      gateway_id: "GW-CONFIG-001",
      current_version: 2,
      current_hash: update.body.configHash,
    },
  });
  assert.equal(unchanged.status, 200);
  assert.equal(unchanged.body.changed, false);

  const changed = await requestJson(app.baseUrl, "/api/gateway/config/check", {
    method: "POST",
    token: "gateway-secret",
    body: {
      gateway_id: "GW-CONFIG-001",
      current_version: 1,
      current_hash: original.body.configHash,
    },
  });
  assert.equal(changed.status, 200);
  assert.equal(changed.body.changed, true);
  assert.equal(changed.body.version, 2);
  assert.equal(changed.body.config.gateway.pollLoopDelayMs, 300);

  const status = await requestJson(app.baseUrl, "/api/gateway/config/status", {
    method: "POST",
    token: "gateway-secret",
    body: {
      gateway_id: "GW-CONFIG-001",
      config_version: 2,
      status: "applied",
      message: "ok",
      app_version: "0.3.0",
    },
  });
  assert.equal(status.status, 200);
  assert.equal(status.body.gateway.appliedConfigVersion, 2);
  assert.equal(status.body.gateway.lastConfigStatus, "applied");
  assert.equal(status.body.gateway.lastConfigMessage, "ok");
  assert.equal(status.body.gateway.appVersion, "0.3.0");
});

test("telemetry ingest stores records and ignores duplicate record ids", async (t) => {
  const app = await startTestServer(t);
  const sessionCookie = await login(app);

  await createGateway(app, sessionCookie, {
    id: "GW-TEL-001",
    token: "gateway-secret",
  });

  const firstUpload = await requestJson(app.baseUrl, "/api/telemetry", {
    method: "POST",
    token: "gateway-secret",
    body: {
      gateway_id: "GW-TEL-001",
      records: [
        {
          id: "record-1",
          device: "meter_01",
          measurements: {
            voltage_v: 230.4,
          },
        },
        {
          id: "record-2",
          device: "meter_01",
          measurements: {
            voltage_v: 230.8,
          },
        },
      ],
    },
  });
  assert.equal(firstUpload.status, 200);
  assert.equal(firstUpload.body.accepted, 2);
  assert.equal(firstUpload.body.inserted, 2);
  assert.equal(firstUpload.body.ignored, 0);

  const duplicateUpload = await requestJson(app.baseUrl, "/api/telemetry", {
    method: "POST",
    token: "gateway-secret",
    body: {
      gateway_id: "GW-TEL-001",
      records: [
        {
          id: "record-1",
          device: "meter_01",
          measurements: {
            voltage_v: 230.4,
          },
        },
      ],
    },
  });
  assert.equal(duplicateUpload.status, 200);
  assert.equal(duplicateUpload.body.accepted, 1);
  assert.equal(duplicateUpload.body.inserted, 0);
  assert.equal(duplicateUpload.body.ignored, 1);

  const latest = await requestJson(app.baseUrl, "/api/gateways/GW-TEL-001/telemetry/latest", {
    cookie: sessionCookie,
  });
  assert.equal(latest.status, 200);
  assert.equal(latest.body.records.length, 2);
  assert.deepEqual(
    latest.body.records.map((record) => record.recordId).sort(),
    ["record-1", "record-2"],
  );
});

async function startTestServer(t) {
  const port = await getFreePort();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hardware-server-integration-"));
  const dbPath = path.join(dir, "hardware-server.sqlite");
  const templatePath = path.join(dir, "device-templates.yml");

  fs.writeFileSync(templatePath, "templates: []\n");

  const env = {
    ...process.env,
    HOST: "127.0.0.1",
    PORT: String(port),
    PUBLIC_URL: `http://127.0.0.1:${port}`,
    DB_PATH: dbPath,
    DEVICE_TEMPLATES_PATH: templatePath,
    ADMIN_USERNAME: "admin",
    ADMIN_PASSWORD: "admin-password",
    SESSION_SECRET: "test-session-secret",
    TOKEN_HASH_SECRET: "test-token-secret",
    PROVISIONING_TOKEN: "provisioning-token",
    AUTO_REGISTER_GATEWAYS: "true",
  };

  const child = spawn(process.execPath, ["src/index.js"], {
    cwd: ROOT_DIR,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stdout = "";
  let stderr = "";

  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    stdout += chunk;
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });

  t.after(async () => {
    child.kill();
    await onceExit(child);
    fs.rmSync(dir, {
      recursive: true,
      force: true,
    });
  });

  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    await waitForHealth(baseUrl);
  } catch (error) {
    child.kill();
    await onceExit(child);
    error.message = `${error.message}\nstdout:\n${stdout}\nstderr:\n${stderr}`;
    throw error;
  }

  return {
    baseUrl,
    dbPath,
  };
}

async function login(app) {
  const response = await requestJson(app.baseUrl, "/api/login", {
    method: "POST",
    body: {
      username: "admin",
      password: "admin-password",
    },
  });
  assert.equal(response.status, 200);
  assert.equal(response.body.ok, true);

  const setCookie = response.headers.get("set-cookie");
  assert.ok(setCookie, "login response should include a session cookie");

  return setCookie.split(";")[0];
}

async function createGateway(app, cookie, gateway) {
  const response = await requestJson(app.baseUrl, "/api/gateways", {
    method: "POST",
    cookie,
    body: gateway,
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.gateway.id, gateway.id);

  return response.body.gateway;
}

async function requestJson(baseUrl, pathname, { method = "GET", token, cookie, body } = {}) {
  const headers = {
    Accept: "application/json",
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (cookie) {
    headers.Cookie = cookie;
  }

  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const contentType = response.headers.get("content-type") || "";
  const responseBody = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  return {
    status: response.status,
    headers: response.headers,
    body: responseBody,
  };
}

async function waitForHealth(baseUrl) {
  const startedAt = Date.now();
  let lastError;

  while (Date.now() - startedAt < 5000) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch (error) {
      lastError = error;
    }

    await delay(50);
  }

  throw new Error(`Timed out waiting for test server health${lastError ? `: ${lastError.message}` : ""}`);
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = address.port;
      server.close(() => resolve(port));
    });
  });
}

function onceExit(child) {
  return new Promise((resolve) => {
    if (child.exitCode !== null || child.signalCode !== null) {
      resolve();
      return;
    }

    child.once("exit", resolve);
  });
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
