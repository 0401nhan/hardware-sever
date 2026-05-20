import test from "node:test";
import assert from "node:assert/strict";

import { MongoHardwareStore } from "../src/mongoStore.js";

test("Mongo store allows empty bootstrap seed without deleting existing templates", async () => {
  const db = new FakeDb({
    device_templates: [
      {
        _id: "existing_meter",
        id: "existing_meter",
        label: "Existing Meter",
        manufacturer: "Existing",
        model: "Meter",
        type: "meter",
        protocol: "modbus-rtu",
        pollIntervalMs: 5000,
        notes: "",
        sortOrder: 0,
        registers: [{ name: "voltage", address: 0 }],
      },
    ],
  });
  const store = new MongoHardwareStore({ db: () => db, async close() {} }, "test", "secret");

  const templates = await store.seedDeviceTemplates([]);

  assert.equal(templates.length, 1);
  assert.equal(templates[0].id, "existing_meter");
  assert.equal(await db.collection("template_library_metadata").findOne({ _id: "device_templates_initialized" }).then((row) => row.value), "1");
  assert.equal(db.collection("device_templates").docs.length, 1);
});

class FakeDb {
  constructor(seed = {}) {
    this.collections = new Map(Object.entries(seed).map(([name, docs]) => [name, new FakeCollection(docs)]));
  }

  collection(name) {
    if (!this.collections.has(name)) {
      this.collections.set(name, new FakeCollection([]));
    }
    return this.collections.get(name);
  }
}

class FakeCollection {
  constructor(docs) {
    this.docs = docs.map((doc) => ({ ...doc }));
  }

  async findOne(filter) {
    return this.docs.find((doc) => matches(doc, filter)) || null;
  }

  async updateOne(filter, update, options = {}) {
    let doc = this.docs.find((item) => matches(item, filter));

    if (!doc && options.upsert) {
      doc = { ...filter };
      this.docs.push(doc);
    }

    if (!doc) return { matchedCount: 0, modifiedCount: 0, upsertedCount: 0 };

    Object.assign(doc, update.$set || {});
    return { matchedCount: 1, modifiedCount: 1, upsertedCount: 0 };
  }

  find() {
    return {
      sort: () => ({
        toArray: async () => this.docs.map((doc) => ({ ...doc })).sort((left, right) => {
          const order = (left.sortOrder ?? 0) - (right.sortOrder ?? 0);
          return order || String(left.id || "").localeCompare(String(right.id || ""));
        }),
      }),
    };
  }
}

function matches(doc, filter) {
  return Object.entries(filter).every(([key, value]) => doc[key] === value);
}
