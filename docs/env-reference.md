# Environment Variable Reference

## Required

| Variable | Description |
|---|---|
| `PAYLOAD_SECRET` | Secret used by Payload to sign tokens. Min 32 chars. |
| `DATABASE_URI` | PostgreSQL connection string. |
| `S3_ACCESS_KEY` | MinIO / S3 access key. |
| `S3_SECRET_KEY` | MinIO / S3 secret key. |
| `HOCUSPOCUS_SECRET` | Shared secret between web and hocuspocus sidecar. |

## Optional

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_SERVER_URL` | `http://localhost:3000` | Public URL for og: tags and RSS links. |
| `NEXT_PUBLIC_APP_DOMAIN` | `app.urbankit.de` | Subdomain that receives workspace rewrite. |
| `S3_ENDPOINT` | `http://minio:9000` | S3-compatible storage endpoint. |
| `S3_BUCKET_MEDIA` | `media` | Bucket for Payload media uploads. |
| `S3_BUCKET_FILES` | `project-files` | Bucket for project file uploads. |
| `REDIS_URL` | `redis://redis:6379` | Redis connection string for rate limiting. |
| `HOCUSPOCUS_URL` | `ws://hocuspocus:1234` | WebSocket URL for collaborative features. |
| `SMTP_HOST` | `localhost` | SMTP server hostname. |
| `SMTP_PORT` | `1025` | SMTP server port. |
| `SMTP_USER` | — | SMTP username (if required). |
| `SMTP_PASS` | — | SMTP password (if required). |
| `OPENAI_API_KEY` | — | Enables OpenAI provider for Urban Agent. |
| `ANTHROPIC_API_KEY` | — | Enables Anthropic provider for Urban Agent (takes priority over OpenAI). |
| `OLLAMA_BASE_URL` | — | Enables local Ollama provider (fallback if no cloud keys). |
| `SEED_ADMIN_EMAIL` | `admin@urbankit.local` | Admin user email created by seed script. |
| `SEED_ADMIN_PASSWORD` | `Admin1234!` | Admin user password created by seed script. |

## Notes

- In Docker Compose, variables marked `:?` in the compose file will cause a hard failure at startup if unset — this is intentional to prevent misconfigured deployments.
- `DATABASE_URI` is hard-coded in `docker-compose.yml` to use the internal `postgres` service. Override in `.env` for external databases.
- The `HOCUSPOCUS_SECRET` must match between the `web` service (`HOCUSPOCUS_SECRET`) and the `hocuspocus` service (`HOCUSPOCUS_SECRET`). Docker Compose handles this automatically from a single `.env` file.
