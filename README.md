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
http://localhost:8080/
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
5. Save a new config version.
6. Gateway polls `/api/gateway/config/check`.
7. Gateway validates, saves to local SQLite, restarts, and reports status.

## Remote Inverter Control

Admins can queue inverter control commands from the dashboard `Inverter Control` tab or through the API:

```bash
curl -X POST https://server.electricbird.vn/api/gateways/GATEWAY_ID/control \
  -H "Content-Type: application/json" \
  -b "hardware_server_session=<session-cookie>" \
  -d '{"deviceName":"Huawei","action":"limit_power","percent":60,"durationMinutes":30}'
```

Supported actions are `on`/`start`/`boot`, `off`/`stop`/`shutdown`, `reboot`/`restart`, `limit_power`, and `clear_power_limit`. The gateway polls `/api/gateway/commands/check`, executes the command locally through Modbus, then reports `/api/gateway/commands/status`.

## Docker Compose

```bash
docker compose up -d --build
docker compose logs -f hardware-server
```

The container listens on port `8080`. Put Nginx/Caddy in front of it for TLS:

```text
https://server.electricbird.vn -> http://127.0.0.1:8080
```

## Data

SQLite database:

```text
/data/hardware-server.sqlite
```

The Docker Compose file stores it in the `hardware-server-data` volume.
