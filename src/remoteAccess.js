const DEFAULT_REMOTE_ACCESS = Object.freeze({
  enabled: false,
  method: "tailscale",
  host: "",
  ip: "",
  uiPort: 3000,
  sshPort: 22,
  tag: "tag:gateway",
});

const BODY_REMOTE_ACCESS_FIELDS = [
  "remoteAccess",
  "tailscaleHost",
  "tailscaleIp",
  "tailscaleUiPort",
  "tailscaleSshPort",
  "tailscaleTag",
  "remoteUiPort",
  "sshPort",
];

export function gatewayRemoteAccessFromBody(body = {}) {
  if (!body || typeof body !== "object") return undefined;
  if (!BODY_REMOTE_ACCESS_FIELDS.some((field) => Object.prototype.hasOwnProperty.call(body, field))) {
    return undefined;
  }

  return normalizeRemoteAccess(body.remoteAccess ?? {
    enabled: body.remoteAccessEnabled ?? body.tailscaleEnabled,
    method: body.remoteAccessMethod ?? "tailscale",
    host: body.tailscaleHost,
    ip: body.tailscaleIp,
    uiPort: body.tailscaleUiPort ?? body.remoteUiPort,
    sshPort: body.tailscaleSshPort ?? body.sshPort,
    tag: body.tailscaleTag,
  });
}

export function normalizeRemoteAccess(input = {}) {
  const value = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const method = stringField(value.method || "tailscale").toLowerCase();
  if (method && method !== "tailscale") {
    throw remoteAccessError("remoteAccess.method must be tailscale");
  }

  const host = stringField(value.host ?? value.tailscaleHost);
  const ip = stringField(value.ip ?? value.tailscaleIp);
  const explicitEnabled = value.enabled ?? value.tailscaleEnabled;
  const enabled = explicitEnabled === undefined
    ? Boolean(host || ip)
    : booleanField(explicitEnabled, "remoteAccess.enabled");

  if (enabled && !host && !ip) {
    throw remoteAccessError("remoteAccess.host or remoteAccess.ip is required when remote access is enabled");
  }

  return {
    enabled,
    method: "tailscale",
    host,
    ip,
    uiPort: integerField(value.uiPort ?? value.remoteUiPort ?? value.tailscaleUiPort, "remoteAccess.uiPort", {
      fallback: DEFAULT_REMOTE_ACCESS.uiPort,
      min: 1,
      max: 65535,
    }),
    sshPort: integerField(value.sshPort ?? value.tailscaleSshPort, "remoteAccess.sshPort", {
      fallback: DEFAULT_REMOTE_ACCESS.sshPort,
      min: 1,
      max: 65535,
    }),
    tag: stringField(value.tag ?? value.tailscaleTag) || DEFAULT_REMOTE_ACCESS.tag,
  };
}

export function defaultRemoteAccess() {
  return { ...DEFAULT_REMOTE_ACCESS };
}

function stringField(value) {
  return typeof value === "string" ? value.trim() : "";
}

function booleanField(value, field) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on", "enabled"].includes(normalized)) return true;
    if (["false", "0", "no", "off", "disabled", ""].includes(normalized)) return false;
  }
  throw remoteAccessError(`${field} must be a boolean`);
}

function integerField(value, field, { fallback, min, max }) {
  if (value === undefined || value === null || value === "") return fallback;
  const number = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  if (!Number.isInteger(number)) {
    throw remoteAccessError(`${field} must be an integer`);
  }
  if (number < min || number > max) {
    throw remoteAccessError(`${field} must be between ${min} and ${max}`);
  }
  return number;
}

function remoteAccessError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}
