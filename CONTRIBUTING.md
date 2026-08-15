<!--
SPDX-FileCopyrightText: 2026 Johannes Homann

SPDX-License-Identifier: EUPL-1.2
-->

# Contributing

Thanks for your interest in improving **UrbanKIT**! This guide covers how to
get set up and the conventions we follow. For the deeper architecture and
per-task map, read [`AGENTS.md`](AGENTS.md) first.

By participating you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting set up

```bash
cp .env.example .env.local      # configure DATABASE_URI etc.
npm install
npm run dev:all                 # Next on http://localhost:3000 + Hocuspocus WS on :1234
npm run seed                    # populate platform defaults (idempotent)
```

You need a local MongoDB 7 (and optionally MinIO/Redis — see
[`.env.example`](.env.example)). The admin panel is at
<http://localhost:3000/admin>.

To sanity-check a change, run `npx tsc --noEmit` (fast) or `npm run build`
(slow). After editing a collection/field/global, run `npm run generate:types`;
after wiring a custom admin component, run `npm run generate:importmap`.

## Conventions

- **German-first.** `de` is the default content locale; `en` falls back to
  `de`. Both message catalogs (`messages/de.json` + `en.json`) must stay
  key-identical.
- **Access control:** collection access is coarse; every server action/route
  must do its own guard (`getProjectManagerContext`, `getViewerTier`, …).
  UI checks are not security.
- **Design tokens, not hex:** colors come from CSS custom properties
  (`--plattform-*`, `--project-*` chameleon vars).
- **Comments are English and explain the *why*, not the *what*.**
- See [`AGENTS.md`](AGENTS.md) for the full conventions & gotchas list.

## Licensing & REUSE

This project is [REUSE](https://reuse.software)-compliant: **every file
declares its copyright and license**. When you add a file:

- New **source files** need an SPDX header. The easiest way:

  ```bash
  pipx install reuse           # once
  reuse annotate --copyright "Your Name" --license EUPL-1.2 path/to/new-file.ts
  ```

- New **binaries / generated / data files** are covered by globs in
  `REUSE.toml` — extend it instead of adding a header.
- Verify before opening a PR:

  ```bash
  reuse lint
  ```

By contributing, you agree that your contributions are licensed under the
**EUPL-1.2** (the project license).

## Pull requests

1. Branch from `main`.
2. Keep commits focused — one logical change per commit, with a short
   imperative message (`VERB – details` format: ADD / CHANGE / FIX / REMOVE).
3. Make sure `npm run generate:types` (if the model changed) and `reuse lint`
   pass.
4. Describe *what* changed and *why* in the PR description.

## Reporting issues

Please include: what you did, what you expected, what happened, and your
environment (OS, Node version, Docker or local). Screenshots help for UI
issues.
