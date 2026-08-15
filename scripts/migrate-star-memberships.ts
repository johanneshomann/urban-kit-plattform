// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

/**
 * One-off migration: star-only memberships were created with status
 * 'requested', which made every star from a non-member appear as a join
 * request in the PM inbox (and blocked those users from ever actually
 * requesting). Rewrites `requested + starred` rows to the new 'none' status.
 *
 * NOTE: a user who genuinely requested to join AND starred the project is
 * indistinguishable from a star-only row and gets demoted to 'none' — they
 * can simply request again.
 *
 * Run with: npx payload run scripts/migrate-star-memberships.ts
 */
import { getPayload } from 'payload'
import config from '@payload-config'

const payload = await getPayload({ config })

const res = await payload.find({
  collection: 'project-memberships',
  where: { and: [{ status: { equals: 'requested' } }, { starred: { equals: true } }] },
  depth: 0,
  limit: 1000,
  overrideAccess: true,
})

console.error(`Found ${res.totalDocs} starred 'requested' membership(s).`)
for (const doc of res.docs) {
  await payload.update({
    collection: 'project-memberships',
    id: doc.id,
    data: { status: 'none' },
    overrideAccess: true,
  })
  console.error(`  ${doc.id}: requested → none`)
}
console.error('Done.')
process.exit(0)
