import crypto from "node:crypto";

import { MongoClient } from "mongodb";
import { commandStatusForNextRun, isRecurringSchedule, nextScheduledRun } from "./schedule.js";

const DEFAULT_GATEWAY_OFFLINE_AFTER_MS = 90_000;
const DEFAULT_TELEMETRY_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const DEFAULT_TELEMETRY_PRUNE_INTERVAL_MS = 60 * 60 * 1000;
const TELEMETRY_TTL_INDEX_NAME = "idx_telemetry_created_at_ttl";

function isMongoDuplicateKey(error) {
  return error?.code === 11000;
}

export async function openMongoStore({ uri, dbName, tokenHashSecret, options = {} }) {
  const client = new MongoClient(uri);
  await client.connect();

  const store = new MongoHardwareStore(client, dbName, tokenHashSecret, options);
  await store.init();
  return store;
}

export class MongoHardwareStore {
  constructor(client, dbName, tokenHashSecret, {
    offlineAfterMs = DEFAULT_GATEWAY_OFFLINE_AFTER_MS,
    telemetryRetentionMs = DEFAULT_TELEMETRY_RETENTION_MS,
    telemetryPruneIntervalMs = DEFAULT_TELEMETRY_PRUNE_INTERVAL_MS,
    now = () => Date.now(),
  } = {}) {
    this.client = client;
    this.db = client.db(dbName);
    this.tokenHashSecret = tokenHashSecret;
    this.offlineAfterMs = offlineAfterMs;
    this.telemetryRetentionMs = nonNegativeInteger(telemetryRetentionMs, DEFAULT_TELEMETRY_RETENTION_MS);
    this.telemetryPruneIntervalMs = nonNegativeInteger(telemetryPruneIntervalMs, DEFAULT_TELEMETRY_PRUNE_INTERVAL_MS);
    this.now = now;
    this.lastTelemetryPrunedAt = 0;

    this.gateways = this.db.collection("gateways");
    this.configVersions = this.db.collection("config_versions");
    this.telemetryRecords = this.db.collection("telemetry_records");
    this.gatewayCommands = this.db.collection("gateway_commands");
    this.deviceTemplates = this.db.collection("device_templates");
    this.metadata = this.db.collection("template_library_metadata");
  }

  async init() {
    await Promise.all([
      this.gateways.createIndex({ updatedAt: -1 }),
      this.configVersions.createIndex({ gatewayId: 1, version: -1 }, { unique: true }),
      this.telemetryRecords.createIndex({ gatewayId: 1, createdAt: -1 }),
      this.#syncTelemetryTtlIndex(),
      this.telemetryRecords.createIndex(
        { gatewayId: 1, recordId: 1 },
        { unique: true, partialFilterExpression: { recordId: { $type: "string" } } },
      ),
      this.gatewayCommands.createIndex({ gatewayId: 1, status: 1, createdAt: 1 }),
      this.gatewayCommands.createIndex({ gatewayId: 1, status: 1, nextRunAt: 1, createdAt: 1 }),
      this.gatewayCommands.createIndex(
        { gatewayId: 1, scheduleId: 1, runIndex: 1 },
        { unique: true, partialFilterExpression: { scheduleId: { $type: "string" } } },
      ),
      this.deviceTemplates.createIndex({ sortOrder: 1, id: 1 }),
    ]);
    await this.pruneTelemetry({ force: true });
  }

  async listGateways() {
    const rows = await this.gateways.find({}).sort({ lastSeenAt: -1, createdAt: -1, id: 1 }).toArray();
    return Promise.all(rows.map(async (row) => {
      const latest = await this.getLatestConfig(row.id);
      return mapGatewayDoc({ ...row, latestConfigVersion: latest?.version }, this.offlineAfterMs, this.now);
    }));
  }

  async getGateway(id) {
    const row = await this.gateways.findOne({ _id: id });
    return row ? mapGatewayDoc(row, this.offlineAfterMs, this.now) : null;
  }

  async deleteGateway(id) {
    const gateway = await this.getGateway(id);
    if (!gateway) return null;
    await Promise.all([
      this.gateways.deleteOne({ _id: id }),
      this.configVersions.deleteMany({ gatewayId: id }),
      this.telemetryRecords.deleteMany({ gatewayId: id }),
      this.gatewayCommands.deleteMany({ gatewayId: id }),
    ]);
    return gateway;
  }

  async upsertGateway({ id, name = "", site = "", token = "" }) {
    const now = new Date().toISOString();
    const existing = await this.getGateway(id);
    const tokenHash = token ? this.hashToken(token) : existing?.tokenHash;

    if (!tokenHash) {
      throw new Error("Gateway token is required");
    }

    await this.gateways.updateOne(
      { _id: id },
      {
        $set: {
          id,
          name,
          site,
          tokenHash,
          updatedAt: now,
        },
        $setOnInsert: {
          status: "offline",
          createdAt: now,
        },
      },
      { upsert: true },
    );

    return this.getGateway(id);
  }

  async autoRegisterGateway(id, token) {
    return this.upsertGateway({
      id,
      name: id,
      site: "",
      token,
    });
  }

  async verifyGatewayToken(gatewayId, token) {
    const gateway = await this.getGateway(gatewayId);
    if (!gateway || !token) return false;
    return safeEqual(gateway.tokenHash, this.hashToken(token));
  }

  async markHeartbeat(gatewayId, appVersion = "") {
    const now = new Date().toISOString();
    await this.gateways.updateOne(
      { _id: gatewayId },
      {
        $set: {
          status: "online",
          lastSeenAt: now,
          appVersion,
          updatedAt: now,
        },
      },
    );
    return this.getGateway(gatewayId);
  }

  async getLatestConfig(gatewayId) {
    const row = await this.configVersions.findOne({ gatewayId }, { sort: { version: -1 } });
    return row ? mapConfigDoc(row) : null;
  }

  async addConfigVersion({ gatewayId, config, restartRequired = true, createdBy = "admin" }) {
    const configJson = stableJson(config);
    const configHash = sha256(configJson);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const latest = await this.getLatestConfig(gatewayId);
      const version = (latest?.version ?? 0) + 1;
      const now = new Date().toISOString();

      try {
        await this.configVersions.insertOne({
          _id: `${gatewayId}:${version}`,
          gatewayId,
          version,
          config,
          configHash,
          restartRequired: Boolean(restartRequired),
          createdBy,
          createdAt: now,
        });
        await this.gateways.updateOne(
          { _id: gatewayId },
          { $set: { desiredConfigVersion: version, updatedAt: now } },
        );

        return this.getLatestConfig(gatewayId);
      } catch (error) {
        if (!isMongoDuplicateKey(error) || attempt === 4) throw error;
      }
    }

    throw new Error("Failed to create MongoDB config version");
  }

  async updateConfigStatus({ gatewayId, version, status, message = "", appVersion = "" }) {
    const now = new Date().toISOString();
    const gateway = await this.getGateway(gatewayId);
    const appliedVersion = status === "applied" ? version : gateway?.appliedConfigVersion;
    const set = {
      appliedConfigVersion: appliedVersion ?? null,
      lastConfigStatus: status,
      lastConfigMessage: message ?? "",
      lastSeenAt: now,
      status: "online",
      updatedAt: now,
    };

    if (appVersion) set.appVersion = appVersion;
    await this.gateways.updateOne({ _id: gatewayId }, { $set: set });
    return this.getGateway(gatewayId);
  }

  async insertTelemetry(gatewayId, records) {
    const nowMs = this.now();
    const nowDate = new Date(nowMs);
    const now = nowDate.toISOString();
    const docs = records.map((record) => ({
      _id: record.id ? `${gatewayId}:${record.id}` : crypto.randomUUID(),
      gatewayId,
      recordId: record.id ?? null,
      record,
      createdAt: now,
      createdAtDate: nowDate,
    }));
    let inserted = 0;

    await this.pruneTelemetry({ nowMs });

    if (docs.length > 0) {
      try {
        const result = await this.telemetryRecords.insertMany(docs, { ordered: false });
        inserted = result.insertedCount;
      } catch (error) {
        if (error.code !== 11000 && error.name !== "MongoBulkWriteError") throw error;
        inserted = error.result?.insertedCount ?? error.insertedCount ?? 0;
      }
    }

    await this.gateways.updateOne(
      { _id: gatewayId },
      { $set: { lastSeenAt: now, status: "online", updatedAt: now } },
    );

    return {
      received: records.length,
      inserted,
      ignored: records.length - inserted,
    };
  }

  async pruneTelemetry({ force = false, nowMs = this.now() } = {}) {
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
    const result = await this.telemetryRecords.deleteMany({
      createdAt: { $lt: cutoff },
    });

    return {
      deleted: Number(result.deletedCount ?? 0),
    };
  }

  async latestTelemetry(gatewayId, limit = 100) {
    const rows = await this.telemetryRecords.find({ gatewayId }).sort({ createdAt: -1 }).limit(limit).toArray();
    return rows.map((row) => ({
      id: row._id,
      gatewayId: row.gatewayId,
      recordId: row.recordId,
      createdAt: row.createdAt,
      record: row.record,
    }));
  }

  async createGatewayCommand({ gatewayId, action, payload, createdBy = "admin", schedule = null, nextRunAt = null, scheduleId = null, runIndex = 0 }) {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const commandScheduleId = schedule ? (scheduleId || crypto.randomUUID()) : null;
    await this.gatewayCommands.insertOne({
      _id: id,
      id,
      gatewayId,
      action,
      payload: sortKeys(payload),
      status: commandStatusForNextRun(nextRunAt, new Date(now)),
      message: "",
      result: null,
      createdBy,
      createdAt: now,
      scheduledAt: schedule?.scheduledAt || nextRunAt || null,
      nextRunAt: nextRunAt || null,
      schedule: schedule ? sortKeys(schedule) : null,
      scheduleId: commandScheduleId,
      runIndex,
      deliveredAt: null,
      completedAt: null,
      updatedAt: now,
    });
    return this.getGatewayCommand(gatewayId, id);
  }

  async getGatewayCommand(gatewayId, commandId) {
    const row = await this.gatewayCommands.findOne({ _id: commandId, gatewayId });
    return row ? mapCommandDoc(row) : null;
  }

  async listGatewayCommands(gatewayId, limit = 50) {
    const rows = await this.gatewayCommands.find({ gatewayId }).sort({ createdAt: -1 }).limit(limit).toArray();
    return rows.map(mapCommandDoc);
  }

  async nextGatewayCommand(gatewayId) {
    const now = new Date().toISOString();
    const result = await this.gatewayCommands.findOneAndUpdate(
      {
        gatewayId,
        status: { $in: ["queued", "scheduled"] },
        $or: [
          { nextRunAt: null },
          { nextRunAt: { $exists: false } },
          { nextRunAt: { $lte: now } },
        ],
      },
      {
        $set: {
          status: "delivered",
          deliveredAt: now,
          updatedAt: now,
        },
      },
      {
        sort: { nextRunAt: 1, createdAt: 1 },
        returnDocument: "after",
      },
    );

    const command = result?.value ?? result;
    if (!command) return null;
    return mapCommandDoc(command);
  }

  async updateGatewayCommandStatus({ gatewayId, commandId, status, message = "", result = null, appVersion = "" }) {
    const now = new Date().toISOString();
    const completedAt = ["applied", "failed", "cancelled"].includes(status) ? now : null;
    const set = {
      status,
      message: message ?? "",
      result: result ?? null,
      updatedAt: now,
    };

    if (completedAt) set.completedAt = completedAt;

    await this.gatewayCommands.updateOne({ _id: commandId, gatewayId }, { $set: set });

    const gatewaySet = {
      lastSeenAt: now,
      status: "online",
      updatedAt: now,
    };
    if (appVersion) gatewaySet.appVersion = appVersion;
    await this.gateways.updateOne({ _id: gatewayId }, { $set: gatewaySet });

    const command = await this.getGatewayCommand(gatewayId, commandId);
    await this.#enqueueNextScheduledCommand(command, status, now);
    return command;
  }

  async #enqueueNextScheduledCommand(command, status, now) {
    if (!command || !["applied", "failed"].includes(status) || !isRecurringSchedule(command.schedule)) return;

    const nextRunIndex = Number(command.runIndex || 0) + 1;
    const nextRunAt = nextScheduledRun(command.schedule, {
      from: new Date(now),
      runIndex: nextRunIndex,
    });
    if (!nextRunAt) return;

    const id = crypto.randomUUID();
    await this.gatewayCommands.updateOne(
      {
        gatewayId: command.gatewayId,
        scheduleId: command.scheduleId,
        runIndex: nextRunIndex,
      },
      {
        $setOnInsert: {
          _id: id,
          id,
          gatewayId: command.gatewayId,
          action: command.action,
          payload: sortKeys(command.payload),
          status: commandStatusForNextRun(nextRunAt, new Date(now)),
          message: "",
          result: null,
          createdBy: command.createdBy,
          createdAt: now,
          scheduledAt: command.schedule?.scheduledAt || nextRunAt,
          nextRunAt,
          schedule: sortKeys(command.schedule),
          scheduleId: command.scheduleId,
          runIndex: nextRunIndex,
          deliveredAt: null,
          completedAt: null,
          updatedAt: now,
        },
      },
      { upsert: true },
    );
  }

  async seedDeviceTemplates(templates) {
    const normalized = normalizeTemplateLibrary(templates);
    if (await this.#metadata("device_templates_initialized") === "1") {
      await this.#mergeNewSeedTemplates(normalized);
      return this.listDeviceTemplates();
    }

    if (normalized.length === 0) {
      const existing = await this.listDeviceTemplates();
      await this.#setMetadata("device_templates_initialized", "1");
      await this.#setSeedTemplateMetadata(normalized);
      return existing;
    }

    const saved = await this.saveDeviceTemplates(normalized);
    await this.#setMetadata("device_templates_initialized", "1");
    await this.#setSeedTemplateMetadata(normalized);
    return saved;
  }

  async listDeviceTemplates() {
    const rows = await this.deviceTemplates.find({}).sort({ sortOrder: 1, id: 1 }).toArray();
    return rows.map((row) => ({
      id: row.id,
      label: row.label,
      manufacturer: row.manufacturer,
      model: row.model,
      category: row.category,
      type: normalizeDeviceTemplateType(row.type, row.category, row.label),
      protocol: row.protocol,
      pollIntervalMs: row.pollIntervalMs,
      notes: row.notes,
      registers: row.registers || [],
    }));
  }

  async saveDeviceTemplates(templates) {
    const normalized = normalizeTemplateLibrary(templates);

    if (normalized.length === 0) {
      throw new Error("Device template library must not be empty");
    }

    const ids = normalized.map((template) => template.id);
    await this.deviceTemplates.bulkWrite(normalized.map((template, index) => ({
      replaceOne: {
        filter: { _id: template.id },
        replacement: {
          _id: template.id,
          ...template,
          sortOrder: index,
        },
        upsert: true,
      },
    })), { ordered: true });
    await this.deviceTemplates.deleteMany({ _id: { $nin: ids } });
    await this.#setMetadata("device_templates_initialized", "1");
    return this.listDeviceTemplates();
  }

  async #mergeNewSeedTemplates(seedTemplates) {
    const previousSeedIds = await this.#seedTemplateIds();
    const existingTemplates = await this.listDeviceTemplates();
    const existingIds = new Set(existingTemplates.map((template) => template.id));
    const knownSeedIds = previousSeedIds ?? existingIds;
    const previousSeedRegisterNames = await this.#seedTemplateRegisterNames();
    const existingRegisterNames = new Map(existingTemplates.map((template) => [
      template.id,
      new Set((template.registers || []).map((register) => register.name)),
    ]));
    const knownSeedRegisterNames = previousSeedRegisterNames ?? existingRegisterNames;
    const newSeedTemplates = seedTemplates.filter(
      (template) => !knownSeedIds.has(template.id) && !existingIds.has(template.id),
    );

    if (newSeedTemplates.length > 0) {
      const maxSort = existingTemplates.reduce((max, template, index) => Math.max(max, template.sortOrder ?? index), -1);
      await this.deviceTemplates.insertMany(newSeedTemplates.map((template, index) => ({
        _id: template.id,
        ...template,
        sortOrder: maxSort + index + 1,
      })));
    }

    for (const template of seedTemplates) {
      if (!knownSeedIds.has(template.id) || !existingIds.has(template.id)) continue;

      const previousNames = knownSeedRegisterNames.get(template.id) ?? new Set();
      const existingNames = existingRegisterNames.get(template.id) ?? new Set();
      const missing = template.registers.filter((register) => !previousNames.has(register.name) && !existingNames.has(register.name));

      if (missing.length > 0) {
        await this.deviceTemplates.updateOne(
          { _id: template.id },
          { $push: { registers: { $each: missing } } },
        );
      }
    }

    await this.#setSeedTemplateMetadata(seedTemplates);
  }

  async #seedTemplateIds() {
    const raw = await this.#metadata("seed_template_ids");
    if (!raw) return null;
    try {
      const ids = JSON.parse(raw);
      return Array.isArray(ids) ? new Set(ids.map(String)) : null;
    } catch {
      return null;
    }
  }

  async #seedTemplateRegisterNames() {
    const raw = await this.#metadata("seed_template_register_names");
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
      return new Map(Object.entries(parsed).map(([templateId, names]) => [
        templateId,
        new Set(Array.isArray(names) ? names.map(String) : []),
      ]));
    } catch {
      return null;
    }
  }

  async #setSeedTemplateMetadata(seedTemplates) {
    await this.#setMetadata("seed_template_ids", JSON.stringify(seedTemplates.map((template) => template.id)));
    await this.#setMetadata(
      "seed_template_register_names",
      JSON.stringify(Object.fromEntries(seedTemplates.map((template) => [
        template.id,
        template.registers.map((register) => register.name),
      ]))),
    );
  }

  async #metadata(key) {
    return (await this.metadata.findOne({ _id: key }))?.value;
  }

  async #setMetadata(key, value) {
    await this.metadata.updateOne({ _id: key }, { $set: { value } }, { upsert: true });
  }

  hashToken(token) {
    return crypto.createHmac("sha256", this.tokenHashSecret).update(token).digest("hex");
  }

  async #syncTelemetryTtlIndex() {
    if (this.telemetryRetentionMs <= 0) {
      await dropMongoIndexIfExists(this.telemetryRecords, TELEMETRY_TTL_INDEX_NAME);
      return;
    }

    const options = {
      name: TELEMETRY_TTL_INDEX_NAME,
      expireAfterSeconds: Math.max(1, Math.ceil(this.telemetryRetentionMs / 1000)),
    };

    try {
      await this.telemetryRecords.createIndex({ createdAtDate: 1 }, options);
    } catch (error) {
      if (!isIndexOptionsConflict(error)) throw error;
      await dropMongoIndexIfExists(this.telemetryRecords, TELEMETRY_TTL_INDEX_NAME);
      await this.telemetryRecords.createIndex({ createdAtDate: 1 }, options);
    }
  }

  async close() {
    await this.client.close();
  }
}

function mapGatewayDoc(row, offlineAfterMs, now) {
  return {
    id: row.id,
    name: row.name || "",
    site: row.site || "",
    tokenHash: row.tokenHash,
    status: gatewayStatus(row, offlineAfterMs, now),
    lastSeenAt: row.lastSeenAt,
    appVersion: row.appVersion,
    desiredConfigVersion: row.desiredConfigVersion,
    appliedConfigVersion: row.appliedConfigVersion,
    latestConfigVersion: row.latestConfigVersion,
    lastConfigStatus: row.lastConfigStatus,
    lastConfigMessage: row.lastConfigMessage,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function dropMongoIndexIfExists(collection, indexName) {
  try {
    await collection.dropIndex(indexName);
  } catch (error) {
    if (!isIndexNotFound(error)) throw error;
  }
}

function isIndexOptionsConflict(error) {
  return error?.code === 85 || error?.codeName === "IndexOptionsConflict";
}

function isIndexNotFound(error) {
  return error?.code === 27 || error?.codeName === "IndexNotFound";
}

function gatewayStatus(row, offlineAfterMs, now) {
  if (row.status !== "online") return row.status || "offline";
  if (!row.lastSeenAt) return "offline";

  const lastSeenAt = Date.parse(row.lastSeenAt);
  if (!Number.isFinite(lastSeenAt)) return "offline";

  return now() - lastSeenAt > offlineAfterMs ? "offline" : "online";
}

function mapConfigDoc(row) {
  return {
    gatewayId: row.gatewayId,
    version: row.version,
    config: row.config,
    configHash: row.configHash,
    restartRequired: Boolean(row.restartRequired),
    createdBy: row.createdBy,
    createdAt: row.createdAt,
  };
}

function mapCommandDoc(row) {
  return {
    id: row.id || row._id,
    gatewayId: row.gatewayId,
    action: row.action,
    payload: row.payload,
    status: row.status,
    message: row.message,
    result: row.result ?? null,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    deliveredAt: row.deliveredAt,
    completedAt: row.completedAt,
    scheduledAt: row.scheduledAt,
    nextRunAt: row.nextRunAt,
    schedule: row.schedule ?? null,
    scheduleId: row.scheduleId,
    runIndex: Number(row.runIndex || 0),
    updatedAt: row.updatedAt,
  };
}

function stableJson(value) {
  return JSON.stringify(sortKeys(value));
}

function sha256(value) {
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

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function nonNegativeInteger(value, fallback) {
  return Number.isInteger(value) && value >= 0 ? value : fallback;
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
