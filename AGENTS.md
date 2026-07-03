# AGENTS.md — working on UrbanKIT

Civic-participation platform: public portal (`urbankit.de`) + logged-in
workspace (`app.urbankit.de`) served by one Next.js App Router app with
Payload CMS 3 embedded (MongoDB). Start with
[docs/architecture.md](docs/architecture.md); the full doc index is
[docs/README.md](docs/README.md).

## Read before touching…

- Roles, memberships, visibility, auth → [docs/access-control.md](docs/access-control.md)
- Project modules / their collections → [docs/modules.md](docs/modules.md)
- UI copy / message catalogs → [docs/i18n.md](docs/i18n.md)
- Env vars / Docker / domains → [docs/env-reference.md](docs/env-reference.md), [docs/deployment.md](docs/deployment.md)

## Commands

```bash
npm run dev:all          # Next (turbopack) + Hocuspocus WS sidecar; needs local MongoDB
npm run generate:types   # REQUIRED after any Payload collection/field change
npx tsc --noEmit         # typecheck (run before committing)
npm run lint
```

Dev runs in tmux. npm installs are network-fragile; repair with
`rm -rf node_modules && npm ci`.

## Hard rules

1. **Payload docs first** — before writing any Payload-specific code (fields,
   access, hooks, queries), check https://payloadcms.com/docs. Don't code
   from memory.
2. **Enforce server-side** — collection access is coarse (`isAuthenticated`);
   every server action and API route must do its own guard
   (`getProjectManagerContext`, `getViewerTier`, …). UI checks are not
   security.
3. **Both message catalogs** — `messages/de.json` and `messages/en.json` stay
   key-identical. Copy tone: formal Sie, minimal direct address. Project
   content itself stays German-only (see docs/i18n.md).
4. **Module gating** — anything module-related must 404/deny when the module
   isn't in `project.modules`, for PMs too.
5. **Design tokens, not hex** — colors come from CSS custom properties
   (`--plattform-*`, `--project-*` chameleon vars). Match the existing
   inline-style + Tailwind idiom of the surrounding file.

## Git conventions

- Commit granularly, one concern per commit; **commit only, never push**
  unless explicitly asked.
- Message format: `VERB – details` (e.g. `FIX – Workspace module cards: …`).
  Verbs: ADD, CHANGE, FIX, REMOVE.
- No co-author trailers.

## Gotchas

- `src/payload-types.ts` is generated and gitignored — never edit it.
- `NEXT_PUBLIC_SERVER_URL` / `NEXT_PUBLIC_HOCUSPOCUS_URL` are baked at Docker
  build time (build args), not runtime env.
- MongoDB: new optional fields need no migration; stale keys on old docs are
  simply ignored.
- The middleware skips `/admin` and `/api` entirely; domain-splitting only
  applies to the production hostnames — localhost serves everything.
- Dev-server 500s mentioning "module factory is not available" are turbopack
  HMR staleness — recompile/restart, not a code bug.
