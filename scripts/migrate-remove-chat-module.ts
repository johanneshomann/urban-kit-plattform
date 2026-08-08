/**
 * One-off migration: chat left the module system (it is platform-wide now).
 * Strips the removed 'chat' value from projects' `modules` arrays — required
 * because the select no longer offers it and stored values would fail
 * validation on the project's next save. Idempotent.
 *
 * Run with: npx payload run scripts/migrate-remove-chat-module.ts
 */
import { getPayload } from 'payload'
import config from '@payload-config'

const payload = await getPayload({ config })

const res = await payload.find({
  collection: 'projects',
  where: { modules: { contains: 'chat' } },
  depth: 0,
  limit: 1000,
  overrideAccess: true,
})

console.error(`Found ${res.totalDocs} project(s) with the legacy 'chat' module.`)
for (const doc of res.docs) {
  const modules = (doc.modules ?? []).filter((m) => (m as string) !== 'chat')
  await payload.update({ collection: 'projects', id: doc.id, data: { modules }, overrideAccess: true })
  console.error(`  ${doc.slug ?? doc.id}: chat removed`)
}
console.error('Done.')
process.exit(0)
