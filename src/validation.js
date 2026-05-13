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

  for (const [name, port] of Object.entries(config.ports || {})) {
    if (!port.path) throw new Error(`Invalid gateway config. ports.${name}.path is required`);
    if (!port.baudRate) throw new Error(`Invalid gateway config. ports.${name}.baudRate is required`);
  }

  for (const device of config.devices) {
    const protocol = device.protocol ?? "modbus-rtu";

    if (!device.name) throw new Error("Invalid gateway config. device.name is required");
    if (!["modbus-rtu", "modbus-tcp"].includes(protocol)) {
      throw new Error(`Invalid gateway config. ${device.name}.protocol is unsupported`);
    }

    if (protocol === "modbus-tcp") {
      if (!device.host) throw new Error(`Invalid gateway config. ${device.name}.host is required`);
      if (!Number.isInteger(device.unitId ?? device.slaveId)) {
        throw new Error(`Invalid gateway config. ${device.name}.unitId must be an integer`);
      }
    } else {
      if (!config?.ports || Object.keys(config.ports).length === 0) {
        throw new Error("Invalid gateway config. ports is required for Modbus RTU devices");
      }
      if (!device.port) throw new Error(`Invalid gateway config. ${device.name}.port is required`);
      if (!config.ports[device.port]) {
        throw new Error(`Invalid gateway config. ${device.name}.port references unknown port ${device.port}`);
      }
      if (!Number.isInteger(device.slaveId)) {
        throw new Error(`Invalid gateway config. ${device.name}.slaveId must be an integer`);
      }
    }

    if (!Array.isArray(device.registers) || device.registers.length === 0) {
      throw new Error(`Invalid gateway config. ${device.name}.registers is required`);
    }
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
    storage: {
      queuePath: "/data/queue.jsonl",
    },
    ports: {},
    devices: [],
  };
}
