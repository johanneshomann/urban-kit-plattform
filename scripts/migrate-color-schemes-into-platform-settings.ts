// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

/**
 * One-off migration: the project-color-schemes global moved into
 * platform-settings (Projektfarben tab). Copies the old global's `schemes`
 * rows into platform-settings — but only when platform-settings has no
 * schemes yet, so re-runs never clobber newer edits — and removes the
 * orphaned global doc. Idempotent; a missing old doc is a no-op (the reader
 * falls back to the code defaults anyway).
 *
 * Run with: npx payload run scripts/migrate-color-schemes-into-platform-settings.ts
 */
import { getPayload } from 'payload'
import config from '@payload-config'

const payload = await getPayload({ config })

// The old global is no longer registered — read its doc straight from the
// globals collection of the mongodb adapter.
const globalsCollection = payload.db.connection.collection('globals')
const oldDoc = await globalsCollection.findOne({ globalType: 'project-color-schemes' })

if (!oldDoc) {
  console.error('No project-color-schemes doc found — nothing to migrate.')
  process.exit(0)
}

const settings = (await payload.findGlobal({ slug: 'platform-settings', depth: 0, overrideAccess: true })) as {
  schemes?: unknown[] | null
}
const oldSchemes = (oldDoc.schemes ?? []) as { name?: string }[]

if ((settings.schemes?.length ?? 0) > 0) {
  console.error(`platform-settings already has ${settings.schemes!.length} scheme rows — keeping them.`)
} else if (oldSchemes.length > 0) {
  await payload.updateGlobal({
    slug: 'platform-settings',
    data: { schemes: oldSchemes as never },
    overrideAccess: true,
  })
  console.error(`Copied ${oldSchemes.length} scheme rows into platform-settings.`)
} else {
  console.error('Old doc had no scheme rows — defaults apply.')
}

await globalsCollection.deleteOne({ _id: oldDoc._id })
console.error('Removed the orphaned project-color-schemes global doc.')
process.exit(0)
