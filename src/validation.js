const SUPPORTED_PROTOCOLS = new Set(["modbus-rtu", "modbus-tcp"]);
const SUPPORTED_PARITIES = new Set(["none", "even", "odd", "mark", "space"]);
const SUPPORTED_REGISTER_FUNCTIONS = new Set(["holding", "input"]);
const SUPPORTED_REGISTER_ACCESS = new Set(["ro", "rw", "wo"]);
const SUPPORTED_REGISTER_TYPES = new Set([
  "uint16",
  "int16",
  "uint32",
  "int32",
  "uint64",
  "int64",
  "float32",
  "string",
  "str",
  "bytes",
  "bitfield16",
  "bitfield32",
]);
const SUPPORTED_WORD_ORDERS = new Set(["be", "high-low", "le", "low-high"]);

export function validateGatewayConfig(config, expectedGatewayId) {
  const missing = [];

  if (!config?.gateway?.id) missing.push("gateway.id");
  if (!config?.server?.url) missing.push("server.url");
  if (!config?.storage?.queuePath) missing.push("storage.queuePath");
  if (!Array.isArray(config?.devices)) missing.push("devices");

  if (missing.length > 0) {
    throw new Error(`Invalid gateway config. Missing: ${missing.join(", ")}`);
  }

  if (expectedGatewayId && config.gateway.id !== expectedGatewayId) {
    throw new Error(`Invalid gateway config. gateway.id must be ${expectedGatewayId}`);
  }

  if (config.remoteConfig?.enabled && !config.remoteConfig.url) {
    throw new Error("Invalid gateway config. remoteConfig.url is required when remoteConfig.enabled is true");
  }
  validateStorage(config.storage);
  validateInteger(config.gateway.pollLoopDelayMs, "gateway.pollLoopDelayMs", { min: 50, optional: true });
  validateInteger(config.server.timeoutMs, "server.timeoutMs", { min: 100, optional: true });
  validateInteger(config.server.batchSize, "server.batchSize", { min: 1, optional: true });
  validateInteger(config.server.uploadIntervalMs, "server.uploadIntervalMs", { min: 500, optional: true });
  validateRemoteConfig(config.remoteConfig);
  validateMongo(config.mongo);

  for (const [name, port] of Object.entries(config.ports || {})) {
    if (!port.path) throw new Error(`Invalid gateway config. ports.${name}.path is required`);
    validateInteger(port.baudRate, `ports.${name}.baudRate`, { min: 1 });
    validateEnum(port.parity, `ports.${name}.parity`, SUPPORTED_PARITIES, { optional: true });
    validateInteger(port.dataBits, `ports.${name}.dataBits`, { min: 5, max: 8, optional: true });
    validateInteger(port.stopBits, `ports.${name}.stopBits`, { min: 1, max: 2, optional: true });
    validateInteger(port.timeoutMs, `ports.${name}.timeoutMs`, { min: 100, optional: true });
    validateBoolean(port.autoDiscover, `ports.${name}.autoDiscover`, { optional: true });
    validateStringArray(port.pathCandidates, `ports.${name}.pathCandidates`, { optional: true });
  }

  for (const device of config.devices) {
    const protocol = device.protocol ?? "modbus-rtu";

    if (!device.name) throw new Error("Invalid gateway config. device.name is required");
    if (!SUPPORTED_PROTOCOLS.has(protocol)) {
      throw new Error(`Invalid gateway config. ${device.name}.protocol is unsupported`);
    }
    validateInteger(device.pollIntervalMs, `${device.name}.pollIntervalMs`, { min: 500, optional: true });

    if (protocol === "modbus-tcp") {
      if (!device.host) throw new Error(`Invalid gateway config. ${device.name}.host is required`);
      validateInteger(device.tcpPort, `${device.name}.tcpPort`, { min: 1, max: 65535, optional: true });
      validateInteger(device.unitId ?? device.slaveId, `${device.name}.unitId`, { min: 1, max: 247 });
    } else {
      if (!config?.ports || Object.keys(config.ports).length === 0) {
        throw new Error("Invalid gateway config. ports is required for Modbus RTU devices");
      }
      if (!device.port) throw new Error(`Invalid gateway config. ${device.name}.port is required`);
      if (!config.ports[device.port]) {
        throw new Error(`Invalid gateway config. ${device.name}.port references unknown port ${device.port}`);
      }
      validateInteger(device.slaveId, `${device.name}.slaveId`, { min: 1, max: 247 });
    }

    if (!Array.isArray(device.registers) || device.registers.length === 0) {
      throw new Error(`Invalid gateway config. ${device.name}.registers is required`);
    }

    device.registers.forEach((register, index) => {
      validateRegister(register, `${device.name}.registers[${index}]`);
    });
  }
}

export function createDefaultGatewayConfig(gatewayId, publicUrl) {
  return {
    gateway: {
      id: gatewayId,
      pollLoopDelayMs: 250,
    },
    server: {
      url: `${publicUrl.replace(/\/+$/, "")}/api/telemetry`,
      tokenEnv: "SERVER_TOKEN",
      timeoutMs: 10000,
      batchSize: 100,
      uploadIntervalMs: 5000,
    },
    remoteConfig: {
      enabled: true,
      url: `${publicUrl.replace(/\/+$/, "")}/api/gateway`,
      tokenEnv: "GATEWAY_TOKEN",
      checkIntervalMs: 30000,
      timeoutMs: 10000,
      statePath: "/data/remote-config-state.json",
    },
    mongo: {
      enabled: false,
      uriEnv: "MONGODB_URI",
      dbNameEnv: "MONGODB_DB",
      dbName: "hardware_gateway",
      checkIntervalMs: 30000,
      uploadIntervalMs: 5000,
      batchSize: 100,
      statePath: "/data/mongo-sync-state.json",
    },
    storage: {
      queuePath: "/data/queue.jsonl",
      queue: {
        maxRecords: 100000,
        maxBytes: 52428800,
        retentionMs: 604800000,
        compactIntervalMs: 60000,
        corruptPath: "/data/queue.jsonl.corrupt",
      },
    },
    ports: {},
    devices: [],
  };
}

function validateStorage(storage) {
  const queue = storage.queue || {};

  validateInteger(queue.maxRecords ?? storage.queueMaxRecords, "storage.queue.maxRecords", { min: 1, optional: true });
  validateInteger(queue.maxBytes ?? storage.queueMaxBytes, "storage.queue.maxBytes", { min: 1024, optional: true });
  validateInteger(queue.retentionMs ?? storage.queueRetentionMs, "storage.queue.retentionMs", { min: 0, optional: true });
  validateInteger(queue.compactIntervalMs ?? storage.queueCompactIntervalMs, "storage.queue.compactIntervalMs", { min: 0, optional: true });

  const corruptPath = queue.corruptPath ?? storage.queueCorruptPath;
  if (corruptPath !== undefined && !corruptPath) {
    throw new Error("Invalid gateway config. storage.queue.corruptPath must not be empty");
  }
}

function validateRemoteConfig(remoteConfig = {}) {
  if (!remoteConfig.enabled) return;

  validateInteger(remoteConfig.checkIntervalMs, "remoteConfig.checkIntervalMs", { min: 5000, optional: true });
  validateInteger(remoteConfig.timeoutMs, "remoteConfig.timeoutMs", { min: 1000, optional: true });

  if (remoteConfig.statePath !== undefined && !remoteConfig.statePath) {
    throw new Error("Invalid gateway config. remoteConfig.statePath must not be empty");
  }
}

function validateMongo(mongo = {}) {
  if (!mongo.enabled) return;

  if (!mongo.uriEnv) {
    throw new Error("Invalid gateway config. mongo.uriEnv is required when mongo.enabled is true");
  }
  if (!mongo.dbName && !mongo.dbNameEnv) {
    throw new Error("Invalid gateway config. mongo.dbName or mongo.dbNameEnv is required when mongo.enabled is true");
  }
  validateInteger(mongo.checkIntervalMs, "mongo.checkIntervalMs", { min: 5000, optional: true });
  validateInteger(mongo.uploadIntervalMs, "mongo.uploadIntervalMs", { min: 500, optional: true });
  validateInteger(mongo.batchSize, "mongo.batchSize", { min: 1, optional: true });
  if (mongo.statePath !== undefined && !mongo.statePath) {
    throw new Error("Invalid gateway config. mongo.statePath must not be empty");
  }
}

function validateRegister(register, registerPath) {
  if (!register || typeof register !== "object" || Array.isArray(register)) {
    throw new Error(`Invalid gateway config. ${registerPath} must be an object`);
  }

  if (!register.name) {
    throw new Error(`Invalid gateway config. ${registerPath}.name is required`);
  }

  validateEnum(register.function, `${registerPath}.function`, SUPPORTED_REGISTER_FUNCTIONS, { optional: true });
  validateEnum(register.access, `${registerPath}.access`, SUPPORTED_REGISTER_ACCESS, { optional: true });
  validateBoolean(register.poll, `${registerPath}.poll`, { optional: true });
  validateInteger(register.address, `${registerPath}.address`, { min: 0, max: 65535 });
  validateInteger(register.length, `${registerPath}.length`, { min: 1, max: 125, optional: true });
  validateEnum(register.type, `${registerPath}.type`, SUPPORTED_REGISTER_TYPES, { optional: true });
  validateNumber(register.scale, `${registerPath}.scale`, { optional: true });
  validateNumber(register.offset, `${registerPath}.offset`, { optional: true });
  validateEnum(register.wordOrder, `${registerPath}.wordOrder`, SUPPORTED_WORD_ORDERS, { optional: true });
  validateRegisterLengthForType(register, registerPath);
}

function validateRegisterLengthForType(register, registerPath) {
  const type = register.type || "uint16";
  const length = register.length ?? 1;
  const minimumLengths = {
    uint32: 2,
    int32: 2,
    float32: 2,
    bitfield32: 2,
    uint64: 4,
    int64: 4,
  };
  const minimum = minimumLengths[type];

  if (minimum && length < minimum) {
    throw new Error(`Invalid gateway config. ${registerPath}.length must be >= ${minimum} for ${type}`);
  }
}

function validateEnum(value, field, allowed, { optional = false } = {}) {
  if (value === undefined || value === null || value === "") {
    if (optional) return;
    throw new Error(`Invalid gateway config. ${field} is required`);
  }

  if (!allowed.has(value)) {
    throw new Error(`Invalid gateway config. ${field} is unsupported`);
  }
}

function validateInteger(value, field, { min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, optional = false } = {}) {
  if (value === undefined || value === null || value === "") {
    if (optional) return;
    throw new Error(`Invalid gateway config. ${field} is required`);
  }

  if (!Number.isInteger(value)) {
    throw new Error(`Invalid gateway config. ${field} must be an integer`);
  }

  if (value < min || value > max) {
    throw new Error(`Invalid gateway config. ${field} must be between ${min} and ${max}`);
  }
}

function validateNumber(value, field, { optional = false } = {}) {
  if (value === undefined || value === null || value === "") {
    if (optional) return;
    throw new Error(`Invalid gateway config. ${field} is required`);
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Invalid gateway config. ${field} must be a finite number`);
  }
}

function validateBoolean(value, field, { optional = false } = {}) {
  if (value === undefined || value === null || value === "") {
    if (optional) return;
    throw new Error(`Invalid gateway config. ${field} is required`);
  }

  if (typeof value !== "boolean") {
    throw new Error(`Invalid gateway config. ${field} must be a boolean`);
  }
}

function validateStringArray(value, field, { optional = false } = {}) {
  if (value === undefined || value === null) {
    if (optional) return;
    throw new Error(`Invalid gateway config. ${field} is required`);
  }

  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || item.trim() === "")) {
    throw new Error(`Invalid gateway config. ${field} must be an array of strings`);
  }
}
