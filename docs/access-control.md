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
| `status` | `requested` → `active` \| `rejected` | join-request flow; only `active` grants anything |
| `isTeam` | boolean | working-team flag; PMs count as team implicitly |

## 3. Chat room role — `chat-room-members.role`

`owner` | `member`, with its own `active`/`invited` status. Scoped to chat
only.

## Visibility tiers — `src/lib/visibility.ts`

Content documents carry a `visibility` field; viewers get a **tier** derived
from their membership:

| Viewer tier | Derived from | May see |
|---|---|---|
| `public` | no active membership (incl. logged-out) | `PUBLIC` |
| `member` | any `active` membership | `PUBLIC`, `INTERNAL` |
| `team` | `role === 'PM'` or `isTeam` | `PUBLIC`, `INTERNAL`, `TEAM` |

Helpers: `viewerTier(membership)`, `canView(tier, visibility)`,
`visibilityWhere(tier)` (Payload where-clause), `getViewerTier(payload,
userId, projectId)`. Unknown visibility values are treated as `INTERNAL`
(safe default). `Citizen` vs `Follower` makes no visibility difference today —
the effective distinction is member / team / PM.

## Guards — `src/lib/auth/`

- `getUser()` — resolve the current user from the `payload-token` cookie.
- `getProjectManagerContext(slug)` — active PM membership or `null`. Guards
  the `manage/` layout **and every manage server action** (read guard alone
  is not enough).
- `getProjectTeamContext(slug)` — tier `team` or `null`. Used by team-only
  modules (Tasks).
- `getWorkspaceContext(slug)` (`src/lib/workspace-context.ts`) — project +
  viewer membership for the workspace subtree, wrapped in `React.cache()`.
  Exposes `canManage`, `canRequestJoin`, `isActiveMember`.

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
