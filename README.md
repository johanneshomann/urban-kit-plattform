<!--
SPDX-FileCopyrightText: 2026 Johannes Homann

SPDX-License-Identifier: EUPL-1.2
-->

# UrbanKIT – Plattform

The digital **civic-participation platform** of a city: a public portal
(`urbankit.de`) lets anyone browse participation projects; a logged-in
workspace (`app.urbankit.de`) provides per-project collaboration through
swappable feature **modules** — news, calendar, polls, forum, tasks, chat,
whiteboard, files and an AI assistant. One Next.js App Router app with
Payload CMS 3 embedded.

> **German-first.** UI copy, field names and content default to German (`de`);
> English (`en`) is a fallback. This README is in English for tooling and
> contributors.

---

## Features

- 🏛️ **Public portal** with project overview, archive and CMS-managed pages.
- 🧩 **Project workspaces** with toggleable modules (news, calendar, polls,
  forum, tasks, chat, board, files, urban-agent).
- 🖊️ **Collaborative realtime whiteboard** — Excalidraw synced via a
  Hocuspocus/Yjs WebSocket sidecar.
- 🤖 **Urban Agent** — provider-agnostic AI assistant (Anthropic > OpenAI >
  Ollama fallback).
- 🔐 **Tiered access control** per project (public/participant/team roles).
- 🎨 **Editable platform identity** — colors, logos and project color schemes
  ("chameleon" design tokens) from the admin.
- 🌍 **Bilingual UI** via `next-intl` (`de` default, `en` fallback).

## Tech stack

| Layer | Tech |
|---|---|
| Web framework | Next.js 15 (App Router, RSC-first) + React 19, Turbopack dev |
| CMS / backend | Payload CMS 3 (embedded, `/admin` + `/api`) |
| Database | MongoDB 7 (`@payloadcms/db-mongodb`) |
| Styling | Tailwind CSS 4 + CSS custom properties (design tokens) |
| Realtime board | Hocuspocus sidecar (Yjs over WebSocket) + Excalidraw |
| i18n | `next-intl` (UI chrome) + Payload localization (content) |
| Language / runtime | TypeScript, ESM, Node ≥ 20, npm |

---

## Quick start

```bash
cp .env.example .env.local    # point DATABASE_URI at your MongoDB
npm install
npm run dev:all               # Next on http://localhost:3000 + Hocuspocus WS on :1234
```

Requires a local **MongoDB 7**; MinIO (S3 media/files) and Redis are optional
in dev — see [`.env.example`](.env.example). Then open the **admin panel** at
<http://localhost:3000/admin> and create the first user. To populate platform
defaults:

```bash
npm run seed                  # idempotent — safe to re-run
```

## Common commands

| Task | Command |
|---|---|
| Dev (Next + WS sidecar) | `npm run dev:all` |
| Dev (Next only) | `npm run dev` |
| Production build | `npm run build` |
| Regenerate Payload types (after a collection/global change) | `npm run generate:types` |
| Regenerate admin import map (after wiring an admin component) | `npm run generate:importmap` |
| Seed platform defaults | `npm run seed` |

---

## Documentation

- [`AGENTS.md`](AGENTS.md) — conventions, gotchas and a per-task map (for
  humans and AI agents).
- [`docs/architecture.md`](docs/architecture.md) — big picture: domains, route
  groups, data model, realtime, theming.
- [`docs/README.md`](docs/README.md) — doc index with a "read when…" table.

## Contributing

Contributions are welcome — please read [`CONTRIBUTING.md`](CONTRIBUTING.md)
and our [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) first.

## License

Licensed under the **European Union Public Licence v. 1.2 (EUPL-1.2)** — see
[`LICENSES/EUPL-1.2.txt`](LICENSES/EUPL-1.2.txt). The project is
[REUSE](https://reuse.software)-compliant: every file declares its copyright
and license. The bundled Atkinson Hyperlegible font is licensed separately
under [OFL-1.1](LICENSES/OFL-1.1.txt).
