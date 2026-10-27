<!--
SPDX-FileCopyrightText: 2026 Johannes Homann

SPDX-License-Identifier: EUPL-1.2
-->

# Project status

_Last updated: 2026-10-27 · Version 1.1.0 · `developmentStatus: beta` in `publiccode.yml`_

## Development stage

UrbanKIT Plattform is a **prototype in pilot operation**. One municipality (Stadt
Detmold) runs it in production with seeded showcase projects and two public
read-only test accounts; the public portal, the project workspaces and all nine
modules are feature-complete for that pilot. The software is published so that
other municipalities can evaluate, adapt and deploy it. It is not yet a hardened,
multi-tenant product: one deployment serves exactly one municipality.

What is in place and used in the pilot:

- Public portal (frontpage, topic areas, project pages with public news, events,
  polls and files, legal pages) with CMS-managed content.
- Per-project workspaces with toggleable modules: news, calendar, polls, forum,
  tasks, collaborative whiteboard, files and the optional AI assistant.
- Platform-wide chat (direct messages, project rooms, groups) with notifications.
- Three-level visibility per content item (public / project / team), roles for
  administrators, project managers, team leads and participants, join requests
  and invitation codes.
- Fully bilingual UI (German default, English), accessibility settings
  (font size, contrast, motion, link underlines), BITV-oriented markup.
- Prototype mode: dismissible prototype notice, public demo accounts, a switch
  that closes self-registration.
- Editable platform identity (city name, logos, colour tokens, project colour
  schemes) and seeded, fill-in-the-blanks legal texts.

## Known limitations

| Area | Limitation | Consequence |
|---|---|---|
| Quality assurance | No automated tests and no lint configuration. Verification is `npx tsc --noEmit`, `npm run build` and manual checks. A minimal CI (type check + REUSE lint) ships with this version. | Regressions are caught late; contributors should test manually against a seeded instance. |
| E-mail | Mail delivery is optional, but the Compose stack points `SMTP_HOST` at the dev mail catcher by default. Without a reachable SMTP server, registration fails at the verification mail and notification mails are not sent. | Operators must configure a real SMTP provider before opening registration. |
| Registration | Self-registration can be switched off in Platform Settings; the pilot runs with it closed and uses the demo accounts. | New users need an operator to create accounts or to reopen registration. |
| AI assistant (Urban Agent) | Optional module, provider-agnostic (Mistral, Anthropic, OpenAI, Ollama). Disabled in the pilot. Rate limits and a daily ceiling exist, but costs are the operator's. | Enabling it requires an API key, a privacy-policy section and a cost budget. |
| Whiteboard | Excalidraw canvases are not screen-reader accessible and only partly keyboard operable (documented in the accessibility statement). | Teams should publish results in text form as well. |
| Notifications | Fixed window of 30 entries, no pruning, no grouping of bursts, no per-item read state. | Busy projects see older notifications disappear. |
| Data model leftovers | The `activity` collection is written but never read; `task-columns` is modelled but has no UI; `calendar-events.slug` is unused. | No user impact; cleanup or completion pending. |
| Logging | Container logs use Docker's default `json-file` driver without rotation; the application writes no access logs. | Operators should configure log rotation (see `docs/operations.md`). |

## Open points

Ranked by value, not scheduled. The internal backlog lives in the repository
history; this is the public summary.

1. Make e-mail truly optional in production (no SMTP configured means no mail,
   not a failed registration).
2. Notification retention, grouping and per-item read state; further events
   (poll activated, event changed, task due, membership decisions).
3. Decide on the `activity` collection: build the feed on it or remove it.
4. Task columns (custom Kanban columns) and an assignee filter.
5. Calendar: attendee list for project managers, project-wide ICS feed.
6. Polls: duplicate action, question reordering.
7. Board: snapshot thumbnails in the picker, read-only visitor view.
8. Urban Agent phases 3 and 4 (dashboard-wide assistant, public guide) remain
   design-only.
9. Automated tests for the access-control guards and the visibility model.

## Maintenance

Developed by Johannes Homann on behalf of Stadt Detmold within the Smart City
project. Issues and merge requests are accepted on the published repository;
security reports go to the address in [`SECURITY.md`](../SECURITY.md). Response
target for issues: seven days.
