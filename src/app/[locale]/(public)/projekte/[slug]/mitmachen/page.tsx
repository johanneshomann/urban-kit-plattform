import { JoinRequestForm } from './JoinRequestForm'
import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function JoinRequestPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'projects',
    where: { and: [{ slug: { equals: slug } }, { isPublic: { equals: true } }, { joinRequestsEnabled: { equals: true } }] },
    limit: 1,
    overrideAccess: true,
  })

  if (result.totalDocs === 0) notFound()
  const project = result.docs[0] as unknown as { id: string; title: string }

  return (
    <main className="min-h-screen p-8 max-w-lg mx-auto">
      <Link href={`/${locale}/projekte/${slug}`} className="text-sm text-blue-600 hover:underline mb-6 block">
        ← {project.title}
      </Link>
      <h1 className="text-2xl font-bold mb-2">Am Projekt mitmachen</h1>
      <p className="text-gray-600 mb-6">
        Sende eine Beitrittsanfrage für <strong>{project.title}</strong>. Der Projektmanager wird benachrichtigt.
      </p>
      <JoinRequestForm projectId={project.id} projectSlug={slug} locale={locale} />
    </main>
  )
}
