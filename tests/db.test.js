import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { openDatabase } from "../src/db.js";

test("persists device templates in server sqlite", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hardware-server-db-"));
  const store = openDatabase(path.join(dir, "hardware-server.sqlite"), "test-secret");

  try {
    const saved = store.saveDeviceTemplates([
      {
        label: "Generic - Test Meter",
        manufacturer: "Generic",
        model: "Test Meter",
        registers: [
          {
            name: "voltage_v",
            address: 10,
            scale: 0.1,
            unit: "V",
          },
        ],
      },
    ]);

    assert.equal(saved.length, 1);
    assert.equal(saved[0].id, "generic_test_meter");
    assert.equal(saved[0].registers[0].function, "holding");

    const persisted = store.listDeviceTemplates();
    assert.equal(persisted[0].label, "Generic - Test Meter");
    assert.deepEqual(persisted[0].registers[0], {
      name: "voltage_v",
      function: "holding",
      address: 10,
      length: 1,
      type: "uint16",
      scale: 0.1,
      unit: "V",
    });
  } finally {
    store.close();
  }
});

test("rejects duplicate server device template ids", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hardware-server-db-duplicate-"));
  const store = openDatabase(path.join(dir, "hardware-server.sqlite"), "test-secret");

  try {
    assert.throws(
      () => store.saveDeviceTemplates([
        { id: "meter", label: "Meter A" },
        { id: "meter", label: "Meter B" },
      ]),
      /Duplicate device template id 'meter'/,
    );
  } finally {
    store.close();
  }
});

test("ignores duplicate telemetry record ids for the same gateway", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hardware-server-telemetry-dedupe-"));
  const store = openDatabase(path.join(dir, "hardware-server.sqlite"), "test-secret");

  try {
    store.upsertGateway({
      id: "GW-1",
      name: "Gateway 1",
      token: "token",
    });

    const first = store.insertTelemetry("GW-1", [
      { id: "record-1", measurements: { power_kw: 1 } },
    ]);
    const retry = store.insertTelemetry("GW-1", [
      { id: "record-1", measurements: { power_kw: 1 } },
    ]);

    assert.deepEqual(first, {
      received: 1,
      inserted: 1,
      ignored: 0,
    });
    assert.deepEqual(retry, {
      received: 1,
      inserted: 0,
      ignored: 1,
    });

    const records = store.latestTelemetry("GW-1", 10);
    assert.equal(records.length, 1);
    assert.equal(records[0].recordId, "record-1");
  } finally {
    store.close();
  }
});

test("allows the same telemetry record id on different gateways", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hardware-server-telemetry-gateway-scope-"));
  const store = openDatabase(path.join(dir, "hardware-server.sqlite"), "test-secret");

  try {
    store.upsertGateway({ id: "GW-1", token: "token-1" });
    store.upsertGateway({ id: "GW-2", token: "token-2" });

    assert.equal(store.insertTelemetry("GW-1", [{ id: "record-1" }]).inserted, 1);
    assert.equal(store.insertTelemetry("GW-2", [{ id: "record-1" }]).inserted, 1);
    assert.equal(store.latestTelemetry("GW-1", 10).length, 1);
    assert.equal(store.latestTelemetry("GW-2", 10).length, 1);
  } finally {
    store.close();
  }
});
