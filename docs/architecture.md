# Architecture

UrbanKIT is a civic-participation platform: a city runs public participation
projects, citizens browse them on a public portal and collaborate in a
logged-in workspace.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router, RSC-first) + TypeScript |
| CMS / API / Auth | Payload CMS 3 (embedded in the Next app, `/admin` + `/api`) |
| Database | MongoDB (`@payloadcms/db-mongodb`) |
| Styling | Tailwind CSS 4 + CSS custom properties (design tokens) |
| i18n | next-intl (`de`, `en`) — see [i18n.md](./i18n.md) |
| Realtime board | Hocuspocus sidecar (Yjs over WebSocket) + Excalidraw |
| AI | Urban Agent module — Anthropic > OpenAI > Ollama fallback |

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
`health`.

## Data model

Core collections (`src/collections/`): `users`, `media`, `projects`, `teams`,
`project-memberships`, `activity`, `notifications`.
Globals (`src/globals/`): `PlatformSettings` (city name, colors → CSS vars via
`src/lib/theme.ts`), `PlatformPages`, `LegalSettings` (the only localized
content).

Everything else is contributed by **modules** — self-contained feature packages
(news, calendar, polls, forum, tasks, chat, board, files, urban-agent) that
register their own Payload collections via a plugin registry. See
[modules.md](./modules.md).

## Access control

Three independent role layers (global admin, per-project membership role,
chat-room role) collapse into a 3-tier visibility model (`PUBLIC` /
`INTERNAL` / `TEAM`). Collection-level Payload access is intentionally coarse;
real enforcement lives in server actions and route guards. See
[access-control.md](./access-control.md).

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
`--projekte-*`, …) injected at the root. Inside a project, a theme scope sets
`--project-*` vars so the header and workspace "chameleon" into the project's
color scheme with a CSS transition (see `PlatformHeader.tsx`).

## Development runtime

```bash
npm run dev:all   # Next (turbopack) + Hocuspocus sidecar, needs local MongoDB
npm run generate:types   # after any collection/field change
```

Deployment is Docker Compose (`web` + `hocuspocus` + `mongo`) — see
[deployment.md](./deployment.md).
