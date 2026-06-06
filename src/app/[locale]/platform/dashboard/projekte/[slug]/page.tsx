import { getPayload } from 'payload'
import config from '@payload-config'
import { TopBar } from '@/components/layout/TopBar'
import { notFound } from 'next/navigation'

export default async function ProjectDashboardPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'projects',
    where: { slug: { equals: slug } },
    limit: 1,
    overrideAccess: true,
  })

  if (result.totalDocs === 0) notFound()
  const project = result.docs[0] as unknown as { title: string; description?: string }

  const modulesResult = await payload.find({
    collection: 'project-modules',
    where: { and: [{ project: { equals: result.docs[0].id } }, { enabled: { equals: true } }] },
    overrideAccess: true,
  })

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar locale={locale} projectName={project.title} />
      <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{project.title}</h1>
          {project.description && (
            <p className="text-gray-600 mt-1">{project.description}</p>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {modulesResult.docs.length === 0 && (
            <p className="col-span-full text-gray-500 text-sm py-8 text-center">
              Noch keine Module aktiviert. Projektmanager kann Module in den Einstellungen aktivieren.
            </p>
          )}
          {(modulesResult.docs as unknown as { moduleType: string }[]).map((m) => (
            <a
              key={m.moduleType}
              href={`/${locale}/platform/dashboard/projekte/${slug}/m/${m.moduleType}`}
              className="p-4 border rounded-lg hover:bg-gray-50 transition"
            >
              <p className="font-medium capitalize">{m.moduleType}</p>
            </a>
          ))}
        </div>
      </main>
    </div>
  )
}
