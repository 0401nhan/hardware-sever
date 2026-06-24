import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { openDatabase } from "../src/db.js";

test("stores gateway directory records without legacy token or queue schema", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hardware-server-db-"));
  const store = await openDatabase(path.join(dir, "hardware-server.sqlite"));

  try {
    const gateway = store.upsertGateway({
      id: "moxa",
      name: "Moxa",
      site: "Plant A",
      remoteAccess: {
        enabled: true,
        method: "tailscale",
        host: "moxa.tailnet.test",
        ip: "100.77.152.66",
        uiPort: 80,
        sshPort: 22,
        tag: "tag:gateway",
      },
    });

    assert.equal(gateway.id, "moxa");
    assert.equal(gateway.remoteAccess.ip, "100.77.152.66");
    assert.equal(gateway.tokenHash, undefined);
    assert.equal(tableExists(store, "gateway_commands"), false);
    assert.equal(tableExists(store, "telemetry_records"), false);
    assert.equal(tableExists(store, "config_versions"), false);
    assert.equal(tableExists(store, "device_templates"), false);
    assert.equal(gatewayColumns(store).includes("token_hash"), false);
    assert.equal(gatewayColumns(store).includes("desired_config_version"), false);
  } finally {
    store.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("marks Tailscale synced gateways online and ages them offline", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hardware-server-status-"));
  let now = Date.parse("2026-06-24T00:00:00.000Z");
  const store = await openDatabase(path.join(dir, "hardware-server.sqlite"), {
    offlineAfterMs: 1_000,
    now: () => now,
  });

  try {
    store.upsertGateway({
      id: "moxa",
      remoteAccess: {
        enabled: true,
        ip: "100.77.152.66",
        uiPort: 80,
      },
    });
    store.markOnline("moxa", "tailscale");

    assert.equal(store.getGateway("moxa").status, "online");
    now += 2_000;
    assert.equal(store.getGateway("moxa").status, "offline");
  } finally {
    store.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("migrates legacy sqlite data into the compact gateway directory", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hardware-server-migrate-"));
  const dbPath = path.join(dir, "hardware-server.sqlite");
  const seed = await openDatabase(dbPath);

  try {
    seed.db.exec(`
      DROP TABLE gateways;
      CREATE TABLE gateways (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL DEFAULT '',
        site TEXT NOT NULL DEFAULT '',
        token_hash TEXT NOT NULL,
        remote_access_enabled INTEGER NOT NULL DEFAULT 0,
        remote_access_method TEXT NOT NULL DEFAULT 'tailscale',
        tailscale_host TEXT NOT NULL DEFAULT '',
        tailscale_ip TEXT NOT NULL DEFAULT '',
        tailscale_ui_port INTEGER NOT NULL DEFAULT 3000,
        tailscale_ssh_port INTEGER NOT NULL DEFAULT 22,
        tailscale_tag TEXT NOT NULL DEFAULT 'tag:gateway',
        status TEXT NOT NULL DEFAULT 'offline',
        last_seen_at TEXT,
        app_version TEXT,
        desired_config_version INTEGER,
        applied_config_version INTEGER,
        last_config_status TEXT,
        last_config_message TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      INSERT INTO gateways (
        id, name, site, token_hash, remote_access_enabled, remote_access_method,
        tailscale_host, tailscale_ip, tailscale_ui_port, tailscale_ssh_port,
        tailscale_tag, status, last_seen_at, app_version, created_at, updated_at
      ) VALUES (
        'legacy', 'Legacy Moxa', 'Old Site', 'hash', 1, 'tailscale',
        'legacy.tailnet.test', '100.64.1.2', 80, 22,
        'tag:gateway', 'online', '2026-06-24T00:00:00.000Z', 'old-app',
        '2026-06-24T00:00:00.000Z', '2026-06-24T00:00:00.000Z'
      );
      CREATE TABLE gateway_commands (id TEXT PRIMARY KEY);
    `);
  } finally {
    seed.close();
  }

  const migrated = await openDatabase(dbPath, {
    offlineAfterMs: 60_000,
    now: () => Date.parse("2026-06-24T00:00:10.000Z"),
  });

  try {
    const gateway = migrated.getGateway("legacy");
    assert.equal(gateway.name, "Legacy Moxa");
    assert.equal(gateway.remoteAccess.ip, "100.64.1.2");
    assert.equal(gateway.status, "online");
    assert.equal(tableExists(migrated, "gateway_commands"), false);
    assert.equal(gatewayColumns(migrated).includes("token_hash"), false);
  } finally {
    migrated.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

function tableExists(store, name) {
  return Boolean(store.db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get(name));
}

function gatewayColumns(store) {
  return store.db.prepare("PRAGMA table_info(gateways)").all().map((row) => row.name);
}
