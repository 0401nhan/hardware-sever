import assert from "node:assert/strict";
import test from "node:test";

import { nextScheduledRun, normalizeCommandSchedule, scheduledWindowEndRun } from "../src/schedule.js";

test("normalizes one-time schedules", () => {
  const now = new Date("2026-06-11T01:00:00.000Z");
  const scheduledAt = "2026-06-11T02:00:00.000Z";
  const scheduledUntil = "2026-06-11T04:00:00.000Z";

  assert.deepEqual(normalizeCommandSchedule({
    mode: "once",
    scheduledAt,
    scheduledUntil,
  }, { now }), {
    schedule: {
      mode: "once",
      timezone: "Asia/Bangkok",
      scheduledAt,
      scheduledUntil,
    },
    nextRunAt: scheduledAt,
  });
});

test("computes daily schedule in Asia/Bangkok", () => {
  const schedule = {
    mode: "daily",
    timezone: "Asia/Bangkok",
    timeOfDay: "08:30",
    endTimeOfDay: "17:00",
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

test("normalizes recurring schedule end time metadata", () => {
  const now = new Date("2026-06-11T00:00:00.000Z");

  assert.deepEqual(normalizeCommandSchedule({
    mode: "weekly",
    timezone: "Asia/Bangkok",
    timeOfDay: "08:00",
    endTimeOfDay: "16:30",
    daysOfWeek: [1, 5],
  }, { now }).schedule, {
    mode: "weekly",
    timezone: "Asia/Bangkok",
    timeOfDay: "08:00",
    endTimeOfDay: "16:30",
    daysOfWeek: [1, 5],
  });
});

test("computes one-time and recurring schedule window end", () => {
  assert.equal(
    scheduledWindowEndRun({
      mode: "once",
      timezone: "Asia/Bangkok",
      scheduledAt: "2026-06-11T01:00:00.000Z",
      scheduledUntil: "2026-06-11T03:00:00.000Z",
    }, "2026-06-11T01:00:00.000Z"),
    "2026-06-11T03:00:00.000Z",
  );

  assert.equal(
    scheduledWindowEndRun({
      mode: "daily",
      timezone: "Asia/Bangkok",
      timeOfDay: "08:00",
      endTimeOfDay: "16:30",
    }, "2026-06-11T01:00:00.000Z"),
    "2026-06-11T09:30:00.000Z",
  );

  assert.equal(
    scheduledWindowEndRun({
      mode: "daily",
      timezone: "Asia/Bangkok",
      timeOfDay: "22:00",
      endTimeOfDay: "02:00",
    }, "2026-06-11T15:00:00.000Z"),
    "2026-06-11T19:00:00.000Z",
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
