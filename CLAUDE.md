# CLAUDE.md

This project's agent guidance is maintained in **[AGENTS.md](AGENTS.md)** so it works
for every coding agent (Claude Code, Cursor, Copilot, Codex, …).

👉 **Read [AGENTS.md](AGENTS.md) first.** It covers the stack, commands, repository
map, and the conventions/rules you must follow.

Deeper references:
- [docs/architecture.md](docs/architecture.md) — big picture: domains, route groups, data model, realtime, theming.
- [docs/README.md](docs/README.md) — doc index with a "read when…" table.

## Quick reminders (full detail in AGENTS.md)

- **Stack:** Next.js 15 (App Router) + Payload CMS 3 + MongoDB 7 + Tailwind 4. German-first UI (`de` default, `en` fallback). npm.
- **Dev:** `npm run dev:all` → Next on `:3000` + Hocuspocus WS sidecar on `:1234`; needs local MongoDB. Admin at `/admin`.
- After editing a collection/field/global → **`npm run generate:types`**. After wiring a custom admin component → **`npm run generate:importmap`**.
- **Access control:** collection access is coarse; every server action/route must do its own guard (`getProjectManagerContext`, `getViewerTier`, …). UI checks are not security.
- **Design tokens, not hex:** colors come from CSS custom properties (`--plattform-*`, `--project-*` chameleon vars).
- Both message catalogs (`messages/de.json` + `en.json`) stay key-identical.
- **Git:** commit only, never push, without an explicit request. `VERB – details` format (ADD / CHANGE / FIX / REMOVE).