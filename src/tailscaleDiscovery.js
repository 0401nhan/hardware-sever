import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const DEFAULT_TAG = "tag:gateway";

export async function readTailscaleStatusJson({
  cliPath = "",
  statusJson = "",
  timeoutMs = 5000,
} = {}) {
  if (statusJson) return JSON.parse(statusJson);

  const candidates = tailscaleCliCandidates(cliPath);
  const errors = [];

  for (const candidate of candidates) {
    try {
      const { stdout } = await execFileAsync(candidate, ["status", "--json"], {
        timeout: timeoutMs,
        windowsHide: true,
        maxBuffer: 1024 * 1024,
      });
      return JSON.parse(stdout);
    } catch (error) {
      errors.push(`${candidate}: ${error.message}`);
    }
  }

  throw new Error(`Cannot read Tailscale status: ${errors.join("; ")}`);
}

export async function syncTailscaleGateways({
  store,
  status,
  readStatus,
  includeOffline = false,
  allowedOs = ["linux"],
  uiPort = 80,
  sshPort = 22,
  tag = DEFAULT_TAG,
} = {}) {
  if (!store) throw new Error("store is required");

  const tailscaleStatus = status || await readStatus();
  const peers = tailscaleGatewayPeers(tailscaleStatus, { includeOffline, allowedOs });
  const existingGateways = await store.listGateways();
  const synced = [];

  for (const peer of peers) {
    const existing = findExistingGateway(existingGateways, peer);
    const id = existing?.id || gatewayIdFromPeer(peer);
    if (!id) continue;

    const remoteAccess = {
      enabled: true,
      method: "tailscale",
      host: peer.host,
      ip: peer.ip,
      uiPort,
      sshPort,
      tag,
    };

    let gateway = await store.upsertGateway({
      id,
      name: existing?.name || peer.name || id,
      site: existing?.site || peer.site || "Tailscale",
      remoteAccess,
    });

    if (peer.online && typeof store.markOnline === "function") {
      gateway = await store.markOnline(id, "tailscale") || gateway;
    }

    synced.push(gateway);
  }

  return {
    ok: true,
    synced: synced.length,
    gateways: synced,
  };
}

export function tailscaleGatewayPeers(status, { includeOffline = false, allowedOs = ["linux"] } = {}) {
  const peers = Object.values(status?.Peer || {});
  const allowed = new Set((allowedOs || []).map((item) => String(item).trim().toLowerCase()).filter(Boolean));

  return peers
    .map((peer) => normalizePeer(peer))
    .filter((peer) => peer.ip)
    .filter((peer) => includeOffline || peer.online)
    .filter((peer) => allowed.size === 0 || allowed.has(peer.os.toLowerCase()));
}

function normalizePeer(peer = {}) {
  const dnsName = String(peer.DNSName || "").replace(/\.$/, "");
  const hostName = String(peer.HostName || peer.Hostname || "").trim();
  const name = hostName || dnsName.split(".")[0] || String(peer.ID || "").trim();
  const ip = firstIpv4(peer.TailscaleIPs || []);

  return {
    id: String(peer.ID || "").trim(),
    name,
    site: name,
    host: dnsName || hostName,
    ip,
    os: String(peer.OS || "").trim(),
    online: peer.Online !== false,
  };
}

function findExistingGateway(gateways, peer) {
  return gateways.find((gateway) => (
    gateway.remoteAccess?.ip === peer.ip
    || (peer.host && gateway.remoteAccess?.host === peer.host)
    || gateway.id === gatewayIdFromPeer(peer)
  ));
}

function gatewayIdFromPeer(peer) {
  return sanitizeGatewayId(peer.name || peer.host || peer.id);
}

function sanitizeGatewayId(value) {
  return String(value || "")
    .trim()
    .replace(/\.$/, "")
    .replace(/[^A-Za-z0-9_.:-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function firstIpv4(ips) {
  return ips.find((ip) => /^\d{1,3}(?:\.\d{1,3}){3}$/.test(String(ip))) || "";
}

function tailscaleCliCandidates(cliPath) {
  return [
    cliPath,
    "tailscale",
    "tailscale.exe",
    "C:\\Program Files\\Tailscale\\tailscale.exe",
    "C:\\Program Files (x86)\\Tailscale\\tailscale.exe",
  ].filter(Boolean).filter((item, index, items) => items.indexOf(item) === index);
}
