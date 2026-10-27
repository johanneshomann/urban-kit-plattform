<!--
SPDX-FileCopyrightText: 2026 Johannes Homann

SPDX-License-Identifier: EUPL-1.2
-->

# Security policy

## Supported versions

Only the latest release on the `main` branch receives security fixes. Operators
should update to the current tag; see `CHANGELOG.md`.

## Reporting a vulnerability

Please do **not** open a public issue for security problems.

Send a report to **hi@johanneshomann.de** with:

- a description of the issue and its impact,
- steps to reproduce or a proof of concept,
- the affected version or commit,
- whether you want to be credited.

You will receive an acknowledgement within **7 days**. We aim to confirm the
issue, agree on a disclosure date with you and publish a fix in a tagged
release. Fixed vulnerabilities are listed in `CHANGELOG.md`.

## Scope

In scope: this repository (the Next.js application, the Payload CMS
configuration, the Hocuspocus sidecar, Docker and Compose files, seed scripts).
Out of scope: third-party services an operator connects (database hosting,
mail providers, AI providers, CDNs) and vulnerabilities in upstream
dependencies that have not yet been fixed upstream; please report those to the
respective project.

## Dependencies

Dependencies are pinned in `package-lock.json`. Known high-severity
vulnerabilities in dependencies (CVSS 7.0 or higher) are addressed with a
patch release as soon as an upstream fix is available.
