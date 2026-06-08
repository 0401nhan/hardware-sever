import test from "node:test";
import assert from "node:assert/strict";

import { createDefaultGatewayConfig, validateGatewayConfig } from "../src/validation.js";

test("creates a valid default remote config for a gateway", () => {
  const config = createDefaultGatewayConfig("EB-ANHUNG-001", "https://server.electricbird.vn");

  assert.doesNotThrow(() => validateGatewayConfig(config, "EB-ANHUNG-001"));
  assert.equal(config.server.url, "https://server.electricbird.vn/api/telemetry");
  assert.equal(config.remoteConfig.url, "https://server.electricbird.vn/api/gateway");
});

test("rejects config for the wrong gateway id", () => {
  const config = createDefaultGatewayConfig("EB-OTHER-001", "https://server.electricbird.vn");

  assert.throws(
    () => validateGatewayConfig(config, "EB-ANHUNG-001"),
    /gateway.id must be EB-ANHUNG-001/,
  );
});

test("rejects invalid remote gateway queue limits", () => {
  const config = validRtuConfig();
  config.storage.queue.maxBytes = 1;

  assert.throws(
    () => validateGatewayConfig(config, "EB-ANHUNG-001"),
    /storage\.queue\.maxBytes must be between 1024/,
  );
});

test("rejects invalid remote gateway port settings", () => {
  const config = validRtuConfig();
  config.ports.rs485_1.parity = "bad";

  assert.throws(
    () => validateGatewayConfig(config, "EB-ANHUNG-001"),
    /ports\.rs485_1\.parity is unsupported/,
  );
});

test("accepts RTU auto-discovery and register control metadata", () => {
  const config = validRtuConfig();
  config.ports.rs485_1.autoDiscover = true;
  config.ports.rs485_1.pathCandidates = ["/host-dev/serial/by-id/*", "/host-dev/ttyUSB*"];
  config.devices[0].registers[0].access = "rw";
  config.devices[0].registers[0].poll = false;

  assert.doesNotThrow(() => validateGatewayConfig(config, "EB-ANHUNG-001"));
});

test("accepts IEC 60870-5-104 remote config mappings", () => {
  const config = validRtuConfig();
  config.iec104 = {
    enabled: true,
    mode: "client",
    remoteHost: "10.0.0.10",
    remotePort: 2404,
    host: "0.0.0.0",
    port: 2404,
    commonAddress: 1,
    originatorAddress: 0,
    staleAfterMs: 60000,
    maxClientConnections: 4,
    reconnectMs: 5000,
    keepAliveMs: 30000,
    spontaneous: true,
    simulator: {
      enabled: true,
      mode: "fallback",
      intervalMs: 1000,
    },
    points: [
      {
        ioa: 1001,
        device: "meter_01",
        measurement: "voltage_v",
        type: "float",
      },
      {
        ioa: 1002,
        device: "meter_01",
        measurement: "online",
        type: "single",
      },
    ],
    controls: [
      {
        ioa: 12,
        name: "setpoint_p_out_percent",
        type: "setpoint",
        device: "meter_01",
        action: "limit_power",
        valueField: "percent",
        durationSeconds: 86400,
      },
    ],
  };

  assert.doesNotThrow(() => validateGatewayConfig(config, "EB-ANHUNG-001"));

  config.iec104.points[0].measurement = "";
  assert.throws(
    () => validateGatewayConfig(config, "EB-ANHUNG-001"),
    /iec104\.points\[0\]\.measurement is required/,
  );

  config.iec104.points[0].measurement = "voltage_v";
  config.iec104.controls[0].valueField = "megawatts";
  assert.throws(
    () => validateGatewayConfig(config, "EB-ANHUNG-001"),
    /iec104\.controls\[0\]\.valueField is unsupported/,
  );

  config.iec104.controls[0].valueField = "percent";
  config.iec104.simulator.mode = "manual";
  assert.throws(
    () => validateGatewayConfig(config, "EB-ANHUNG-001"),
    /iec104\.simulator\.mode is unsupported/,
  );
});

test("accepts station model and station IEC104 mappings in remote config", () => {
  const config = validRtuConfig();
  config.stations = [
    {
      id: "station_1",
      name: "Station 1",
      capacityKw: 100,
      devices: ["meter_01"],
      evnProfile: {
        enabled: true,
        autoGenerateIoa: true,
        simulator: "fallback",
      },
    },
  ];
  config.devices[0].stationId = "station_1";
  config.devices[0].capacityKw = 100;
  config.iec104 = {
    enabled: true,
    mode: "server",
    host: "0.0.0.0",
    port: 2404,
    points: [
      {
        ioa: 1,
        source: "station",
        station: "station_1",
        measurement: "active_power_kw",
        type: "float",
      },
    ],
    controls: [
      {
        ioa: 12,
        name: "setpoint_p_out_percent",
        type: "setpoint",
        station: "station_1",
        action: "limit_power",
        valueField: "percent",
      },
    ],
  };

  assert.doesNotThrow(() => validateGatewayConfig(config, "EB-ANHUNG-001"));

  config.devices[0].stationId = "missing";
  assert.throws(
    () => validateGatewayConfig(config, "EB-ANHUNG-001"),
    /meter_01\.stationId references unknown station missing/,
  );
});

test("rejects invalid remote gateway polling settings", () => {
  const config = validRtuConfig();
  config.devices[0].pollIntervalMs = 100;

  assert.throws(
    () => validateGatewayConfig(config, "EB-ANHUNG-001"),
    /meter_01\.pollIntervalMs must be between 500/,
  );
});

test("rejects remote gateway registers without names", () => {
  const config = validRtuConfig();
  delete config.devices[0].registers[0].name;

  assert.throws(
    () => validateGatewayConfig(config, "EB-ANHUNG-001"),
    /meter_01\.registers\[0\]\.name is required/,
  );
});

test("rejects invalid remote gateway register type and scale", () => {
  const config = validRtuConfig();
  config.devices[0].registers[0].type = "decimal";

  assert.throws(
    () => validateGatewayConfig(config, "EB-ANHUNG-001"),
    /meter_01\.registers\[0\]\.type is unsupported/,
  );

  config.devices[0].registers[0].type = "uint16";
  config.devices[0].registers[0].scale = "0.1";

  assert.throws(
    () => validateGatewayConfig(config, "EB-ANHUNG-001"),
    /meter_01\.registers\[0\]\.scale must be a finite number/,
  );
});

test("rejects remote gateway register length that is too short for the type", () => {
  const config = validRtuConfig();
  config.devices[0].registers[0].type = "float32";
  config.devices[0].registers[0].length = 1;

  assert.throws(
    () => validateGatewayConfig(config, "EB-ANHUNG-001"),
    /meter_01\.registers\[0\]\.length must be >= 2 for float32/,
  );
});

test("accepts float64 registers used by shared meter templates", () => {
  const config = validRtuConfig();
  config.devices[0].registers[0].type = "float64";
  config.devices[0].registers[0].length = 4;

  assert.doesNotThrow(() => validateGatewayConfig(config, "EB-ANHUNG-001"));

  config.devices[0].registers[0].length = 2;
  assert.throws(
    () => validateGatewayConfig(config, "EB-ANHUNG-001"),
    /meter_01\.registers\[0\]\.length must be >= 4 for float64/,
  );
});

function validRtuConfig() {
  return {
    gateway: {
      id: "EB-ANHUNG-001",
      pollLoopDelayMs: 250,
    },
    server: {
      url: "https://server.electricbird.vn/api/telemetry",
      timeoutMs: 10000,
      batchSize: 100,
      uploadIntervalMs: 5000,
    },
    remoteConfig: {
      enabled: true,
      url: "https://server.electricbird.vn/api/gateway",
      checkIntervalMs: 30000,
      timeoutMs: 10000,
      statePath: "/data/remote-config-state.json",
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
    ports: {
      rs485_1: {
        path: "/dev/rs485-1",
        baudRate: 9600,
        parity: "none",
        dataBits: 8,
        stopBits: 1,
        timeoutMs: 1000,
      },
    },
    devices: [
      {
        name: "meter_01",
        protocol: "modbus-rtu",
        port: "rs485_1",
        slaveId: 1,
        pollIntervalMs: 5000,
        registers: [
          {
            name: "voltage_v",
            function: "holding",
            address: 0,
            length: 1,
            type: "uint16",
            scale: 0.1,
            unit: "V",
          },
        ],
      },
    ],
  };
}
