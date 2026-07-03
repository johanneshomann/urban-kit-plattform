# Deployment

Docker Compose with three services (see `docker-compose.yml`):

| Service | Image / build | Host port | Notes |
|---|---|---|---|
| `web` | `Dockerfile` (Next standalone) | `127.0.0.1:3020` | runs `payload migrate` then `next start` (`start.sh`) |
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

## Updates

```bash
git pull
docker compose up -d --build web hocuspocus
```

Migrations run automatically on container start (`start.sh`).

## Backups

```bash
docker compose exec mongo mongodump --db urban_kit --archive > backup-$(date +%Y%m%d).archive
docker run --rm -v urban-kit-plattform_media_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/media-$(date +%Y%m%d).tar.gz /data
```
