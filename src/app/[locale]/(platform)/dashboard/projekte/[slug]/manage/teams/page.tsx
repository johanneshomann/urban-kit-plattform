import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import { getProjectManagerContext } from '@/lib/auth/requireProjectManager'
import { TeamsManager } from '@/components/platform/manage/TeamsManager'

export default async function ManageTeamsPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const ctx = await getProjectManagerContext(slug)
  if (!ctx) notFound()

  const payload = await getPayload({ config })
  const project = await payload.findByID({
    collection: 'projects',
    id: ctx.project.id,
    depth: 0,
    overrideAccess: true,
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = project as any
  const teams: string[] = Array.isArray(p.teams) ? p.teams : []

  return <TeamsManager slug={slug} locale={locale} teams={teams} />
}