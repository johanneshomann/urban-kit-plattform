# Architecture

UrbanKIT is a civic-participation platform: a city runs public participation
projects, citizens browse them on a public portal and collaborate in a
logged-in workspace.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router, RSC-first) + React 19, Turbopack dev |
| CMS / API / Auth | Payload CMS 3 (embedded in the Next app, `/admin` + `/api`) |
| Database | MongoDB 7 (`@payloadcms/db-mongodb`) |
| Styling | Tailwind CSS 4 + CSS custom properties (design tokens) |
| i18n | next-intl (`de`, `en`) — UI chrome only, see [i18n.md](./i18n.md) |
| Realtime board | Hocuspocus sidecar (Yjs over WebSocket) + Excalidraw |
| AI | Urban Agent module — Anthropic > OpenAI > Ollama fallback |
| Language/runtime | TypeScript, ESM (`"type": "module"`), npm |

## Two domains, one deployment

The same Next.js app serves two hosts; `src/middleware.ts` enforces the split
(production hosts only — localhost serves everything):

- **`urbankit.de`** — public portal: frontpage, Bereiche, project pages,
  legal pages. Gets CDN cache headers (`s-maxage=60`).
- **`app.urbankit.de`** — logged-in workspace (`/dashboard/...`). Portal paths
  redirect back to the public domain and vice versa; `/login` + `/register`
  are reachable on both.

The session cookie (`payload-token`) is scoped to the parent domain
(`.urbankit.de`) in production so one login is valid on both hosts. After
login on the portal, the workspace opens on the app domain in a new tab
(`src/actions/auth.ts` → `LoginForm`).

## Repository map

```
hocuspocus/                 # Realtime sidecar (Yjs over WebSocket, Hocuspocus)
docs/                       # deeper references (this index)
messages/                   # next-intl message catalogs: de.json, en.json
public/                     # static assets, default project media, fonts
src/
  middleware.ts             # domain split (portal ↔ workspace) + next-intl
  payload.config.ts         # Payload entry: collections, globals, plugins, editor, db
  collections/              # core Payload collections (users, media, projects, …)
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

## Route groups

```
src/app/[locale]/
├── (public)/          # portal: frontpage, bereich/*, projekte/[slug], legal
└── (platform)/        # workspace (no URL segment of its own)
    ├── login, register
    └── dashboard/
        ├── profil, einstellungen, nachrichten
        └── projekte/[slug]/
            ├── (workspace)/         # member view: module cards, m/[moduleType]
            └── manage/              # PM-only: allgemein, module, mitglieder, …
```

`src/app/api/` adds custom routes next to Payload's: `chat/*` (polling),
`urban-agent`, `internal/*` (server-to-server for the Hocuspocus sidecar),
`health`, `rss`, `ics`, `search`.

## Data model

Core collections (`src/collections/`):

| Collection | Slug | Purpose |
|---|---|---|
| Users | `users` | Auth-enabled; roles `admin`/`user`; affiliations (citizen, student, cityEmployee, …), conditional `cityInfo` |
| Media | `media` | Uploads (absolute path, volume-backed); visibility + project + uploadedBy |
| Projects | `projects` | Title, slug, coverImage/gallery, colorScheme, projektphase (derives status), thema/stadtbereich, modules, rich-text, contact |
| Teams | `teams` | Name, slug, project relationship, optional groups array |
| ProjectMemberships | `project-memberships` | user × project; role (PM/Citizen/Follower), status (requested/active/rejected), isTeam, moduleOrder |
| Activity | `activity` | Read-only activity feed (created via `emitActivity` helper) |
| Notifications | `notifications` | Per-user notifications (created via `emitNotification` helper) |

Everything else is contributed by **modules** — see [modules.md](./modules.md)
for the full collection inventory per module.

Globals (`src/globals/`):

| Global | Slug | Purpose |
|---|---|---|
| PlatformSettings | `platform-settings` | City name/logo, hero slideshow, joinRequest flag, all platform color tokens (`--plattform-*`, `--projekte-*`, …) — tabbed admin (Allgemein / Farben) with native color-picker fields + reset-to-defaults |
| LegalSettings | `legal-settings` | Tabbed legal + contact: impressum, datenschutz, cookies (localized) + contact details |

## Access control

Three independent role layers (global admin, per-project membership role,
chat-room role) collapse into a 3-tier visibility model (`PUBLIC` /
`INTERNAL` / `TEAM`). Collection-level Payload access is intentionally coarse;
real enforcement lives in server actions and route guards. See
[access-control.md](./access-control.md).

## Modules

Each module in `src/modules/<id>/` self-registers via `src/modules/registry.ts`
with a `manifest.ts` (id, name, icon, hasPublicContent) and a `plugin.ts`
(Payload plugin registering the module's collections). `payload.config.ts`
pulls all registered plugins in. Projects enable a subset via `projects.modules`
(default: `news`, `calendar`). See [modules.md](./modules.md).

## Realtime

- **Board**: the browser connects to the Hocuspocus sidecar
  (`NEXT_PUBLIC_HOCUSPOCUS_URL`) with the user's Payload JWT as token. The
  sidecar authorizes rooms server-to-server against
  `/api/internal/authorize-room` (shared `HOCUSPOCUS_SECRET`) and persists
  Yjs state through `/api/internal/board-doc`. Room name format:
  `board:<projectSlug>:<canvasId>`.
- **Chat**: no WebSocket — same-origin polling against `/api/chat/*`
  (message poll + typing + read receipts), rendered as a popup from the
  platform header.

## Theming

`PlatformSettings` colors become CSS custom properties (`--plattform-*`,
`--projekte-*`, …) injected at the root via `src/lib/theme.ts`. Inside a
project, a theme scope sets `--project-*` vars so the header and workspace
"chameleon" into the project's color scheme with a CSS transition (see
`PlatformHeader.tsx`).

## Development runtime

```bash
npm run dev:all   # Next (turbopack) + Hocuspocus sidecar, needs local MongoDB
npm run generate:types   # after any collection/field change
```

Deployment is Docker Compose (`web` + `hocuspocus` + `mongo`) — see
[deployment.md](./deployment.md).