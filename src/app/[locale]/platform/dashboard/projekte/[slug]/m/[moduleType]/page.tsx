import { getPayload } from 'payload'
import config from '@payload-config'
import { TopBar } from '@/components/layout/TopBar'
import { notFound } from 'next/navigation'
import { moduleRegistry } from '@/modules/registry'

export default async function ModulePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string; moduleType: string }>
}) {
  const { locale, slug, moduleType } = await params
  const payload = await getPayload({ config })

  // Verify project exists
  const projectResult = await payload.find({
    collection: 'projects',
    where: { slug: { equals: slug } },
    limit: 1,
    overrideAccess: true,
  })
  if (projectResult.totalDocs === 0) notFound()
  const project = projectResult.docs[0] as unknown as { id: string; title: string }

  // Verify module is enabled for this project
  const moduleResult = await payload.find({
    collection: 'project-modules',
    where: {
      and: [
        { project: { equals: project.id } },
        { moduleType: { equals: moduleType } },
        { enabled: { equals: true } },
      ],
    },
    limit: 1,
    overrideAccess: true,
  })
  if (moduleResult.totalDocs === 0) notFound()

  const manifest = moduleRegistry.manifests().find((m) => m.id === moduleType)

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar locale={locale} projectName={project.title} />
      <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
        <h1 className="text-2xl font-bold mb-6 capitalize">
          {manifest?.name ?? moduleType}
        </h1>
        <p className="text-gray-500">
          Modul <strong>{moduleType}</strong> — UI wird in Phase 4–12 implementiert.
        </p>
      </main>
    </div>
  )
}
