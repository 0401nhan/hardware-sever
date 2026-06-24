# Electric Bird Hardware Server

Hardware-Server is the logged-in gateway directory for Electric Bird IPC/Moxa gateways.

Current architecture:

- Store gateways, Tailscale host/IP, sessions, templates, command history, and telemetry history in SQLite.
- Auto-import online Linux peers from the local Tailscale client.
- Show a small site list after login.
- Open the real Hardware-Gateway UI through `/gateways/<gateway-id>/remote/`.
- Keep Hardware-Gateway configuration and Modbus runtime on the IPC.

The server is not the primary gateway config UI in the Tailscale architecture. Click `Remote` from
the server home page and work inside the IPC gateway UI.

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

Required production values:

```text
ADMIN_USERNAME
ADMIN_PASSWORD
SESSION_SECRET
TOKEN_HASH_SECRET
```

## Tailscale Remote Flow

Recommended layout:

```text
Admin browser
  -> login to Hardware-Server
  -> click Remote
  -> Hardware-Server proxies /gateways/<gateway-id>/remote/* to the IPC over Tailscale
  -> login to Hardware-Gateway on the IPC/Moxa
```

The browser does not need to be in the tailnet. The machine running Hardware-Server must be joined
to the same tailnet as the IPC/Moxa gateways.

Do not expose the IPC Hardware-Gateway UI directly to the public Internet.

## Tailscale Auto Sync

Hardware-Server can populate the gateway directory from `tailscale status --json`.

On startup, on every `/api/gateways` refresh, and at `TAILSCALE_SYNC_INTERVAL_MS`, it imports online
Linux peers into SQLite and stores their `100.x.x.x` address as the remote target. Windows peers are
ignored by default so the server and support laptops do not appear as gateways.

```bash
TAILSCALE_SYNC_ENABLED=true
TAILSCALE_CLI_PATH="C:\Program Files\Tailscale\tailscale.exe"
TAILSCALE_SYNC_INTERVAL_MS=30000
TAILSCALE_SYNC_OS=linux
TAILSCALE_SYNC_UI_PORT=80
TAILSCALE_SYNC_SSH_PORT=22
TAILSCALE_SYNC_TAG=tag:gateway
```

Manual gateway records can also be created from the dashboard with a Tailscale host or `100.x.x.x`
IP address.

## Remote Gateway API

Hardware-Server proxies direct control calls to the IPC Hardware-Gateway Admin API through
Tailscale:

```bash
curl -X POST https://server.electricbird.vn/api/gateways/GATEWAY_ID/tailscale/control \
  -H "Content-Type: application/json" \
  -b "hardware_server_session=<session-cookie>" \
  -d '{"deviceName":"Huawei","action":"limit_power","percent":60,"durationMinutes":30}'
```

Server-side Tailscale gateway login uses:

```bash
TAILSCALE_GATEWAY_ADMIN_USERNAME=admin
TAILSCALE_GATEWAY_ADMIN_PASSWORD=admin
TAILSCALE_GATEWAY_TIMEOUT_MS=10000
```

## SQLite Data

Default database path:

```text
data/hardware-server.sqlite
```

For Docker deployments this should be mounted as persistent storage.

Telemetry retention defaults to 30 days:

```text
TELEMETRY_RETENTION_MS=2592000000
TELEMETRY_PRUNE_INTERVAL_MS=3600000
```

Set `TELEMETRY_RETENTION_MS=0` to disable automatic telemetry cleanup.

## Docker Compose

```bash
docker compose up -d --build
docker compose logs -f hardware-server
```

The app listens on port `7000`. Put Nginx/Caddy in front for TLS:

```text
https://server.electricbird.vn -> http://127.0.0.1:7000
```

## Legacy Push API

The older outbound heartbeat, remote config, telemetry ingest, and cloud command queue API is kept
only for backward compatibility and is disabled by default.

Leave this unset for the current Tailscale architecture:

```text
GATEWAY_PUSH_API_ENABLED=false
```
