import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import { getProjectManagerContext } from '@/lib/auth/requireProjectManager'
import { RequestsManager, type RequestItem } from '@/components/platform/manage/RequestsManager'

export default async function ManageAnfragenPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const ctx = await getProjectManagerContext(slug)
  if (!ctx) notFound()

  const payload = await getPayload({ config })
  const res = await payload.find({
    collection: 'project-memberships',
    where: { and: [{ project: { equals: ctx.project.id } }, { status: { equals: 'requested' } }] },
    depth: 1,
    limit: 200,
    sort: '-createdAt',
    overrideAccess: true,
  })

  const requests: RequestItem[] = []
  for (const doc of res.docs) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const m = doc as any
    const u = m.user
    if (!u || typeof u !== 'object') continue
    const name = [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || u.email || 'Unbekannt'
    requests.push({
      membershipId: String(m.id),
      name,
      email: u.email ?? '',
      requestedAt: m.createdAt ?? null,
    })
  }

  return <RequestsManager slug={slug} locale={locale} requests={requests} />
}
