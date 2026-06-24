const GATEWAY_SESSION_COOKIE = "rs485_admin_session";

export function gatewayTailscaleBaseUrl(gateway) {
  const remote = gateway?.remoteAccess || {};
  if (!remote.enabled) {
    throw gatewayClientError(409, "Tailscale remote access is not enabled for this gateway");
  }

  const endpoint = String(remote.ip || remote.host || "").trim();
  if (!endpoint) {
    throw gatewayClientError(409, "Tailscale host or IP is required for this gateway");
  }

  const port = positivePort(remote.uiPort || 3000);
  const hasScheme = /^[a-z][a-z\d+.-]*:\/\//i.test(endpoint);
  let url;

  try {
    url = new URL(hasScheme ? endpoint : `http://${hostForUrl(endpoint)}`);
  } catch {
    throw gatewayClientError(400, "Tailscale host or IP is not a valid HTTP endpoint");
  }

  if (!url.port && port) url.port = String(port);
  url.username = "";
  url.password = "";
  url.pathname = "/";
  url.search = "";
  url.hash = "";

  return url.toString().replace(/\/$/, "");
}

export async function getGatewayPublicJson({ gateway, path, timeoutMs }) {
  const baseUrl = gatewayTailscaleBaseUrl(gateway);
  const payload = await requestGatewayJson({
    method: "GET",
    baseUrl,
    path,
    timeoutMs,
  });

  return {
    baseUrl,
    payload,
  };
}

export async function postGatewayAdminJson({ gateway, path, body, credentials, timeoutMs }) {
  const baseUrl = gatewayTailscaleBaseUrl(gateway);
  const cookie = await loginGatewayAdmin({ baseUrl, credentials, timeoutMs });
  const payload = await requestGatewayJson({
    method: "POST",
    baseUrl,
    path,
    cookie,
    body,
    timeoutMs,
  });

  return {
    baseUrl,
    payload,
  };
}

async function loginGatewayAdmin({ baseUrl, credentials, timeoutMs }) {
  if (!credentials?.username || !credentials?.password) {
    throw gatewayClientError(500, "Gateway admin credentials are not configured");
  }

  const response = await fetchWithTimeout(joinUrl(baseUrl, "/api/login"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: credentials.username,
      password: credentials.password,
    }),
  }, timeoutMs);
  const payload = await readResponsePayload(response);

  if (!response.ok || payload?.ok === false) {
    throw gatewayClientError(502, `Gateway login failed: ${payloadMessage(payload) || `HTTP ${response.status}`}`);
  }

  const cookie = sessionCookieFromHeaders(response.headers);
  if (!cookie) {
    throw gatewayClientError(502, "Gateway login did not return an admin session cookie");
  }

  return cookie;
}

async function requestGatewayJson({ method, baseUrl, path, cookie, body, timeoutMs }) {
  const response = await fetchWithTimeout(joinUrl(baseUrl, path), {
    method,
    headers: {
      Accept: "application/json",
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  }, timeoutMs);
  const payload = await readResponsePayload(response);

  if (!response.ok || payload?.ok === false) {
    const statusCode = response.status >= 400 && response.status < 500 ? response.status : 502;
    throw gatewayClientError(statusCode, payloadMessage(payload) || `Gateway request failed with HTTP ${response.status}`);
  }

  return payload;
}

async function fetchWithTimeout(url, options, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (error) {
    const statusCode = error?.name === "AbortError" ? 504 : 502;
    throw gatewayClientError(statusCode, `Cannot reach Tailscale gateway at ${url}: ${error.message}`);
  } finally {
    clearTimeout(timeout);
  }
}

async function readResponsePayload(response) {
  const text = await response.text();
  if (!text) return null;

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(text);
    } catch {
      return { text };
    }
  }

  try {
    return JSON.parse(text);
  } catch {
    return { text };
  }
}

function sessionCookieFromHeaders(headers) {
  const setCookieHeaders = typeof headers.getSetCookie === "function"
    ? headers.getSetCookie()
    : [headers.get("set-cookie")].filter(Boolean);
  const session = setCookieHeaders.find((cookie) => cookie.toLowerCase().startsWith(`${GATEWAY_SESSION_COOKIE}=`))
    || setCookieHeaders[0]
    || "";

  return session.split(";")[0] || "";
}

function payloadMessage(payload) {
  if (!payload) return "";
  if (typeof payload === "string") return payload;
  return String(payload.error || payload.message || payload.text || "").trim();
}

function joinUrl(baseUrl, requestPath) {
  return `${baseUrl.replace(/\/+$/, "")}/${String(requestPath || "").replace(/^\/+/, "")}`;
}

function hostForUrl(endpoint) {
  if (endpoint.startsWith("[") || !endpoint.includes(":")) return endpoint;
  if (/^[^:/?#]+:\d+$/.test(endpoint)) return endpoint;
  return `[${endpoint}]`;
}

function positivePort(value) {
  const port = Number.parseInt(String(value || ""), 10);
  return Number.isInteger(port) && port > 0 && port <= 65535 ? port : 3000;
}

function gatewayClientError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}
