const SUPPORTED_PROTOCOLS = new Set(["modbus-rtu", "modbus-tcp"]);
const SUPPORTED_LOGGER_PROTOCOLS = new Set(["modbus-tcp"]);
const SUPPORTED_PARITIES = new Set(["none", "even", "odd", "mark", "space"]);
const SUPPORTED_REGISTER_FUNCTIONS = new Set(["holding", "input"]);
const SUPPORTED_REGISTER_ACCESS = new Set(["ro", "rw", "wo"]);
const SUPPORTED_ROUTE_TYPES = new Set(["unit_id", "forwarding_address", "system_map"]);
const SUPPORTED_STATION_CONTROL_MODES = new Set(["fanout", "child_device", "logger_plant"]);
const SUPPORTED_IEC104_MODES = new Set(["client", "server"]);
const SUPPORTED_IEC104_POINT_SOURCES = new Set(["device", "station"]);
const SUPPORTED_IEC104_POINT_TYPES = new Set(["float", "single"]);
const SUPPORTED_IEC104_CONTROL_TYPES = new Set(["single", "setpoint"]);
const SUPPORTED_IEC104_CONTROL_VALUE_FIELDS = new Set(["value", "percent", "kw", "watts"]);
const SUPPORTED_IEC104_SIMULATOR_MODES = new Set(["fallback", "always"]);
const SUPPORTED_INVERTER_CONTROL_ACTIONS = new Set(["start", "stop", "reboot", "limit_power", "clear_power_limit"]);
const SUPPORTED_INVERTER_CONTROL_VALUE_SOURCES = new Set(["value", "percent", "kw", "watts", "durationSeconds"]);
const SUPPORTED_EVN_SIGNAL_SOURCES = new Set(["meter", "device", "inverter_total", "snapshot"]);
const SUPPORTED_EVN_SNAPSHOT_STRATEGIES = new Set(["daily_register_eod", "cumulative_delta"]);
const SUPPORTED_REGISTER_TYPES = new Set([
  "uint16",
  "int16",
  "uint32",
  "int32",
  "uint64",
  "int64",
  "float32",
  "float64",
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
  validateInteger(config.gateway.maxConcurrentPollGroups, "gateway.maxConcurrentPollGroups", { min: 1, max: 64, optional: true });
  validateInteger(config.server.timeoutMs, "server.timeoutMs", { min: 100, optional: true });
  validateInteger(config.server.batchSize, "server.batchSize", { min: 1, optional: true });
  validateInteger(config.server.uploadIntervalMs, "server.uploadIntervalMs", { min: 500, optional: true });
  validateRemoteConfig(config.remoteConfig);
  validateMongo(config.mongo);
  validateIec104(config.iec104);
  const loggerIds = validateLoggers(config.loggers);
  validateStations(config.stations, config.devices, loggerIds);

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
    validateString(device.parentLogger, `${device.name}.parentLogger`, { optional: true });
    validateInteger(device.pollIntervalMs, `${device.name}.pollIntervalMs`, { min: 500, optional: true });
    validateString(device.stationId, `${device.name}.stationId`, { optional: true });
    validateNumber(device.capacityKw, `${device.name}.capacityKw`, { optional: true });
    if (device.capacityKw !== undefined && device.capacityKw < 0) {
      throw new Error(`Invalid gateway config. ${device.name}.capacityKw must be greater than or equal to 0`);
    }

    if (device.parentLogger) {
      if (!loggerIds.has(device.parentLogger)) {
        throw new Error(`Invalid gateway config. ${device.name}.parentLogger references unknown logger ${device.parentLogger}`);
      }
      if (device.protocol && protocol !== "modbus-tcp") {
        throw new Error(`Invalid gateway config. ${device.name}.protocol must be modbus-tcp when parentLogger is set`);
      }
      validateDeviceRoute(device.route, device, `${device.name}.route`);
      validateInteger(device.tcpPort, `${device.name}.tcpPort`, { min: 1, max: 65535, optional: true });
    } else if (protocol === "modbus-tcp") {
      if (!device.host) throw new Error(`Invalid gateway config. ${device.name}.host is required`);
      validateInteger(device.tcpPort, `${device.name}.tcpPort`, { min: 1, max: 65535, optional: true });
      validateInteger(device.unitId ?? device.slaveId, `${device.name}.unitId`, { min: 0, max: 255 });
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
    validateDeviceControls(device.controls, `${device.name}.controls`);
  }
}

function validateDeviceControls(controls, controlsPath) {
  if (controls === undefined || controls === null) return;

  if (typeof controls !== "object" || Array.isArray(controls)) {
    throw new Error(`Invalid gateway config. ${controlsPath} must be an object`);
  }

  for (const [action, control] of Object.entries(controls)) {
    validateEnum(action, `${controlsPath}.${action}`, SUPPORTED_INVERTER_CONTROL_ACTIONS);
    validateDeviceControl(control, `${controlsPath}.${action}`);
  }
}

function validateLoggers(loggers = []) {
  if (loggers === undefined || loggers === null) return new Set();
  if (!Array.isArray(loggers)) {
    throw new Error("Invalid gateway config. loggers must be an array");
  }

  const ids = new Set();

  loggers.forEach((logger, index) => {
    const loggerPath = `loggers[${index}]`;

    if (!logger || typeof logger !== "object" || Array.isArray(logger)) {
      throw new Error(`Invalid gateway config. ${loggerPath} must be an object`);
    }

    validateString(logger.id, `${loggerPath}.id`);
    if (ids.has(logger.id)) {
      throw new Error(`Invalid gateway config. ${loggerPath}.id must be unique`);
    }
    ids.add(logger.id);

    validateEnum(logger.protocol ?? "modbus-tcp", `${loggerPath}.protocol`, SUPPORTED_LOGGER_PROTOCOLS, { optional: true });
    validateString(logger.host, `${loggerPath}.host`);
    validateInteger(logger.tcpPort, `${loggerPath}.tcpPort`, { min: 1, max: 65535, optional: true });
    validateInteger(logger.unitId ?? logger.slaveId ?? logger.address, `${loggerPath}.unitId`, { min: 0, max: 255, optional: true });
    validateInteger(logger.timeoutMs, `${loggerPath}.timeoutMs`, { min: 100, optional: true });
    validateString(logger.name, `${loggerPath}.name`, { optional: true });
    validateString(logger.vendor, `${loggerPath}.vendor`, { optional: true });
    validateString(logger.manufacturer, `${loggerPath}.manufacturer`, { optional: true });
    validateString(logger.model, `${loggerPath}.model`, { optional: true });

    if (logger.registers !== undefined) {
      if (!Array.isArray(logger.registers)) {
        throw new Error(`Invalid gateway config. ${loggerPath}.registers must be an array`);
      }
      logger.registers.forEach((register, registerIndex) => {
        validateRegister(register, `${loggerPath}.registers[${registerIndex}]`);
      });
    }

    validateDeviceControls(logger.controls, `${loggerPath}.controls`);
  });

  return ids;
}

function validateDeviceRoute(route, device, routePath) {
  const hasLegacyAddress = device.unitId !== undefined || device.slaveId !== undefined;

  if (route === undefined || route === null) {
    if (hasLegacyAddress) return;
    throw new Error(`Invalid gateway config. ${routePath}.address is required when parentLogger is set`);
  }

  if (typeof route !== "object" || Array.isArray(route)) {
    throw new Error(`Invalid gateway config. ${routePath} must be an object`);
  }

  const routeType = normalizeRouteType(route.type ?? route.addressType ?? "unit_id");
  validateEnum(routeType, `${routePath}.type`, SUPPORTED_ROUTE_TYPES);

  const address = route.address ?? route.unitId ?? route.forwardingAddress ?? route.logicalAddress ?? device.unitId ?? device.slaveId;
  validateInteger(address, `${routePath}.address`, { min: 0, max: 255 });
}

function validateDeviceControl(control, controlPath) {
  if (Array.isArray(control)) {
    control.forEach((write, index) => validateDeviceControlWrite(write, `${controlPath}[${index}]`));
    return;
  }

  if (!control || typeof control !== "object") {
    throw new Error(`Invalid gateway config. ${controlPath} must be an object or array`);
  }

  if (Array.isArray(control.writes)) {
    control.writes.forEach((write, index) => validateDeviceControlWrite(write, `${controlPath}.writes[${index}]`));
    return;
  }

  validateDeviceControlWrite(control, controlPath);
}

function validateDeviceControlWrite(write, writePath) {
  if (!write || typeof write !== "object" || Array.isArray(write)) {
    throw new Error(`Invalid gateway config. ${writePath} must be an object`);
  }

  const register = write.register ?? write.registerName;
  const isDelay = write.delayMs !== undefined && !register;

  if (isDelay) {
    validateInteger(write.delayMs, `${writePath}.delayMs`, { min: 0, max: 300000 });
    return;
  }

  validateString(register, `${writePath}.register`);
  validateEnum(write.valueFrom, `${writePath}.valueFrom`, SUPPORTED_INVERTER_CONTROL_VALUE_SOURCES, { optional: true });
  validateBoolean(write.required, `${writePath}.required`, { optional: true });
  validateNumber(write.multiplier, `${writePath}.multiplier`, { optional: true });
  validateNumber(write.offset, `${writePath}.offset`, { optional: true });

  if (write.value !== undefined) validateControlValue(write.value, `${writePath}.value`);
  if (write.value === undefined && write.valueFrom === undefined && write.required !== false) {
    throw new Error(`Invalid gateway config. ${writePath}.value or ${writePath}.valueFrom is required`);
  }
}

function validateControlValue(value, valuePath) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => validateNumber(item, `${valuePath}[${index}]`));
    return;
  }

  validateNumber(value, valuePath);
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
    iec104: {
      enabled: false,
      mode: "client",
      remoteHost: "",
      remotePort: 2404,
      localAddress: "",
      localPort: 0,
      host: "0.0.0.0",
      port: 2404,
      commonAddress: 1,
      originatorAddress: 0,
      staleAfterMs: 60000,
      maxClientConnections: 4,
      reconnectMs: 5000,
      keepAliveMs: 30000,
      selectTimeoutMs: 30000,
      periodicMs: 0,
      spontaneous: true,
      simulator: {
        enabled: false,
        mode: "fallback",
        intervalMs: 1000,
      },
      points: [],
      controls: [],
    },
    storage: {
      queuePath: "/data/queue.jsonl",
      archive: {
        enabled: true,
        path: "/data/telemetry-5m.sqlite",
        intervalMs: 300000,
        retentionMs: 604800000,
        compactIntervalMs: 60000,
      },
      queue: {
        maxRecords: 100000,
        maxBytes: 52428800,
        retentionMs: 604800000,
        compactIntervalMs: 60000,
        corruptPath: "/data/queue.jsonl.corrupt",
      },
    },
    stations: [],
    ports: {},
    devices: [],
  };
}

function validateIec104(iec104 = {}) {
  validateBoolean(iec104.enabled, "iec104.enabled", { optional: true });

  if (!iec104.enabled) return;

  const mode = iec104.mode ?? "client";

  validateEnum(mode, "iec104.mode", SUPPORTED_IEC104_MODES);

  if (mode === "client") {
    validateString(iec104.remoteHost, "iec104.remoteHost");
    validateInteger(iec104.remotePort ?? iec104.port, "iec104.remotePort", { min: 1, max: 65535, optional: true });
    validateString(iec104.localAddress, "iec104.localAddress", { optional: true });
    validateInteger(iec104.localPort, "iec104.localPort", { min: 0, max: 65535, optional: true });
    validateInteger(iec104.reconnectMs, "iec104.reconnectMs", { min: 1000, optional: true });
    validateInteger(iec104.keepAliveMs, "iec104.keepAliveMs", { min: 0, optional: true });
  } else {
    validateString(iec104.host, "iec104.host", { optional: true });
    validateInteger(iec104.port, "iec104.port", { min: 1, max: 65535, optional: true });
    validateInteger(iec104.maxClientConnections, "iec104.maxClientConnections", { min: 1, max: 32, optional: true });
  }

  validateInteger(iec104.commonAddress, "iec104.commonAddress", { min: 1, max: 65535, optional: true });
  validateInteger(iec104.originatorAddress, "iec104.originatorAddress", { min: 0, max: 255, optional: true });
  validateInteger(iec104.staleAfterMs, "iec104.staleAfterMs", { min: 0, optional: true });
  validateInteger(iec104.periodicMs, "iec104.periodicMs", { min: 0, optional: true });
  validateInteger(iec104.selectTimeoutMs, "iec104.selectTimeoutMs", { min: 0, optional: true });
  validateBoolean(iec104.spontaneous, "iec104.spontaneous", { optional: true });
  validateIec104Simulator(iec104.simulator);
  validateIec104EvnMapping(iec104.evnMapping, "iec104.evnMapping");

  if (iec104.points !== undefined && !Array.isArray(iec104.points)) {
    throw new Error("Invalid gateway config. iec104.points must be an array");
  }

  if (iec104.controls !== undefined && !Array.isArray(iec104.controls)) {
    throw new Error("Invalid gateway config. iec104.controls must be an array");
  }

  (iec104.points || []).forEach((point, index) => {
    validateIec104Point(point, `iec104.points[${index}]`);
  });

  (iec104.controls || []).forEach((control, index) => {
    validateIec104Control(control, `iec104.controls[${index}]`);
  });
}

function validateIec104Simulator(simulator) {
  if (simulator === undefined || simulator === null) return;

  if (typeof simulator !== "object" || Array.isArray(simulator)) {
    throw new Error("Invalid gateway config. iec104.simulator must be an object");
  }

  validateBoolean(simulator.enabled, "iec104.simulator.enabled", { optional: true });
  validateEnum(simulator.mode, "iec104.simulator.mode", SUPPORTED_IEC104_SIMULATOR_MODES, { optional: true });
  validateInteger(simulator.intervalMs, "iec104.simulator.intervalMs", { min: 100, optional: true });
}

function validateStations(stations = [], devices = [], loggerIds = new Set()) {
  if (stations !== undefined && !Array.isArray(stations)) {
    throw new Error("Invalid gateway config. stations must be an array");
  }

  const stationIds = new Set();
  const deviceNames = new Set((devices || []).map((device) => device.name).filter(Boolean));

  (stations || []).forEach((station, index) => {
    const stationPath = `stations[${index}]`;

    if (!station || typeof station !== "object" || Array.isArray(station)) {
      throw new Error(`Invalid gateway config. ${stationPath} must be an object`);
    }

    validateString(station.id, `${stationPath}.id`);
    validateString(station.name, `${stationPath}.name`, { optional: true });
    validateNumber(station.capacityKw, `${stationPath}.capacityKw`, { optional: true });
    if (station.capacityKw !== undefined && station.capacityKw < 0) {
      throw new Error(`Invalid gateway config. ${stationPath}.capacityKw must be greater than or equal to 0`);
    }

    if (stationIds.has(station.id)) {
      throw new Error(`Invalid gateway config. ${stationPath}.id must be unique`);
    }
    stationIds.add(station.id);

    validateStringArray(station.devices, `${stationPath}.devices`, { optional: true });
    for (const deviceName of station.devices || []) {
      if (!deviceNames.has(deviceName)) {
        throw new Error(`Invalid gateway config. ${stationPath}.devices references unknown device ${deviceName}`);
      }
    }

    validateStationControl(station.control, `${stationPath}.control`, loggerIds);
    validateStationEvnProfile(station.evnProfile, `${stationPath}.evnProfile`);
  });

  for (const device of devices || []) {
    if (device.stationId && stationIds.size > 0 && !stationIds.has(device.stationId)) {
      throw new Error(`Invalid gateway config. ${device.name}.stationId references unknown station ${device.stationId}`);
    }
  }
}

function validateStationControl(control, controlPath, loggerIds) {
  if (control === undefined || control === null) return;

  if (typeof control !== "object" || Array.isArray(control)) {
    throw new Error(`Invalid gateway config. ${controlPath} must be an object`);
  }

  const mode = normalizeStationControlMode(control.mode ?? "fanout");
  validateEnum(mode, `${controlPath}.mode`, SUPPORTED_STATION_CONTROL_MODES);
  validateBoolean(control.fallback, `${controlPath}.fallback`, { optional: true });
  validateString(control.logger, `${controlPath}.logger`, { optional: true });
  validateString(control.loggerId, `${controlPath}.loggerId`, { optional: true });
  validateStringArray(control.loggers, `${controlPath}.loggers`, { optional: true });

  for (const loggerId of [
    control.logger,
    control.loggerId,
    ...(Array.isArray(control.loggers) ? control.loggers : []),
  ].filter(Boolean)) {
    if (!loggerIds.has(loggerId)) {
      throw new Error(`Invalid gateway config. ${controlPath} references unknown logger ${loggerId}`);
    }
  }
}

function validateStationEvnProfile(evnProfile, profilePath) {
  if (evnProfile === undefined || evnProfile === null) return;

  if (typeof evnProfile !== "object" || Array.isArray(evnProfile)) {
    throw new Error(`Invalid gateway config. ${profilePath} must be an object`);
  }

  validateBoolean(evnProfile.enabled, `${profilePath}.enabled`, { optional: true });
  validateBoolean(evnProfile.autoGenerateIoa, `${profilePath}.autoGenerateIoa`, { optional: true });
  validateEnum(evnProfile.simulator, `${profilePath}.simulator`, SUPPORTED_IEC104_SIMULATOR_MODES, { optional: true });
}

function validateIec104Point(point, pointPath) {
  if (!point || typeof point !== "object" || Array.isArray(point)) {
    throw new Error(`Invalid gateway config. ${pointPath} must be an object`);
  }

  const source = point.source ?? (point.station || point.stationId ? "station" : "device");

  validateInteger(point.ioa, `${pointPath}.ioa`, { min: 1, max: 16777215 });
  validateEnum(source, `${pointPath}.source`, SUPPORTED_IEC104_POINT_SOURCES, { optional: true });
  if (source === "station") {
    validateString(point.station ?? point.stationId, `${pointPath}.station`);
  } else {
    validateString(point.device, `${pointPath}.device`);
  }
  validateString(point.measurement, `${pointPath}.measurement`);
  validateEnum(point.type, `${pointPath}.type`, SUPPORTED_IEC104_POINT_TYPES, { optional: true });
  validateBoolean(point.inverted, `${pointPath}.inverted`, { optional: true });
  validateString(point.name, `${pointPath}.name`, { optional: true });
  validateNumber(point.scale, `${pointPath}.scale`, { optional: true });
  validateNumber(point.offset, `${pointPath}.offset`, { optional: true });
}

function validateIec104EvnMapping(evnMapping, mappingPath) {
  if (evnMapping === undefined || evnMapping === null) return;

  if (typeof evnMapping !== "object" || Array.isArray(evnMapping)) {
    throw new Error(`Invalid gateway config. ${mappingPath} must be an object`);
  }

  validateString(evnMapping.stationId ?? evnMapping.station, `${mappingPath}.stationId`, { optional: true });

  for (const key of ["pOut", "pinvOut", "ainvD1", "qOut", "ua", "ub", "uc", "ia", "ib", "ic", "frequency", "powerFactor"]) {
    validateEvnSignal(evnMapping[key], `${mappingPath}.${key}`);
  }

  validateEvnInverterPoints(evnMapping.inverterPoints, `${mappingPath}.inverterPoints`);
}

function validateEvnSignal(signal, signalPath) {
  if (signal === undefined || signal === null) return;

  if (typeof signal !== "object" || Array.isArray(signal)) {
    throw new Error(`Invalid gateway config. ${signalPath} must be an object`);
  }

  validateBoolean(signal.enabled, `${signalPath}.enabled`, { optional: true });
  validateEnum(signal.source, `${signalPath}.source`, SUPPORTED_EVN_SIGNAL_SOURCES, { optional: true });
  validateString(signal.device, `${signalPath}.device`, { optional: true });
  validateStringArray(signal.devices, `${signalPath}.devices`, { optional: true });
  validateString(signal.register ?? signal.measurement, `${signalPath}.register`, { optional: true });
  validateEnum(signal.snapshotStrategy, `${signalPath}.snapshotStrategy`, SUPPORTED_EVN_SNAPSHOT_STRATEGIES, { optional: true });
  validateNumber(signal.scale, `${signalPath}.scale`, { optional: true });
  validateEvnOverrides(signal.overrides, `${signalPath}.overrides`);
}

function validateEvnInverterPoints(signal, signalPath) {
  if (signal === undefined || signal === null) return;

  if (typeof signal !== "object" || Array.isArray(signal)) {
    throw new Error(`Invalid gateway config. ${signalPath} must be an object`);
  }

  validateBoolean(signal.enabled, `${signalPath}.enabled`, { optional: true });
  validateStringArray(signal.devices, `${signalPath}.devices`, { optional: true });
  validateString(signal.powerRegister, `${signalPath}.powerRegister`, { optional: true });
  validateString(signal.energyRegister, `${signalPath}.energyRegister`, { optional: true });
  validateEnum(signal.snapshotStrategy, `${signalPath}.snapshotStrategy`, SUPPORTED_EVN_SNAPSHOT_STRATEGIES, { optional: true });
  validateNumber(signal.powerScale, `${signalPath}.powerScale`, { optional: true });
  validateNumber(signal.energyScale, `${signalPath}.energyScale`, { optional: true });
  validateEvnOverrides(signal.overrides, `${signalPath}.overrides`);
}

function validateEvnOverrides(overrides, overridesPath) {
  if (overrides === undefined || overrides === null) return;

  if (typeof overrides !== "object" || Array.isArray(overrides)) {
    throw new Error(`Invalid gateway config. ${overridesPath} must be an object`);
  }

  for (const [deviceName, override] of Object.entries(overrides)) {
    const path = `${overridesPath}.${deviceName}`;
    if (!override || typeof override !== "object" || Array.isArray(override)) {
      throw new Error(`Invalid gateway config. ${path} must be an object`);
    }
    validateString(override.register, `${path}.register`, { optional: true });
    validateString(override.powerRegister, `${path}.powerRegister`, { optional: true });
    validateString(override.energyRegister, `${path}.energyRegister`, { optional: true });
    validateNumber(override.scale, `${path}.scale`, { optional: true });
    validateNumber(override.powerScale, `${path}.powerScale`, { optional: true });
    validateNumber(override.energyScale, `${path}.energyScale`, { optional: true });
  }
}

function validateIec104Control(control, controlPath) {
  if (!control || typeof control !== "object" || Array.isArray(control)) {
    throw new Error(`Invalid gateway config. ${controlPath} must be an object`);
  }

  validateInteger(control.ioa, `${controlPath}.ioa`, { min: 1, max: 16777215 });
  validateEnum(control.type, `${controlPath}.type`, SUPPORTED_IEC104_CONTROL_TYPES);
  validateString(control.name, `${controlPath}.name`, { optional: true });
  validateString(control.device ?? control.deviceName, `${controlPath}.device`, { optional: true });
  validateString(control.station ?? control.stationId, `${controlPath}.station`, { optional: true });
  validateBoolean(control.selectBeforeExecute, `${controlPath}.selectBeforeExecute`, { optional: true });
  validateEnum(control.action, `${controlPath}.action`, SUPPORTED_INVERTER_CONTROL_ACTIONS, { optional: true });
  validateEnum(control.actionOn, `${controlPath}.actionOn`, SUPPORTED_INVERTER_CONTROL_ACTIONS, { optional: true });
  validateEnum(control.actionOff, `${controlPath}.actionOff`, SUPPORTED_INVERTER_CONTROL_ACTIONS, { optional: true });
  validateEnum(control.valueField, `${controlPath}.valueField`, SUPPORTED_IEC104_CONTROL_VALUE_FIELDS, { optional: true });
  validateInteger(control.durationSeconds, `${controlPath}.durationSeconds`, { min: 0, max: 86400, optional: true });
  validateInteger(control.durationMinutes, `${controlPath}.durationMinutes`, { min: 0, max: 1440, optional: true });
  validateInteger(control.durationHours, `${controlPath}.durationHours`, { min: 0, max: 24, optional: true });
  validateInteger(control.delayMs, `${controlPath}.delayMs`, { min: 0, max: 300000, optional: true });
  validateInteger(control.rebootDelayMs, `${controlPath}.rebootDelayMs`, { min: 0, max: 300000, optional: true });

  if ((control.action || control.actionOn || control.actionOff) && !(control.device || control.deviceName || control.station || control.stationId)) {
    throw new Error(`Invalid gateway config. ${controlPath}.device or ${controlPath}.station is required when an action is configured`);
  }
}

function validateStorage(storage) {
  const queue = storage.queue || {};
  const archive = storage.archive || {};

  validateInteger(queue.maxRecords ?? storage.queueMaxRecords, "storage.queue.maxRecords", { min: 1, optional: true });
  validateInteger(queue.maxBytes ?? storage.queueMaxBytes, "storage.queue.maxBytes", { min: 1024, optional: true });
  validateInteger(queue.retentionMs ?? storage.queueRetentionMs, "storage.queue.retentionMs", { min: 0, optional: true });
  validateInteger(queue.compactIntervalMs ?? storage.queueCompactIntervalMs, "storage.queue.compactIntervalMs", { min: 0, optional: true });
  validateBoolean(archive.enabled, "storage.archive.enabled", { optional: true });
  validateInteger(archive.intervalMs, "storage.archive.intervalMs", { min: 60000, optional: true });
  validateInteger(archive.retentionMs, "storage.archive.retentionMs", { min: 0, optional: true });
  validateInteger(archive.compactIntervalMs, "storage.archive.compactIntervalMs", { min: 0, optional: true });

  const corruptPath = queue.corruptPath ?? storage.queueCorruptPath;
  if (corruptPath !== undefined && !corruptPath) {
    throw new Error("Invalid gateway config. storage.queue.corruptPath must not be empty");
  }
  if (archive.path !== undefined && !archive.path) {
    throw new Error("Invalid gateway config. storage.archive.path must not be empty");
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
    float64: 4,
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

function normalizeRouteType(value) {
  const normalized = String(value || "unit_id").trim().toLowerCase().replace(/[\s-]+/g, "_");
  const aliases = {
    unitid: "unit_id",
    unit_id: "unit_id",
    slave_id: "unit_id",
    forwardingaddress: "forwarding_address",
    forwarding_address: "forwarding_address",
    logical_address: "unit_id",
    comm_address: "unit_id",
    systemmap: "system_map",
    system_map: "system_map",
  };

  return aliases[normalized] || normalized;
}

function normalizeStationControlMode(value) {
  const normalized = String(value || "fanout").trim().toLowerCase().replace(/[\s-]+/g, "_");
  const aliases = {
    logger: "logger_plant",
    logger_control: "logger_plant",
    plant: "logger_plant",
    plant_control: "logger_plant",
    child: "child_device",
    child_devices: "child_device",
  };

  return aliases[normalized] || normalized;
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

function validateString(value, field, { optional = false } = {}) {
  if (value === undefined || value === null || value === "") {
    if (optional) return;
    throw new Error(`Invalid gateway config. ${field} is required`);
  }

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Invalid gateway config. ${field} must be a non-empty string`);
  }
}
