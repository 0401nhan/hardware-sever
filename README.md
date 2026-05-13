# Electric Bird Hardware Server

Cloud server for Electric Bird hardware gateways. It provides:

- Gateway registry with per-gateway bearer tokens.
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
```

## Production URL

The intended public URL is:

```text
https://server.eletricbird.vn
```

Gateway config should point to:

```text
server.url: https://server.eletricbird.vn/api/telemetry
remoteConfig.url: https://server.eletricbird.vn/api/gateway
```

## Gateway API

Gateway calls are outbound HTTPS from the IPC/Moxa device to the cloud:

```text
POST /api/gateway/heartbeat
POST /api/gateway/config/check
POST /api/gateway/config/status
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

1. Create a gateway in the dashboard.
2. Set a strong token for that gateway.
3. Edit `Setting Communication`.
4. Save a new config version.
5. Gateway polls `/api/gateway/config/check`.
6. Gateway validates, saves to local SQLite, restarts, and reports status.

## Docker Compose

```bash
docker compose up -d --build
docker compose logs -f hardware-server
```

The container listens on port `8080`. Put Nginx/Caddy in front of it for TLS:

```text
https://server.eletricbird.vn -> http://127.0.0.1:8080
```

## Data

SQLite database:

```text
/data/hardware-server.sqlite
```

The Docker Compose file stores it in the `hardware-server-data` volume.
