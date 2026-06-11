import assert from "node:assert/strict";
import test from "node:test";

import { nextScheduledRun, normalizeCommandSchedule } from "../src/schedule.js";

test("normalizes one-time schedules", () => {
  const now = new Date("2026-06-11T01:00:00.000Z");
  const scheduledAt = "2026-06-11T02:00:00.000Z";

  assert.deepEqual(normalizeCommandSchedule({
    mode: "once",
    scheduledAt,
  }, { now }), {
    schedule: {
      mode: "once",
      timezone: "Asia/Bangkok",
      scheduledAt,
    },
    nextRunAt: scheduledAt,
  });
});

test("computes daily schedule in Asia/Bangkok", () => {
  const schedule = {
    mode: "daily",
    timezone: "Asia/Bangkok",
    timeOfDay: "08:30",
  };

  assert.equal(
    nextScheduledRun(schedule, { from: new Date("2026-06-11T00:00:00.000Z"), runIndex: 0 }),
    "2026-06-11T01:30:00.000Z",
  );
  assert.equal(
    nextScheduledRun(schedule, { from: new Date("2026-06-11T02:00:00.000Z"), runIndex: 0 }),
    "2026-06-12T01:30:00.000Z",
  );
});

test("computes weekly schedule and respects maxRuns", () => {
  const schedule = {
    mode: "weekly",
    timezone: "Asia/Bangkok",
    timeOfDay: "09:00",
    daysOfWeek: [1, 3],
    maxRuns: 2,
  };

  assert.equal(
    nextScheduledRun(schedule, { from: new Date("2026-06-11T00:00:00.000Z"), runIndex: 0 }),
    "2026-06-15T02:00:00.000Z",
  );
  assert.equal(
    nextScheduledRun(schedule, { from: new Date("2026-06-15T03:00:00.000Z"), runIndex: 1 }),
    "2026-06-17T02:00:00.000Z",
  );
  assert.equal(
    nextScheduledRun(schedule, { from: new Date("2026-06-16T03:00:00.000Z"), runIndex: 2 }),
    null,
  );
});
