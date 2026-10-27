<!--
SPDX-FileCopyrightText: 2026 Johannes Homann

SPDX-License-Identifier: EUPL-1.2
-->

# Changelog

All notable changes to UrbanKIT Plattform. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow
[Semantic Versioning](https://semver.org/). Each version is a Git tag.

## [1.1.0] – 2026-10-27

### Added
- Public demo accounts for pilot operation: users flagged `isDemo` are read-only
  on every mutating action, route and the realtime board; one-click logins on
  the login page, configured in Platform Settings; `npm run seed:demo`.
- Registration switch (Platform Settings → Prototyp-Hinweis → Registrierung
  erlauben): closes self-registration server-side, shows a prototype notice on
  the disabled form and redirects register links to the login page.
- Complete English translation of the workspace (modules, team area, manage
  area, widgets) and localised server-action error messages (`actionError()`).
- Date formatting follows the UI language (`intlLocale()`); Excalidraw UI
  follows the locale.
- Structured data (JSON-LD WebSite/Organization) and `og:site_name` on the
  frontpage.
- Documentation set for operators, users and developers (`docs/usage.md`,
  `docs/operations.md`, `docs/development.md`, `docs/project-status.md`),
  `CHANGELOG.md`, `SECURITY.md`, and a minimal CI (type check, REUSE lint).

### Changed
- Logout runs through `/api/auth/logout` and clears both session-cookie
  scopes; redirects build their origin from the forwarding headers.
- City name is the plain place name ("Detmold"); templates derive "Stadt …".
- Accessibility statement and cookie policy templates match the actual
  platform (board exceptions, real cookie inventory).
- Legal texts: privacy policy template reorganised along the municipal model
  (responsible body, data protection officer, legal bases, full list of rights).
- Project deletion cascade moved to `src/lib/project-delete.ts`.
- `users.read` returns a self-scoped query for non-admins so list queries work.

### Fixed
- Logout left the parent-domain session cookie alive, so a reload logged the
  user back in.
- Logout redirected to the container address behind a reverse proxy.
- Demo seed failed on an unreachable SMTP host.
- Hocuspocus sidecar could not reach Payload in mixed dev setups
  (`HOCUSPOCUS_PAYLOAD_URL`); board realtime reconciles instead of replacing
  scenes.

### Removed
- Seed project "Kultur trifft digital" and its memberships.
- Hardcoded German strings in the workspace UI.

## [1.0.0] – 2026-08-20

First public release on Open CoDE.

- Public portal with frontpage, topic areas (projects and archive,
  collaboration, basics), project pages, legal pages, CMS-managed content.
- Project workspaces with toggleable modules: news, calendar, polls, forum,
  tasks, collaborative whiteboard (Excalidraw via Hocuspocus/Yjs), files,
  Urban Agent (provider-agnostic AI assistant with tool calling).
- Platform-wide chat with rooms, groups, direct messages, reactions,
  attachments and notifications.
- Three-level visibility (public / project / team), roles for administrators,
  project managers, team leads and participants, join requests, invitation
  codes, team catalogue per project.
- Bilingual UI (German default, English), accessibility settings,
  BITV-oriented markup.
- Editable platform identity: logos, colour tokens, project colour schemes,
  partner logos, prototype notice.
- Seeded legal-text templates (imprint, privacy, cookies, accessibility),
  seed with seven showcase projects, Docker Compose deployment with
  production override, backup and restore scripts, REUSE-compliant licensing
  under EUPL-1.2.

[1.1.0]: https://gitlab.opencode.de/stadt-detmold/urban-kit-plattform/-/compare/v1.0.0...v1.1.0
[1.0.0]: https://gitlab.opencode.de/stadt-detmold/urban-kit-plattform/-/tags/v1.0.0
