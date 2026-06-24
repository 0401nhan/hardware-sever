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

test("gateway push API is ignored by default for Tailscale directory mode", async (t) => {
  const app = await startTestServer(t, {
    GATEWAY_PUSH_API_ENABLED: "false",
  });

  const heartbeat = await requestJson(app.baseUrl, "/api/gateway/heartbeat", {
    method: "POST",
    body: {
      gateway_id: "GW-DIRECTORY-001",
      app_version: "0.2.0",
    },
  });
  assert.equal(heartbeat.status, 200);
  assert.deepEqual(heartbeat.body, {
    ok: true,
    ignored: true,
    reason: "gateway_push_api_disabled",
  });

  const telemetry = await requestJson(app.baseUrl, "/api/telemetry", {
    method: "POST",
    body: {
      gateway_id: "GW-DIRECTORY-001",
      records: [],
    },
  });
  assert.equal(telemetry.status, 200);
  assert.equal(telemetry.body.ignored, true);
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

test("admin can delete a gateway and its site from the server list", async (t) => {
  const app = await startTestServer(t);
  const sessionCookie = await login(app);

  await createGateway(app, sessionCookie, {
    id: "GW-DELETE-001",
    name: "Station delete test",
    site: "Station delete test",
    token: "gateway-secret",
  });

  const deleted = await requestJson(app.baseUrl, "/api/gateways/GW-DELETE-001", {
    method: "DELETE",
    cookie: sessionCookie,
  });
  assert.equal(deleted.status, 200);
  assert.equal(deleted.body.ok, true);
  assert.equal(deleted.body.gateway.id, "GW-DELETE-001");

  const gateways = await requestJson(app.baseUrl, "/api/gateways", {
    cookie: sessionCookie,
  });
  assert.equal(gateways.status, 200);
  assert.deepEqual(gateways.body.gateways, []);

  const missing = await requestJson(app.baseUrl, "/api/gateways/GW-DELETE-001", {
    method: "DELETE",
    cookie: sessionCookie,
  });
  assert.equal(missing.status, 404);
});

test("admin can store Tailscale remote access metadata for a gateway", async (t) => {
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
      uiPort: 3000,
      sshPort: 22,
      tag: "tag:gateway",
    },
  });

  assert.deepEqual(created.remoteAccess, {
    enabled: true,
    method: "tailscale",
    host: "station-ts-001",
    ip: "100.64.10.20",
    uiPort: 3000,
    sshPort: 22,
    tag: "tag:gateway",
  });
  assert.equal(created.tokenHash, undefined);

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
  assert.equal(updated.body.gateway.remoteAccess.sshPort, 22);

  const listed = await requestJson(app.baseUrl, "/api/gateways", {
    cookie: sessionCookie,
  });
  assert.equal(listed.status, 200);
  assert.equal(listed.body.gateways[0].remoteAccess.host, "station-ts-001-new");
  assert.equal(listed.body.gateways[0].tokenHash, undefined);

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
});

test("server auto-syncs Linux Tailscale peers into sqlite gateways", async (t) => {
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

  const latestConfig = await requestJson(app.baseUrl, "/api/gateways/moxa/config", {
    cookie: sessionCookie,
  });
  assert.equal(latestConfig.status, 200);
  assert.equal(latestConfig.body.config.gateway.id, "moxa");
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
  assert.equal(update.body.restartRequired, true);

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
  assert.equal(changed.body.restart_required, true);
  assert.equal(changed.body.config.gateway.pollLoopDelayMs, 300);

  const status = await requestJson(app.baseUrl, "/api/gateway/config/status", {
    method: "POST",
    token: "gateway-secret",
    body: {
      gateway_id: "GW-CONFIG-001",
      config_version: 2,
      config_hash: update.body.configHash,
      status: "applied",
      message: "ok",
      app_version: "0.3.0",
    },
  });
  assert.equal(status.status, 200);
  assert.equal(status.body.ignored, false);
  assert.equal(status.body.gateway.appliedConfigVersion, 2);
  assert.equal(status.body.gateway.lastConfigStatus, "applied");
  assert.equal(status.body.gateway.lastConfigMessage, "ok");
  assert.equal(status.body.gateway.appVersion, "0.3.0");

  const badStatus = await requestJson(app.baseUrl, "/api/gateway/config/status", {
    method: "POST",
    token: "gateway-secret",
    body: {
      gateway_id: "GW-CONFIG-001",
      config_version: 2,
      config_hash: update.body.configHash,
      status: "running",
    },
  });
  assert.equal(badStatus.status, 400);
  assert.match(badStatus.body.error, /status must be pending, applied, or failed/);

  const badHash = await requestJson(app.baseUrl, "/api/gateway/config/status", {
    method: "POST",
    token: "gateway-secret",
    body: {
      gateway_id: "GW-CONFIG-001",
      config_version: 2,
      config_hash: "wrong-hash",
      status: "applied",
    },
  });
  assert.equal(badHash.status, 400);
  assert.match(badHash.body.error, /config_hash does not match/);

  const missingVersion = await requestJson(app.baseUrl, "/api/gateway/config/status", {
    method: "POST",
    token: "gateway-secret",
    body: {
      gateway_id: "GW-CONFIG-001",
      config_version: 999,
      config_hash: update.body.configHash,
      status: "applied",
    },
  });
  assert.equal(missingVersion.status, 404);

  const newerConfig = structuredClone(nextConfig);
  newerConfig.gateway.pollLoopDelayMs = 450;
  const updateNewer = await requestJson(app.baseUrl, "/api/gateways/GW-CONFIG-001/config", {
    method: "PUT",
    cookie: sessionCookie,
    body: {
      config: newerConfig,
    },
  });
  assert.equal(updateNewer.status, 200);
  assert.equal(updateNewer.body.version, 3);

  const staleStatus = await requestJson(app.baseUrl, "/api/gateway/config/status", {
    method: "POST",
    token: "gateway-secret",
    body: {
      gateway_id: "GW-CONFIG-001",
      config_version: 2,
      config_hash: update.body.configHash,
      status: "failed",
      message: "late failure",
      app_version: "0.4.0",
    },
  });
  assert.equal(staleStatus.status, 200);
  assert.equal(staleStatus.body.ignored, true);
  assert.equal(staleStatus.body.reason, "stale_config_status");
  assert.equal(staleStatus.body.gateway.desiredConfigVersion, 3);
  assert.equal(staleStatus.body.gateway.appliedConfigVersion, 2);
  assert.equal(staleStatus.body.gateway.lastConfigStatus, "applied");
  assert.equal(staleStatus.body.gateway.lastConfigMessage, "ok");
});

test("admin can queue inverter control commands for gateway execution", async (t) => {
  const app = await startTestServer(t);
  const sessionCookie = await login(app);

  await createGateway(app, sessionCookie, {
    id: "GW-CMD-001",
    token: "gateway-secret",
  });

  const queued = await requestJson(app.baseUrl, "/api/gateways/GW-CMD-001/control", {
    method: "POST",
    cookie: sessionCookie,
    body: {
      deviceName: "Huawei",
      action: "limit_power",
      percent: 60,
      durationMinutes: 15,
    },
  });
  assert.equal(queued.status, 200);
  assert.equal(queued.body.command.action, "limit_power");
  assert.equal(queued.body.command.status, "queued");
  assert.deepEqual(queued.body.command.payload, {
    deviceName: "Huawei",
    action: "limit_power",
    percent: 60,
    durationMinutes: 15,
  });

  const check = await requestJson(app.baseUrl, "/api/gateway/commands/check", {
    method: "POST",
    token: "gateway-secret",
    body: {
      gateway_id: "GW-CMD-001",
      app_version: "0.1.12",
    },
  });
  assert.equal(check.status, 200);
  assert.equal(check.body.command.id, queued.body.command.id);
  assert.deepEqual(check.body.command.payload, queued.body.command.payload);

  const running = await requestJson(app.baseUrl, "/api/gateway/commands/status", {
    method: "POST",
    token: "gateway-secret",
    body: {
      gateway_id: "GW-CMD-001",
      command_id: queued.body.command.id,
      status: "running",
      app_version: "0.1.12",
    },
  });
  assert.equal(running.status, 200);
  assert.equal(running.body.command.status, "running");

  const beforeApplied = Date.now();
  const applied = await requestJson(app.baseUrl, "/api/gateway/commands/status", {
    method: "POST",
    token: "gateway-secret",
    body: {
      gateway_id: "GW-CMD-001",
      command_id: queued.body.command.id,
      status: "applied",
      result: {
        action: "limit_power",
        writes: [{ register: "active_power_percentage_derating_percent", words: [600] }],
      },
      app_version: "0.1.12",
    },
  });
  const afterApplied = Date.now();
  assert.equal(applied.status, 200);
  assert.equal(applied.body.command.status, "applied");
  assert.equal(applied.body.command.result.writes[0].register, "active_power_percentage_derating_percent");

  const commands = await requestJson(app.baseUrl, "/api/gateways/GW-CMD-001/commands", {
    cookie: sessionCookie,
  });
  assert.equal(commands.status, 200);
  assert.equal(commands.body.commands.length, 2);

  const appliedCommand = commands.body.commands.find((command) => command.id === queued.body.command.id);
  const clearCommand = commands.body.commands.find((command) => command.action === "clear_power_limit");
  assert.equal(appliedCommand.status, "applied");
  assert.equal(clearCommand.status, "scheduled");
  assert.equal(clearCommand.windowRole, "end");
  assert.equal(clearCommand.sourceCommandId, queued.body.command.id);
  assert.deepEqual(clearCommand.payload, {
    action: "clear_power_limit",
    deviceName: "Huawei",
  });
  const clearRunAt = Date.parse(clearCommand.nextRunAt);
  assert.ok(clearRunAt >= beforeApplied + 15 * 60 * 1000 - 1000);
  assert.ok(clearRunAt <= afterApplied + 15 * 60 * 1000 + 1000);
});

test("admin can queue station control commands for gateway execution", async (t) => {
  const app = await startTestServer(t);
  const sessionCookie = await login(app);

  await createGateway(app, sessionCookie, {
    id: "GW-STATION-CMD-001",
    token: "gateway-secret",
  });

  const queued = await requestJson(app.baseUrl, "/api/gateways/GW-STATION-CMD-001/control", {
    method: "POST",
    cookie: sessionCookie,
    body: {
      stationId: "station_1",
      action: "limit_power",
      percent: 60,
    },
  });
  assert.equal(queued.status, 200);
  assert.deepEqual(queued.body.command.payload, {
    stationId: "station_1",
    action: "limit_power",
    percent: 60,
  });

  const check = await requestJson(app.baseUrl, "/api/gateway/commands/check", {
    method: "POST",
    token: "gateway-secret",
    body: {
      gateway_id: "GW-STATION-CMD-001",
      app_version: "0.1.12",
    },
  });
  assert.equal(check.status, 200);
  assert.equal(check.body.command.id, queued.body.command.id);
  assert.deepEqual(check.body.command.payload, queued.body.command.payload);
});

test("admin can execute inverter control directly through a Tailscale gateway", async (t) => {
  const gatewayAdmin = await startFakeGatewayAdmin(t, {
    username: "gateway-admin",
    password: "gateway-password",
  });
  const app = await startTestServer(t, {
    TAILSCALE_GATEWAY_ADMIN_USERNAME: "gateway-admin",
    TAILSCALE_GATEWAY_ADMIN_PASSWORD: "gateway-password",
  });
  const sessionCookie = await login(app);

  await createGateway(app, sessionCookie, {
    id: "GW-TS-DIRECT-001",
    token: "gateway-secret",
    remoteAccess: {
      enabled: true,
      method: "tailscale",
      host: "127.0.0.1",
      uiPort: gatewayAdmin.port,
      sshPort: 22,
      tag: "tag:gateway",
    },
  });

  const health = await requestJson(app.baseUrl, "/api/gateways/GW-TS-DIRECT-001/tailscale/health", {
    cookie: sessionCookie,
  });
  assert.equal(health.status, 200);
  assert.equal(health.body.gatewayBaseUrl, gatewayAdmin.baseUrl);
  assert.equal(health.body.gateway.ok, true);

  const direct = await requestJson(app.baseUrl, "/api/gateways/GW-TS-DIRECT-001/tailscale/control", {
    method: "POST",
    cookie: sessionCookie,
    body: {
      deviceName: "Huawei",
      action: "limit_power",
      percent: 60,
      durationMinutes: 15,
    },
  });

  assert.equal(direct.status, 200);
  assert.equal(direct.body.mode, "tailscale_direct");
  assert.equal(direct.body.gatewayBaseUrl, gatewayAdmin.baseUrl);
  assert.equal(direct.body.result.ok, true);
  assert.equal(direct.body.result.device, "Huawei");
  assert.deepEqual(gatewayAdmin.controls, [{
    deviceName: "Huawei",
    action: "limit_power",
    percent: 60,
    durationMinutes: 15,
  }]);
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

  const health = await requestJson(app.baseUrl, "/gateways/GW-TS-PROXY-001/remote/api/health", {
    cookie: sessionCookie,
  });
  assert.equal(health.status, 200);
  assert.equal(health.body.ok, true);

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

test("tailscale direct control requires gateway remote access metadata", async (t) => {
  const app = await startTestServer(t);
  const sessionCookie = await login(app);

  await createGateway(app, sessionCookie, {
    id: "GW-NO-TS-001",
    token: "gateway-secret",
  });

  const direct = await requestJson(app.baseUrl, "/api/gateways/GW-NO-TS-001/tailscale/control", {
    method: "POST",
    cookie: sessionCookie,
    body: {
      deviceName: "Huawei",
      action: "start",
    },
  });

  assert.equal(direct.status, 409);
  assert.match(direct.body.error, /Tailscale remote access is not enabled/);
});

test("admin can schedule inverter control commands", async (t) => {
  const app = await startTestServer(t);
  const sessionCookie = await login(app);

  await createGateway(app, sessionCookie, {
    id: "GW-SCHEDULE-001",
    token: "gateway-secret",
  });

  const futureAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const scheduled = await requestJson(app.baseUrl, "/api/gateways/GW-SCHEDULE-001/control", {
    method: "POST",
    cookie: sessionCookie,
    body: {
      deviceName: "Huawei",
      action: "limit_power",
      percent: 50,
      durationMinutes: 30,
      schedule: {
        mode: "once",
        scheduledAt: futureAt,
      },
    },
  });
  assert.equal(scheduled.status, 200);
  assert.equal(scheduled.body.command.status, "scheduled");
  assert.equal(scheduled.body.command.schedule.mode, "once");
  assert.equal(scheduled.body.command.nextRunAt, futureAt);

  const earlyCheck = await requestJson(app.baseUrl, "/api/gateway/commands/check", {
    method: "POST",
    token: "gateway-secret",
    body: {
      gateway_id: "GW-SCHEDULE-001",
      app_version: "0.1.12",
    },
  });
  assert.equal(earlyCheck.status, 200);
  assert.equal(earlyCheck.body.command, null);

  const dueAt = new Date(Date.now() - 60 * 1000).toISOString();
  const due = await requestJson(app.baseUrl, "/api/gateways/GW-SCHEDULE-001/control", {
    method: "POST",
    cookie: sessionCookie,
    body: {
      deviceName: "Huawei",
      action: "clear_power_limit",
      schedule: {
        mode: "once",
        scheduledAt: dueAt,
      },
    },
  });
  assert.equal(due.status, 200);
  assert.equal(due.body.command.status, "queued");

  const dueCheck = await requestJson(app.baseUrl, "/api/gateway/commands/check", {
    method: "POST",
    token: "gateway-secret",
    body: {
      gateway_id: "GW-SCHEDULE-001",
      app_version: "0.1.12",
    },
  });
  assert.equal(dueCheck.status, 200);
  assert.equal(dueCheck.body.command.id, due.body.command.id);
  assert.deepEqual(dueCheck.body.command.payload, {
    deviceName: "Huawei",
    action: "clear_power_limit",
  });

  const recurring = await requestJson(app.baseUrl, "/api/gateways/GW-SCHEDULE-001/control", {
    method: "POST",
    cookie: sessionCookie,
    body: {
      deviceName: "Huawei",
      action: "start",
      schedule: {
        mode: "daily",
        timezone: "Asia/Bangkok",
        timeOfDay: bangkokTimeOfDay(Date.now() + 60 * 60 * 1000),
        endTimeOfDay: bangkokTimeOfDay(Date.now() + 2 * 60 * 60 * 1000),
      },
    },
  });
  assert.equal(recurring.status, 200);
  assert.equal(recurring.body.command.status, "scheduled");
  assert.equal(recurring.body.command.schedule.mode, "daily");

  const cancelled = await requestJson(app.baseUrl, `/api/gateways/GW-SCHEDULE-001/commands/${encodeURIComponent(recurring.body.command.id)}`, {
    method: "DELETE",
    cookie: sessionCookie,
  });
  assert.equal(cancelled.status, 200);
  assert.equal(cancelled.body.ok, true);
  assert.equal(cancelled.body.series, true);
  assert.equal(cancelled.body.command.status, "cancelled");
  assert.ok(cancelled.body.command.cancelledAt);
  assert.ok(cancelled.body.command.seriesCancelledAt);
  assert.equal(cancelled.body.cancelled.length, 1);

  const cancelledCheck = await requestJson(app.baseUrl, "/api/gateway/commands/check", {
    method: "POST",
    token: "gateway-secret",
    body: {
      gateway_id: "GW-SCHEDULE-001",
      app_version: "0.1.12",
    },
  });
  assert.equal(cancelledCheck.status, 200);
  assert.equal(cancelledCheck.body.command, null);
});

test("admin cannot schedule overlapping power limit commands for the same target", async (t) => {
  const app = await startTestServer(t);
  const sessionCookie = await login(app);

  await createGateway(app, sessionCookie, {
    id: "GW-CONFLICT-001",
    token: "gateway-secret",
  });

  const scheduled = await requestJson(app.baseUrl, "/api/gateways/GW-CONFLICT-001/control", {
    method: "POST",
    cookie: sessionCookie,
    body: {
      deviceName: "Huawei",
      action: "limit_power",
      percent: 50,
      durationMinutes: 120,
      schedule: {
        mode: "daily",
        timezone: "Asia/Bangkok",
        timeOfDay: "08:00",
        endTimeOfDay: "10:00",
      },
    },
  });
  assert.equal(scheduled.status, 200);

  const duplicate = await requestJson(app.baseUrl, "/api/gateways/GW-CONFLICT-001/control", {
    method: "POST",
    cookie: sessionCookie,
    body: {
      deviceName: "Huawei",
      action: "limit_power",
      percent: 40,
      durationMinutes: 120,
      schedule: {
        mode: "daily",
        timezone: "Asia/Bangkok",
        timeOfDay: "09:00",
        endTimeOfDay: "11:00",
      },
    },
  });
  assert.equal(duplicate.status, 409);
  assert.match(duplicate.body.error, /Lịch tiết giảm trùng/);

  const otherTarget = await requestJson(app.baseUrl, "/api/gateways/GW-CONFLICT-001/control", {
    method: "POST",
    cookie: sessionCookie,
    body: {
      deviceName: "SMA",
      action: "limit_power",
      percent: 40,
      durationMinutes: 120,
      schedule: {
        mode: "daily",
        timezone: "Asia/Bangkok",
        timeOfDay: "09:00",
        endTimeOfDay: "11:00",
      },
    },
  });
  assert.equal(otherTarget.status, 200);
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

async function startFakeGatewayAdmin(t, { username = "admin", password = "admin" } = {}) {
  const controls = [];
  const writes = [];
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

      if (!String(req.headers.cookie || "").includes("rs485_admin_session=fake-session")) {
        return sendTestJson(res, 401, {
          ok: false,
          error: "Authentication required",
        });
      }

      if (req.method === "POST" && pathname === "/api/inverter/control") {
        const body = await readTestJsonBody(req);
        controls.push(body);
        return sendTestJson(res, 200, {
          ok: true,
          device: body.deviceName,
          stationId: body.stationId,
          action: body.action,
          mode: "fake",
        });
      }

      if (req.method === "POST" && pathname === "/api/modbus/write") {
        const body = await readTestJsonBody(req);
        writes.push(body);
        return sendTestJson(res, 200, {
          ok: true,
          device: body.deviceName,
          register: body.registerName,
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
    controls,
    writes,
  };
}

async function startTestServer(t, envOverrides = {}) {
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
    GATEWAY_PUSH_API_ENABLED: "true",
    PROVISIONING_TOKEN: "provisioning-token",
    AUTO_REGISTER_GATEWAYS: "true",
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

function bangkokTimeOfDay(timestamp) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(timestamp));
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
