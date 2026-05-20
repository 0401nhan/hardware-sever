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
