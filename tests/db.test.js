import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { openDatabase } from "../src/db.js";
import { readDeviceTemplateSeed } from "../src/deviceTemplates.js";

test("bundled Huawei seed includes writable control registers", () => {
  const { templates } = readDeviceTemplateSeed("config/device-templates.yml");
  const inverter = templates.find((template) => template.id === "huawei_sun2000");
  const battery = templates.find((template) => template.id === "huawei_luna2000_battery");

  assert.ok(inverter);
  assert.ok(battery);
  assert.equal(inverter.registers.length, 128);
  assert.equal(battery.registers.length, 90);
  assert.deepEqual(inverter.registers.filter((register) => (register.access || "ro") !== "ro").map((register) => register.address), [
    40000,
    40037,
    40038,
    40120,
    40122,
    40123,
    40125,
    40126,
    40129,
    40133,
    40154,
    40175,
    40196,
    40198,
    40200,
    40201,
    42000,
    42015,
    42017,
    42019,
    42405,
    43006,
    45086,
    47415,
    47416,
    47418,
    47590,
    47604,
    47605,
  ]);
  assert.ok(battery.registers.some((register) => register.name === "energy_storage_forcible_charge_power_kw"));
  assert.ok(battery.registers.some((register) => register.name === "energy_storage_tou_charge_discharge_periods_raw"));
  assert.ok(battery.registers.filter((register) => (register.access || "ro") !== "ro").every((register) => register.poll === false));
});

test("persists device templates in server sqlite", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hardware-server-db-"));
  const store = await openDatabase(path.join(dir, "hardware-server.sqlite"), "test-secret");

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
          {
            name: "active_power_limit",
            access: "rw",
            poll: false,
            address: 40016,
            type: "uint16",
            scale: 0.1,
            unit: "%",
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
    assert.deepEqual(persisted[0].registers[1], {
      name: "active_power_limit",
      function: "holding",
      access: "rw",
      poll: false,
      address: 40016,
      length: 1,
      type: "uint16",
      scale: 0.1,
      unit: "%",
    });
  } finally {
    store.close();
  }
});

test("rejects duplicate server device template ids", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hardware-server-db-duplicate-"));
  const store = await openDatabase(path.join(dir, "hardware-server.sqlite"), "test-secret");

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

test("imports new seed registers into an initialized server template library", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hardware-server-db-seed-merge-"));
  const store = await openDatabase(path.join(dir, "hardware-server.sqlite"), "test-secret");

  try {
    store.seedDeviceTemplates([
      {
        id: "huawei_sun2000",
        label: "Huawei SUN2000",
        registers: [
          { name: "model_id", address: 30000 },
        ],
      },
    ]);

    const merged = store.seedDeviceTemplates([
      {
        id: "huawei_sun2000",
        label: "Huawei SUN2000",
        registers: [
          { name: "model_id", address: 30000 },
          {
            name: "active_power_control_mode",
            access: "rw",
            poll: false,
            address: 40000,
          },
        ],
      },
    ]);

    assert.equal(merged[0].registers.length, 2);
    assert.deepEqual(merged[0].registers[1], {
      name: "active_power_control_mode",
      function: "holding",
      access: "rw",
      poll: false,
      address: 40000,
      length: 1,
      type: "uint16",
      scale: 1,
      unit: "",
    });
  } finally {
    store.close();
  }
});

test("ignores duplicate telemetry record ids for the same gateway", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hardware-server-telemetry-dedupe-"));
  const store = await openDatabase(path.join(dir, "hardware-server.sqlite"), "test-secret");

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

test("allows the same telemetry record id on different gateways", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hardware-server-telemetry-gateway-scope-"));
  const store = await openDatabase(path.join(dir, "hardware-server.sqlite"), "test-secret");

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

test("reports an online gateway as offline after heartbeat timeout", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hardware-server-gateway-offline-"));
  const now = new Date("2026-05-14T10:00:00.000Z").getTime();
  const store = await openDatabase(path.join(dir, "hardware-server.sqlite"), "test-secret", {
    offlineAfterMs: 90_000,
    now: () => now,
  });

  try {
    store.upsertGateway({ id: "GW-OFFLINE", token: "token" });
    store.db.prepare(`
      UPDATE gateways
      SET status = 'online',
          last_seen_at = ?
      WHERE id = ?
    `).run("2026-05-14T09:59:00.000Z", "GW-OFFLINE");

    assert.equal(store.getGateway("GW-OFFLINE").status, "online");

    store.db.prepare(`
      UPDATE gateways
      SET status = 'online',
          last_seen_at = ?
      WHERE id = ?
    `).run("2026-05-14T09:58:29.000Z", "GW-OFFLINE");

    assert.equal(store.getGateway("GW-OFFLINE").status, "offline");
    assert.equal(store.listGateways()[0].status, "offline");
  } finally {
    store.close();
  }
});
