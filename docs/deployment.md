# Deployment Guide

## Prerequisites

- Docker & Docker Compose v2
- A `.env` file based on `.env.example`

## Production Setup

### 1. Configure environment

```bash
cp .env.example .env
# Edit .env and set all required variables (see docs/env-reference.md)
```

**Required variables** (Docker Compose will fail without them):
- `PAYLOAD_SECRET` — random 32+ character string
- `S3_ACCESS_KEY` / `S3_SECRET_KEY` — MinIO credentials
- `HOCUSPOCUS_SECRET` — shared secret between web and hocuspocus

### 2. Build and start

```bash
docker compose up -d --build
```

Services start in dependency order:
1. `postgres` — waits for healthcheck
2. `redis` — waits for healthcheck
3. `minio` — waits for healthcheck, then `minio-init` creates buckets
4. `web` — waits for all three to be healthy
5. `hocuspocus` — waits for `web` to be healthy

### 3. Run migrations and seed

```bash
# Run Payload migrations (creates DB schema)
docker compose exec web npm run payload migrate

# Seed color schemes and demo content (idempotent)
docker compose exec web npm run payload -- tsx scripts/seed.ts
```

### 4. Verify

```bash
# All services healthy
docker compose ps

# Web app
curl http://localhost:3000

# Admin panel
open http://localhost:3000/admin
```

## Nginx reverse proxy (recommended)

```nginx
server {
    listen 80;
    server_name urbankit.de app.urbankit.de;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name urbankit.de app.urbankit.de;

    ssl_certificate /etc/letsencrypt/live/urbankit.de/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/urbankit.de/privkey.pem;

    location /api/ws {
        proxy_pass http://localhost:1234;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Updates

```bash
git pull
docker compose up -d --build web
docker compose exec web npm run payload migrate
```

## Backups

```bash
# PostgreSQL dump
docker compose exec postgres pg_dump -U urban_kit urban_kit > backup-$(date +%Y%m%d).sql

# MinIO data (on the host)
docker run --rm -v urban-kit-plattform_minio_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/minio-$(date +%Y%m%d).tar.gz /data
```
