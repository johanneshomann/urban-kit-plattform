/**
 * One-off migration: rewrite legacy 7-step `projektphase` values on projects
 * to the archive-aligned 8-phase system (see LEGACY_PHASE_MAP). Idempotent —
 * already-migrated or unknown values are left untouched; `status` is
 * re-derived by the collection's beforeChange hook on update.
 *
 * Run with: npx payload run scripts/migrate-projektphasen.ts
 * (top-level await — `payload run` does not wait for a floating promise)
 */
import { getPayload } from 'payload'
import config from '@payload-config'
import { LEGACY_PHASE_MAP } from '../src/lib/options/projektphasen'

const payload = await getPayload({ config })
const legacyValues = Object.keys(LEGACY_PHASE_MAP)

const res = await payload.find({
  collection: 'projects',
  where: { projektphase: { in: legacyValues } },
  depth: 0,
  limit: 1000,
  overrideAccess: true,
})

console.error(`Found ${res.totalDocs} project(s) with legacy phase values.`)
for (const doc of res.docs) {
  const oldValue = doc.projektphase as string
  const newValue = LEGACY_PHASE_MAP[oldValue]
  if (!newValue) continue
  await payload.update({
    collection: 'projects',
    id: doc.id,
    data: { projektphase: newValue as (typeof res.docs)[number]['projektphase'] },
    overrideAccess: true,
  })
  console.error(`  ${doc.slug ?? doc.id}: ${oldValue} → ${newValue}`)
}
console.error('Done.')
process.exit(0)
