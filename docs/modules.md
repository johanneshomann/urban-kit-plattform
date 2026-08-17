# Module System

Project features are packaged as **modules** under `src/modules/`. A project
enables a subset via its `modules` select field (default: `news`,
`calendar`); the PM toggles them in manage → Module.

## Anatomy of a module

```
src/modules/<id>/
├── manifest.ts      # { id, name, icon, hasPublicContent }
├── plugin.ts        # Payload plugin: registers the module's collections
├── collections/     # module-owned collections (e.g. news-posts)
├── actions/         # server actions (optional)
└── components/      # module UI (optional; most UI lives in
                     # src/components/platform/modules/<id>/)
```

Modules self-register in `src/modules/index.ts` via
`moduleRegistry.register(manifest, plugin)` (`src/modules/registry.ts`);
`payload.config.ts` pulls all registered plugins in. Adding a module = new
folder + registry entry + option in `projects.modules` + entries in
`src/lib/options/modules.ts` (labels, ordering, section grouping).

## Current modules

| id | Collections | Notes |
|---|---|---|
| `news` | news-posts, news-comments | |
| `calendar` | calendar-events, event-attendees | |
| `polls` | polls, poll-questions, poll-options, poll-votes | |
| `forum` | forum-threads, forum-comments, forum-thread-votes | |
| `tasks` | tasks, task-columns, task-assignees | TEAM-only (Aufgaben board) |
| `board` | board-canvases | Excalidraw + Yjs via Hocuspocus |
| `files` | file-uploads, folders | has public content |
| `urban-agent` | — | LLM chat (Vercel AI SDK, one selected provider — see `urban-agent-settings` global + `docs/env-reference.md`). Route enforces membership + module-enabled + per-user rate limit + daily ceiling |

## Where modules surface

- **Workspace** (`(workspace)/page.tsx`): module cards in two sections —
  Mitmachen (participate) and Zusammen arbeiten (collaborate, active members
  only). Users can drag-reorder; the order is stored per membership
  (`project-memberships.moduleOrder`) and filtered against the currently
  active modules on read. Chat is NOT a module: it is platform-wide (floating
  `ChatLauncher` in the dashboard layout, collections chat-rooms /
  chat-room-members / chat-messages); projects only structure the room list —
  project rooms plus groups assigned via the per-project setting
  `chatGroupAssignmentEnabled`.
- **Module page** (`(workspace)/m/[moduleType]/page.tsx`): consumption view;
  404s when the module isn't enabled.
- **Manage** (`manage/inhalte/[moduleType]`): PM content editing, driven by
  `MANAGE_MODULES`.
- **Public project page** (`(public)/projekte/[slug]/page.tsx`): renders
  public content for enabled modules whose manifest says
  `hasPublicContent` (news, calendar, polls, files) — always filtered with
  `visibilityWhere('public')`.

## Rules of thumb

- Every module collection needs a `project` relationship and (if it has
  reader-facing content) a `visibility` field checked via
  `src/lib/visibility.ts`.
- Gate every entry point on `project.modules.includes(<id>)` — the module
  being disabled must 404, including for PMs.
- Run `npm run generate:types` after touching any collection.
