line o# AGENTS.md — working on UrbanKIT

Civic-participation platform: public portal (`urbankit.de`) + logged-in
workspace (`app.urbankit.de`) served by one Next.js App Router app with
Payload CMS 3 embedded (MongoDB). Start with
[docs/architecture.md](docs/architecture.md); the full doc index is
[docs/README.md](docs/README.md).

> The **product is German-first**. UI copy, field names and content default to
> German (`de`); English (`en`) is a fallback. See [docs/i18n.md](docs/i18n.md).

---

## What this project is

UrbanKIT is the digital civic-participation platform of a city: the public
portal lets anyone browse participation projects; a logged-in workspace
(`app.urbankit.de`) provides per-project collaboration through swappable
feature **modules** (news, calendar, polls, forum, tasks, chat, board, files,
urban-agent).

- **Framework:** Next.js 15 (App Router, RSC-first) + React 19, Turbopack dev
- **CMS / API / Auth:** Payload CMS 3 embedded (`/admin` + `/api`)
- **Database:** MongoDB 7 via `@payloadcms/db-mongodb` (Mongoose)
- **Styling:** Tailwind CSS 4 + CSS custom properties (design tokens)
- **Icons:** `lucide-react`
- **i18n:** `next-intl` (`de` default, `en`) — UI chrome only, see [docs/i18n.md](docs/i18n.md)
- **Realtime board:** Hocuspocus sidecar (Yjs over WebSocket) + Excalidraw
- **AI:** Urban Agent module — Anthropic > OpenAI > Ollama fallback
- **Language/runtime:** TypeScript, ESM (`"type": "module"`), npm

### Reading & commenting the code

Comments are **English** and explain the *why*, not the *what* — they're
targeted, not exhaustive. Expect a short doc-comment header on non-obvious
modules (server actions, `lib/` helpers, API routes, module plugins) and
`// NOTE:` flags at genuine gotchas (e.g. the build-time env args, the
cookie-domain logic, the `as any` Payload slug casts). Trivial presentational
components are intentionally left uncommented. Match that bar: comment what
would otherwise need reverse-engineering, and skip the obvious.

---

## Commands

```bash
npm run dev:all          # Next (turbopack, :3000) + Hocuspocus WS sidecar (:1234); needs local MongoDB
npm run dev              # Next only (turbopack)
npm run dev:ws           # Hocuspocus WS sidecar only
npm run build            # production build
npm run start            # start production build
npm run generate:types   # REQUIRED after any Payload collection/field/global change
npm run generate:importmap  # after adding/moving a custom admin component
npm run payload          # Payload CLI (migrations etc.)
npm run seed [-- --force]  # seed demo data; --force wipes & re-seeds (needs dev server / MongoDB)
npm run lint             # next lint
npx tsc --noEmit         # typecheck (run before committing)
```

- Dev runs in tmux. npm installs are network-fragile; repair with
  `rm -rf node_modules && npm ci`.
- **Admin panel:** `http://localhost:3000/admin`.
- Hocuspocus sidecar: `http://localhost:1234` (WebSocket).

---

## Repository map

```
hocuspocus/                 # Realtime sidecar (Yjs over WebSocket, Hocuspocus)
docs/                       # deeper references (see below)
messages/                   # next-intl message catalogs: de.json, en.json
src/
  middleware.ts             # domain split (portal ↔ workspace) + next-intl
  payload.config.ts         # Payload entry: collections, globals, plugins, editor, db
  collections/              # core Payload collections (see docs/architecture.md)
  globals/                  # PlatformSettings, LegalSettings
  modules/                  # self-registering feature modules (registry.ts + index.ts)
  actions/                  # server actions (auth, join-request, polls, manage/* …)
  app/
    (payload)/              # Admin UI + Payload REST/GraphQL
    [locale]/(public)/      # Portal: frontpage, bereich/*, projekte/[slug], legal
    [locale]/(platform)/    # Workspace: login/register, dashboard/** (incl. manage/)
    api/                    # custom routes: chat/*, internal/*, rss, ics, search, urban-agent
  components/               # platform/, public/, payload/, ui/, accessibility/
  lib/                      # auth, access, visibility, theme, options, defaults, helpers
  i18n/                     # next-intl routing, navigation, request
  styles/                   # globals.css (design tokens, Tailwind)
  types/                    # shared TS types (+ generated payload-types.ts, gitignored)
```

Full inventory: [docs/architecture.md](docs/architecture.md). Project modules
and their collections: [docs/modules.md](docs/modules.md).

---

## Read before touching…

- Roles, memberships, visibility, auth → [docs/access-control.md](docs/access-control.md)
- Project modules / their collections → [docs/modules.md](docs/modules.md)
- UI copy / message catalogs → [docs/i18n.md](docs/i18n.md)
- Env vars / Docker / domains → [docs/env-reference.md](docs/env-reference.md), [docs/deployment.md](docs/deployment.md)

---

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
6. **Docs ride along** — every change that touches the architecture, data
   model, modules, access control, i18n, env vars, or commands **must update
   the affected docs and this file in the same commit series**. Stale docs are
   a bug. (See "Keep this documentation alive" below.)
7. **Barrierefreiheit (BITV 2.0 / WCAG 2.1 AA)** — every public page wraps its
   content (between `PublicNavServer` and `PublicFooter`) in
   `<main id="main-content" tabIndex={-1} className="flex-1 flex flex-col">`;
   the skip link in `[locale]/layout.tsx` targets that id. Interactive
   elements are real `<button>`/`<a>` (never click-handled divs/SVGs), rely on
   the global `:focus-visible` ring in `globals.css` (don't add bare
   `outline-none` without a replacement), and JS-driven animation must respect
   `useAccessibility().settings.reduceMotion`. Hidden-but-mounted containers
   with focusable children use `inert`, not `aria-hidden`. The Erklärung zur
   Barrierefreiheit lives at `/barrierefreiheit` (CMS field
   `legal-settings.barrierefreiheit`, fallback template in
   `src/lib/legalDefaults.ts`) — if you add or remove a11y features, update
   both the template and the statement.

---

## Conventions & gotchas

1. **Generated types.** `src/payload-types.ts` is generated and gitignored —
   never edit it. Run `npm run generate:types` after any collection/field/global
   change (see Commands). MongoDB: new optional fields need no migration; stale
   keys on old docs are simply ignored.
2. **Two domains, one deployment.** `NEXT_PUBLIC_SERVER_URL` /
   `NEXT_PUBLIC_HOCUSPOCUS_URL` are baked at Docker build time (build args), not
   runtime env. The middleware skips `/admin` and `/api` entirely; domain-splitting
   only applies to the production hostnames — localhost serves everything.
3. **Session cookie.** The `payload-token` cookie is scoped to the parent domain
   (`.urbankit.de`) in production so one login is valid on both hosts; on
   localhost it stays host-only. Logout clears both the parent-domain and the
   legacy host-only cookie.
4. **Module registry.** Each module lives in `src/modules/<id>/` with a
   `manifest.ts` (id, name, icon, hasPublicContent) and a `plugin.ts` (Payload
   plugin registering the module's collections). Modules self-register via
   `src/modules/registry.ts`; `payload.config.ts` pulls all registered plugins in.
   Adding a module = new folder + registry entry + option in `projects.modules` +
   entries in `src/lib/options/modules.ts` (labels, ordering, section grouping).
5. **Visibility model.** Content documents carry a `visibility` field
    (`PUBLIC` / `PROJECT` / `TEAM`) + optional `visibilityTeams: string[]`; a
    viewer's context (`{ tier, teams, isPM, active }`) is derived from their active
    membership and the project's `teams` catalog. Always filter with
    `visibilityWhere(ctx)` and gate with `canViewContent`/`getViewerContext` — see
    [docs/access-control.md](docs/access-control.md).
6. **Rich text.** Public-facing rich-text fields are Lexical. Server actions
   that receive Markdown convert via `markdownToLexical` (`src/lib/richtext.ts`);
   rendering on the client uses `lexicalToHtml`. Keep these two helpers in sync.
7. **Dev-server 500s** mentioning "module factory is not available" are turbopack
   HMR staleness — recompile/restart, not a code bug.
8. **Chat & Board access.** Chat is same-origin polling (`/api/chat/*`), not a
   WebSocket. The Board connects to the Hocuspocus sidecar
   (`NEXT_PUBLIC_HOCUSPOCUS_URL`) with the user's Payload JWT; the sidecar
   authorizes rooms server-to-server via `/api/internal/authorize-room` (shared
   `HOCUSPOCUS_SECRET`) and persists Yjs state through `/api/internal/board-doc`.
9. **Admin labels are localized DE-first.** All collection/global `label`,
   select `options` and admin descriptions use `{ en, de }` objects (DE is the
   source). Never add a bare German string to a field the admin renders — and
   keep shared select options (Projektthemen, Phasen, …) in the central
   helpers under `src/lib/options/` so the admin and the manage UI stay in sync.

---

## Git conventions

- Commit granularly, one concern per commit; **commit only, never push**
  unless explicitly asked.
- Message format: `VERB – details` (e.g. `FIX – Workspace module cards: …`).
  Verbs: ADD, CHANGE, FIX, REMOVE.
- No co-author trailers.

---

## Keep this documentation alive

**Rule for agents: if your code change makes any doc or `.md` file stale,
update it in the same commit series — before you call the change done.**
Documentation that describes code is only useful while it matches the code;
leaving it behind is a bug, not a chore. Prefer one own commit per doc change
(e.g. `CHANGE – docs: …`).

Which doc to touch when:

- New/removed module, collection, or field with access implications →
  [docs/modules.md](docs/modules.md), [docs/access-control.md](docs/access-control.md)
- Roles, visibility tiers, guards, auth/cookie flow → [docs/access-control.md](docs/access-control.md)
- Env vars, Docker services, domains → [docs/env-reference.md](docs/env-reference.md), [docs/deployment.md](docs/deployment.md)
- Stack, routing, realtime, theming decisions → [docs/architecture.md](docs/architecture.md)
- New locale/namespace conventions → [docs/i18n.md](docs/i18n.md)
- New commands, conventions, recurring gotchas → this file (and keep
  `CLAUDE.md` a thin importer — content belongs here, not there)
- New/renamed paths, route groups, or components inventory →
  [docs/architecture.md](docs/architecture.md), and the repository map here

Guiding principles:

- **Don't document aspirations** — write what the code does *now*.
- **Proactively fix stale docs** — if you notice a doc is already wrong while
  working on something else, fix it in the same change.
- **Never leave docs in a broken state** — a change that breaks the documented
  architecture without updating the docs is incomplete.
- This file (`AGENTS.md`) and the docs are first-class citizens of every
  change, not an afterthought.

---

## Where to look first by task

- **Add/change a project field** → `src/collections/Projects.ts`, then
  `npm run generate:types`.
- **Add a module** → new folder in `src/modules/<id>/` (manifest + plugin +
  collections), register in `src/modules/index.ts`, wire options in
  `src/lib/options/modules.ts`, then `npm run generate:types`.
- **Change access/visibility** → `src/lib/visibility.ts`, `src/lib/auth/`,
  `src/lib/access/`, plus the guards used by the action/route.
- **Workspace / module UI** → `src/app/[locale]/(platform)/dashboard/projekte/[slug]/(workspace)/`
  + `src/components/platform/modules/<id>/`.
- **Manage (PM) UI & actions** → `.../manage/` + `src/actions/manage/`.
- **Public portal** → `src/app/[locale]/(public)/` + `src/components/public/`.
- **I18n/UI copy** → `messages/de.json` + `messages/en.json` (keep key-identical).
- **Deploy / env / Docker** → `docker-compose.yml`, `Dockerfile`, `start.sh`,
  `hocuspocus/` — see [docs/deployment.md](docs/deployment.md).
- **Realtime board / chat** → `hocuspocus/server.js`, `src/app/api/internal/`,
  `src/app/api/chat/`, `src/components/platform/board/`.