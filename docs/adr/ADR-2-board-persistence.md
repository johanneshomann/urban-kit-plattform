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

- No data loss on sidecar restart — the Yjs log survives in Postgres
- Single source of truth — no sync logic between two representations
- Requires `@hocuspocus/extension-database` configured with a Postgres connection
- JSON snapshot must never be written directly by application code
