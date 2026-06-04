# Urban Kit v2 — Build Plan (Payload CMS)

## Vision

A self-hosted city collaboration platform. One city operates one instance on its own infrastructure.
Two domains, one Next.js + Payload codebase:

- `urbankit.de` — public civic portal (no login): project discovery, public news/events/polls, platform pages
- `app.urbankit.de` — internal workspace (login required): teams, modules, collaboration

Both served from one Docker stack. Both managed from one Payload admin.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| CMS / Backend | Payload CMS 3.x |
| Database | PostgreSQL 16 (Payload Drizzle adapter) |
| Auth | Payload built-in (replaces Auth.js) |
| UI | shadcn/ui + Radix UI + Tailwind CSS v4 |
| Rich text | Payload Lexical |
| Real-time | Yjs + Hocuspocus (Docker sidecar) |
| Board | TLDraw v3 + Yjs |
| Drag-and-drop | dnd-kit |
| Files | MinIO S3-compatible (Docker sidecar) |
| AI | Vercel AI SDK (Ollama / OpenAI / Anthropic via env) |
| Email | Nodemailer (any SMTP) |
| Search | PostgreSQL full-text via Payload |
| i18n | next-intl (de + en) |
| Deployment | Docker Compose |

> **License check (Phase 0):** Verify TLDraw v3 license terms permit distribution as part of a self-hosted product delivered to city clients. Confirm Payload 3.x + Drizzle + Tailwind v4 + next-intl version compatibility in a throwaway install before committing the full stack.

---

## Docker Services

```yaml
services:
  web:          # Next.js + Payload — serves both domains
  postgres:     # PostgreSQL 16
  minio:        # MinIO (S3-compatible file storage)
  redis:        # Redis 7 (cache, rate limiting)
  hocuspocus:   # Node.js WebSocket server (real-time Chat + Board)
```

Production compose adds: health checks, restart policies, named volumes, resource limits.

> **Scaling note:** The `web` container serves both the authenticated app and the public portal. Public (`urbankit.de`) routes are read-only and cacheable — plan a reverse-proxy/CDN cache layer in front of `urbankit.de` from Phase 0 to avoid traffic spikes (e.g. a controversial poll going local news) hitting the same process as authenticated users.

---

## Domain Routing

`src/middleware.ts` reads the `Host` header:

- `urbankit.de` → `src/app/(public)/` routes (civic portal, no auth required)
- `app.urbankit.de` → `src/app/(app)/` routes (workspace, auth required)
- `/admin` → Payload Admin UI (Platform Managers only)

> **Tailwind scope:** Tailwind v4 globals must be scoped so they never leak into the `/admin` route. Payload 3 ships its own admin styling — conflicting global resets will break it.

---

## Architectural Decisions (resolve before Phase 1)

These three decisions are load-bearing. Write an ADR for each and keep them in `docs/adr/`.

### ADR-1: Hocuspocus ↔ Payload Authorization

Hocuspocus runs as a separate Node sidecar without access to Payload's request context or access-control functions. The 4-step access-control chain (auth → membership → role → visibility) does **not** automatically apply to WebSocket connections.

**Decision:** Hocuspocus validates connections via an internal Payload endpoint:

```
POST /api/internal/authorize-room
Body: { token, roomName }
Returns: { authorized: boolean, userId, role }
```

Hocuspocus `onAuthenticate` calls this endpoint server-to-server. Authorization logic stays single-sourced in Payload. The `roomName` encodes project + resource (e.g. `board:projectSlug:canvasId`) so Payload can enforce project membership and role from its own collections.

### ADR-2: Board / Yjs Persistence Strategy

TLDraw v3 produces a live Yjs document in Hocuspocus memory and a JSON snapshot in Postgres. Keeping both casually in sync creates data-loss bugs (last-writer-wins clobbering, snapshot taken mid-edit, sidecar restart losing unsaved state).

**Decision:** The Yjs update log is the authoritative source of truth. Persistence uses Hocuspocus's built-in database extension to write binary Y.Doc updates to Postgres (a `yjs-updates` column on `board-canvases`, or a separate `board-updates` table). The JSON snapshot field is derived/read-only — rebuilt from the Yjs log on demand for Payload queries, not written independently.

### ADR-3: Payload Local API `overrideAccess` Policy

The Payload Local API defaults `overrideAccess: true`, silently bypassing all access control. This is the most common Payload security mistake and would leak data on a civic platform with real role boundaries.

**Decision:** All server actions and internal helpers that act on behalf of a user **must** use a shared wrapper:

```ts
// src/lib/payload-client.ts
export function payloadAs(user: User) {
  return { overrideAccess: false, user }
}
// Usage in every server action:
await payload.find({ collection: 'news-posts', ...payloadAs(user) })
```

`overrideAccess: true` is only permitted in seed scripts and platform-manager-only admin operations, and must be accompanied by an explanatory comment. Enforce via ESLint rule or code review checklist.

---

## Collections

### Core

| Collection | Key fields |
|---|---|
| `users` | Payload built-in + `isPlatformManager`, `avatar`, `bio`, `notificationPrefs` |
| `color-schemes` | Seeded. CSS variable sets (5–10 predefined) |
| `activity` | Append-only log. `type`, `user`, `project`, `reference` |
| `notifications` | `user`, `type`, `read`, `reference` |

### Globals

| Global | Notes |
|---|---|
| `platform-settings` | Instance name, join request toggle |
| `platform-pages` | Editable static pages: Grundlagen, Zusammenarbeit, Impressum, Mitmachen |

### Project / Team Structure

| Collection | Key fields |
|---|---|
| `projects` | `title`, `slug`, `description`, `colorScheme`, `isPublic`, `joinRequestsEnabled`, `status` |
| `teams` | `name`, `slug`, `groups` (embedded array — see note) |
| `project-memberships` | `user`, `project`, `role` (PM / CM / Citizen / Follower) |
| `content-manager-assignments` | `user`, `project`, `team` |
| `project-modules` | `project`, `moduleType`, `enabled` |

> **Groups decision (Phase 2):** `teams.groups` is an embedded array. If `content-manager-assignments` or any other entity ever references a group by ID, promote groups to a standalone collection before Phase 2 ships. Confirm in Phase 2 planning — don't let this drift.

### Module Collections (one Payload plugin per module)

| Module | Collections |
|---|---|
| News | `news-posts` |
| Calendar | `calendar-events` |
| Polls | `polls`, `poll-questions`, `poll-options`, `poll-votes` |
| Files | `folders`, `file-uploads` |
| Tasks | `task-columns`, `tasks`, `task-assignees` |
| Forum | `forum-threads`, `forum-comments` |
| Chat | `chat-channels`, `chat-messages`, `direct-conversations` |
| Board | `board-canvases` (Yjs update log + derived JSON snapshot — see ADR-2) |
| Urban Agent | No collection — custom API routes + Vercel AI SDK |

All content collections share common fields: `projectModule`, `visibility` (PUBLIC / INTERNAL / TEAM), `visibilityTeam`, `slug`, `author`.

---

## Visibility Model

Three levels apply to all content: `PUBLIC` / `INTERNAL` / `TEAM`.

**Clarified boundaries:**

| Viewer | PUBLIC content | INTERNAL content | TEAM content |
|---|---|---|---|
| Anonymous (public portal) | ✓ | ✗ | ✗ |
| Follower (logged in) | ✓ | ✗ | ✗ |
| Citizen | ✓ | ✓ | if member of `visibilityTeam` |
| Content Manager | ✓ | ✓ | if member of `visibilityTeam` |
| Project Manager | ✓ | ✓ | ✓ |
| Platform Manager | ✓ | ✓ | ✓ |

> **Follower vs. anonymous:** A logged-in Follower gets the same content access as an anonymous visitor. The Follower role exists for notifications (invited, poll closed, new public content) and to appear in a project's follower count. This distinction must be explicit in access-control functions — don't conflate auth state with content permission.

**Explicit exceptions to the standard access-control chain:**

1. **Direct Messages (Phase 11):** DMs are platform-wide and not project-scoped. They bypass the 4-step chain entirely. Access rule: only the two participants of a `direct-conversation` can read/write its messages. Implement as a standalone access-control function, not a variant of the project chain.

2. **Public poll voting without login (Phase 6):** Voting on a PUBLIC poll does not require auth. Ballot integrity must be enforced: one vote per anonymous session (signed cookie) + rate limiting via Redis. IP alone is insufficient for a civic platform. Define this before Phase 6, not during.

---

## Module Plugin Pattern

Every module is a Payload plugin:

```
src/modules/news/
  plugin.ts              ← registers collections, hooks, endpoints with Payload
  collections/
    news-posts.ts        ← Payload collection config + access control
  components/
    news-list.tsx
    news-editor.tsx
    news-dashboard-card.tsx
  actions/
    index.ts             ← server actions using Payload Local API (always via payloadAs(user))
  manifest.ts            ← id, name, icon, hasPublicContent
```

`src/modules/registry.ts` imports all plugins.
`payload.config.ts` loads them via the registry.

Access control on every collection checks in order:
1. Is the user authenticated?
2. Are they a member of this project?
3. Does their role allow this operation?
4. Does the content `visibility` permit this read?

> All server actions use `payloadAs(user)` (ADR-3). `overrideAccess: true` is never used inside a module.

---

## Core APIs (shared, not per-module)

Three utilities live in `src/lib/` and are consumed by all modules. They are never reimplemented per-module.

| Utility | Location | Purpose |
|---|---|---|
| `payloadAs(user)` | `src/lib/payload-client.ts` | Enforces `overrideAccess: false` on all Local API calls (ADR-3) |
| `resolveReference(ref)` | `src/lib/content-reference.ts` | Typed cross-module reference resolver. Handles deleted/visibility-changed targets |
| `emitActivity(event)` / `emitNotification(event)` | `src/lib/events.ts` | Single entry point for activity log + notification creation |

**Content reference contract:** When a chat message embeds a reference to another collection, `resolveReference` checks at render time that the referenced document still exists and that the requesting user can see it (applies the 4-step chain). If not, it renders a "content unavailable" fallback — never a leak.

---

## Module Enable/Disable Semantics

Defined here in Phase 3, applied consistently to all modules:

- **Disabling a module** hides its UI (dashboard card, floating menu entry, routes return 404) but **preserves all data**.
- Re-enabling restores full access to existing content.
- Data is only deleted if the Platform Manager explicitly chooses "delete module data" (a destructive confirmation step, separate from the toggle).
- Access-control functions on module collections check `project-modules.enabled` before checking role/visibility — a disabled module's content is inaccessible regardless of role.

---

## Roles

| Role | Scope | Flag / Table |
|---|---|---|
| Platform Manager | Platform-wide | `isPlatformManager` on User |
| Project Manager | Per project | `project-memberships` role=PM |
| Content Manager | Per team within project | `project-memberships` role=CM + `content-manager-assignments` |
| Citizen | Per project | `project-memberships` role=Citizen |
| Follower | Per project | `project-memberships` role=Follower |

---

## Phases

---

### Phase 0 — Bootstrap

- `npx create-payload-app` → Next.js template, name `urban-kit`
- **Version pin matrix:** verify Payload 3.x + Drizzle + Tailwind v4 + next-intl + shadcn/ui compatibility; lock versions in `package.json`
- **TLDraw license check:** confirm v3 license permits self-hosted distribution to city clients
- Configure PostgreSQL adapter (Drizzle)
- Install Tailwind v4, shadcn/ui, Radix — scope Tailwind so it never touches `/admin`
- Docker Compose: `postgres`, `minio`, `redis`, `hocuspocus`, `web`
- Dockerfile for `web` (multi-stage, production-ready)
- Hostname middleware (`urbankit.de` vs `app.urbankit.de`)
- `next-intl` setup (de + en, `/messages/`)
- MinIO bucket init (`project-files`, `media`)
- Nodemailer config (env-based SMTP)
- Module system skeleton: manifest type, registry, catch-all route
- **Reverse-proxy / CDN cache config stub** for `urbankit.de` public routes (even if not active yet)
- **Write ADR-1, ADR-2, ADR-3** (see Architectural Decisions above)

**Result:** Stack runs in Docker. Empty shell builds. Domain routing works. All load-bearing architectural decisions documented.

---

### Phase 1 — Users, Auth & Platform Core

- Extend Payload `users` collection: `isPlatformManager`, `avatar`, `bio`, `notificationPrefs`
- `platform-settings` global
- `platform-pages` global (Grundlagen, Zusammenarbeit, Impressum, Mitmachen)
- `color-schemes` collection + seed script
- **`src/lib/payload-client.ts`** — `payloadAs(user)` wrapper (ADR-3); all subsequent server actions use this from day one
- **`src/lib/events.ts`** — `emitActivity` + `emitNotification` helpers (stubs for now, wired up in Phase 3)
- Platform Manager access control pattern
- Payload Admin: dark theme shell, custom nav for platform management
- Payload Admin: users table
- App: registration page, login/logout, user home (empty project list)
- App: profile + account settings
- App: notification bell (shell — no notifications yet)
- App: top bar (☰ floating menu, breadcrumb, search placeholder, avatar menu)
- Public portal: homepage, static platform pages (reads from `platform-pages` global)

**Result:** Auth works. Platform Managers access admin. Public portal homepage renders. Core API utilities in place.

---

### Phase 2 — Projects & Teams

- **Confirm groups decision:** check whether `content-manager-assignments` references groups by ID; if yes, promote `groups` to a standalone collection before implementing
- `projects`, `teams`, `project-memberships`, `content-manager-assignments`, `project-modules` collections
- Access control functions for all project-level roles (in `src/lib/access/`)
- Platform Manager: create project (title, slug, description, color scheme, initial team, assign PM)
- Project dashboard shell (top bar, floating ☰ menu, breadcrumb)
- Color scheme applied via CSS variable wrapper class
- Project settings (PM: edit info, color scheme, join requests toggle)
- Team management (PM creates teams, assigns CMs)
- Internal teams page (members, groups)
- Add/remove users to project
- User home: project cards with color schemes
- Public portal: project listing page (`/projekte`)
- Public portal: public project page shell (`/projekte/[slug]`)
- Public team page (`/teams/[slug]`)
- Follow project (Follower role)
- Join request form + PM approval flow

**Result:** Full project/team lifecycle. Roles enforced. Public project pages visible.

---

### Phase 3 — Module System, Visibility & Activity

- Module toggle UI in project settings (PM activates/deactivates)
- Module enable/disable semantics enforced (see Module Enable/Disable Semantics above)
- Module registry loads all plugins into `payload.config.ts`
- Dashboard grid: only active module cards shown
- Floating menu: only active modules listed
- Catch-all route: `/projects/[slug]/m/[moduleType]` renders active module view
- `activity` collection + `emitActivity` helper wired (was stubbed in Phase 1)
- Activity dashboard card (latest 5 events)
- **`src/lib/content-reference.ts`** — typed reference resolver with visibility enforcement and "content unavailable" fallback
- **Visibility matrix spike:** take one trivial collection through the full access-control chain end-to-end — anonymous public, Follower, Citizen, INTERNAL hidden from public, TEAM scoped. Prove the pattern works before replicating to 8 modules.
- Content visibility system: PUBLIC / INTERNAL / TEAM applied on all collection reads
- Floating `[+]` create button with module selector
- **Access-control integration tests** for the visibility matrix (anonymous / Follower / Citizen / CM / PM / Platform Manager × PUBLIC / INTERNAL / TEAM). These tests are a definition-of-done for Phase 3 and the baseline for all subsequent module phases.

**Result:** Module framework live. Activity feed works. Dashboard is dynamic. Visibility pattern proven and tested before any content module is built.

---

### Phase 4 — News Module

- `news-posts` collection: title, slug, content (Lexical), featuredImage, gallery, visibility, publishedAt, projectModule
- Server actions: create, update, publish, delete (all via `payloadAs(user)`)
- News list, editor page, dashboard card
- Floating menu: recent posts as sub-entries
- Public portal route: `/projekte/[slug]/news/[postSlug]`
- Activity: "Post published" via `emitActivity`
- Payload media collection for Lexical image uploads (stored in MinIO)
- Access-control tests: verify visibility matrix applies correctly to `news-posts`

**Result:** First module end-to-end. Pattern established for all content modules.

---

### Phase 5 — Calendar Module

- `calendar-events` collection: title, slug, content (Lexical), startDate, endDate, location, category, visibility, projectModule
- Editor, agenda list view, dashboard card
- Floating menu: upcoming events as sub-entries
- Public portal route: `/projekte/[slug]/calendar/[eventSlug]`
- Activity: "Event created", "Event updated"
- Access-control tests for `calendar-events`

---

### Phase 6 — Polls Module

- **Design ballot integrity before implementation:** anonymous public voting uses a signed cookie (one vote per browser session) + Redis rate limiting. Define the exact mechanism and test it before building the voting UI.
- `polls`, `poll-questions`, `poll-options`, `poll-votes` collections
- `poll-votes` access control: authenticated votes tied to user ID; anonymous votes tied to signed session token (no duplicate allowed)
- Poll builder (add/remove questions, types, options)
- Voting UI with anonymous support (per-poll setting)
- Results view (bar charts, live results option)
- Poll list with status badges (active, closed)
- Dashboard card: active poll count
- Public portal route: `/projekte/[slug]/poll/[pollSlug]` (public voting without login)
- Activity: "Poll created", "Poll closed"
- Access-control tests: authenticated voting, anonymous voting, duplicate vote rejection

---

### Phase 7 — Files Module

- `folders`, `file-uploads` collections
- Presigned URL upload direct browser → MinIO
- Folder browser with breadcrumb navigation
- Drag-and-drop upload area
- Visibility inherited from parent folder
- Dashboard card: recent uploads
- Public file download route
- Activity: "File uploaded", "Folder created"
- Access-control tests for `folders` and `file-uploads`

---

### Phase 8 — Tasks Module

- `task-columns`, `tasks`, `task-assignees` collections
- dnd-kit: drag cards between columns, reorder columns
- Task detail dialog: description (Lexical), assignees, deadline, dependencies, `showInCalendar`
- Kanban board view
- Dashboard card: progress bar (done / total)
- Floating menu: recent tasks as sub-entries
- Calendar integration: tasks with `showInCalendar` appear in Calendar view
- Activity: "Task created", "Task completed", "Task status changed"
- Access-control tests for `tasks`

---

### Phase 9 — Forum Module

- `forum-threads`, `forum-comments` collections
- Thread list with category badges
- Thread detail: opening post + comment thread
- Dashboard card: latest threads
- Public portal route: `/projekte/[slug]/forum/[threadSlug]`
- Activity: "Thread created"
- Access-control tests for `forum-threads` and `forum-comments`

---

### Phase 11 — Chat Module

- `chat-channels`, `chat-messages`, `direct-conversations` collections
- **DM access control:** standalone function (not a variant of the project chain) — only conversation participants can read/write. Implemented and tested before the UI is built.
- **Hocuspocus auth integration (ADR-1):** implement `/api/internal/authorize-room` endpoint; wire into Hocuspocus `onAuthenticate`; test with a real WebSocket client before building chat UI
- Channel list + message area
- Project-scoped channels and team channels
- Direct messages (platform-wide, not project-scoped)
- DM accessible from user profile or avatar click
- File/image attachments in messages
- Content references in messages via `resolveReference`
- Dashboard card: unread count
- Activity: "Channel created"
- Access-control tests: channel access by role, DM participant enforcement, unauthorized room rejection at WebSocket level

**Result:** Real-time chat works. Hocuspocus authorization proven for Phase 12.

---

### Phase 12 — Board Module

- `board-canvases` collection with Yjs update log (ADR-2): `yjs_updates` binary column; derived JSON snapshot for Payload queries
- Hocuspocus database extension persists binary Y.Doc updates to Postgres — Yjs log is the authoritative source of truth
- TLDraw v3 + Yjs bindings
- Hocuspocus room per canvas — reuses ADR-1 authorization from Phase 11
- Full-screen canvas view
- Custom TLDraw shapes: interactive buttons linking to project content (via `resolveReference`)
- Canvas state persistence: Hocuspocus writes Yjs updates; JSON snapshot rebuilt on demand
- Dashboard card
- Activity: "Board updated"
- Test: sidecar restart does not lose board state (Yjs log survives in Postgres)

---

### Phase 13 — Urban Agent Module

- Vercel AI SDK (provider-agnostic: Ollama / OpenAI / Anthropic via env)
- Context assembly from project collections via Payload Local API (all via `payloadAs(user)` — agent only surfaces content the user can access)
- Streaming chat UI with suggested prompts
- AI tools: `getProjectSummary`, `searchContent`, `draftNewsPost`, `createTask`
- No activity tracking (interactions are private)

---

### Phase 14 — Search & Notifications

- PostgreSQL full-text search (tsvector + GIN indexes on searchable collections via Payload hooks)
- Search bar in top bar, project-scoped
- Results grouped by module type; visibility-filtered (uses `payloadAs(user)`)
- `notifications` collection + `emitNotification` helper wired (was stubbed in Phase 1)
- Triggers: invited to project, task assigned, poll closed, join request, new public content
- Notification bell dropdown: list, mark read, mark all read
- User home: per-project notification count badges
- Email notifications (opt-in per user via `notificationPrefs`)

---

### Phase 15 — Public Portal (urbankit.de)

The civic-facing front door. No login required. Reads from existing collections with PUBLIC visibility filter.

- Public homepage: platform name, active projects overview, recent public activity
- `/projekte` — filterable project browser (status, category, search)
- `/projekte/[slug]` — full public project page (news, events, polls, pages)
- `/teams/[slug]` — public team page (cross-project)
- Platform pages rendered from `platform-pages` global: Grundlagen, Zusammenarbeit, Impressum, Mitmachen
- Accessible navigation (flyout menu, keyboard)
- SEO: sitemap, `og:` tags, canonical URLs
- RSS feed for public news posts
- **Activate CDN/reverse-proxy cache** for all `(public)` routes (stubbed in Phase 0)

No new collections needed — this phase is entirely frontend routes reading existing data.

---

### Phase 16 — Polish & Hardening

- Responsive + mobile testing across all views
- Empty states for all modules and dashboard cards
- Error pages: 404, 403, 500
- Loading states and skeleton screens
- Accessibility audit (keyboard navigation, ARIA, screen readers)
- Performance audit (bundle size, RSC optimization, image optimization)
- Security audit: access control on all routes, visibility enforcement, `overrideAccess` audit (grep for any non-approved uses), input sanitization
- Seed script: demo project, teams, realistic content
- Documentation: deployment guide, admin guide, env variable reference
- Production Docker Compose: health checks, restart policies, named volumes, resource limits

**Result:** Production-ready for deployment on city infrastructure.

---

## Phase Summary

| Phase | What | Depends on |
|---|---|---|
| 0 | Bootstrap + Docker + ADRs | — |
| 1 | Users, Auth, Platform Core + Core API utilities | 0 |
| 2 | Projects & Teams | 1 |
| 3 | Module System, Visibility & Activity (proven + tested) | 2 |
| 4 | News Module | 3 |
| 5 | Calendar Module | 3 |
| 6 | Polls Module (ballot integrity designed first) | 3 |
| 7 | Files Module | 3 |
| 8 | Tasks Module | 3, benefits from 5 |
| 9 | Forum Module | 3 |
| 10 | Chat Module (Hocuspocus auth wired) | 3 |
| 11 | Board Module (Yjs persistence via ADR-2) | 10 |
| 12 | Urban Agent | 3, benefits from 4–9 |
| 13 | Search & Notifications | 4–9 |
| 14 | Public Portal (CDN cache activated) | 4–9 |
| 15 | Polish & Hardening | All |

Phases 4–9 can be built in any order after Phase 3.
