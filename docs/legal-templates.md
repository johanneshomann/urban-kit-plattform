<!--
SPDX-FileCopyrightText: 2026 Johannes Homann

SPDX-License-Identifier: EUPL-1.2
-->

# Legal templates & storage inventory

The four legal pages (`/impressum`, `/datenschutz`, `/cookies`,
`/barrierefreiheit`) render the localized rich-text fields of the
**`legal-settings` global** (admin → Einstellungen → „Legal – Kontakt &
Recht“). Three of the four fields ship with seedable DE/EN templates in
[`src/lib/legalDefaults.ts`](../src/lib/legalDefaults.ts) — **that file is the
authoritative source**; this doc explains the placeholders and the storage
inventory behind the cookie policy. Update both together.

## Seeding

```bash
npm run seed:legal            # fills only fields that are still empty (both locales)
npm run seed:legal -- --force # OVERWRITES stored texts with the defaults (discards admin edits)
npm run seed                  # full demo seed — runs the same fill-empty legal pass first
```

- "Empty" includes saved-but-empty Lexical documents (`hasRichTextContent`
  in `src/lib/richtext-content.ts` walks the tree), so an accidentally saved
  blank locale is still seedable.
- The **Impressum is never seeded** — there is no meaningful default; the page
  shows a "not configured yet" hint until an admin fills it.
- `/barrierefreiheit` additionally keeps a render-time fallback: with an empty
  CMS field the page renders the bundled template directly
  (`barrierefreiheitDefault(locale, cityName)`), so the legally required
  statement is never absent even before any seed ran.

## Placeholders admins MUST fill

The seeded texts are fill-in-the-blanks starting points, **not finished legal
advice**. Every bracketed `[…]` passage must be completed (in both locales)
before go-live:

### Datenschutzerklärung (`datenschutz`)

| Placeholder | Meaning |
|---|---|
| Betreiber:in (Name/Institution, Anschrift, E-Mail) | Controller identity (§ 1) |
| Datenschutzbeauftragte:r | DPO contact — delete the paragraph if none is appointed |
| Hosting-Anbieter, Ort/Land + Log-Speicherdauer | Hosting provider and log retention (§ 2) |
| CDN/Proxy-Anbieter | Only if a CDN/proxy fronts the site — delete otherwise |
| Hosting-Anbieter (Server-Speicher), Ort/Land | Where media uploads live (§ 6) |
| SMTP-Anbieter, Ort/Land | Transactional-mail provider (§ 7) |
| KI-Anbieter | Urban-Agent backend per deployment: Anthropic / OpenAI / self-hosted Ollama; keep or delete the third-country sentence accordingly (§ 8) |
| Aufsichtsbehörde | Competent supervisory authority (§ 10) |
| Stand: Datum | Last-updated date |

### Erklärung zur Barrierefreiheit (`barrierefreiheit`)

| Placeholder | Meaning |
|---|---|
| Vereinbarkeitsstatus | compliant / partially compliant — set after the self-evaluation |
| Datum der Selbstbewertung | When the BITV 2.0 self-evaluation was carried out |
| Erstellungs-/Prüfdatum | When the statement was prepared / last reviewed |
| Feedback-E-Mail | Address for reporting barriers |
| Durchsetzungs-/Ombudsstelle | Enforcement body (NRW public bodies: Ombudsstelle für barrierefreie Informationstechnik NRW) |

The cookie policy has no placeholders — but it documents code behavior, so it
drifts when the code changes (see the inventory below).

## Storage inventory (authoritative)

Everything the platform stores in the browser. The cookie-policy template and
the cookie notice text must match this table; when you add/change/remove an
entry here, update `cookiePolicyDe/En` in `legalDefaults.ts` and re-seed with
`--force` (or edit the CMS text) in deployments.

| Name | Kind | Set by | Purpose | Lifetime |
|---|---|---|---|---|
| `payload-token` | Cookie (httpOnly, lax) | `src/actions/auth.ts` (and Payload admin login) | Login session; production scopes it to the parent domain so one login serves portal + workspace | 7 days |
| `pollvoted-<pollId>` | Cookie (httpOnly, strict) | `src/actions/poll-vote.ts` | Duplicate-vote guard for anonymous public-poll votes; value is `1`, no identification | 1 year |
| `NEXT_LOCALE` | Cookie | next-intl middleware | Chosen language; only set on an active language switch | Session |
| `uk-a11y` | localStorage | `src/lib/accessibility.ts` | Accessibility settings (font scale, reduce motion, high contrast, underline links) | Until cleared |
| `uk-cookie-notice-ack` | sessionStorage | `src/components/public/CookieNotice.tsx` | "Storage notice dismissed" flag | Tab session |

All of it is strictly necessary / functional — no tracking, no analytics, no
third-party cookies. That is why the **cookie notice is informational, not a
consent gate** (§ 25 Abs. 2 TDDDG i. V. m. Art. 6 Abs. 1 lit. f DSGVO): it
shows once per browser session (BroadcastChannel dedupes across open tabs) and
links to `/cookies`. If third-party analytics or marketing storage is ever
added, an actual consent manager is required instead — the notice must not be
extended into one ad hoc.
