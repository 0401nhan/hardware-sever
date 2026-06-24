import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

import initSqlJs from "sql.js";

import { defaultRemoteAccess, normalizeRemoteAccess } from "./remoteAccess.js";

const require = createRequire(import.meta.url);
const DEFAULT_GATEWAY_OFFLINE_AFTER_MS = 90_000;

export async function openDatabase(dbPath, options = {}) {
  fs.mkdirSync(path.dirname(path.resolve(dbPath)), { recursive: true });
  const db = await openSqliteDatabase(dbPath);

  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = OFF;
  `);

  migrateGatewayDirectorySchema(db);

  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE INDEX IF NOT EXISTS idx_gateways_status_seen
      ON gateways(status, last_seen_at);
  `);

  return new HardwareStore(db, options);
}

function migrateGatewayDirectorySchema(db) {
  const existingRows = tableExists(db, "gateways")
    ? db.prepare("SELECT * FROM gateways").all()
    : [];

  db.exec(`
    DROP TABLE IF EXISTS config_versions;
    DROP TABLE IF EXISTS telemetry_records;
    DROP TABLE IF EXISTS gateway_commands;
    DROP TABLE IF EXISTS template_registers;
    DROP TABLE IF EXISTS device_templates;
    DROP TABLE IF EXISTS template_library_metadata;
    DROP TABLE IF EXISTS gateways;

    CREATE TABLE gateways (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT '',
      site TEXT NOT NULL DEFAULT '',
      remote_access_enabled INTEGER NOT NULL DEFAULT 0,
      remote_access_method TEXT NOT NULL DEFAULT 'tailscale',
      tailscale_host TEXT NOT NULL DEFAULT '',
      tailscale_ip TEXT NOT NULL DEFAULT '',
      tailscale_ui_port INTEGER NOT NULL DEFAULT 80,
      tailscale_ssh_port INTEGER NOT NULL DEFAULT 22,
      tailscale_tag TEXT NOT NULL DEFAULT 'tag:gateway',
      status TEXT NOT NULL DEFAULT 'offline',
      last_seen_at TEXT,
      app_version TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  if (!existingRows.length) return;

  const insert = db.prepare(`
    INSERT OR REPLACE INTO gateways (
      id,
      name,
      site,
      remote_access_enabled,
      remote_access_method,
      tailscale_host,
      tailscale_ip,
      tailscale_ui_port,
      tailscale_ssh_port,
      tailscale_tag,
      status,
      last_seen_at,
      app_version,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const row of existingRows) {
    const now = new Date().toISOString();
    const remote = normalizeRemoteAccess({
      enabled: Boolean(row.remote_access_enabled),
      method: row.remote_access_method || "tailscale",
      host: row.tailscale_host || "",
      ip: row.tailscale_ip || "",
      uiPort: row.tailscale_ui_port || 80,
      sshPort: row.tailscale_ssh_port || 22,
      tag: row.tailscale_tag || "tag:gateway",
    });

    insert.run(
      String(row.id || "").trim(),
      String(row.name || row.id || "").trim(),
      String(row.site || "").trim(),
      remote.enabled ? 1 : 0,
      remote.method,
      remote.host,
      remote.ip,
      remote.uiPort,
      remote.sshPort,
      remote.tag,
      ["online", "offline"].includes(row.status) ? row.status : "offline",
      row.last_seen_at || null,
      row.app_version || null,
      row.created_at || now,
      row.updated_at || now,
    );
  }
}

function tableExists(db, name) {
  const row = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get(name);
  return Boolean(row);
}

export class HardwareStore {
  constructor(db, {
    offlineAfterMs = DEFAULT_GATEWAY_OFFLINE_AFTER_MS,
    now = () => Date.now(),
  } = {}) {
    this.db = db;
    this.offlineAfterMs = positiveInteger(offlineAfterMs, DEFAULT_GATEWAY_OFFLINE_AFTER_MS);
    this.now = now;
  }

  listGateways() {
    return this.db.prepare(`
      SELECT *
      FROM gateways
      ORDER BY COALESCE(last_seen_at, updated_at, created_at) DESC, id ASC
    `).all().map((row) => mapGatewayRow(row, this.offlineAfterMs, this.now));
  }

  getGateway(id) {
    const row = this.db.prepare("SELECT * FROM gateways WHERE id = ?").get(id);
    return row ? mapGatewayRow(row, this.offlineAfterMs, this.now) : null;
  }

  upsertGateway({ id, name = "", site = "", remoteAccess }) {
    const normalizedId = String(id || "").trim();
    if (!normalizedId) throw new Error("Gateway id is required");

    const now = new Date(this.now()).toISOString();
    const existing = this.getGateway(normalizedId);
    const remote = normalizeRemoteAccess(remoteAccess ?? existing?.remoteAccess ?? defaultRemoteAccess());

    this.db.prepare(`
      INSERT INTO gateways (
        id,
        name,
        site,
        remote_access_enabled,
        remote_access_method,
        tailscale_host,
        tailscale_ip,
        tailscale_ui_port,
        tailscale_ssh_port,
        tailscale_tag,
        status,
        last_seen_at,
        app_version,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        site = excluded.site,
        remote_access_enabled = excluded.remote_access_enabled,
        remote_access_method = excluded.remote_access_method,
        tailscale_host = excluded.tailscale_host,
        tailscale_ip = excluded.tailscale_ip,
        tailscale_ui_port = excluded.tailscale_ui_port,
        tailscale_ssh_port = excluded.tailscale_ssh_port,
        tailscale_tag = excluded.tailscale_tag,
        updated_at = excluded.updated_at
    `).run(
      normalizedId,
      String(name || normalizedId).trim(),
      String(site || "").trim(),
      remote.enabled ? 1 : 0,
      remote.method,
      remote.host,
      remote.ip,
      remote.uiPort,
      remote.sshPort,
      remote.tag,
      existing?.status || "offline",
      existing?.lastSeenAt || null,
      existing?.appVersion || null,
      existing?.createdAt || now,
      now,
    );

    return this.getGateway(normalizedId);
  }

  updateGatewayRemoteAccess(id, remoteAccess) {
    if (!this.getGateway(id)) return null;

    const remote = normalizeRemoteAccess(remoteAccess);
    const now = new Date(this.now()).toISOString();
    this.db.prepare(`
      UPDATE gateways
      SET remote_access_enabled = ?,
          remote_access_method = ?,
          tailscale_host = ?,
          tailscale_ip = ?,
          tailscale_ui_port = ?,
          tailscale_ssh_port = ?,
          tailscale_tag = ?,
          updated_at = ?
      WHERE id = ?
    `).run(
      remote.enabled ? 1 : 0,
      remote.method,
      remote.host,
      remote.ip,
      remote.uiPort,
      remote.sshPort,
      remote.tag,
      now,
      id,
    );

    return this.getGateway(id);
  }

  markOnline(gatewayId, appVersion = "") {
    const now = new Date(this.now()).toISOString();

    this.db.prepare(`
      UPDATE gateways
      SET status = 'online',
          last_seen_at = ?,
          app_version = COALESCE(NULLIF(?, ''), app_version),
          updated_at = ?
      WHERE id = ?
    `).run(now, appVersion ?? "", now, gatewayId);

    return this.getGateway(gatewayId);
  }

  deleteGateway(id) {
    const gateway = this.getGateway(id);
    if (!gateway) return null;

    this.db.prepare("DELETE FROM gateways WHERE id = ?").run(id);
    return gateway;
  }

  close() {
    this.db.close();
  }
}

function mapGatewayRow(row, offlineAfterMs = DEFAULT_GATEWAY_OFFLINE_AFTER_MS, now = () => Date.now()) {
  return {
    id: row.id,
    name: row.name,
    site: row.site,
    remoteAccess: normalizeRemoteAccess({
      enabled: Boolean(row.remote_access_enabled),
      method: row.remote_access_method,
      host: row.tailscale_host,
      ip: row.tailscale_ip,
      uiPort: row.tailscale_ui_port,
      sshPort: row.tailscale_ssh_port,
      tag: row.tailscale_tag,
    }),
    status: gatewayStatus(row, offlineAfterMs, now),
    lastSeenAt: row.last_seen_at,
    appVersion: row.app_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function gatewayStatus(row, offlineAfterMs, now) {
  if (row.status !== "online") return row.status || "offline";
  if (!row.last_seen_at) return "offline";

  const lastSeenAt = Date.parse(row.last_seen_at);
  if (!Number.isFinite(lastSeenAt)) return "offline";

  return now() - lastSeenAt > offlineAfterMs ? "offline" : "online";
}

function positiveInteger(value, fallback) {
  const number = Number.parseInt(String(value || ""), 10);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}

async function openSqliteDatabase(dbPath) {
  if (process.env.SQLITE_DRIVER === "node") {
    const { DatabaseSync } = await import("node:sqlite");
    return new DatabaseSync(dbPath);
  }

  const wasmPath = require.resolve("sql.js/dist/sql-wasm.wasm");
  const SQL = await initSqlJs({
    locateFile: () => wasmPath,
  });
  const existingDatabase = fs.existsSync(dbPath) && fs.statSync(dbPath).size > 0
    ? fs.readFileSync(dbPath)
    : null;

  return new SqlJsDatabase(SQL, dbPath, existingDatabase);
}

class SqlJsDatabase {
  constructor(SQL, dbPath, existingDatabase) {
    this.dbPath = dbPath;
    this.db = existingDatabase
      ? new SQL.Database(new Uint8Array(existingDatabase))
      : new SQL.Database();
    this.transactionDepth = 0;
    this.closed = false;
  }

  exec(sql) {
    const result = this.db.exec(sql);
    this.#afterSql(sql);
    return result;
  }

  prepare(sql) {
    return new SqlJsStatement(this, sql);
  }

  close() {
    if (this.closed) return;
    this.#save();
    this.db.close();
    this.closed = true;
  }

  runPrepared(sql, params) {
    const statement = this.db.prepare(sql);

    try {
      statement.run(normalizeSqlParams(params));
      const result = this.#lastWriteResult();
      this.#afterSql(sql);
      return result;
    } finally {
      statement.free();
    }
  }

  getPrepared(sql, params) {
    const statement = this.db.prepare(sql);

    try {
      statement.bind(normalizeSqlParams(params));
      return statement.step() ? statement.getAsObject() : undefined;
    } finally {
      statement.free();
    }
  }

  allPrepared(sql, params) {
    const statement = this.db.prepare(sql);
    const rows = [];

    try {
      statement.bind(normalizeSqlParams(params));
      while (statement.step()) rows.push(statement.getAsObject());
      return rows;
    } finally {
      statement.free();
    }
  }

  #afterSql(sql) {
    const normalized = String(sql).trim().toUpperCase();

    if (normalized.startsWith("BEGIN")) {
      this.transactionDepth += 1;
      return;
    }
    if (normalized.startsWith("COMMIT") || normalized.startsWith("ROLLBACK")) {
      this.transactionDepth = Math.max(0, this.transactionDepth - 1);
      this.#save();
      return;
    }
    if (this.transactionDepth === 0 && isWriteStatement(normalized)) {
      this.#save();
    }
  }

  #lastWriteResult() {
    const changes = this.db.getRowsModified();
    const row = this.db.exec("SELECT last_insert_rowid() AS id")[0]?.values?.[0];
    return {
      changes,
      lastInsertRowid: row ? row[0] : undefined,
    };
  }

  #save() {
    if (this.closed) return;
    fs.writeFileSync(this.dbPath, Buffer.from(this.db.export()));
  }
}

class SqlJsStatement {
  constructor(database, sql) {
    this.database = database;
    this.sql = sql;
  }

  run(...params) {
    return this.database.runPrepared(this.sql, flattenParams(params));
  }

  get(...params) {
    return this.database.getPrepared(this.sql, flattenParams(params));
  }

  all(...params) {
    return this.database.allPrepared(this.sql, flattenParams(params));
  }
}

function flattenParams(params) {
  if (params.length === 1 && Array.isArray(params[0])) return params[0];
  return params;
}

function normalizeSqlParams(params) {
  return params.map((value) => value === undefined ? null : value);
}

function isWriteStatement(normalizedSql) {
  return /^(INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|REPLACE|PRAGMA)/.test(normalizedSql);
}
