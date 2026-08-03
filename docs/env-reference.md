# Environment Variable Reference

Canonical list — matches `.env.example` and `docker-compose.yml`.

## Required (compose fails without them)

| Variable | Description |
|---|---|
| `PAYLOAD_SECRET` | Payload token signing secret. Min 32 random chars. |
| `HOCUSPOCUS_SECRET` | Shared secret between `web` and the `hocuspocus` sidecar (`x-hocuspocus-secret` header on `/api/internal/*`). Must be identical on both services. |
| `NEXT_PUBLIC_HOCUSPOCUS_URL` | Browser-facing WebSocket URL for the Board (**build-time arg**, baked into the bundle). `ws://localhost:1234` in dev, `wss://…` in production. |

## Core

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URI` | `mongodb://localhost:27017/urban_kit` | MongoDB connection string. Compose pins it to the internal `mongo` service. |
| `NEXT_PUBLIC_SERVER_URL` | `http://localhost:3000` | Public URL for metadata/og tags (**build-time arg**). |
| `NEXT_PUBLIC_APP_DOMAIN` | `app.urbankit.de` | Workspace domain; drives middleware domain-splitting and the parent-domain session cookie. |
| `NEXT_PUBLIC_PUBLIC_DOMAIN` | `urbankit.de` | Public portal domain (informational; middleware derives the portal domain by stripping `app.`). |
| `PAYLOAD_INTERNAL_URL` | `http://localhost:3000` | Where the sidecar reaches Payload (compose: `http://web:3000`). |
| `HOCUSPOCUS_URL` | `ws://localhost:1234` | Server-side WS URL (sidecar address). |

## Methodensammlung (optional — method teasers on Bereich Grundlagen)

| Variable | Default | Description |
|---|---|---|
| `METHODEN_URL` | `https://methoden.urbankit.de` | Base URL of the Methodensammlung. |
| `METHODEN_API_KEY` | — | API-client key (its `api-clients` collection) for the GraphQL read of published methods (`Authorization: api-clients API-Key <key>`). Unset ⇒ the Grundlagen page renders without teasers. |

## Urban Agent (optional — module works with any one provider)

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Preferred provider. |
| `OPENAI_API_KEY` | Used if no Anthropic key. |
| `OLLAMA_BASE_URL` | Local fallback (e.g. `http://localhost:11434`). |

## SMTP (optional)

`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` — passed to
the container; defaults target a local dev mailcatcher (`localhost:1025`).

## Vestigial (in `.env.example`, currently unused in code)

`S3_*` (media lives on a Docker volume, not S3) and `REDIS_URL` — kept only
as placeholders for planned features; safe to leave unset.
