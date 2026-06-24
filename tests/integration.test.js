import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
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

test("admin session cookie is Secure when public URL is HTTPS", async (t) => {
  const app = await startTestServer(t, {
    PUBLIC_URL: "https://server.electricbird.vn",
  });

  const response = await requestJson(app.baseUrl, "/api/login", {
    method: "POST",
    body: {
      username: "admin",
      password: "admin-password",
    },
  });

  assert.equal(response.status, 200);
  assert.match(response.headers.get("set-cookie"), /;\s*Secure\b/);
});

test("server serves a browser favicon", async (t) => {
  const app = await startTestServer(t);

  const response = await fetch(`${app.baseUrl}/favicon.ico`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "image/png");
  assert.ok(Number(response.headers.get("content-length")) > 0);
});

test("admin can store, update, and delete Tailscale gateway metadata", async (t) => {
  const app = await startTestServer(t);
  const sessionCookie = await login(app);

  const created = await createGateway(app, sessionCookie, {
    id: "GW-TS-001",
    name: "Station Tailscale",
    site: "Station Tailscale",
    remoteAccess: {
      enabled: true,
      method: "tailscale",
      host: "station-ts-001",
      ip: "100.64.10.20",
      uiPort: 80,
      sshPort: 22,
      tag: "tag:gateway",
    },
  });

  assert.deepEqual(created.remoteAccess, {
    enabled: true,
    method: "tailscale",
    host: "station-ts-001",
    ip: "100.64.10.20",
    uiPort: 80,
    sshPort: 22,
    tag: "tag:gateway",
  });
  assert.equal(created.tokenHash, undefined);
  assert.equal(created.latestConfigVersion, undefined);

  const updated = await requestJson(app.baseUrl, "/api/gateways/GW-TS-001", {
    method: "PUT",
    cookie: sessionCookie,
    body: {
      remoteAccess: {
        enabled: true,
        host: "station-ts-001-new",
        uiPort: 8080,
      },
    },
  });

  assert.equal(updated.status, 200);
  assert.equal(updated.body.gateway.remoteAccess.host, "station-ts-001-new");
  assert.equal(updated.body.gateway.remoteAccess.ip, "");
  assert.equal(updated.body.gateway.remoteAccess.uiPort, 8080);

  const unauthenticatedRemote = await fetch(`${app.baseUrl}/gateways/GW-TS-001/remote`, {
    redirect: "manual",
  });
  assert.equal(unauthenticatedRemote.status, 302);
  assert.equal(unauthenticatedRemote.headers.get("location"), "/login");

  const authenticatedRemote = await fetch(`${app.baseUrl}/gateways/GW-TS-001/remote`, {
    headers: {
      Cookie: sessionCookie,
    },
    redirect: "manual",
  });
  assert.equal(authenticatedRemote.status, 302);
  assert.equal(authenticatedRemote.headers.get("location"), "/gateways/GW-TS-001/remote/");

  const deleted = await requestJson(app.baseUrl, "/api/gateways/GW-TS-001", {
    method: "DELETE",
    cookie: sessionCookie,
  });
  assert.equal(deleted.status, 200);

  const listed = await requestJson(app.baseUrl, "/api/gateways", {
    cookie: sessionCookie,
  });
  assert.deepEqual(listed.body.gateways, []);
});

test("server auto-syncs online Linux Tailscale peers into sqlite gateways", async (t) => {
  const app = await startTestServer(t, {
    TAILSCALE_SYNC_ENABLED: "true",
    TAILSCALE_STATUS_JSON: JSON.stringify({
      Peer: {
        "nodekey:moxa": {
          ID: "n1",
          HostName: "moxa",
          DNSName: "moxa.tailnet.test.",
          OS: "linux",
          Online: true,
          TailscaleIPs: ["100.77.152.66", "fd7a:115c:a1e0::1"],
        },
        "nodekey:laptop": {
          ID: "n2",
          HostName: "nhan-laptop",
          DNSName: "nhan-laptop.tailnet.test.",
          OS: "windows",
          Online: true,
          TailscaleIPs: ["100.111.86.116"],
        },
        "nodekey:offline": {
          ID: "n3",
          HostName: "offline-ipc",
          DNSName: "offline-ipc.tailnet.test.",
          OS: "linux",
          Online: false,
          TailscaleIPs: ["100.100.100.100"],
        },
      },
    }),
  });
  const sessionCookie = await login(app);

  const listed = await requestJson(app.baseUrl, "/api/gateways", {
    cookie: sessionCookie,
  });

  assert.equal(listed.status, 200);
  assert.deepEqual(listed.body.gateways.map((gateway) => gateway.id), ["moxa"]);
  assert.equal(listed.body.gateways[0].remoteAccess.ip, "100.77.152.66");
  assert.equal(listed.body.gateways[0].remoteAccess.host, "moxa.tailnet.test");
  assert.equal(listed.body.gateways[0].remoteAccess.uiPort, 80);
  assert.equal(listed.body.gateways[0].status, "online");
  assert.ok(listed.body.gateways[0].lastSeenAt);
});

test("admin remote page proxies the Tailscale gateway UI through the server", async (t) => {
  const gatewayAdmin = await startFakeGatewayAdmin(t);
  const app = await startTestServer(t);
  const sessionCookie = await login(app);

  await createGateway(app, sessionCookie, {
    id: "GW-TS-PROXY-001",
    remoteAccess: {
      enabled: true,
      method: "tailscale",
      host: "127.0.0.1",
      uiPort: gatewayAdmin.port,
    },
  });

  const health = await requestJson(app.baseUrl, "/api/gateways/GW-TS-PROXY-001/tailscale/health", {
    cookie: sessionCookie,
  });
  assert.equal(health.status, 200);
  assert.equal(health.body.mode, "tailscale_proxy");
  assert.equal(health.body.gatewayBaseUrl, gatewayAdmin.baseUrl);
  assert.equal(health.body.gateway.ok, true);

  const rootRedirect = await fetch(`${app.baseUrl}/gateways/GW-TS-PROXY-001/remote`, {
    headers: { Cookie: sessionCookie },
    redirect: "manual",
  });
  assert.equal(rootRedirect.status, 302);
  assert.equal(rootRedirect.headers.get("location"), "/gateways/GW-TS-PROXY-001/remote/");

  const remotePage = await fetch(`${app.baseUrl}/gateways/GW-TS-PROXY-001/remote/`, {
    headers: { Cookie: sessionCookie },
  });
  assert.equal(remotePage.status, 200);
  const html = await remotePage.text();
  assert.match(html, /\/gateways\/GW-TS-PROXY-001\/remote\/api\/config/);
  assert.match(html, /\/gateways\/GW-TS-PROXY-001\/remote\/assets\/admin-tailwind\.css/);
  assert.match(html, /window\.location\.assign\("\/gateways\/GW-TS-PROXY-001\/remote\/"\)/);
  assert.match(html, /window\.location\.assign\("\/gateways\/GW-TS-PROXY-001\/remote\/login"\)/);
  assert.doesNotMatch(html, /fetch\("\/api\/config"\)/);

  const proxiedHealth = await requestJson(app.baseUrl, "/gateways/GW-TS-PROXY-001/remote/api/health", {
    cookie: sessionCookie,
  });
  assert.equal(proxiedHealth.status, 200);
  assert.equal(proxiedHealth.body.ok, true);

  const loginResponse = await requestJson(app.baseUrl, "/gateways/GW-TS-PROXY-001/remote/api/login", {
    method: "POST",
    cookie: sessionCookie,
    body: {
      username: "admin",
      password: "admin",
    },
  });
  assert.equal(loginResponse.status, 200);
  assert.match(loginResponse.headers.get("set-cookie") || "", /Path=\/gateways\/GW-TS-PROXY-001\/remote/);
});

test("tailscale health requires gateway remote metadata", async (t) => {
  const app = await startTestServer(t);
  const sessionCookie = await login(app);

  await createGateway(app, sessionCookie, {
    id: "GW-NO-TS-001",
  });

  const health = await requestJson(app.baseUrl, "/api/gateways/GW-NO-TS-001/tailscale/health", {
    cookie: sessionCookie,
  });

  assert.equal(health.status, 409);
  assert.match(health.body.error, /Tailscale remote access is not enabled/);
});

async function startFakeGatewayAdmin(t, { username = "admin", password = "admin" } = {}) {
  const server = http.createServer(async (req, res) => {
    try {
      const pathname = new URL(req.url || "/", "http://localhost").pathname;

      if (req.method === "GET" && pathname === "/api/health") {
        return sendTestJson(res, 200, {
          ok: true,
          time: new Date().toISOString(),
        });
      }

      if (req.method === "GET" && pathname === "/") {
        return sendTest(res, 200, `
          <!doctype html>
          <html>
            <head>
              <link rel="stylesheet" href="/assets/admin-tailwind.css">
              <link rel="icon" href="/favicon.ico">
            </head>
            <body>
              <script>
                fetch("/api/config");
                window.location.assign("/");
                window.location.assign("/login");
              </script>
            </body>
          </html>
        `, {
          "Content-Type": "text/html; charset=utf-8",
        });
      }

      if (req.method === "GET" && pathname === "/assets/admin-tailwind.css") {
        return sendTest(res, 200, "body{color:#111}", {
          "Content-Type": "text/css; charset=utf-8",
        });
      }

      if (req.method === "POST" && pathname === "/api/login") {
        const body = await readTestJsonBody(req);
        if (body.username !== username || body.password !== password) {
          return sendTestJson(res, 401, {
            ok: false,
            error: "Invalid username or password",
          });
        }

        return sendTestJson(res, 200, {
          ok: true,
        }, {
          "Set-Cookie": "rs485_admin_session=fake-session; HttpOnly; Path=/",
        });
      }

      sendTestJson(res, 404, {
        ok: false,
        error: "Not found",
      });
    } catch (error) {
      sendTestJson(res, 500, {
        ok: false,
        error: error.message,
      });
    }
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  const { port } = server.address();
  return {
    port,
    baseUrl: `http://127.0.0.1:${port}`,
  };
}

async function startTestServer(t, envOverrides = {}) {
  const port = await getFreePort();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hardware-server-integration-"));
  const dbPath = path.join(dir, "hardware-server.sqlite");

  const env = {
    ...process.env,
    HOST: "127.0.0.1",
    PORT: String(port),
    PUBLIC_URL: `http://127.0.0.1:${port}`,
    DB_PATH: dbPath,
    ADMIN_USERNAME: "admin",
    ADMIN_PASSWORD: "admin-password",
    SESSION_SECRET: "test-session-secret",
    TAILSCALE_SYNC_ENABLED: "false",
    ...envOverrides,
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
    if (child.exitCode === null) child.kill();
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
    if (child.exitCode === null) child.kill();
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

async function readTestJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function sendTestJson(res, statusCode, body, headers = {}) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...headers,
  });
  res.end(JSON.stringify(body));
}

function sendTest(res, statusCode, body, headers = {}) {
  res.writeHead(statusCode, {
    "Cache-Control": "no-store",
    ...headers,
  });
  res.end(body);
}

async function requestJson(baseUrl, pathname, { method = "GET", cookie, body } = {}) {
  const headers = {
    Accept: "application/json",
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
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
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  throw new Error(`Server did not become healthy: ${lastError?.message || "timeout"}`);
}

async function getFreePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const { port } = server.address();
  await new Promise((resolve) => server.close(resolve));
  return port;
}

function onceExit(child) {
  if (child.exitCode !== null) return Promise.resolve();
  return new Promise((resolve) => child.once("exit", resolve));
}
