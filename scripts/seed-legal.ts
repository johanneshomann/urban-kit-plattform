// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

/**
 * Seeds ONLY the default legal texts (privacy policy, cookie policy,
 * accessibility statement) into the `legal-settings` global — the subset of
 * `npm run seed` you want when the templates changed but the demo data should
 * be left alone.
 *
 *   npm run seed:legal            # only fills texts that are still empty
 *   npm run seed:legal -- --force # OVERWRITES the stored texts with the defaults
 *   npm run seed:legal -- --force --only=barrierefreiheit   # overwrite ONE field, leave the rest
 *   In Docker (payload run drops flags): SEED_LEGAL_FORCE=1 SEED_LEGAL_ONLY=barrierefreiheit \
 *     docker compose exec web npx payload run scripts/seed-legal.ts
 *
 * `--force` discards admin edits in those fields (both locales), so the
 * bracketed placeholders (privacy policy, accessibility statement) have to be
 * filled in again. The Impressum is never seeded — there is no meaningful
 * default for it.
 *
 * Run via npm script (tsx loads .env.local); requires a reachable MongoDB.
 */
import { getPayload } from 'payload'
import config from '@payload-config'
import { seedLegalTexts } from '../src/lib/legalDefaults'

const payload = await getPayload({ config })
// --only=barrierefreiheit,cookies → touch just those fields (others stay untouched even with --force)
// `npx payload run` swallows CLI flags (verified in prod: --force/--only never
// reach process.argv), so the same options are also read from the environment:
//   SEED_LEGAL_FORCE=1 SEED_LEGAL_ONLY=barrierefreiheit npx payload run scripts/seed-legal.ts
type LegalField = 'datenschutz' | 'cookies' | 'barrierefreiheit'
const onlyArg = process.argv.find((a) => a.startsWith('--only='))?.slice(7) ?? process.env.SEED_LEGAL_ONLY
const only = onlyArg ? (onlyArg.split(',') as LegalField[]) : undefined
const force = process.argv.includes('--force') || process.env.SEED_LEGAL_FORCE === '1'
await seedLegalTexts(payload, { force, only })

console.log('\n✓ Done. Remember to fill the [bracketed] placeholders in the admin.\n')
process.exit(0)
