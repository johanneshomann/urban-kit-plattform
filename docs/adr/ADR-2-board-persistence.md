# ADR-2: Board / Yjs Persistence Strategy

**Status:** Accepted  
**Date:** 2026-05-31

## Context

TLDraw v3 produces a live Yjs document in Hocuspocus memory. Naive "save on meaningful change" to a JSON column creates two sources of truth and risks:
- Last-writer-wins clobbering on concurrent edits
- Snapshot taken mid-edit losing in-flight operations
- Sidecar restart losing unsaved state

## Decision

**The Yjs update log is the authoritative source of truth.**

`board-canvases` stores:
- `yjs_updates`: binary Yjs update log (written by Hocuspocus's database extension)
- `snapshot`: derived JSON — rebuilt from the Yjs log on demand, never written independently

Persistence mechanism: Hocuspocus `@hocuspocus/extension-database` writes binary `Y.Doc` updates to Postgres after every meaningful change. On room load, the extension reads the update log and reconstructs the document.

The JSON snapshot field is for Payload queries (e.g. listing canvases in the admin), not for round-tripping state.

## Consequences

- No data loss on sidecar restart — the Yjs state survives in the database
- Single source of truth — no sync logic between two representations
- Requires `@hocuspocus/extension-database` configured with `fetch`/`store` callbacks
- JSON snapshot must never be written directly by application code

## Addendum (2026-07-01): MongoDB, not Postgres

The platform ships on **MongoDB** (`mongooseAdapter`), not Postgres. `@hocuspocus/extension-database` is storage-agnostic — you implement `fetch`/`store` callbacks — so the "Postgres" above is not binding.

Per ADR-1 (the sidecar has no direct DB access), persistence is routed **through Payload**:

- The sidecar's `Database` extension calls the internal endpoint `GET/POST /api/internal/board-doc` (guarded by `HOCUSPOCUS_SECRET`).
- The Yjs document state (`Y.encodeStateAsUpdate`) is stored **base64-encoded** on `board-canvases.yjsState` — one blob per canvas, not an append log. The extension debounces writes.
- On room load, `fetch` returns the stored base64 → decoded to a `Uint8Array` to rehydrate the doc.
- `snapshot` (JSON) remains reserved for future admin previews and is still never written directly.
