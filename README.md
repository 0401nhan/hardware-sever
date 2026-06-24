# Electric Bird Hardware Server

Hardware-Server is the logged-in Tailscale gateway directory for Electric Bird IPC/Moxa gateways.

Current architecture:

- Store gateway records and Tailscale host/IP metadata in SQLite.
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

## Remote Gateway Proxy

Hardware-Server proxies the IPC UI at:

```text
/gateways/<gateway-id>/remote/
```

The admin browser stays on `server.electricbird.vn`; Hardware-Server reaches the IPC over Tailscale.
IPC login still happens inside the proxied Hardware-Gateway UI.

## SQLite Data

Default database path:

```text
data/hardware-server.sqlite
```

For Docker deployments this should be mounted as persistent storage. The database contains only the
gateway directory and Tailscale remote metadata.

## Docker Compose

```bash
docker compose up -d --build
docker compose logs -f hardware-server
```

The app listens on port `7000`. Put Nginx/Caddy in front for TLS:

```text
https://server.electricbird.vn -> http://127.0.0.1:7000
```
