import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import { getProjectManagerContext } from '@/lib/auth/requireProjectManager'
import { EinstellungenForm, type EinstellungenInitial } from '@/components/platform/manage/EinstellungenForm'

export default async function ManageEinstellungenPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const ctx = await getProjectManagerContext(slug)
  if (!ctx) notFound()

  const payload = await getPayload({ config })
  const project = await payload.findByID({ collection: 'projects', id: ctx.project.id, depth: 0, overrideAccess: true })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = project as any

  const initial: EinstellungenInitial = {
    isPublic: p.isPublic !== false,
    joinRequestsEnabled: p.joinRequestsEnabled !== false,
  }

  return <EinstellungenForm slug={slug} locale={locale} projectTitle={ctx.project.title} initial={initial} />
}
