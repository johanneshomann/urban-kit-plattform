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
await seedLegalTexts(payload, { force: process.argv.includes('--force') })

console.log('\n✓ Done. Remember to fill the [bracketed] placeholders in the admin.\n')
process.exit(0)
