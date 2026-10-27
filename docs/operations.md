<!--
SPDX-FileCopyrightText: 2026 Johannes Homann

SPDX-License-Identifier: EUPL-1.2
-->

# Installation and operations

How a municipality installs, configures and runs its own UrbanKIT instance.
Everything here is generic: your domains, your hosting, your reverse proxy.
Environment variables are listed in [`env-reference.md`](./env-reference.md).

## 1. Requirements

| Component | Version | Notes |
|---|---|---|
| Docker Engine + Compose plugin | Docker 24+, Compose v2 | Recommended way to run the stack |
| Node.js | 20 or newer | Only for development or running the app without Docker; the image pins its own version |
| MongoDB | 7 | Ships in the Compose stack; an external MongoDB 7 works too (`DATABASE_URI`) |
| Reverse proxy with TLS | any | Nginx, Caddy, Traefik or a managed edge. HTTPS is mandatory (secure cookies, WebSocket upgrade) |
| Resources | 2 vCPU, 2 GB RAM, 10 GB disk | Enough for a pilot; the web container is limited to 1 GB, the sidecar to 512 MB |

Two hostnames are required: one for the public portal and one for the logged-in
workspace (for example `portal.example.org` and `app.example.org`). A third
hostname or path is needed for the board WebSocket (`ws.example.org`). The
session cookie is scoped to the shared parent domain, so both hostnames must
share one (`example.org`).

## 2. External services

| Service | Required | What it is used for | Without it |
|---|---|---|---|
| MongoDB 7 | yes | All content, users, settings | Nothing runs |
| Hocuspocus sidecar | yes for the board | Realtime sync of whiteboards (Yjs over WebSocket); part of the Compose stack | Board module unusable, everything else works |
| SMTP server | recommended | Account verification mails, password reset, notification mails | Registration cannot complete; see limitation in [`project-status.md`](./project-status.md) |
| LLM provider (Mistral, Anthropic, OpenAI or self-hosted Ollama) | optional | The Urban Agent module | Module reports "not configured"; disable it per project |
| Urban Kit Methodensammlung (GraphQL) | optional | Method teasers on the "Grundlagen" area | Area renders without teasers |
| CDN / edge security | optional | Delivery and DDoS protection in front of the proxy | None, but mention any provider in your privacy policy |

Every external service you enable is a data processor under GDPR. The seeded
privacy-policy template contains placeholders for hosting, mail and AI
providers; see [`legal-templates.md`](./legal-templates.md).

## 3. Installation with Docker Compose

```bash
git clone <repository-url> urbankit && cd urbankit
cp .env.example .env
```

Set at least these values in `.env`:

- `PAYLOAD_SECRET`, `HOCUSPOCUS_SECRET`: long random strings.
- `MONGO_ROOT_USER`, `MONGO_ROOT_PASSWORD`: database credentials (production override).
- `NEXT_PUBLIC_PUBLIC_DOMAIN`, `NEXT_PUBLIC_APP_DOMAIN`: your two hostnames.
- `NEXT_PUBLIC_SERVER_URL`: `https://` + public hostname.
- `NEXT_PUBLIC_HOCUSPOCUS_URL`: `wss://` + the board WebSocket hostname.
- `SMTP_*`: your mail provider, or leave registration closed.

Then start the stack with the production override:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
docker compose ps                     # wait for "healthy"
curl -s http://127.0.0.1:3020/api/health
```

The base Compose file binds the web app to `127.0.0.1:3020` and the board
WebSocket to `127.0.0.1:1234`, so nothing is exposed directly. The production
override enables MongoDB authentication, removes the MongoDB host port, sets
`restart: always` and parks the dev mail catcher behind a profile.

**Build-time values.** `NEXT_PUBLIC_SERVER_URL` and `NEXT_PUBLIC_HOCUSPOCUS_URL`
are compiled into the browser bundle. Changing them requires `--build`, not just
a restart.

**Existing database volume.** MongoDB creates the root user only on an empty
volume. If you enable authentication on an existing volume, create the user
once by hand:

```bash
docker compose exec mongo mongosh --eval \
  'db.getSiblingDB("admin").createUser({user: "<user>", pwd: "<password>", roles: ["root"]})'
```

### First run

1. Open `https://app.example.org/admin` and create the first administrator.
2. Seed the platform defaults (idempotent, safe to repeat):
   `docker compose exec web npm run seed`
3. In the admin, open **Platform Settings** and set the city name, logos,
   colours and the public contact address.
4. Open **Legal Settings** and fill the placeholders in the imprint, privacy
   policy, cookie policy and accessibility statement. The seeded texts are
   templates, not legal advice.
5. Optional showcase content: `docker compose exec web npm run seed:prototype`
   creates sample projects and users. Set `SEED_USERS_PASSWORD` in `.env` first;
   rotate later with `npm run seed:rotate-passwords`.
6. Optional pilot mode: enable the prototype notice in Platform Settings, create
   public demo accounts with `npm run seed:demo`, and switch
   **Registrierung erlauben** off to close self-registration.

## 4. Reverse proxy and TLS

Any TLS-terminating proxy works. Three rules:

- Forward `Host` unchanged: the app routes portal and workspace by hostname.
- Forward `X-Forwarded-Proto` (and `X-Forwarded-Host` if your proxy rewrites
  the host): redirects and the logout flow build absolute URLs from them.
- Enable WebSocket upgrade on the board endpoint.

Neutral Nginx example with placeholder hosts:

```nginx
server {
    listen 443 ssl;
    server_name portal.example.org app.example.org;
    location / {
        proxy_pass http://127.0.0.1:3020;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
    }
}

server {
    listen 443 ssl;
    server_name ws.example.org;
    location / {
        proxy_pass http://127.0.0.1:1234;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Caddy or Traefik need the equivalent: two HTTPS sites to port 3020, one
WebSocket site to port 1234, headers forwarded. Tunnel-based edges (no open
ports on the host) work the same way as long as they forward the headers above.

## 5. Configuration

- **Environment** (`.env`): secrets, hostnames, mail, AI provider. Full list in
  [`env-reference.md`](./env-reference.md). Compose fails fast on missing
  required values.
- **Admin settings** (`/admin`): everything editorial and visual lives here and
  needs no redeploy: Platform Settings (identity, prototype mode, demo accounts,
  registration switch, colour tokens, project colour schemes, partners), Legal
  Settings (four legal texts, bilingual), Urban Agent settings (provider,
  model, rate limit), topic-area content.
- **Per project**: project managers configure modules, teams, appearance and
  membership rules in the project's manage area (see
  [`usage.md`](./usage.md)).

## 6. Day-to-day operations

**Health.** `GET /api/health` returns 200 when the app and database respond.
Compose's health check polls it; use it for external monitoring too.

**Updates.**

```bash
git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build web hocuspocus
```

Payload applies schema changes on start; no manual migration step. Rebuild
`hocuspocus` only when its directory changed.

**Backup and restore.** `scripts/backup.sh` dumps the database
(`mongodump --archive --gzip`) and archives the media and upload volumes into a
backup directory (default: a sibling folder of the repository, 14-day
rotation). Run it from cron, for example nightly:

```cron
30 3 * * * /path/to/urbankit/scripts/backup.sh >> /path/to/backups/backup.log 2>&1
```

`scripts/restore.sh <archive>` drops and replaces the current database. Both
scripts read the MongoDB credentials from `.env`.

**Logs.** The application writes no access logs; request data stays with your
proxy or edge. Container logs go to Docker's `json-file` driver, which does not
rotate by default. Set a limit in `/etc/docker/daemon.json`:

```json
{ "log-driver": "json-file", "log-opts": { "max-size": "20m", "max-file": "5" } }
```

**Secrets.** Keep `.env` out of version control (it is git-ignored). Rotate
`PAYLOAD_SECRET` only with a planned re-login of all users. API keys for AI
providers can also be entered in the admin instead of `.env`.

## 7. Legal texts and privacy

The platform ships bilingual templates for imprint, privacy policy, cookie
policy and accessibility statement, seeded into Legal Settings with
`[placeholders]`. The operator is responsible for completing them. Whenever you
add a processor (mail provider, AI provider, CDN) or change what the browser
stores, update the texts; [`legal-templates.md`](./legal-templates.md) lists
the cookies and storage entries the software sets.

## 8. Running without Docker

For development or bare-metal setups: Node 20+, a MongoDB 7, then

```bash
cp .env.example .env.local
npm ci
npm run build && npm run start          # web app on :3000
node hocuspocus/server.js               # board sidecar on :1234
```

Point `PAYLOAD_INTERNAL_URL` (sidecar → app) and `NEXT_PUBLIC_HOCUSPOCUS_URL`
(browser → sidecar) at the right addresses; `docs/env-reference.md` explains
the mixed setups.
