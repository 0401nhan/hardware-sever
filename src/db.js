import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

import initSqlJs from "sql.js";
import { defaultRemoteAccess, normalizeRemoteAccess } from "./remoteAccess.js";
import { commandStatusForNextRun, isRecurringSchedule, nextScheduledRun, scheduledWindowEndRun } from "./schedule.js";

const require = createRequire(import.meta.url);
const DEFAULT_GATEWAY_OFFLINE_AFTER_MS = 90_000;
const DEFAULT_TELEMETRY_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const DEFAULT_TELEMETRY_PRUNE_INTERVAL_MS = 60 * 60 * 1000;
const WINDOW_END_ACTIONS = Object.freeze({
  limit_power: "clear_power_limit",
  start: "stop",
  stop: "start",
});
const DAY_MINUTES = 24 * 60;
const WEEK_MINUTES = 7 * DAY_MINUTES;

export async function openDatabase(dbPath, tokenHashSecret, options = {}) {
  if (mongoStoreEnabled()) {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI || "";

    if (!uri) {
      throw new Error("MONGODB_URI is required when STORE_DRIVER=mongodb");
    }

    const { openMongoStore } = await import("./mongoStore.js");
    return openMongoStore({
      uri,
      dbName: process.env.MONGODB_DB || process.env.MONGO_DB || "hardware_gateway",
      tokenHashSecret,
      options,
    });
  }

  fs.mkdirSync(path.dirname(path.resolve(dbPath)), { recursive: true });
  const db = await openSqliteDatabase(dbPath);

  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS gateways (
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

    CREATE TABLE IF NOT EXISTS gateway_commands (
      id TEXT PRIMARY KEY,
      gateway_id TEXT NOT NULL,
      action TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'queued',
      message TEXT NOT NULL DEFAULT '',
      result_json TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      delivered_at TEXT,
      completed_at TEXT,
      updated_at TEXT NOT NULL,
      scheduled_at TEXT,
      next_run_at TEXT,
      schedule_json TEXT,
      schedule_id TEXT,
      run_index INTEGER NOT NULL DEFAULT 0,
      window_role TEXT NOT NULL DEFAULT 'start',
      source_command_id TEXT,
      cancelled_at TEXT,
      series_cancelled_at TEXT,
      FOREIGN KEY (gateway_id) REFERENCES gateways(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS template_library_metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS device_templates (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      manufacturer TEXT NOT NULL DEFAULT '',
      model TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT '',
      type TEXT NOT NULL DEFAULT '',
      protocol TEXT NOT NULL DEFAULT 'modbus-rtu',
      poll_interval_ms INTEGER NOT NULL DEFAULT 5000,
      notes TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS template_registers (
      template_id TEXT NOT NULL,
      register_index INTEGER NOT NULL,
      name TEXT NOT NULL,
      function TEXT NOT NULL DEFAULT 'holding',
      access TEXT NOT NULL DEFAULT 'ro',
      poll_enabled INTEGER NOT NULL DEFAULT 1,
      address INTEGER NOT NULL DEFAULT 0,
      length INTEGER NOT NULL DEFAULT 1,
      type TEXT NOT NULL DEFAULT 'uint16',
      scale REAL NOT NULL DEFAULT 1,
      unit TEXT NOT NULL DEFAULT '',
      word_order TEXT,
      offset REAL,
      PRIMARY KEY (template_id, register_index),
      FOREIGN KEY (template_id) REFERENCES device_templates(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_config_versions_gateway_version
      ON config_versions(gateway_id, version DESC);

    DELETE FROM telemetry_records
    WHERE record_id IS NOT NULL
      AND id NOT IN (
        SELECT MIN(id)
        FROM telemetry_records
        WHERE record_id IS NOT NULL
        GROUP BY gateway_id, record_id
      );

    CREATE INDEX IF NOT EXISTS idx_telemetry_gateway_created
      ON telemetry_records(gateway_id, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_gateway_commands_gateway_status
      ON gateway_commands(gateway_id, status, created_at);

    CREATE UNIQUE INDEX IF NOT EXISTS idx_telemetry_gateway_record_unique
      ON telemetry_records(gateway_id, record_id)
      WHERE record_id IS NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_template_registers_template_index
      ON template_registers(template_id, register_index);
  `);

  ensureTemplateRegisterColumns(db);
  ensureGatewayCommandScheduleColumns(db);
  ensureGatewayRemoteAccessColumns(db);

  const store = new HardwareStore(db, tokenHashSecret, options);
  store.pruneTelemetry({ force: true });

  return store;
}

function mongoStoreEnabled() {
  const driver = String(process.env.STORE_DRIVER || process.env.DB_DRIVER || "").trim().toLowerCase();
  return driver === "mongodb" || driver === "mongo";
}

function ensureTemplateRegisterColumns(db) {
  const columns = new Set(
    db.prepare("PRAGMA table_info(template_registers)").all().map((row) => row.name),
  );

  if (!columns.has("access")) {
    db.exec("ALTER TABLE template_registers ADD COLUMN access TEXT NOT NULL DEFAULT 'ro'");
  }

  if (!columns.has("poll_enabled")) {
    db.exec("ALTER TABLE template_registers ADD COLUMN poll_enabled INTEGER NOT NULL DEFAULT 1");
  }
}

function ensureGatewayCommandScheduleColumns(db) {
  const columns = new Set(
    db.prepare("PRAGMA table_info(gateway_commands)").all().map((row) => row.name),
  );

  const migrations = [
    ["scheduled_at", "ALTER TABLE gateway_commands ADD COLUMN scheduled_at TEXT"],
    ["next_run_at", "ALTER TABLE gateway_commands ADD COLUMN next_run_at TEXT"],
    ["schedule_json", "ALTER TABLE gateway_commands ADD COLUMN schedule_json TEXT"],
    ["schedule_id", "ALTER TABLE gateway_commands ADD COLUMN schedule_id TEXT"],
    ["run_index", "ALTER TABLE gateway_commands ADD COLUMN run_index INTEGER NOT NULL DEFAULT 0"],
    ["window_role", "ALTER TABLE gateway_commands ADD COLUMN window_role TEXT NOT NULL DEFAULT 'start'"],
    ["source_command_id", "ALTER TABLE gateway_commands ADD COLUMN source_command_id TEXT"],
    ["cancelled_at", "ALTER TABLE gateway_commands ADD COLUMN cancelled_at TEXT"],
    ["series_cancelled_at", "ALTER TABLE gateway_commands ADD COLUMN series_cancelled_at TEXT"],
  ];

  for (const [column, statement] of migrations) {
    if (!columns.has(column)) db.exec(statement);
  }

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_gateway_commands_gateway_due
      ON gateway_commands(gateway_id, status, next_run_at, created_at);

    CREATE UNIQUE INDEX IF NOT EXISTS idx_gateway_commands_schedule_run
      ON gateway_commands(gateway_id, schedule_id, run_index)
      WHERE schedule_id IS NOT NULL;

    CREATE UNIQUE INDEX IF NOT EXISTS idx_gateway_commands_source_followup
      ON gateway_commands(gateway_id, source_command_id, window_role)
      WHERE source_command_id IS NOT NULL;
  `);
}

function ensureGatewayRemoteAccessColumns(db) {
  const columns = new Set(
    db.prepare("PRAGMA table_info(gateways)").all().map((row) => row.name),
  );

  const migrations = [
    ["remote_access_enabled", "ALTER TABLE gateways ADD COLUMN remote_access_enabled INTEGER NOT NULL DEFAULT 0"],
    ["remote_access_method", "ALTER TABLE gateways ADD COLUMN remote_access_method TEXT NOT NULL DEFAULT 'tailscale'"],
    ["tailscale_host", "ALTER TABLE gateways ADD COLUMN tailscale_host TEXT NOT NULL DEFAULT ''"],
    ["tailscale_ip", "ALTER TABLE gateways ADD COLUMN tailscale_ip TEXT NOT NULL DEFAULT ''"],
    ["tailscale_ui_port", "ALTER TABLE gateways ADD COLUMN tailscale_ui_port INTEGER NOT NULL DEFAULT 3000"],
    ["tailscale_ssh_port", "ALTER TABLE gateways ADD COLUMN tailscale_ssh_port INTEGER NOT NULL DEFAULT 22"],
    ["tailscale_tag", "ALTER TABLE gateways ADD COLUMN tailscale_tag TEXT NOT NULL DEFAULT 'tag:gateway'"],
  ];

  for (const [column, statement] of migrations) {
    if (!columns.has(column)) db.exec(statement);
  }
}

export class HardwareStore {
  constructor(db, tokenHashSecret, {
    offlineAfterMs = DEFAULT_GATEWAY_OFFLINE_AFTER_MS,
    telemetryRetentionMs = DEFAULT_TELEMETRY_RETENTION_MS,
    telemetryPruneIntervalMs = DEFAULT_TELEMETRY_PRUNE_INTERVAL_MS,
    now = () => Date.now(),
  } = {}) {
    this.db = db;
    this.tokenHashSecret = tokenHashSecret;
    this.offlineAfterMs = offlineAfterMs;
    this.telemetryRetentionMs = nonNegativeInteger(telemetryRetentionMs, DEFAULT_TELEMETRY_RETENTION_MS);
    this.telemetryPruneIntervalMs = nonNegativeInteger(telemetryPruneIntervalMs, DEFAULT_TELEMETRY_PRUNE_INTERVAL_MS);
    this.now = now;
    this.lastTelemetryPrunedAt = 0;
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
    `).all().map((row) => mapGatewayRow(row, this.offlineAfterMs, this.now));
  }

  getGateway(id) {
    const row = this.db.prepare("SELECT * FROM gateways WHERE id = ?").get(id);
    return row ? mapGatewayRow(row, this.offlineAfterMs, this.now) : null;
  }

  deleteGateway(id) {
    const gateway = this.getGateway(id);
    if (!gateway) return null;
    this.db.prepare("DELETE FROM gateways WHERE id = ?").run(id);
    return gateway;
  }

  upsertGateway({ id, name = "", site = "", token = "", remoteAccess }) {
    const now = new Date().toISOString();
    const existing = this.getGateway(id);
    const tokenHash = token ? this.hashToken(token) : existing?.tokenHash;
    const remote = normalizeRemoteAccess(remoteAccess ?? existing?.remoteAccess ?? defaultRemoteAccess());

    if (!tokenHash) {
      throw new Error("Gateway token is required");
    }

    this.db.prepare(`
      INSERT INTO gateways (
        id,
        name,
        site,
        token_hash,
        remote_access_enabled,
        remote_access_method,
        tailscale_host,
        tailscale_ip,
        tailscale_ui_port,
        tailscale_ssh_port,
        tailscale_tag,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        site = excluded.site,
        token_hash = excluded.token_hash,
        remote_access_enabled = excluded.remote_access_enabled,
        remote_access_method = excluded.remote_access_method,
        tailscale_host = excluded.tailscale_host,
        tailscale_ip = excluded.tailscale_ip,
        tailscale_ui_port = excluded.tailscale_ui_port,
        tailscale_ssh_port = excluded.tailscale_ssh_port,
        tailscale_tag = excluded.tailscale_tag,
        updated_at = excluded.updated_at
    `).run(
      id,
      name,
      site,
      tokenHash,
      remote.enabled ? 1 : 0,
      remote.method,
      remote.host,
      remote.ip,
      remote.uiPort,
      remote.sshPort,
      remote.tag,
      now,
      now,
    );

    return this.getGateway(id);
  }

  updateGatewayRemoteAccess(id, remoteAccess) {
    if (!this.getGateway(id)) return null;
    const remote = normalizeRemoteAccess(remoteAccess);
    const now = new Date().toISOString();

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

  getConfigVersion(gatewayId, version) {
    const row = this.db.prepare(`
      SELECT *
      FROM config_versions
      WHERE gateway_id = ? AND version = ?
      LIMIT 1
    `).get(gatewayId, version);

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

  updateConfigStatus({ gatewayId, version, configHash, status, message = "", appVersion = "" }) {
    const now = new Date().toISOString();
    const configVersion = this.getConfigVersion(gatewayId, version);

    if (!configVersion) {
      throw storeHttpError(404, `Config version ${version} not found for gateway ${gatewayId}`);
    }

    if (configVersion.configHash !== configHash) {
      throw storeHttpError(400, "config_hash does not match config_version");
    }

    const gateway = this.getGateway(gatewayId);
    if (isStaleConfigStatus(gateway, version, status)) {
      this.db.prepare(`
        UPDATE gateways
        SET app_version = COALESCE(NULLIF(?, ''), app_version),
            last_seen_at = ?,
            status = 'online',
            updated_at = ?
        WHERE id = ?
      `).run(appVersion ?? "", now, now, gatewayId);

      return {
        ignored: true,
        reason: "stale_config_status",
        gateway: this.getGateway(gatewayId),
      };
    }

    const appliedVersion = status === "applied" ? version : gateway?.appliedConfigVersion;

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

    return {
      ignored: false,
      gateway: this.getGateway(gatewayId),
    };
  }

  insertTelemetry(gatewayId, records) {
    const nowMs = this.now();
    const now = new Date(nowMs).toISOString();
    const insert = this.db.prepare(`
      INSERT OR IGNORE INTO telemetry_records (gateway_id, record_id, record_json, created_at)
      VALUES (?, ?, ?, ?)
    `);
    const updateGateway = this.db.prepare(`
      UPDATE gateways
      SET last_seen_at = ?, status = 'online', updated_at = ?
      WHERE id = ?
    `);
    let inserted = 0;

    this.pruneTelemetry({ nowMs });

    try {
      this.db.exec("BEGIN");
      for (const record of records) {
        const result = insert.run(gatewayId, record.id ?? null, JSON.stringify(record), now);
        inserted += Number(result.changes ?? 0);
      }
      updateGateway.run(now, now, gatewayId);
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }

    return {
      received: records.length,
      inserted,
      ignored: records.length - inserted,
    };
  }

  pruneTelemetry({ force = false, nowMs = this.now() } = {}) {
    if (this.telemetryRetentionMs <= 0) return { deleted: 0 };
    if (
      !force &&
      this.telemetryPruneIntervalMs > 0 &&
      nowMs - this.lastTelemetryPrunedAt < this.telemetryPruneIntervalMs
    ) {
      return { deleted: 0 };
    }

    this.lastTelemetryPrunedAt = nowMs;
    const cutoff = new Date(nowMs - this.telemetryRetentionMs).toISOString();
    const result = this.db.prepare("DELETE FROM telemetry_records WHERE created_at < ?").run(cutoff);

    return {
      deleted: Number(result.changes ?? 0),
    };
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

  createGatewayCommand({
    gatewayId,
    action,
    payload,
    createdBy = "admin",
    schedule = null,
    nextRunAt = null,
    scheduleId = null,
    runIndex = 0,
    windowRole = "start",
    sourceCommandId = null,
  }) {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const status = commandStatusForNextRun(nextRunAt, new Date(now));
    const commandScheduleId = schedule ? (scheduleId || crypto.randomUUID()) : null;
    if (shouldCheckLimitPowerScheduleConflict({ action, schedule, scheduleId, runIndex, windowRole, sourceCommandId })) {
      const commands = this.db.prepare(`
        SELECT *
        FROM gateway_commands
        WHERE gateway_id = ?
      `).all(gatewayId).map(mapCommandRow);
      const conflict = findLimitPowerScheduleConflict(commands, {
        gatewayId,
        action,
        payload,
        schedule,
        nextRunAt,
        scheduledAt: schedule?.scheduledAt || nextRunAt || null,
        windowRole: windowRole || "start",
      });
      if (conflict) throw scheduleConflictError(conflict);
    }

    this.db.prepare(`
      INSERT INTO gateway_commands (
        id,
        gateway_id,
        action,
        payload_json,
        status,
        created_by,
        created_at,
        updated_at,
        scheduled_at,
        next_run_at,
        schedule_json,
        schedule_id,
        run_index,
        window_role,
        source_command_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      gatewayId,
      action,
      stableJson(payload),
      status,
      createdBy,
      now,
      now,
      schedule?.scheduledAt || nextRunAt || null,
      nextRunAt || null,
      schedule ? stableJson(schedule) : null,
      commandScheduleId,
      runIndex,
      windowRole || "start",
      sourceCommandId || null,
    );

    return this.getGatewayCommand(gatewayId, id);
  }

  getGatewayCommand(gatewayId, commandId) {
    const row = this.db.prepare(`
      SELECT *
      FROM gateway_commands
      WHERE gateway_id = ? AND id = ?
    `).get(gatewayId, commandId);

    return row ? mapCommandRow(row) : null;
  }

  listGatewayCommands(gatewayId, limit = 50) {
    return this.db.prepare(`
      SELECT *
      FROM gateway_commands
      WHERE gateway_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(gatewayId, limit).map(mapCommandRow);
  }

  nextGatewayCommand(gatewayId) {
    const now = new Date().toISOString();
    const row = this.db.prepare(`
      SELECT *
      FROM gateway_commands
      WHERE gateway_id = ?
        AND status IN ('queued', 'scheduled')
        AND (next_run_at IS NULL OR next_run_at <= ?)
      ORDER BY COALESCE(next_run_at, created_at) ASC
      LIMIT 1
    `).get(gatewayId, now);

    if (!row) return null;

    this.db.prepare(`
      UPDATE gateway_commands
      SET status = 'delivered',
          delivered_at = COALESCE(delivered_at, ?),
          updated_at = ?
      WHERE id = ? AND status IN ('queued', 'scheduled')
    `).run(now, now, row.id);

    return this.getGatewayCommand(gatewayId, row.id);
  }

  updateGatewayCommandStatus({ gatewayId, commandId, status, message = "", result = null, appVersion = "" }) {
    const now = new Date().toISOString();
    const completedAt = ["applied", "failed", "cancelled"].includes(status) ? now : null;

    this.db.prepare(`
      UPDATE gateway_commands
      SET status = ?,
          message = ?,
          result_json = ?,
          completed_at = COALESCE(?, completed_at),
          updated_at = ?
      WHERE gateway_id = ? AND id = ?
    `).run(status, message ?? "", result === null || result === undefined ? null : JSON.stringify(result), completedAt, now, gatewayId, commandId);

    this.db.prepare(`
      UPDATE gateways
      SET app_version = COALESCE(NULLIF(?, ''), app_version),
          last_seen_at = ?,
          status = 'online',
          updated_at = ?
      WHERE id = ?
    `).run(appVersion ?? "", now, now, gatewayId);

    const command = this.getGatewayCommand(gatewayId, commandId);
    this.#enqueueWindowEndCommand(command, status, now);
    this.#enqueueDurationClearCommand(command, status, now);
    this.#enqueueNextScheduledCommand(command, status, now);
    return command;
  }

  cancelGatewayCommand({ gatewayId, commandId }) {
    const commands = this.db.prepare(`
      SELECT *
      FROM gateway_commands
      WHERE gateway_id = ?
    `).all(gatewayId).map(mapCommandRow);
    const command = commands.find((item) => item.id === commandId);
    if (!command) return null;

    const now = new Date().toISOString();
    const baseScheduleId = commandBaseScheduleId(command, commands);
    const seriesSchedule = commandSeriesSchedule(command, baseScheduleId, commands);
    const cancelSeries = Boolean(baseScheduleId && isRecurringSchedule(seriesSchedule));
    const targets = commands.filter((item) => shouldCancelCommand(item, command, {
      baseScheduleId,
      cancelSeries,
      commands,
    }));
    const update = this.db.prepare(`
      UPDATE gateway_commands
      SET status = ?,
          message = ?,
          completed_at = ?,
          cancelled_at = ?,
          series_cancelled_at = ?,
          updated_at = ?
      WHERE gateway_id = ? AND id = ?
    `);

    for (const item of targets) {
      const active = isActiveCommand(item);
      update.run(
        active ? "cancelled" : item.status,
        active ? (cancelSeries ? "Recurring schedule cancelled" : "Scheduled command cancelled") : item.message,
        active ? (item.completedAt || now) : item.completedAt,
        item.cancelledAt || now,
        cancelSeries ? (item.seriesCancelledAt || now) : item.seriesCancelledAt,
        now,
        gatewayId,
        item.id,
      );
    }

    return {
      command: this.getGatewayCommand(gatewayId, commandId),
      cancelled: targets.map((item) => this.getGatewayCommand(gatewayId, item.id)).filter(Boolean),
      scheduleId: baseScheduleId || command.scheduleId,
      series: cancelSeries,
    };
  }

  #enqueueNextScheduledCommand(command, status, now) {
    if (command?.windowRole === "end") return;
    if (command?.cancelledAt || command?.seriesCancelledAt) return;
    if (!command || !["applied", "failed"].includes(status) || !isRecurringSchedule(command.schedule)) return;

    const nextRunIndex = Number(command.runIndex || 0) + 1;
    const nextRunAt = nextScheduledRun(command.schedule, {
      from: new Date(now),
      runIndex: nextRunIndex,
    });
    if (!nextRunAt) return;

    const existing = this.db.prepare(`
      SELECT id
      FROM gateway_commands
      WHERE gateway_id = ? AND schedule_id = ? AND run_index = ?
      LIMIT 1
    `).get(command.gatewayId, command.scheduleId, nextRunIndex);
    if (existing) return;

    this.createGatewayCommand({
      gatewayId: command.gatewayId,
      action: command.action,
      payload: command.payload,
      createdBy: command.createdBy,
      schedule: command.schedule,
      nextRunAt,
      scheduleId: command.scheduleId,
      runIndex: nextRunIndex,
      windowRole: "start",
    });
  }

  #enqueueWindowEndCommand(command, status, now) {
    if (command?.cancelledAt || command?.seriesCancelledAt) return;
    if (!command || status !== "applied" || (command.windowRole || "start") !== "start") return;

    const action = WINDOW_END_ACTIONS[command.action];
    if (!action) return;

    const nextRunAt = scheduledWindowEndRun(command.schedule, command.nextRunAt || command.scheduledAt || now);
    if (!nextRunAt) return;

    this.#createFollowUpCommand(command, {
      action,
      nextRunAt,
      schedule: command.schedule,
      scheduleId: command.scheduleId ? `${command.scheduleId}:end:${command.runIndex || 0}` : null,
      runIndex: Number(command.runIndex || 0),
      windowRole: "end",
    });
  }

  #enqueueDurationClearCommand(command, status, now) {
    if (command?.cancelledAt || command?.seriesCancelledAt) return;
    if (!command || status !== "applied" || command.action !== "limit_power" || command.windowRole === "end") return;
    if (scheduledWindowEndRun(command.schedule, command.nextRunAt || command.scheduledAt || now)) return;

    const durationMs = controlDurationMs(command.payload);
    if (!durationMs) return;

    this.#createFollowUpCommand(command, {
      action: "clear_power_limit",
      nextRunAt: new Date(Date.parse(now) + durationMs).toISOString(),
      schedule: null,
      scheduleId: command.scheduleId ? `${command.scheduleId}:duration-clear:${command.runIndex || 0}` : null,
      runIndex: 0,
      windowRole: "end",
    });
  }

  #createFollowUpCommand(command, { action, nextRunAt, schedule, scheduleId, runIndex, windowRole }) {
    const sourceCommandId = command.id;
    const existing = this.db.prepare(`
      SELECT id
      FROM gateway_commands
      WHERE gateway_id = ? AND source_command_id = ? AND window_role = ?
      LIMIT 1
    `).get(command.gatewayId, sourceCommandId, windowRole);
    if (existing) return null;

    return this.createGatewayCommand({
      gatewayId: command.gatewayId,
      action,
      payload: controlFollowUpPayload(command.payload, action),
      createdBy: command.createdBy,
      schedule,
      nextRunAt,
      scheduleId,
      runIndex,
      windowRole,
      sourceCommandId,
    });
  }

  seedDeviceTemplates(templates) {
    const normalized = normalizeTemplateLibrary(templates);

    if (this.#metadata("device_templates_initialized") === "1") {
      this.#mergeNewSeedTemplates(normalized);
      return this.listDeviceTemplates();
    }

    const saved = this.saveDeviceTemplates(normalized);
    this.#setMetadata("device_templates_initialized", "1");
    this.#setSeedTemplateMetadata(normalized);

    return saved;
  }

  listDeviceTemplates() {
    const templateRows = this.db.prepare(`
      SELECT
        id,
        label,
        manufacturer,
        model,
        category,
        type,
        protocol,
        poll_interval_ms AS pollIntervalMs,
        notes
      FROM device_templates
      ORDER BY sort_order, id
    `).all();
    const registerStatement = this.db.prepare(`
      SELECT
        name,
        function,
        access,
        poll_enabled AS poll,
        address,
        length,
        type,
        scale,
        unit,
        word_order AS wordOrder,
        offset
      FROM template_registers
      WHERE template_id = ?
      ORDER BY register_index
    `);

    return templateRows.map((template) => ({
      ...template,
      type: normalizeDeviceTemplateType(template.type, template.category, template.label),
      registers: registerStatement.all(template.id).map((register) => ({
        name: register.name,
        function: register.function,
        ...(register.access && register.access !== "ro" ? { access: register.access } : {}),
        ...(register.poll === 0 ? { poll: false } : {}),
        address: register.address,
        length: register.length,
        type: register.type,
        scale: register.scale,
        unit: register.unit,
        ...(register.wordOrder ? { wordOrder: register.wordOrder } : {}),
        ...(register.offset !== null ? { offset: register.offset } : {}),
      })),
    }));
  }

  saveDeviceTemplates(templates) {
    const normalized = normalizeTemplateLibrary(templates);
    const insertTemplate = this.db.prepare(`
      INSERT INTO device_templates (
        id, label, manufacturer, model, category, type, protocol, poll_interval_ms, notes, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertRegister = this.db.prepare(`
      INSERT INTO template_registers (
        template_id, register_index, name, function, access, poll_enabled, address, length, type, scale, unit, word_order, offset
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    try {
      this.db.exec("BEGIN IMMEDIATE");
      this.db.exec("DELETE FROM template_registers; DELETE FROM device_templates;");

      normalized.forEach((template, templateIndex) => {
        insertTemplate.run(
          template.id,
          template.label,
          template.manufacturer,
          template.model,
          template.category,
          template.type,
          template.protocol,
          template.pollIntervalMs,
          template.notes,
          templateIndex,
        );

        template.registers.forEach((register, registerIndex) => {
          insertRegister.run(
            template.id,
            registerIndex,
            register.name,
            register.function,
            register.access || "ro",
            register.poll === false ? 0 : 1,
            register.address,
            register.length,
            register.type,
            register.scale,
            register.unit,
            register.wordOrder || null,
            register.offset ?? null,
          );
        });
      });

      this.#setMetadata("device_templates_initialized", "1");
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }

    return this.listDeviceTemplates();
  }

  #mergeNewSeedTemplates(seedTemplates) {
    if (seedTemplates.length === 0) return;

    const previousSeedIds = this.#seedTemplateIds();
    const existingIds = new Set(this.db.prepare("SELECT id FROM device_templates").all().map((row) => row.id));
    const knownSeedIds = previousSeedIds ?? existingIds;
    const existingRegisterNames = this.#existingTemplateRegisterNames();
    const previousSeedRegisterNames = this.#seedTemplateRegisterNames() ?? existingRegisterNames;
    const newSeedTemplates = seedTemplates.filter(
      (template) => !knownSeedIds.has(template.id) && !existingIds.has(template.id),
    );
    const missingSeedRegisters = seedTemplates
      .filter((template) => knownSeedIds.has(template.id) && existingIds.has(template.id))
      .map((template) => {
        const previousNames = previousSeedRegisterNames.get(template.id) ?? new Set();
        const existingNames = existingRegisterNames.get(template.id) ?? new Set();

        return {
          templateId: template.id,
          registers: template.registers.filter(
            (register) => !previousNames.has(register.name) && !existingNames.has(register.name),
          ),
        };
      })
      .filter((template) => template.registers.length > 0);

    if (newSeedTemplates.length === 0 && missingSeedRegisters.length === 0) {
      this.#setSeedTemplateMetadata(seedTemplates);
      return;
    }

    try {
      this.db.exec("BEGIN IMMEDIATE");
      this.#insertSeedTemplates(newSeedTemplates);
      this.#insertMissingSeedRegisters(missingSeedRegisters);
      this.#setSeedTemplateMetadata(seedTemplates);
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  #insertSeedTemplates(templates) {
    if (templates.length === 0) return;

    const nextSortOrder = this.db.prepare("SELECT COALESCE(MAX(sort_order) + 1, 0) AS value FROM device_templates").get().value;
    const insertTemplate = this.db.prepare(`
      INSERT INTO device_templates (
        id, label, manufacturer, model, category, type, protocol, poll_interval_ms, notes, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertRegister = this.#insertTemplateRegisterStatement();

    templates.forEach((template, templateIndex) => {
      insertTemplate.run(
        template.id,
        template.label,
        template.manufacturer,
        template.model,
        template.category,
        template.type,
        template.protocol,
        template.pollIntervalMs,
        template.notes,
        nextSortOrder + templateIndex,
      );

      template.registers.forEach((register, registerIndex) => {
        this.#insertTemplateRegister(insertRegister, template.id, registerIndex, register);
      });
    });
  }

  #insertMissingSeedRegisters(templates) {
    if (templates.length === 0) return;

    const nextRegisterIndex = this.db.prepare(`
      SELECT COALESCE(MAX(register_index) + 1, 0) AS value
      FROM template_registers
      WHERE template_id = ?
    `);
    const insertRegister = this.#insertTemplateRegisterStatement();

    for (const template of templates) {
      let registerIndex = nextRegisterIndex.get(template.templateId).value;

      for (const register of template.registers) {
        this.#insertTemplateRegister(insertRegister, template.templateId, registerIndex, register);
        registerIndex += 1;
      }
    }
  }

  #insertTemplateRegisterStatement() {
    return this.db.prepare(`
      INSERT INTO template_registers (
        template_id, register_index, name, function, access, poll_enabled, address, length, type, scale, unit, word_order, offset
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
  }

  #insertTemplateRegister(insertRegister, templateId, registerIndex, register) {
    insertRegister.run(
      templateId,
      registerIndex,
      register.name,
      register.function,
      register.access || "ro",
      register.poll === false ? 0 : 1,
      register.address,
      register.length,
      register.type,
      register.scale,
      register.unit,
      register.wordOrder || null,
      register.offset ?? null,
    );
  }

  #seedTemplateIds() {
    const raw = this.#metadata("seed_template_ids");
    if (!raw) return null;

    try {
      const ids = JSON.parse(raw);
      return Array.isArray(ids) ? new Set(ids.map(String)) : null;
    } catch {
      return null;
    }
  }

  #seedTemplateRegisterNames() {
    const raw = this.#metadata("seed_template_register_names");
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;

      return new Map(
        Object.entries(parsed).map(([templateId, names]) => [
          templateId,
          new Set(Array.isArray(names) ? names.map(String) : []),
        ]),
      );
    } catch {
      return null;
    }
  }

  #existingTemplateRegisterNames() {
    const rows = this.db.prepare("SELECT template_id, name FROM template_registers ORDER BY register_index").all();
    const namesByTemplate = new Map();

    for (const row of rows) {
      if (!namesByTemplate.has(row.template_id)) {
        namesByTemplate.set(row.template_id, new Set());
      }

      namesByTemplate.get(row.template_id).add(row.name);
    }

    return namesByTemplate;
  }

  #setSeedTemplateMetadata(seedTemplates) {
    this.#setMetadata("seed_template_ids", JSON.stringify(seedTemplates.map((template) => template.id)));
    this.#setMetadata(
      "seed_template_register_names",
      JSON.stringify(Object.fromEntries(seedTemplates.map((template) => [
        template.id,
        template.registers.map((register) => register.name),
      ]))),
    );
  }

  hashToken(token) {
    return crypto.createHmac("sha256", this.tokenHashSecret).update(token).digest("hex");
  }

  close() {
    this.db.close();
  }

  #metadata(key) {
    return this.db.prepare("SELECT value FROM template_library_metadata WHERE key = ?").get(key)?.value;
  }

  #setMetadata(key, value) {
    this.db.prepare(`
      INSERT INTO template_library_metadata (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(key, value);
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

function controlFollowUpPayload(payload, action) {
  const result = { action };

  for (const field of ["deviceName", "device", "stationId", "station"]) {
    if (payload?.[field] !== undefined) result[field] = payload[field];
  }

  return result;
}

function controlDurationMs(payload) {
  let seconds;

  if (payload?.durationSeconds !== undefined) {
    seconds = Number(payload.durationSeconds);
  } else if (payload?.durationMinutes !== undefined) {
    seconds = Number(payload.durationMinutes) * 60;
  } else if (payload?.durationHours !== undefined) {
    seconds = Number(payload.durationHours) * 3600;
  }

  const durationMs = seconds * 1000;
  return Number.isFinite(durationMs) && durationMs > 0 ? durationMs : null;
}

function shouldCheckLimitPowerScheduleConflict({ action, schedule, scheduleId, runIndex, windowRole, sourceCommandId }) {
  return action === "limit_power"
    && Boolean(schedule)
    && (windowRole || "start") === "start"
    && !sourceCommandId
    && !scheduleId
    && Number(runIndex || 0) === 0;
}

function findLimitPowerScheduleConflict(commands, candidate) {
  return commands.find((command) => (
    command.action === "limit_power"
    && (command.windowRole || "start") === "start"
    && isActiveCommand(command)
    && !command.cancelledAt
    && !command.seriesCancelledAt
    && command.schedule
    && sameControlTarget(command.payload, candidate.payload)
    && schedulesOverlap(command, candidate)
  )) || null;
}

function scheduleConflictError(conflict) {
  const error = new Error(`Lịch tiết giảm trùng với lịch đang tồn tại (${scheduleConflictLabel(conflict)}). Hãy hủy lịch cũ hoặc chọn khung giờ khác.`);
  error.statusCode = 409;
  return error;
}

function scheduleConflictLabel(command) {
  const target = controlTargetKey(command.payload).replace(/^(device|station):/, "");
  const schedule = command.schedule || {};
  if (schedule.mode === "once") {
    return `${target} ${command.scheduledAt || schedule.scheduledAt || ""}`;
  }
  if (schedule.mode === "weekly") {
    return `${target} weekly ${Array.isArray(schedule.daysOfWeek) ? schedule.daysOfWeek.join(",") : ""} ${schedule.timeOfDay || ""}-${schedule.endTimeOfDay || ""}`;
  }
  return `${target} ${schedule.mode || "schedule"} ${schedule.timeOfDay || ""}-${schedule.endTimeOfDay || ""}`;
}

function isStaleConfigStatus(gateway, version, status) {
  const desiredVersion = Number(gateway?.desiredConfigVersion || 0);
  const appliedVersion = Number(gateway?.appliedConfigVersion || 0);

  return version < desiredVersion
    || version < appliedVersion
    || (version === appliedVersion && status !== "applied");
}

function storeHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function sameControlTarget(left, right) {
  return controlTargetKey(left) === controlTargetKey(right);
}

function controlTargetKey(payload) {
  const station = stringValue(payload?.stationId ?? payload?.station).toLowerCase();
  if (station) return `station:${station}`;

  const device = stringValue(payload?.deviceName ?? payload?.device).toLowerCase();
  if (device) return `device:${device}`;

  return "default";
}

function schedulesOverlap(left, right) {
  const leftWindow = scheduleWindow(left);
  const rightWindow = scheduleWindow(right);
  if (!leftWindow || !rightWindow) return false;
  if (!dateSpansOverlap(leftWindow, rightWindow)) return false;

  if (leftWindow.mode === "once" && rightWindow.mode === "once") {
    return intervalsOverlap(leftWindow, rightWindow);
  }
  if (leftWindow.mode === "recurring" && rightWindow.mode === "recurring") {
    return weeklyIntervalsOverlap(leftWindow.intervals, rightWindow.intervals);
  }

  const once = leftWindow.mode === "once" ? leftWindow : rightWindow;
  const recurring = leftWindow.mode === "recurring" ? leftWindow : rightWindow;
  return onceOverlapsRecurring(once, recurring);
}

function scheduleWindow(command) {
  const schedule = command.schedule;
  if (!schedule) return null;

  if (schedule.mode === "once") {
    const start = parseTimestamp(schedule.scheduledAt || command.nextRunAt || command.scheduledAt);
    if (!Number.isFinite(start)) return null;
    const scheduledUntil = parseTimestamp(schedule.scheduledUntil);
    const durationMs = controlDurationMs(command.payload);
    const end = Number.isFinite(scheduledUntil) ? scheduledUntil : start + (durationMs || 1);
    return {
      mode: "once",
      start,
      end: Math.max(end, start + 1),
      startAt: start,
      endAt: Math.max(end, start + 1),
    };
  }

  if (!isRecurringSchedule(schedule)) return null;
  const startAt = parseTimestamp(command.nextRunAt || command.scheduledAt);
  if (!Number.isFinite(startAt)) return null;
  const endAt = parseTimestamp(schedule.endAt);
  const intervals = recurringWeeklyIntervals(schedule, controlDurationMs(command.payload));
  if (!intervals.length) return null;

  return {
    mode: "recurring",
    startAt,
    endAt: Number.isFinite(endAt) ? endAt : Number.POSITIVE_INFINITY,
    timezone: schedule.timezone,
    intervals,
  };
}

function recurringWeeklyIntervals(schedule, durationMs) {
  const startMinute = timeToMinutes(schedule.timeOfDay);
  if (!Number.isFinite(startMinute)) return [];

  const endMinute = timeToMinutes(schedule.endTimeOfDay);
  let durationMinutes = Number.isFinite(endMinute)
    ? endMinute - startMinute
    : Math.ceil((durationMs || 1) / 60000);
  if (durationMinutes <= 0) durationMinutes += DAY_MINUTES;

  const days = schedule.mode === "weekly" ? (schedule.daysOfWeek || []) : [1, 2, 3, 4, 5, 6, 7];
  const intervals = [];
  for (const day of days) {
    if (!Number.isInteger(day) || day < 1 || day > 7) continue;
    const start = (day - 1) * DAY_MINUTES + startMinute;
    pushWeekInterval(intervals, start, start + durationMinutes);
  }
  return intervals;
}

function onceOverlapsRecurring(once, recurring) {
  if (once.end - once.start >= WEEK_MINUTES * 60000) return true;
  return weeklyIntervalsOverlap(
    absoluteIntervalToWeeklyIntervals(once.start, once.end, recurring.timezone),
    recurring.intervals,
  );
}

function absoluteIntervalToWeeklyIntervals(startMs, endMs, timezone) {
  const durationMinutes = Math.max(1, Math.ceil((endMs - startMs) / 60000));
  const offsetMinutes = scheduleTimezoneOffsetMinutes(timezone);
  const local = new Date(startMs + offsetMinutes * 60000);
  const weekday = isoWeekday(local.getUTCFullYear(), local.getUTCMonth() + 1, local.getUTCDate());
  const start = (weekday - 1) * DAY_MINUTES + local.getUTCHours() * 60 + local.getUTCMinutes();
  const intervals = [];
  pushWeekInterval(intervals, start, start + durationMinutes);
  return intervals;
}

function pushWeekInterval(intervals, start, end) {
  const duration = end - start;
  if (duration >= WEEK_MINUTES) {
    intervals.push({ start: 0, end: WEEK_MINUTES });
    return;
  }

  let cursor = start;
  let remaining = Math.max(1, duration);
  while (remaining > 0) {
    const normalizedStart = ((cursor % WEEK_MINUTES) + WEEK_MINUTES) % WEEK_MINUTES;
    const chunk = Math.min(remaining, WEEK_MINUTES - normalizedStart);
    intervals.push({ start: normalizedStart, end: normalizedStart + chunk });
    cursor += chunk;
    remaining -= chunk;
  }
}

function weeklyIntervalsOverlap(left, right) {
  return left.some((leftInterval) => right.some((rightInterval) => intervalsOverlap(leftInterval, rightInterval)));
}

function intervalsOverlap(left, right) {
  return left.start < right.end && right.start < left.end;
}

function dateSpansOverlap(left, right) {
  return left.startAt < right.endAt && right.startAt < left.endAt;
}

function parseTimestamp(value) {
  const timestamp = Date.parse(String(value || ""));
  return Number.isFinite(timestamp) ? timestamp : Number.NaN;
}

function timeToMinutes(value) {
  const match = String(value || "").match(/^(\d{2}):(\d{2})$/);
  if (!match) return Number.NaN;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours <= 23 && minutes <= 59 ? hours * 60 + minutes : Number.NaN;
}

function scheduleTimezoneOffsetMinutes(timezone) {
  const normalized = String(timezone || "").trim().toLowerCase();
  if (normalized === "utc" || normalized === "z") return 0;
  if (normalized === "asia/bangkok" || normalized === "asia/ho_chi_minh") return 7 * 60;

  const match = normalized.match(/^utc([+-])(\d{1,2})(?::?(\d{2}))?$/);
  if (!match) return 7 * 60;

  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number(match[2]);
  const minutes = Number(match[3] || 0);
  if (!Number.isInteger(hours) || hours > 14 || !Number.isInteger(minutes) || minutes > 59) return 7 * 60;
  return sign * (hours * 60 + minutes);
}

function isoWeekday(year, month, day) {
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return weekday === 0 ? 7 : weekday;
}

function commandBaseScheduleId(command, commands) {
  if (command?.sourceCommandId) {
    const source = commands.find((item) => item.id === command.sourceCommandId);
    if (source?.scheduleId) return source.scheduleId;
  }

  if (!command?.scheduleId) return null;
  return String(command.scheduleId).replace(/:(end|duration-clear):\d+$/, "");
}

function commandSeriesSchedule(command, baseScheduleId, commands) {
  if (isRecurringSchedule(command?.schedule)) return command.schedule;

  const source = commands.find((item) => item.id === command?.sourceCommandId);
  if (isRecurringSchedule(source?.schedule)) return source.schedule;

  if (!baseScheduleId) return null;
  const baseCommand = commands.find((item) => item.scheduleId === baseScheduleId && isRecurringSchedule(item.schedule));
  return baseCommand?.schedule || null;
}

function shouldCancelCommand(item, command, { baseScheduleId, cancelSeries, commands }) {
  if (item.id === command.id) return true;
  if (!baseScheduleId) return false;

  if (cancelSeries) {
    return commandBelongsToSeries(item, baseScheduleId, commands);
  }

  return item.scheduleId === command.scheduleId
    && Number(item.runIndex || 0) === Number(command.runIndex || 0);
}

function commandBelongsToSeries(command, baseScheduleId, commands) {
  if (command.scheduleId === baseScheduleId || String(command.scheduleId || "").startsWith(`${baseScheduleId}:`)) {
    return true;
  }

  const source = commands.find((item) => item.id === command.sourceCommandId);
  return source?.scheduleId === baseScheduleId;
}

function isActiveCommand(command) {
  return ["queued", "scheduled", "running", "delivered"].includes(command.status || "");
}

function mapGatewayRow(row, offlineAfterMs = DEFAULT_GATEWAY_OFFLINE_AFTER_MS, now = () => Date.now()) {
  return {
    id: row.id,
    name: row.name,
    site: row.site,
    tokenHash: row.token_hash,
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
    desiredConfigVersion: row.desired_config_version,
    appliedConfigVersion: row.applied_config_version,
    latestConfigVersion: row.latest_config_version,
    lastConfigStatus: row.last_config_status,
    lastConfigMessage: row.last_config_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function gatewayStatus(row, offlineAfterMs, now) {
  if (row.status !== "online") return row.status;
  if (!row.last_seen_at) return "offline";

  const lastSeenAt = Date.parse(row.last_seen_at);
  if (!Number.isFinite(lastSeenAt)) return "offline";

  return now() - lastSeenAt > offlineAfterMs ? "offline" : "online";
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

function mapCommandRow(row) {
  return {
    id: row.id,
    gatewayId: row.gateway_id,
    action: row.action,
    payload: JSON.parse(row.payload_json),
    status: row.status,
    message: row.message,
    result: row.result_json ? JSON.parse(row.result_json) : null,
    createdBy: row.created_by,
    createdAt: row.created_at,
    deliveredAt: row.delivered_at,
    completedAt: row.completed_at,
    scheduledAt: row.scheduled_at,
    nextRunAt: row.next_run_at,
    schedule: row.schedule_json ? JSON.parse(row.schedule_json) : null,
    scheduleId: row.schedule_id,
    runIndex: Number(row.run_index || 0),
    windowRole: row.window_role || "start",
    sourceCommandId: row.source_command_id,
    cancelledAt: row.cancelled_at,
    seriesCancelledAt: row.series_cancelled_at,
    updatedAt: row.updated_at,
  };
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));

  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function normalizeTemplateLibrary(templates) {
  if (!Array.isArray(templates)) {
    throw new Error("Device template library must be an array");
  }

  const normalized = templates.map(normalizeTemplate);
  const seen = new Set();

  for (const template of normalized) {
    if (seen.has(template.id)) {
      throw new Error(`Duplicate device template id '${template.id}'`);
    }

    seen.add(template.id);
  }

  return normalized;
}

function normalizeTemplate(template, index) {
  if (!template || typeof template !== "object") {
    throw new Error(`Invalid device template at index ${index}`);
  }

  const manufacturer = stringValue(template.manufacturer);
  const model = stringValue(template.model);
  const label = stringValue(template.label) || [manufacturer, model].filter(Boolean).join(" - ");
  const id = stringValue(template.id) || slug(label || `template_${index + 1}`);

  if (!id) {
    throw new Error(`Invalid device template at index ${index}. id or label is required`);
  }

  return {
    id,
    label: label || id,
    manufacturer,
    model,
    category: stringValue(template.category),
    type: normalizeDeviceTemplateType(template.type, stringValue(template.category), label || id),
    protocol: stringValue(template.protocol) || "modbus-rtu",
    pollIntervalMs: numberValue(template.pollIntervalMs ?? template.defaultPollIntervalMs, 5000),
    notes: stringValue(template.notes),
    ...(plainObject(template.controls) ? { controls: cloneJson(template.controls) } : {}),
    registers: Array.isArray(template.registers)
      ? template.registers.map(normalizeRegister)
      : [],
  };
}

function plainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeRegister(register) {
  const access = normalizeAccess(register.access);
  const poll = register.poll === false ? false : true;

  return {
    name: stringValue(register.name),
    function: stringValue(register.function) || "holding",
    ...(access !== "ro" ? { access } : {}),
    ...(poll === false ? { poll } : {}),
    address: numberValue(register.address, 0),
    length: numberValue(register.length, 1),
    type: stringValue(register.type) || "uint16",
    scale: numberValue(register.scale, 1),
    unit: stringValue(register.unit),
    ...(register.wordOrder ? { wordOrder: stringValue(register.wordOrder) } : {}),
    ...(register.offset !== undefined ? { offset: numberValue(register.offset, 0) } : {}),
  };
}

function normalizeAccess(value) {
  const key = stringValue(value).toLowerCase();

  return ["ro", "rw", "wo"].includes(key) ? key : "ro";
}

function normalizeDeviceTemplateType(type, category = "", fallback = "") {
  const keys = [
    compactType(type),
    compactType(category),
    compactType(fallback),
  ];

  for (const key of keys) {
    if (["inverter", "meter", "weatherstation", "datalogger", "other"].includes(key)) return key;
    if (key.includes("inverter")) return "inverter";
    if (key.includes("meter")) return "meter";
    if (key.includes("weather")) return "weatherstation";
    if (key.includes("logger")) return "datalogger";
  }

  return "other";
}

function compactType(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function stringValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

function numberValue(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function nonNegativeInteger(value, fallback) {
  return Number.isInteger(value) && value >= 0 ? value : fallback;
}

function slug(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

async function openSqliteDatabase(dbPath) {
  if (process.env.SQLITE_DRIVER !== "sqljs") {
    try {
      const { DatabaseSync } = require("node:sqlite");
      return new DatabaseSync(dbPath);
    } catch (error) {
      if (!["ERR_UNKNOWN_BUILTIN_MODULE", "MODULE_NOT_FOUND"].includes(error?.code)) {
        throw error;
      }
    }
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
      while (statement.step()) {
        rows.push(statement.getAsObject());
      }
      return rows;
    } finally {
      statement.free();
    }
  }

  #afterSql(sql) {
    const operation = firstSqlOperation(sql);

    if (operation === "BEGIN") {
      this.transactionDepth += 1;
      return;
    }

    if (operation === "COMMIT") {
      this.transactionDepth = Math.max(0, this.transactionDepth - 1);
      this.#save();
      return;
    }

    if (operation === "ROLLBACK") {
      this.transactionDepth = Math.max(0, this.transactionDepth - 1);
      return;
    }

    if (this.transactionDepth === 0 && isWriteSql(operation)) {
      this.#save();
    }
  }

  #lastWriteResult() {
    const result = this.db.exec("SELECT changes() AS changes, last_insert_rowid() AS lastInsertRowid");
    const [changes = 0, lastInsertRowid = 0] = result[0]?.values?.[0] || [];

    return {
      changes,
      lastInsertRowid,
    };
  }

  #save() {
    fs.mkdirSync(path.dirname(path.resolve(this.dbPath)), { recursive: true });
    const tmpPath = `${this.dbPath}.tmp`;

    fs.writeFileSync(tmpPath, Buffer.from(this.db.export()));
    fs.renameSync(tmpPath, this.dbPath);
  }
}

class SqlJsStatement {
  constructor(database, sql) {
    this.database = database;
    this.sql = sql;
  }

  run(...params) {
    return this.database.runPrepared(this.sql, params);
  }

  get(...params) {
    return this.database.getPrepared(this.sql, params);
  }

  all(...params) {
    return this.database.allPrepared(this.sql, params);
  }
}

function normalizeSqlParams(params) {
  if (params.length === 1 && Array.isArray(params[0])) {
    return params[0].map(normalizeSqlParam);
  }

  return params.map(normalizeSqlParam);
}

function normalizeSqlParam(value) {
  return value === undefined ? null : value;
}

function firstSqlOperation(sql) {
  return String(sql)
    .trim()
    .replace(/^;+/, "")
    .split(/\s+/, 1)[0]
    .toUpperCase();
}

function isWriteSql(operation) {
  return [
    "CREATE",
    "DELETE",
    "DROP",
    "INSERT",
    "PRAGMA",
    "REINDEX",
    "REPLACE",
    "UPDATE",
    "VACUUM",
  ].includes(operation);
}
