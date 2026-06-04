# ADR-1: Hocuspocus ↔ Payload Authorization

**Status:** Accepted  
**Date:** 2026-05-31

## Context

Hocuspocus runs as a separate Node sidecar without access to Payload's request context or access-control functions. The 4-step chain (auth → membership → role → visibility) does not automatically apply to WebSocket connections.

Two options:
1. Hocuspocus decodes the Payload JWT itself, then re-queries Postgres for membership/role.
2. Hocuspocus calls an internal Payload endpoint that performs authorization using Payload's own logic.

## Decision

**Option 2: internal Payload endpoint.**

Hocuspocus `onAuthenticate` calls `POST /api/internal/authorize-room` with the client token and room name. The endpoint:
- Verifies the shared `HOCUSPOCUS_SECRET` header (server-to-server only)
- Validates the Payload JWT
- Checks project membership and module enabled status
- Returns `{ authorized: boolean, userId }`

The `roomName` encodes module + project + resource: `<moduleType>:<projectSlug>:<resourceId>`.

## Consequences

- Authorization logic stays single-sourced in Payload
- Hocuspocus has no direct Postgres access
- Adds one HTTP round-trip per new WebSocket connection (acceptable — connections are infrequent)
- The internal endpoint must be kept internal: not exposed to the public internet
