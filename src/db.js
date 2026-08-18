import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

import initSqlJs from "sql.js";

import { defaultRemoteAccess, normalizeRemoteAccess } from "./remoteAccess.js";

const require = createRequire(import.meta.url);
const DEFAULT_GATEWAY_OFFLINE_AFTER_MS = 90_000;

export async function openDatabase(dbPath, options = {}) {
  fs.mkdirSync(path.dirname(path.resolve(dbPath)), { recursive: true });
  const { db, driver } = await openSqliteDatabase(dbPath, options.databaseDriver);
  assertDatabaseHealthy(db, dbPath);

  db.exec(`
    PRAGMA journal_mode = DELETE;
    PRAGMA synchronous = FULL;
    PRAGMA busy_timeout = 5000;
    PRAGMA foreign_keys = OFF;
  `);

  migrateGatewayDirectorySchema(db);

  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE INDEX IF NOT EXISTS idx_gateways_status_seen
      ON gateways(status, last_seen_at);
  `);

  return new HardwareStore(db, {
    ...options,
    databaseDriver: driver,
  });
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
    databaseDriver = "unknown",
  } = {}) {
    this.db = db;
    this.offlineAfterMs = positiveInteger(offlineAfterMs, DEFAULT_GATEWAY_OFFLINE_AFTER_MS);
    this.now = now;
    this.databaseDriver = databaseDriver;
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

async function openSqliteDatabase(dbPath, configuredDriver = process.env.SQLITE_DRIVER) {
  const requestedDriver = normalizeDatabaseDriver(configuredDriver);

  if (requestedDriver !== "sqljs") {
    let DatabaseSync;

    try {
      ({ DatabaseSync } = await import("node:sqlite"));
    } catch (error) {
      if (requestedDriver === "node") {
        throw new Error(`SQLITE_DRIVER=node requires a Node.js release with node:sqlite support: ${error.message}`);
      }
    }

    if (DatabaseSync) {
      return {
        db: new DatabaseSync(dbPath),
        driver: "node",
      };
    }
  }

  assertSqlJsCanOpenDatabase(dbPath);
  const wasmPath = require.resolve("sql.js/dist/sql-wasm.wasm");
  const SQL = await initSqlJs({
    locateFile: () => wasmPath,
  });
  const existingDatabase = fs.existsSync(dbPath) && fs.statSync(dbPath).size > 0
    ? fs.readFileSync(dbPath)
    : null;

  return {
    db: new SqlJsDatabase(SQL, dbPath, existingDatabase),
    driver: "sqljs",
  };
}

function assertDatabaseHealthy(db, dbPath) {
  let result;

  try {
    result = db.prepare("PRAGMA quick_check").get();
  } catch (error) {
    throw new Error(`SQLite health check failed for ${path.resolve(dbPath)}: ${error.message}`, { cause: error });
  }

  if (result?.quick_check === "ok") return;
  throw new Error(`SQLite health check failed for ${path.resolve(dbPath)}: ${result?.quick_check || "unknown error"}`);
}

function normalizeDatabaseDriver(value) {
  const driver = String(value || "auto").trim().toLowerCase();
  if (driver === "auto" || driver === "node") return driver;
  if (["sqljs", "sql.js", "wasm"].includes(driver)) return "sqljs";
  throw new Error(`Unsupported SQLITE_DRIVER=${value}; expected auto, node, or sqljs`);
}

function assertSqlJsCanOpenDatabase(dbPath) {
  const walPath = `${dbPath}-wal`;
  if (!fs.existsSync(walPath) || fs.statSync(walPath).size === 0) return;

  throw new Error(
    `Cannot safely open ${dbPath} with sql.js while ${walPath} contains WAL data. `
      + "Use SQLITE_DRIVER=node to checkpoint the database before using the sql.js fallback.",
  );
}

class SqlJsDatabase {
  constructor(SQL, dbPath, existingDatabase) {
    this.dbPath = dbPath;
    this.db = existingDatabase
      ? new SQL.Database(new Uint8Array(existingDatabase))
      : new SQL.Database();
    this.transactionDepth = 0;
    this.saveSequence = 0;
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
    let result;

    try {
      statement.run(normalizeSqlParams(params));
      result = this.#lastWriteResult();
    } finally {
      statement.free();
    }

    this.#afterSql(sql);
    return result;
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
    const targetPath = path.resolve(this.dbPath);
    const tempPath = path.join(
      path.dirname(targetPath),
      `.${path.basename(targetPath)}.${process.pid}.${this.saveSequence += 1}.tmp`,
    );
    let descriptor;

    try {
      descriptor = fs.openSync(tempPath, "w", 0o600);
      fs.writeFileSync(descriptor, Buffer.from(this.db.export()));
      fs.fsyncSync(descriptor);
      fs.closeSync(descriptor);
      descriptor = undefined;
      fs.renameSync(tempPath, targetPath);
    } catch (error) {
      throw new Error(`Failed to persist SQLite database ${targetPath}: ${error.message}`, { cause: error });
    } finally {
      if (descriptor !== undefined) {
        try {
          fs.closeSync(descriptor);
        } catch {
          // Preserve the original persistence error.
        }
      }
      try {
        fs.unlinkSync(tempPath);
      } catch {
        // The destination is already safe; a stale temp file can be cleaned later.
      }
    }
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
