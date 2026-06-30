import { getPayload } from 'payload'
import config from '@payload-config'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { getUser } from '@/lib/auth/getUser'
import { getViewerTier } from '@/lib/visibility'
import { ProjectModuleNav } from '@/components/platform/ProjectModuleNav'
import { ModuleConsumptionPlaceholder } from '@/components/platform/modules/ModuleConsumptionPlaceholder'

export default async function ModulePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string; moduleType: string }>
}) {
  const { locale, slug, moduleType } = await params
  const tm = await getTranslations({ locale, namespace: 'modules' })
  const payload = await getPayload({ config })

  const projectResult = await payload.find({
    collection: 'projects',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  if (projectResult.totalDocs === 0) notFound()
  const project = projectResult.docs[0] as unknown as { id: string; title: string; modules?: string[] }

  const modules = project.modules ?? ['news', 'calendar']
  if (!modules.includes(moduleType)) notFound()

  const user = await getUser()
  const tier = await getViewerTier(payload, user ? String(user.id) : null, project.id)

  return (
    <div>
      <ProjectModuleNav modules={modules} slug={slug} locale={locale} activeModule={moduleType} />
      <main className="p-6 md:p-8 max-w-4xl mx-auto w-full" style={{ minHeight: 'calc(100svh - 8rem)' }}>
        {/* Per-module consumption UI is filled in per module (news → calendar → polls → …). */}
        <ModuleConsumptionPlaceholder title={tm(moduleType)} />
      </main>
    </div>
  )
}
