# Access Control & Visibility

Three independent role layers, one visibility model. The important rule:
**collection-level Payload access is coarse (`isAuthenticated`); the real
enforcement happens in server actions, route guards and query filters.**
Anything that must hold against direct API calls needs a check in the
action/route, not just in the UI.

## 1. Global user role — `users.role`

`admin` | `user` (default). Only gates the Payload admin panel
(`/admin`). Plays no part in project permissions.

## 2. Project membership — `project-memberships`

One document per user × project:

| Field | Values | Meaning |
|---|---|---|
| `role` | `PM` \| `Citizen` \| `Follower` | Projektmanager / Bürger:in / Follower |
| `status` | `requested` → `active` \| `rejected` \| `invited` | join-request flow; `active` grants full access; `invited` marks a redeemable invitation (see invite code) |
| `teams` | `string[]` | team tags (from the project's `teams` catalog); a membership tagged with a team can see `TEAM`-visibility content scoped to that team |
| `inviteCode` | `string` | PM-generated code; redeeming it flips the membership from `invited` → `active` and reassigns it to the redeeming user |

## 3. Chat room role — `chat-room-members.role`

`owner` | `member`, with its own `active`/`invited` status. Scoped to chat
only.

## Visibility tiers — `src/lib/visibility.ts`

Content documents carry a `visibility` field (`PUBLIC` | `PROJECT` | `TEAM`)
and an optional `visibilityTeams: string[]`; viewers get a **context**
(→ `ViewerContext { tier, teams, isPM, active }`) derived from their (active)
membership:

| Viewer tier | Derived from | May see |
|---|---|---|
| `public` | no active membership (incl. logged-out) | `PUBLIC` |
| `member` | any `active` membership | `PUBLIC`, `PROJECT` |
| `team` | `role === 'PM'` or `teams` non-empty | `PUBLIC`, `PROJECT`, `TEAM` (PM sees all TEAM; tagged members see TEAM with intersecting `visibilityTeams`) |

Key helpers:
- `getViewerContext(payload, userId, projectId)` — resolves the full viewer context (tier + teams).
- `getViewerTier(...)` — thin wrapper, returns scalar tier (kept for backcompat).
- `canView(tier, visibility)`, `canViewContent(membership, doc)` — pure checks for UI/guard use.
- `visibilityWhere(ctx)` — a Payload `where` clause filtering content the viewer may see (also tolerates legacy `INTERNAL` values).
- Legacy `INTERNAL` values are normalized to `PROJECT` internally (module-private `normalizeVisibility`).

`Citizen` vs `Follower` makes no visibility difference today — the effective
distinction is member / team / PM.

### Invitation flow

City staff / PMs can invite citizens directly: `generateInvite` creates an
`invited` membership with a random `inviteCode`. The code is shared with the
person (email/letter); on `/starten` they enter it, and `redeemInvite`
(logged-in user) finds the membership by code, checks `joinRequestsEnabled !==
false`, then activates it: `status → active`, `role → Citizen`, `user →`
the redeemer, `inviteCode → null`. PMs are notified. An invited-but-not-redeemed
membership grants **no project access** (it's not active) — the visitor sees only
`PUBLIC` content until the code is redeemed.

### Team catalog & scoping

- **`projects.teams: string[]`** — the PM-editable team vocabulary (catalog) for the project. Members are tagged with these names; content can be scoped to these names.
- **`project-memberships.teams: string[]`** — which teams this member belongs to.
- **Content collections (`news-posts`, `calendar-events`, `polls`, `forum-threads`, `tasks`, `file-uploads`, `folders`):** have `visibilityTeams: string[]`. When `visibility === 'TEAM'`, only active members whose `teams` intersect the doc's `visibilityTeams` may see it (PMs see all TEAM content regardless).
- Legacy `TEAM` docs without `visibilityTeams` fall back to the old behavior: any tagged member sees them.
- The manage actions (`news.ts`, `calendar.ts`, `polls.ts`, `forum.ts`) validate `visibilityTeams` against the project catalog on create/update.
- `settings.ts` provides `updateProjectTeams(slug, locale, teams: string[])` to edit the catalog.

## Guards — `src/lib/auth/`

- `getUser()` — resolve the current user from the `payload-token` cookie.
- `getProjectManagerContext(slug)` — active PM membership or `null`. Guards
  the `manage/` layout **and every manage server action** (read guard alone
  is not enough).
- `getProjectTeamContext(slug)` — tier `team` (PM or any team tag). Used by team-only
  modules (Tasks).
- `getWorkspaceContext(slug)` (`src/lib/workspace-context.ts`) — project +
  viewer membership for the workspace subtree, wrapped in `React.cache()`.
  Exposes `canManage`, `canRequestJoin`, `isActiveMember`, `teams: string[]`,
  `viewer: ViewerContext`.

## WebSocket authorization (Board)

The Hocuspocus sidecar never talks to Mongo. It calls
`POST /api/internal/authorize-room` (shared-secret header) with the client's
JWT + room name; the route verifies the JWT, checks the module is enabled,
the canvas belongs to the project, and the viewer tier is not `public`.

## Auth flow

Custom server actions (`src/actions/auth.ts`) call `payload.login()` and set
an httpOnly `payload-token` cookie — scoped to `.urbankit.de` in production so
the session spans both domains. Logout clears both the parent-domain and any
legacy host-only cookie. Payload's own `/admin` login is separate and
unaffected.