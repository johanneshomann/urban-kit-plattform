// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

/**
 * Creates/refreshes the two public prototype test accounts (read-only via
 * users.isDemo), puts them into one project (citizen + PM) and lists them in
 * platform-settings.prototypeDemoAccounts so the login page shows them.
 * Idempotent — safe to re-run to rotate the password or move the project.
 *
 *   npx payload run scripts/seed-demo-accounts.ts
 *   (Docker: docker compose exec web npm run seed:demo)
 *
 * Env (all optional):
 *   DEMO_PROJECT_SLUG   project both accounts join            (default push-statt-pull)
 *   DEMO_CITIZEN_EMAIL  citizen account                       (default demo-buerger@urbankit.de)
 *   DEMO_PM_EMAIL       project-lead account                  (default demo-projektleitung@urbankit.de)
 *   DEMO_PASSWORD       shared password — PUBLIC by design    (default urbankit-demo)
 *
 * The credentials are meant to be displayed publicly; the accounts cannot
 * write anything (see src/lib/auth/demo.ts), so a leaked password is harmless.
 */
import { getPayload } from 'payload'
import config from '@payload-config'

const PROJECT_SLUG = process.env.DEMO_PROJECT_SLUG || 'push-statt-pull'
const PASSWORD = process.env.DEMO_PASSWORD || 'urbankit-demo'
const ACCOUNTS = [
  { email: process.env.DEMO_CITIZEN_EMAIL || 'demo-buerger@urbankit.de', firstName: 'Demo', lastName: 'Bürger:in', role: 'Citizen' as const,
    label: { de: 'Bürger:in', en: 'Citizen' },
    description: { de: 'Sieht den Arbeitsbereich eines Projekts aus Sicht eines Mitglieds: News, Termine, Umfragen, Forum, Dateien, Urban-Agent.', en: 'Sees a project workspace as a member: news, calendar, polls, forum, files, Urban Agent.' } },
  { email: process.env.DEMO_PM_EMAIL || 'demo-projektleitung@urbankit.de', firstName: 'Demo', lastName: 'Projektleitung', role: 'PM' as const,
    label: { de: 'Projektleitung', en: 'Project lead' },
    description: { de: 'Zeigt zusätzlich den Verwaltungsbereich (Inhalte, Mitglieder, Einstellungen) — Speichern ist im Testzugang deaktiviert.', en: 'Additionally shows the manage area (content, members, settings) — saving is disabled in the test account.' } },
]

const payload = await getPayload({ config })

const projectRes = await payload.find({ collection: 'projects', where: { slug: { equals: PROJECT_SLUG } }, limit: 1, depth: 0, overrideAccess: true })
const project = projectRes.docs[0]
if (!project) throw new Error(`Project "${PROJECT_SLUG}" not found — set DEMO_PROJECT_SLUG`)

for (const a of ACCOUNTS) {
  const existing = await payload.find({ collection: 'users', where: { email: { equals: a.email } }, limit: 1, depth: 0, overrideAccess: true })
  let userId: string | number
  if (existing.docs[0]) {
    userId = existing.docs[0].id
    await payload.update({ collection: 'users', id: userId, data: { password: PASSWORD, isDemo: true, firstName: a.firstName, lastName: a.lastName, role: 'user' }, overrideAccess: true })
  } else {
    const created = await payload.create({ collection: 'users', data: { email: a.email, password: PASSWORD, role: 'user', isDemo: true, firstName: a.firstName, lastName: a.lastName }, overrideAccess: true })
    userId = created.id
  }
  await payload.update({ collection: 'users', id: userId, data: { _verified: true } as never, overrideAccess: true }).catch(() => {})

  const mem = await payload.find({ collection: 'project-memberships', where: { and: [{ user: { equals: userId } }, { project: { equals: project.id } }] }, limit: 1, depth: 0, overrideAccess: true })
  if (mem.docs[0]) {
    await payload.update({ collection: 'project-memberships', id: mem.docs[0].id, data: { role: a.role, status: 'active' }, overrideAccess: true })
  } else {
    await payload.create({ collection: 'project-memberships', data: { user: userId, project: project.id, role: a.role, status: 'active' }, overrideAccess: true })
  }
  console.log(`✓ ${a.email} — isDemo, ${a.role} in "${(project as { title?: string }).title}"`)
}

// Login-page listing — only if the admin hasn't configured entries yet.
const settings = (await payload.findGlobal({ slug: 'platform-settings', depth: 0, locale: 'de', overrideAccess: true })) as {
  prototypeNoticeEnabled?: boolean | null
  prototypeDemoAccounts?: Array<{ id?: string | null; email?: string | null }> | null
}
if ((settings.prototypeDemoAccounts ?? []).length === 0) {
  const de = await payload.updateGlobal({
    slug: 'platform-settings', locale: 'de', overrideAccess: true,
    data: { prototypeDemoAccounts: ACCOUNTS.map((a) => ({ label: a.label.de, email: a.email, password: PASSWORD, description: a.description.de })) },
  })
  const rows = ((de as { prototypeDemoAccounts?: Array<{ id?: string | null; email?: string | null }> }).prototypeDemoAccounts ?? [])
  await payload.updateGlobal({
    slug: 'platform-settings', locale: 'en', overrideAccess: true,
    data: { prototypeDemoAccounts: rows.map((row) => {
      const a = ACCOUNTS.find((x) => x.email === row.email)!
      return { id: row.id, label: a.label.en, email: a.email, password: PASSWORD, description: a.description.en }
    }) },
  })
  console.log('✓ platform-settings.prototypeDemoAccounts written (de/en)')
} else {
  console.log('• platform-settings.prototypeDemoAccounts already configured — left untouched')
}
if (!settings.prototypeNoticeEnabled) console.log('NOTE: prototype notice is OFF — the accounts appear on the login page only while "Prototyp-Hinweis anzeigen" is enabled.')
console.log(`Password (public by design): ${PASSWORD}`)
process.exit(0)
