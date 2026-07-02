import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getProjectManagerContext } from '@/lib/auth/requireProjectManager'
import { MembersManager, type MemberItem } from '@/components/platform/manage/MembersManager'

export default async function ManageMitgliederPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const ctx = await getProjectManagerContext(slug)
  if (!ctx) notFound()

  const t = await getTranslations({ locale, namespace: 'manage' })
  const payload = await getPayload({ config })
  const res = await payload.find({
    collection: 'project-memberships',
    where: { and: [{ project: { equals: ctx.project.id } }, { status: { equals: 'active' } }] },
    depth: 1,
    limit: 200,
    sort: 'createdAt',
    overrideAccess: true,
  })

  const members: MemberItem[] = []
  for (const doc of res.docs) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const m = doc as any
    const u = m.user
    if (!u || typeof u !== 'object') continue
    const name = [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || u.email || t('members.unknownName')
    members.push({
      membershipId: String(m.id),
      name,
      email: u.email ?? '',
      role: m.role ?? 'Citizen',
      isTeam: m.isTeam === true,
      isSelf: String(u.id) === String(ctx.user.id),
    })
  }

  // PMs first, then alphabetically
  members.sort((a, b) => (a.role === 'PM' ? 0 : 1) - (b.role === 'PM' ? 0 : 1) || a.name.localeCompare(b.name, 'de'))

  return <MembersManager slug={slug} locale={locale} members={members} />
}
