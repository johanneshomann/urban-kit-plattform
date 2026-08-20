// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

/**
 * Sets the password of ALL seeded roster accounts to SEED_USERS_PASSWORD —
 * for deployments that were seeded before the env-based password existed, or
 * to rotate the shared demo credential later. Touches only the emails from
 * seed/content/users.ts; admins and self-registered accounts are untouched.
 *
 *   SEED_USERS_PASSWORD=… npx payload run scripts/rotate-seed-passwords.ts
 *   (in Docker: docker compose exec web npm run … — the var comes from .env)
 */
import { getPayload } from 'payload'
import config from '@payload-config'
import { SEED_USERS } from '../seed/content/users'

const password = process.env.SEED_USERS_PASSWORD
if (!password) {
  console.error('ABBRUCH: SEED_USERS_PASSWORD ist nicht gesetzt.')
  process.exit(1)
}

const payload = await getPayload({ config })
let rotated = 0
for (const u of SEED_USERS) {
  const existing = await payload.find({ collection: 'users', where: { email: { equals: u.email } }, limit: 1, depth: 0, overrideAccess: true })
  if (!existing.docs[0]) continue
  await payload.update({ collection: 'users', id: existing.docs[0].id, data: { password } as never, overrideAccess: true })
  rotated++
}
console.log(`rotated ${rotated}/${SEED_USERS.length} seed accounts`)
process.exit(0)
