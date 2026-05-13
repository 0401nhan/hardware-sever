import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { DatabaseSync } = require("node:sqlite");

export function openDatabase(dbPath, tokenHashSecret) {
  fs.mkdirSync(path.dirname(path.resolve(dbPath)), { recursive: true });
  const db = new DatabaseSync(dbPath);

  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS gateways (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT '',
      site TEXT NOT NULL DEFAULT '',
      token_hash TEXT NOT NULL,
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

    CREATE TABLE IF NOT EXISTS config_versions (
      gateway_id TEXT NOT NULL,
      version INTEGER NOT NULL,
      config_json TEXT NOT NULL,
      config_hash TEXT NOT NULL,
      restart_required INTEGER NOT NULL DEFAULT 1,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (gateway_id, version),
      FOREIGN KEY (gateway_id) REFERENCES gateways(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS telemetry_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gateway_id TEXT NOT NULL,
      record_id TEXT,
      record_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (gateway_id) REFERENCES gateways(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_config_versions_gateway_version
      ON config_versions(gateway_id, version DESC);

    CREATE INDEX IF NOT EXISTS idx_telemetry_gateway_created
      ON telemetry_records(gateway_id, created_at DESC);
  `);

  return new HardwareStore(db, tokenHashSecret);
}

export class HardwareStore {
  constructor(db, tokenHashSecret) {
    this.db = db;
    this.tokenHashSecret = tokenHashSecret;
  }

  listGateways() {
    return this.db.prepare(`
      SELECT
        g.*,
        (
          SELECT MAX(version)
          FROM config_versions
          WHERE gateway_id = g.id
        ) AS latest_config_version
      FROM gateways g
      ORDER BY COALESCE(g.last_seen_at, g.created_at) DESC, g.id ASC
    `).all().map(mapGatewayRow);
  }

  getGateway(id) {
    const row = this.db.prepare("SELECT * FROM gateways WHERE id = ?").get(id);
    return row ? mapGatewayRow(row) : null;
  }

  upsertGateway({ id, name = "", site = "", token = "" }) {
    const now = new Date().toISOString();
    const existing = this.getGateway(id);
    const tokenHash = token ? this.hashToken(token) : existing?.tokenHash;

    if (!tokenHash) {
      throw new Error("Gateway token is required");
    }

    this.db.prepare(`
      INSERT INTO gateways (id, name, site, token_hash, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        site = excluded.site,
        token_hash = excluded.token_hash,
        updated_at = excluded.updated_at
    `).run(id, name, site, tokenHash, now, now);

    return this.getGateway(id);
  }

  autoRegisterGateway(id, token) {
    return this.upsertGateway({
      id,
      name: id,
      site: "",
      token,
    });
  }

  verifyGatewayToken(gatewayId, token) {
    const gateway = this.getGateway(gatewayId);
    if (!gateway || !token) return false;
    return safeEqual(gateway.tokenHash, this.hashToken(token));
  }

  markHeartbeat(gatewayId, appVersion = "") {
    const now = new Date().toISOString();

    this.db.prepare(`
      UPDATE gateways
      SET status = 'online',
          last_seen_at = ?,
          app_version = ?,
          updated_at = ?
      WHERE id = ?
    `).run(now, appVersion, now, gatewayId);

    return this.getGateway(gatewayId);
  }

  getLatestConfig(gatewayId) {
    const row = this.db.prepare(`
      SELECT *
      FROM config_versions
      WHERE gateway_id = ?
      ORDER BY version DESC
      LIMIT 1
    `).get(gatewayId);

    return row ? mapConfigRow(row) : null;
  }

  addConfigVersion({ gatewayId, config, restartRequired = true, createdBy = "admin" }) {
    const latest = this.getLatestConfig(gatewayId);
    const version = (latest?.version ?? 0) + 1;
    const configJson = stableJson(config);
    const configHash = sha256(configJson);
    const now = new Date().toISOString();

    this.db.prepare(`
      INSERT INTO config_versions (
        gateway_id,
        version,
        config_json,
        config_hash,
        restart_required,
        created_by,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(gatewayId, version, configJson, configHash, restartRequired ? 1 : 0, createdBy, now);

    this.db.prepare(`
      UPDATE gateways
      SET desired_config_version = ?, updated_at = ?
      WHERE id = ?
    `).run(version, now, gatewayId);

    return this.getLatestConfig(gatewayId);
  }

  updateConfigStatus({ gatewayId, version, status, message = "", appVersion = "" }) {
    const now = new Date().toISOString();
    const appliedVersion = status === "applied" ? version : this.getGateway(gatewayId)?.appliedConfigVersion;

    this.db.prepare(`
      UPDATE gateways
      SET applied_config_version = ?,
          last_config_status = ?,
          last_config_message = ?,
          app_version = COALESCE(NULLIF(?, ''), app_version),
          last_seen_at = ?,
          status = 'online',
          updated_at = ?
      WHERE id = ?
    `).run(appliedVersion ?? null, status, message ?? "", appVersion ?? "", now, now, gatewayId);

    return this.getGateway(gatewayId);
  }

  insertTelemetry(gatewayId, records) {
    const now = new Date().toISOString();
    const insert = this.db.prepare(`
      INSERT INTO telemetry_records (gateway_id, record_id, record_json, created_at)
      VALUES (?, ?, ?, ?)
    `);
    const updateGateway = this.db.prepare(`
      UPDATE gateways
      SET last_seen_at = ?, status = 'online', updated_at = ?
      WHERE id = ?
    `);

    try {
      this.db.exec("BEGIN");
      for (const record of records) {
        insert.run(gatewayId, record.id ?? null, JSON.stringify(record), now);
      }
      updateGateway.run(now, now, gatewayId);
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  latestTelemetry(gatewayId, limit = 100) {
    return this.db.prepare(`
      SELECT *
      FROM telemetry_records
      WHERE gateway_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(gatewayId, limit).map((row) => ({
      id: row.id,
      gatewayId: row.gateway_id,
      recordId: row.record_id,
      createdAt: row.created_at,
      record: JSON.parse(row.record_json),
    }));
  }

  hashToken(token) {
    return crypto.createHmac("sha256", this.tokenHashSecret).update(token).digest("hex");
  }
}

export function stableJson(value) {
  return JSON.stringify(sortKeys(value));
}

export function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (!value || typeof value !== "object") return value;

  return Object.keys(value).sort().reduce((result, key) => {
    result[key] = sortKeys(value[key]);
    return result;
  }, {});
}

function mapGatewayRow(row) {
  return {
    id: row.id,
    name: row.name,
    site: row.site,
    tokenHash: row.token_hash,
    status: row.status,
    lastSeenAt: row.last_seen_at,
    appVersion: row.app_version,
    desiredConfigVersion: row.desired_config_version,
    appliedConfigVersion: row.applied_config_version,
    latestConfigVersion: row.latest_config_version,
    lastConfigStatus: row.last_config_status,
    lastConfigMessage: row.last_config_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapConfigRow(row) {
  return {
    gatewayId: row.gateway_id,
    version: row.version,
    config: JSON.parse(row.config_json),
    configHash: row.config_hash,
    restartRequired: Boolean(row.restart_required),
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));

  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}
