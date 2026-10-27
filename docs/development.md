<!--
SPDX-FileCopyrightText: 2026 Johannes Homann

SPDX-License-Identifier: EUPL-1.2
-->

# Development

Entry point for developers. The detailed references are linked from each
section; conventions and gotchas live in [`AGENTS.md`](../AGENTS.md) and
[`CONTRIBUTING.md`](../CONTRIBUTING.md).

## 1. Architecture in short

One Next.js 15 application (App Router, React 19, TypeScript) with Payload CMS 3
embedded. Payload provides the data model (collections and globals on
MongoDB 7), the admin UI at `/admin` and REST/GraphQL at `/api`. The frontend
renders two route groups from the same code base and splits them by hostname in
`src/middleware.ts`: the public portal and the logged-in workspace. A separate
Node sidecar (`hocuspocus/`) syncs whiteboards over WebSocket with Yjs and
persists through an internal, secret-protected API of the main app.

Server actions in `src/actions/` perform all writes and enforce access
themselves; collection access in Payload is deliberately coarse. UI copy comes
from `messages/de.json` and `messages/en.json` (next-intl); content is
localised by Payload. Colours are CSS custom properties set from the admin.

Read next: [`architecture.md`](./architecture.md) (domains, route groups, data
model, realtime, theming), [`access-control.md`](./access-control.md),
[`modules.md`](./modules.md), [`i18n.md`](./i18n.md).

## 2. Modules

Each feature module registers itself in `src/modules/` with a manifest
(id, collections, public content flag) and surfaces in four places: the
workspace overview card, the module page, the manage area and the public
project page. Adding a module means adding its collections, its manifest, its
components and the message keys; [`modules.md`](./modules.md) has the
checklist and the rules (project relationship, visibility fields, server-side
gating when the module is disabled).

## 3. Interfaces

| Interface | Path | Auth | Purpose |
|---|---|---|---|
| Payload REST | `/api/<collection>` | Payload session cookie; collection access rules | Admin UI and internal reads |
| Payload GraphQL | `/api/graphql` | same | Available, not used by the frontend |
| Health | `/api/health` | none | Liveness for Compose and monitoring |
| Auth | `/api/auth/logout` | cookie | Logout via route handler (clears both cookie scopes) |
| Chat | `/api/chat/*` | cookie, room membership | Rooms, messages, reactions, read state, typing, attachments |
| Notifications | `/api/notifications` | cookie | List, mark read, delete |
| Search | `/api/search` | cookie, project membership | Workspace search across modules |
| Calendar feeds | `/api/ics/*` | public items only | ICS download per event |
| News feed | `/api/rss` | none | Public news as RSS |
| Urban Agent | `/api/urban-agent` | cookie, active membership, module enabled, rate limit | Streams NDJSON answers of the tool-calling assistant |
| Internal | `/api/internal/*` | `x-hocuspocus-secret` header | Room authorisation and document persistence for the sidecar |

Outbound: the chosen LLM provider (Vercel AI SDK), the optional SMTP server,
and the Urban Kit Methodensammlung GraphQL API (read-only, API key) for method
teasers. Demo accounts (`users.isDemo`) are refused on every mutating action
and route; see rule 8 in `AGENTS.md`.

## 4. Dependencies

Core: `next`, `react`, `payload` with `@payloadcms/db-mongodb` and
`@payloadcms/richtext-lexical`, `next-intl`, `tailwindcss` 4, `ai` (Vercel AI
SDK) with provider packages, `@excalidraw/excalidraw`, `yjs`,
`@hocuspocus/provider`, `@dnd-kit/core`, `lucide-react`. The sidecar has its own
`package.json` (`@hocuspocus/server`, `yjs`). Exact versions: `package.json`
and `package-lock.json`.

## 5. Build and check

```bash
npm ci
npm run dev:all            # Next on :3000 + sidecar on :1234 (needs MongoDB)
npx tsc --noEmit           # type check — run before every commit
npm run build              # production build (do not run while the dev server is up)
npm run generate:types     # after any collection/field/global change
npm run generate:importmap # after wiring a custom admin component
~/.local/bin/reuse lint    # licence headers (REUSE); CI runs this too
```

Node 20+, npm, a local MongoDB 7 (`docker compose up -d mongo` is enough).
Seed data for development: `npm run seed` (platform defaults) and
`npm run seed:prototype` (sample projects and users with the dev password).

## 6. Testing

There are **no automated tests** yet. The verification path is the type check,
the production build, and manual checks against a seeded instance, for which
headless browser scripts have been used ad hoc. The continuous integration
pipeline (`.gitlab-ci.yml`, mirrored by `.github/workflows/ci.yml`) runs
`npm ci`, `npx tsc --noEmit` and `reuse lint` on every push. Contributions that
add tests for the access-control guards (`src/lib/auth/`, `src/lib/visibility.ts`)
are especially welcome; they are the security-relevant core.

## 7. Extending the code

- Follow the conventions in `AGENTS.md`: server-side guards in every action,
  design tokens instead of hex colours, both message catalogues key-identical,
  German-first copy, docs updated with the change.
- Server actions return localised errors through `actionError()`
  (`src/lib/action-errors.ts`); dates format through `intlLocale()`.
- Legal implications: anything that stores data in the browser or sends data to
  a third party must update the legal templates (`docs/legal-templates.md`).
- Commit messages follow `VERB – details` (ADD / CHANGE / FIX / REMOVE), one
  logical unit per commit. Pull or merge requests welcome; see
  `CONTRIBUTING.md`.
