# Deployment

Docker Compose with three services (see `docker-compose.yml`):

| Service | Image / build | Host port | Notes |
|---|---|---|---|
| `web` | `Dockerfile` | `127.0.0.1:3020` | runs `next start` directly (no migrations — Mongo is schemaless) |
| `hocuspocus` | `hocuspocus/Dockerfile` | `127.0.0.1:1234` | realtime sidecar for the Board module |
| `mongo` | `mongo:7` | `127.0.0.1:27019` | volume `mongo_data` |

Media uploads live on the `media_data` volume (`/app/media`) — no external
object storage.

## Setup

```bash
cp .env.example .env
# set at minimum: PAYLOAD_SECRET, HOCUSPOCUS_SECRET, NEXT_PUBLIC_HOCUSPOCUS_URL,
# NEXT_PUBLIC_SERVER_URL  (see docs/env-reference.md)

docker compose up -d --build
docker compose ps          # wait for healthy
curl http://localhost:3020/api/health
```

Compose fails fast on missing required vars (`:?` syntax) — intentional.

**Build-time args:** `NEXT_PUBLIC_SERVER_URL` and `NEXT_PUBLIC_HOCUSPOCUS_URL`
are baked into the client bundle at build time (Docker build args). Changing
them requires a rebuild, not just a restart.

## Domains

One deployment serves both hosts; `src/middleware.ts` splits them (see
[architecture.md](./architecture.md)):

- `urbankit.de` → public portal
- `app.urbankit.de` → logged-in workspace

Point both DNS records at the same server. The board WebSocket needs its own
public endpoint: set `NEXT_PUBLIC_HOCUSPOCUS_URL` to a `wss://` URL (e.g.
`wss://ws.urbankit.de`) proxied to port 1234 — plain `ws://` is blocked as
mixed content on https pages.

### Nginx sketch

```nginx
# portal + app → next
server {
    listen 443 ssl;
    server_name urbankit.de app.urbankit.de;
    location / {
        proxy_pass http://127.0.0.1:3020;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# board websocket
server {
    listen 443 ssl;
    server_name ws.urbankit.de;
    location / {
        proxy_pass http://127.0.0.1:1234;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

`Host` must be forwarded unchanged — the middleware's domain routing and the
login "open workspace in new tab" flow depend on it.

## Production override

Same pattern as the urban-kit-methodensammlung stack: `docker-compose.prod.yml`
hardens the base compose for the VPS.

```bash
# additionally set in .env: MONGO_ROOT_USER, MONGO_ROOT_PASSWORD
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

What it changes:

- **MongoDB root auth** — `MONGO_INITDB_ROOT_*` creates the root user on first
  boot, `web` connects with a credentialed `DATABASE_URI` (`authSource=admin`).
  NOTE: init only applies to an EMPTY `mongo_data` volume. For an existing
  volume, create the user once by hand:
  `docker compose exec mongo mongosh --eval 'db.getSiblingDB("admin").createUser({user: "…", pwd: "…", roles: ["root"]})'`
- Mongo publishes **no host port** at all (base maps `127.0.0.1:27019`).
- `restart: always` for web/hocuspocus/mongo.
- The **mailpit** dev mailcatcher is parked behind a compose profile and never
  starts — point `SMTP_*` at a real provider.

## Backup & restore

`scripts/backup.sh` dumps the database (`mongodump --archive --gzip`) and tars
the `media_data` + `uploads_data` volumes into `../backups/` (rotating after 14
days). Run it from cron on the server:

```cron
30 3 * * * /root/projects/urban-kit-plattform/urban-kit-plattform/scripts/backup.sh \
           >> /root/projects/urban-kit-plattform/backups/backup.log 2>&1
```

Restore a DB archive (drops and replaces the current database):

```bash
scripts/restore.sh ../backups/db_2026-08-20_0330.archive.gz
```

Both scripts read `MONGO_ROOT_USER`/`MONGO_ROOT_PASSWORD` from `.env`.

## Updates

```bash
git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build web hocuspocus
```

