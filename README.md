# Electric Bird Hardware Server

Cloud server for Electric Bird hardware gateways. It provides:

- Gateway registry with per-gateway bearer tokens.
- Auto-provisioning for new gateways on first boot.
- Remote config version management.
- Gateway heartbeat and config apply status.
- Telemetry ingest endpoint compatible with `Hardware-Gateway`.
- Web dashboard at `/`.

## Local Development

```bash
npm install
cp .env.example .env
npm start
```

Open:

```text
http://localhost:7000/
```

Default admin values come from `.env`. Change these before production:

```text
ADMIN_USERNAME
ADMIN_PASSWORD
SESSION_SECRET
TOKEN_HASH_SECRET
PROVISIONING_TOKEN
```

## Auto Provisioning

`AUTO_REGISTER_GATEWAYS=true` lets a new hardware gateway create itself on the server the first time it connects.

Production flow:

```text
gateway boots
  -> gateway generates a stable ID such as EB-9A7C2D4F10B3
  -> gateway calls /api/gateway/heartbeat with PROVISIONING_TOKEN
  -> server creates the gateway registry row
  -> server creates config version 1 for that gateway
  -> gateway pulls config and reports applied/failed
```

Set the same initial token on the server and gateway image:

```text
PROVISIONING_TOKEN=<factory-token>
SERVER_TOKEN=<factory-token>
GATEWAY_TOKEN=<factory-token>
```

After the first connection, the dashboard will show the auto-created gateway. For stronger production security, replace the gateway token from the dashboard after commissioning.

## Production URL

The intended public URL is:

```text
https://server.electricbird.vn
```

Gateway config should point to:

```text
server.url: https://server.electricbird.vn/api/telemetry
remoteConfig.url: https://server.electricbird.vn/api/gateway
```

## Gateway API

Gateway calls are outbound HTTPS from the IPC/Moxa device to the cloud:

```text
POST /api/gateway/heartbeat
POST /api/gateway/config/check
POST /api/gateway/config/status
POST /api/gateway/commands/check
POST /api/gateway/commands/status
POST /api/telemetry
```

All gateway API requests require:

```text
Authorization: Bearer <gateway-token>
```

Use the same token on the gateway:

```text
SERVER_TOKEN=<gateway-token>
GATEWAY_TOKEN=<gateway-token>
```

## Dashboard Flow

1. Power on the hardware gateway.
2. The server auto-creates a gateway record when it receives the first heartbeat.
3. Open the dashboard and select the new gateway.
4. Edit `Setting Communication`.
5. Add Modbus RTU devices with an RS485/COM port, or Modbus TCP devices with `host`, `tcpPort`, and `unitId`.
   For logger sites, config versions may also include `loggers[]`, child devices with `parentLogger` plus `route`, and station `control.mode` such as `logger_plant` or `fanout`.
6. Save a new config version.
7. Gateway polls `/api/gateway/config/check`.
8. Gateway validates, saves to local SQLite, restarts, and reports status.

## Tailscale Remote IPC UI

Hardware-Server stores private Tailscale access metadata for each IPC/Moxa gateway. The server
dashboard is intentionally only a logged-in gateway directory: click `Remote` on the home page and
Hardware-Server proxies the real Gateway UI running on the IPC.

Recommended layout:

```text
Admin browser
  -> login to Hardware-Server
  -> click Remote
  -> Hardware-Server proxies /gateways/<gateway-id>/remote/* to the IPC over Tailscale
  -> login to Hardware-Gateway on IPC/Moxa
```

For each gateway, set these fields from the server dashboard `System > Tailscale remote`, or when
creating a manual gateway. A token is not required for this directory-only mode:

```json
{
  "remoteAccess": {
    "enabled": true,
    "method": "tailscale",
    "host": "tram-a-gw-01",
    "ip": "100.64.10.20",
    "uiPort": 80,
    "sshPort": 22,
    "tag": "tag:gateway"
  }
}
```

The `Remote` link is served through `/gateways/<gateway-id>/remote/`, so a Hardware-Server admin
session is required before any IPC page is proxied. The browser can be outside the tailnet because
the machine running Hardware-Server performs the Tailscale connection to the IPC/Moxa gateway.
Do not expose the Gateway UI directly to the public Internet.

Hardware-Server also keeps API-level proxy routes for immediate control calls over Tailscale. The
machine running Hardware-Server must be joined to the same tailnet as the IPC/Moxa gateway.

The legacy gateway push API (`/api/gateway/*` and `/api/telemetry`) is disabled by default in this
architecture, so IPC heartbeat or telemetry requests are ignored instead of requiring a shared token.
Set `GATEWAY_PUSH_API_ENABLED=true` only when you intentionally want the older heartbeat, telemetry,
remote config, or cloud command queue workflow.

```bash
TAILSCALE_GATEWAY_ADMIN_USERNAME=admin
TAILSCALE_GATEWAY_ADMIN_PASSWORD=admin
TAILSCALE_GATEWAY_TIMEOUT_MS=10000
```

Hardware-Server can also auto-provision this directory from the local Tailscale client. On startup,
on every `/api/gateways` refresh, and then every `TAILSCALE_SYNC_INTERVAL_MS`, it runs
`tailscale status --json`, imports online Linux peers into SQLite, and stores their `100.x.x.x`
address as the gateway remote target. Windows peers are ignored by default so the server and support
laptops do not appear as gateways.

```bash
TAILSCALE_SYNC_ENABLED=true
TAILSCALE_CLI_PATH="C:\Program Files\Tailscale\tailscale.exe"
TAILSCALE_SYNC_INTERVAL_MS=30000
TAILSCALE_SYNC_OS=linux
TAILSCALE_SYNC_UI_PORT=80
TAILSCALE_SYNC_SSH_PORT=22
TAILSCALE_SYNC_TAG=tag:gateway
```

## Remote Inverter Control

Admins can queue inverter control commands from the dashboard `Inverter Control` tab or through the API:

```bash
curl -X POST https://server.electricbird.vn/api/gateways/GATEWAY_ID/control \
  -H "Content-Type: application/json" \
  -b "hardware_server_session=<session-cookie>" \
  -d '{"deviceName":"Huawei","action":"limit_power","percent":60,"durationMinutes":30}'
```

Station-level commands are also supported by using `stationId` instead of `deviceName`; the gateway decides whether to use logger plant control or inverter fanout from its local config.

Supported actions are `on`/`start`/`boot`, `off`/`stop`/`shutdown`, `reboot`/`restart`, `limit_power`, and `clear_power_limit`. The gateway polls `/api/gateway/commands/check`, executes the command locally through Modbus, then reports `/api/gateway/commands/status`.

For direct Tailscale execution, use the dashboard `Control` tab and select `Tailscale direct`, or call:

```bash
curl -X POST https://server.electricbird.vn/api/gateways/GATEWAY_ID/tailscale/control \
  -H "Content-Type: application/json" \
  -b "hardware_server_session=<session-cookie>" \
  -d '{"deviceName":"Huawei","action":"limit_power","percent":60,"durationMinutes":30}'
```

This route logs in to the Gateway Admin API through the saved Tailscale host/IP, then calls
`/api/inverter/control` on the gateway. Use `Cloud queue` only when Hardware-Server cannot reach
the IPC over Tailscale or when the IPC is temporarily offline.

## Docker Compose

Production Compose stores Hardware-Server data in the SQLite database volume:

```bash
docker compose up -d --build
docker compose logs -f hardware-server
```

The container listens on port `7000`. Put Nginx/Caddy in front of it for TLS:

```text
https://server.electricbird.vn -> http://127.0.0.1:7000
```

## Data

SQLite database:

```text
/data/hardware-server.sqlite
```

The Docker Compose file stores it in the `hardware-server-data` volume.

Telemetry retention defaults to 30 days:

```text
TELEMETRY_RETENTION_MS=2592000000
TELEMETRY_PRUNE_INTERVAL_MS=3600000
```

Set `TELEMETRY_RETENTION_MS=0` to disable automatic telemetry cleanup. SQLite prunes
`telemetry_records` during startup and ingest.
