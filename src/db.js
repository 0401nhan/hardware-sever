import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

import initSqlJs from "sql.js";

const require = createRequire(import.meta.url);
const DEFAULT_GATEWAY_OFFLINE_AFTER_MS = 90_000;

export async function openDatabase(dbPath, tokenHashSecret, options = {}) {
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

    CREATE UNIQUE INDEX IF NOT EXISTS idx_telemetry_gateway_record_unique
      ON telemetry_records(gateway_id, record_id)
      WHERE record_id IS NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_template_registers_template_index
      ON template_registers(template_id, register_index);
  `);

  ensureTemplateRegisterColumns(db);

  return new HardwareStore(db, tokenHashSecret, options);
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

export class HardwareStore {
  constructor(db, tokenHashSecret, {
    offlineAfterMs = DEFAULT_GATEWAY_OFFLINE_AFTER_MS,
    now = () => Date.now(),
  } = {}) {
    this.db = db;
    this.tokenHashSecret = tokenHashSecret;
    this.offlineAfterMs = offlineAfterMs;
    this.now = now;
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
      INSERT OR IGNORE INTO telemetry_records (gateway_id, record_id, record_json, created_at)
      VALUES (?, ?, ?, ?)
    `);
    const updateGateway = this.db.prepare(`
      UPDATE gateways
      SET last_seen_at = ?, status = 'online', updated_at = ?
      WHERE id = ?
    `);
    let inserted = 0;

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

function mapGatewayRow(row, offlineAfterMs = DEFAULT_GATEWAY_OFFLINE_AFTER_MS, now = () => Date.now()) {
  return {
    id: row.id,
    name: row.name,
    site: row.site,
    tokenHash: row.token_hash,
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
    registers: Array.isArray(template.registers)
      ? template.registers.map(normalizeRegister)
      : [],
  };
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
