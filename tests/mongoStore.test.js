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

test("Mongo store creates telemetry TTL index and prunes old telemetry records", async () => {
  const now = Date.parse("2026-06-10T00:00:00.000Z");
  const db = new FakeDb({
    telemetry_records: [
      {
        _id: "old",
        gatewayId: "GW-MONGO",
        recordId: "old",
        createdAt: new Date(now - 2_000).toISOString(),
      },
      {
        _id: "fresh",
        gatewayId: "GW-MONGO",
        recordId: "fresh",
        createdAt: new Date(now).toISOString(),
      },
    ],
  });
  const store = new MongoHardwareStore({ db: () => db, async close() {} }, "test", "secret", {
    telemetryRetentionMs: 1_000,
    telemetryPruneIntervalMs: 0,
    now: () => now,
  });

  await store.init();

  const telemetry = db.collection("telemetry_records");
  const ttlIndex = telemetry.indexes.find((index) => index.options.name === "idx_telemetry_created_at_ttl");

  assert.deepEqual(telemetry.docs.map((doc) => doc._id), ["fresh"]);
  assert.deepEqual(ttlIndex.key, { createdAtDate: 1 });
  assert.equal(ttlIndex.options.expireAfterSeconds, 1);

  await store.insertTelemetry("GW-MONGO", [{ id: "new-record", measurements: { power_kw: 1 } }]);

  const inserted = telemetry.docs.find((doc) => doc._id === "GW-MONGO:new-record");
  assert.ok(inserted);
  assert.equal(inserted.createdAt, new Date(now).toISOString());
  assert.ok(inserted.createdAtDate instanceof Date);
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
    this.indexes = [];
  }

  async createIndex(key, options = {}) {
    this.indexes.push({
      key,
      options,
    });
    return options.name || Object.entries(key).map(([field, direction]) => `${field}_${direction}`).join("_");
  }

  async dropIndex(indexName) {
    const index = this.indexes.findIndex((item) => item.options.name === indexName);
    if (index < 0) {
      const error = new Error("index not found");
      error.code = 27;
      error.codeName = "IndexNotFound";
      throw error;
    }

    this.indexes.splice(index, 1);
  }

  async findOne(filter) {
    return this.docs.find((doc) => matches(doc, filter)) || null;
  }

  async insertMany(docs) {
    this.docs.push(...docs.map((doc) => ({ ...doc })));
    return {
      insertedCount: docs.length,
    };
  }

  async updateOne(filter, update, options = {}) {
    let doc = this.docs.find((item) => matches(item, filter));

    if (!doc && options.upsert) {
      doc = { ...filter };
      Object.assign(doc, update.$setOnInsert || {});
      this.docs.push(doc);
    }

    if (!doc) return { matchedCount: 0, modifiedCount: 0, upsertedCount: 0 };

    Object.assign(doc, update.$set || {});
    return { matchedCount: 1, modifiedCount: 1, upsertedCount: 0 };
  }

  async deleteMany(filter) {
    const before = this.docs.length;
    this.docs = this.docs.filter((doc) => !matches(doc, filter));

    return {
      deletedCount: before - this.docs.length,
    };
  }

  find(filter = {}) {
    return {
      sort: (sortSpec = {}) => ({
        limit: (limit) => ({
          toArray: async () => sortDocs(this.docs.filter((doc) => matches(doc, filter)), sortSpec)
            .slice(0, limit)
            .map((doc) => ({ ...doc })),
        }),
        toArray: async () => sortDocs(this.docs.filter((doc) => matches(doc, filter)), sortSpec)
          .map((doc) => ({ ...doc })),
      }),
    };
  }
}

function matches(doc, filter) {
  return Object.entries(filter).every(([key, value]) => {
    if (value && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
      if (Object.prototype.hasOwnProperty.call(value, "$lt")) {
        return doc[key] < value.$lt;
      }
      if (Object.prototype.hasOwnProperty.call(value, "$nin")) {
        return !value.$nin.includes(doc[key]);
      }
      if (Object.prototype.hasOwnProperty.call(value, "$type")) {
        return true;
      }
    }

    return doc[key] === value;
  });
}

function sortDocs(docs, sortSpec) {
  const entries = Object.entries(sortSpec);
  if (entries.length === 0) {
    return docs.map((doc) => ({ ...doc })).sort((left, right) => {
      const order = (left.sortOrder ?? 0) - (right.sortOrder ?? 0);
      return order || String(left.id || "").localeCompare(String(right.id || ""));
    });
  }

  return docs.map((doc) => ({ ...doc })).sort((left, right) => {
    for (const [field, direction] of entries) {
      const leftValue = left[field] ?? "";
      const rightValue = right[field] ?? "";
      if (leftValue === rightValue) continue;
      return leftValue > rightValue ? direction : -direction;
    }

    return 0;
  });
}
