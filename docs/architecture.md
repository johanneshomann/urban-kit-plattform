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
  components/               # platform/, public/ (incl. SectionDotsNav), payload/, ui/, accessibility/
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
        └── projekte/[slug]/         # shell layout: theme scope + ProjectSidebar
            ├── (workspace)/         # member view: overview cards, info, m/[moduleType]
            └── manage/              # PM-only: allgemein, module, mitglieder, …
```

`projekte/[slug]/layout.tsx` is the shell for both subtrees: it resolves
`getWorkspaceContext` (React.cache — shared with the pages), scopes the
`--project-*` vars and renders the persistent project navigation —
`ProjectSidebar` (≥ lg, dual-mode: citizen workspace / PM manage) and
`ProjectTabBar` (< lg, bottom tabs + "Mehr" sheet). The nav's tier-filtered
module lists are presentation only; `manage/layout.tsx` keeps the
`getProjectManagerContext` guard and every module page keeps its own
module-enabled + visibility checks.

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
| PlatformSettings | `platform-settings` | City identity (name/logo), hero slideshow, joinRequest flag, all platform color tokens (`--plattform-*`, `--projekte-*`, …) — tabbed admin (Stadt / Allgemein / Farben) with native color-picker fields + reset-to-defaults; no free-text description (homepage copy is i18n-hardcoded) |
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
  (message poll + typing + read receipts), rendered in the floating
  `PlatformDock`.

## Theming

`PlatformSettings` colors become CSS custom properties (`--plattform-*`,
`--projekte-*`, …) injected at the root via `src/lib/theme.ts`. Inside a
project, a theme scope sets `--project-*` vars so the project navigation and
workspace "chameleon" into the project's color scheme with a CSS transition.

Project palettes use the **same role structure as the Bereiche**, so a project
palette and a Bereich palette are interchangeable. Seven tokens, defined in
`src/lib/defaults/colorSchemes.ts` and mapped to CSS vars by the single
`schemeToCssVars` in `src/lib/colorScheme.ts`:

| Token | Role | Bereich equivalent |
|---|---|---|
| `--project-light` | page / section background | `light` |
| `--project-general` | pastel brand surface | `main` |
| `--project-dark` | chip / badge surface, carries `black` | `dark` |
| `--project-accent` | darkest tone: text, links, solid buttons | — |
| `--project-ink` | muted body copy | `--plattform-ink` |
| `--project-black` | headings, text on `general` / `dark` | `on-brand` |
| `--project-white` | near-white surface, text on `accent` | — |

Which pairings are allowed follows from measured contrast, not taste: text uses
`accent` / `ink` / `black` on `white` / `light` / `general`; a chip is `black`
on `dark`; a button is `white` on `accent`. **`white` on `dark` is not a valid
pair** — it tops out at 2.9:1, and that combination was the AA failure this
structure replaced. The gate and the derivation live in
`.claude/plan/project-color-tokens.md`.

Two consequences worth remembering:

- **Never dim project text with `opacity`.** A token that passes at full
  strength fails at 0.6. Use `--project-ink` for muted copy instead.
- **Anything rendering a palette must go through the vars**, not raw hex from
  `resolveColorScheme`. The high-contrast preset overrides `--project-*`, so
  inline hex silently escapes it. Components that show several projects at once
  (`ProjectPillList`) paint `schemeToCssVars` onto a `data-project-theme`
  wrapper per card, which the preset targets explicitly.

The logged-in area has **no header bar**: `dashboard/layout.tsx` renders only
`<main id="main-content">` plus the floating `PlatformDock` (chat + activity,
two tabs). Project navigation — and the account controls (`SidebarUserBar`:
profile, language, back to the public site, logout) — live in
`ProjectSidebar` / `ProjectTabBar`.

## Accessibility (BITV 2.0 / WCAG 2.1 AA)

User preferences (font scale, reduced motion, high contrast, underlined
links) live in `src/lib/accessibility.ts` + `components/accessibility/`
(provider, floating panel), persisted in localStorage `uk-a11y` and applied
as `a11y-*` classes on `<html>` — a pre-paint script in `[locale]/layout.tsx`
avoids a flash. `globals.css` holds the matching CSS: the high-contrast
preset remaps all token families (incl. `--project-*` and
`[data-project-theme]` wrappers) to black/white, a global `:focus-visible`
two-layer ring, the `.skip-link`, and reduced-motion rules (both the manual
class and the OS media query). Every public page provides
`<main id="main-content" tabIndex={-1}>` as the skip-link target (Hard rule 7
in AGENTS.md). The Erklärung zur Barrierefreiheit is served at
`/barrierefreiheit` from `legal-settings.barrierefreiheit`, falling back to
the bundled template in `src/lib/legalDefaults.ts` when the field is empty.

## Development runtime

```bash
npm run dev:all   # Next (turbopack) + Hocuspocus sidecar, needs local MongoDB
npm run generate:types   # after any collection/field change
```

Deployment is Docker Compose (`web` + `hocuspocus` + `mongo`) — see
[deployment.md](./deployment.md).