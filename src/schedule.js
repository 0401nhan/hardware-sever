const DEFAULT_TIMEZONE = "Asia/Bangkok";
const DEFAULT_OFFSET_MINUTES = 7 * 60;
const MAX_RUNS = 10000;

export function normalizeCommandSchedule(input, { now = new Date() } = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;

  const mode = normalizeMode(input.mode ?? input.scheduleMode);
  if (mode === "now") return null;

  const timezone = stringField(input.timezone) || DEFAULT_TIMEZONE;
  const schedule = { mode, timezone };

  if (input.maxRuns !== undefined && input.maxRuns !== null && input.maxRuns !== "") {
    const maxRuns = integerField(input.maxRuns, "schedule.maxRuns");
    if (maxRuns < 1 || maxRuns > MAX_RUNS) {
      throw httpError(400, `schedule.maxRuns must be between 1 and ${MAX_RUNS}`);
    }
    schedule.maxRuns = maxRuns;
  }

  if (input.endAt) {
    schedule.endAt = isoDateField(input.endAt, "schedule.endAt");
  }

  if (mode === "once") {
    schedule.scheduledAt = isoDateField(input.scheduledAt ?? input.at, "schedule.scheduledAt");
  } else {
    schedule.timeOfDay = normalizeTimeOfDay(input.timeOfDay ?? input.time);
    if (mode === "weekly") {
      schedule.daysOfWeek = normalizeDaysOfWeek(input.daysOfWeek);
    }
  }

  const nextRunAt = nextScheduledRun(schedule, { from: now, runIndex: 0 });
  if (!nextRunAt) {
    throw httpError(400, "schedule does not have a next run within its limits");
  }

  return {
    schedule,
    nextRunAt,
  };
}

export function nextScheduledRun(schedule, { from = new Date(), runIndex = 0 } = {}) {
  if (!schedule || typeof schedule !== "object") return null;
  if (Number.isInteger(schedule.maxRuns) && runIndex >= schedule.maxRuns) return null;

  let nextRunAt = null;

  if (schedule.mode === "once") {
    if (runIndex > 0) return null;
    nextRunAt = parseDate(schedule.scheduledAt);
  } else if (schedule.mode === "daily") {
    nextRunAt = nextDailyRun(schedule, from);
  } else if (schedule.mode === "weekly") {
    nextRunAt = nextWeeklyRun(schedule, from);
  }

  if (!nextRunAt) return null;

  const endAt = schedule.endAt ? parseDate(schedule.endAt) : null;
  if (endAt && nextRunAt.getTime() > endAt.getTime()) return null;

  return nextRunAt.toISOString();
}

export function isRecurringSchedule(schedule) {
  return schedule?.mode === "daily" || schedule?.mode === "weekly";
}

export function commandStatusForNextRun(nextRunAt, now = new Date()) {
  if (!nextRunAt) return "queued";
  const timestamp = Date.parse(nextRunAt);
  return Number.isFinite(timestamp) && timestamp > now.getTime() ? "scheduled" : "queued";
}

function nextDailyRun(schedule, from) {
  const offsetMinutes = timezoneOffsetMinutes(schedule.timezone);
  const parts = localParts(from, offsetMinutes);
  const time = parseTimeOfDay(schedule.timeOfDay);
  let candidate = localToUtcDate(parts.year, parts.month, parts.day, time.hour, time.minute, offsetMinutes);

  if (candidate.getTime() <= from.getTime()) {
    candidate = addLocalDays(candidate, 1, offsetMinutes, time);
  }

  return candidate;
}

function nextWeeklyRun(schedule, from) {
  const offsetMinutes = timezoneOffsetMinutes(schedule.timezone);
  const parts = localParts(from, offsetMinutes);
  const time = parseTimeOfDay(schedule.timeOfDay);
  const daysOfWeek = new Set(schedule.daysOfWeek || []);

  for (let offsetDays = 0; offsetDays <= 7; offsetDays += 1) {
    const base = localToUtcDate(parts.year, parts.month, parts.day + offsetDays, time.hour, time.minute, offsetMinutes);
    const local = localParts(base, offsetMinutes);
    const weekday = isoWeekday(local.year, local.month, local.day);

    if (daysOfWeek.has(weekday) && base.getTime() > from.getTime()) {
      return base;
    }
  }

  return null;
}

function addLocalDays(date, days, offsetMinutes, time) {
  const parts = localParts(date, offsetMinutes);
  return localToUtcDate(parts.year, parts.month, parts.day + days, time.hour, time.minute, offsetMinutes);
}

function localParts(date, offsetMinutes) {
  const shifted = new Date(date.getTime() + offsetMinutes * 60_000);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

function localToUtcDate(year, month, day, hour, minute, offsetMinutes) {
  return new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0) - offsetMinutes * 60_000);
}

function isoWeekday(year, month, day) {
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return weekday === 0 ? 7 : weekday;
}

function timezoneOffsetMinutes(timezone) {
  const normalized = String(timezone || "").trim().toLowerCase();
  if (normalized === "utc" || normalized === "z") return 0;
  if (normalized === "asia/bangkok" || normalized === "asia/ho_chi_minh") return DEFAULT_OFFSET_MINUTES;

  const match = normalized.match(/^utc([+-])(\d{1,2})(?::?(\d{2}))?$/);
  if (!match) return DEFAULT_OFFSET_MINUTES;

  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number(match[2]);
  const minutes = Number(match[3] || 0);
  if (!Number.isInteger(hours) || hours > 14 || !Number.isInteger(minutes) || minutes > 59) return DEFAULT_OFFSET_MINUTES;
  return sign * (hours * 60 + minutes);
}

function normalizeMode(value) {
  const normalized = stringField(value).toLowerCase().replace(/[\s-]+/g, "_");
  const aliases = {
    "": "now",
    now: "now",
    immediate: "now",
    run_now: "now",
    once: "once",
    one_time: "once",
    one_time_only: "once",
    daily: "daily",
    every_day: "daily",
    weekly: "weekly",
    every_week: "weekly",
  };
  const mode = aliases[normalized] || normalized;
  if (!["now", "once", "daily", "weekly"].includes(mode)) {
    throw httpError(400, `Unsupported schedule mode '${value}'`);
  }
  return mode;
}

function normalizeTimeOfDay(value) {
  const text = stringField(value);
  if (!/^\d{2}:\d{2}$/.test(text)) {
    throw httpError(400, "schedule.timeOfDay must use HH:mm");
  }

  const { hour, minute } = parseTimeOfDay(text);
  if (hour > 23 || minute > 59) {
    throw httpError(400, "schedule.timeOfDay must be a valid HH:mm time");
  }

  return text;
}

function parseTimeOfDay(value) {
  const [hour, minute] = String(value).split(":").map(Number);
  return { hour, minute };
}

function normalizeDaysOfWeek(value) {
  if (!Array.isArray(value) || value.length === 0) {
    throw httpError(400, "schedule.daysOfWeek is required for weekly schedules");
  }

  const days = [...new Set(value.map((item) => integerField(item, "schedule.daysOfWeek")))].sort((a, b) => a - b);
  if (days.some((day) => day < 1 || day > 7)) {
    throw httpError(400, "schedule.daysOfWeek values must be between 1 and 7");
  }

  return days;
}

function isoDateField(value, field) {
  const date = parseDate(value);
  if (!date) throw httpError(400, `${field} must be a valid date`);
  return date.toISOString();
}

function parseDate(value) {
  const timestamp = Date.parse(String(value || ""));
  return Number.isFinite(timestamp) ? new Date(timestamp) : null;
}

function integerField(value, field) {
  const number = Number(value);
  if (!Number.isInteger(number)) throw httpError(400, `${field} must be an integer`);
  return number;
}

function stringField(value) {
  return typeof value === "string" ? value.trim() : "";
}

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}
