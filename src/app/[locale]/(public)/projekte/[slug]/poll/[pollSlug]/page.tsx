import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function PublicPollPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string; pollSlug: string }>
}) {
  const { locale, slug, pollSlug } = await params
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'polls',
    where: { and: [{ slug: { equals: pollSlug } }, { visibility: { equals: 'PUBLIC' } }] },
    limit: 1,
    overrideAccess: true,
  })

  if (result.totalDocs === 0) notFound()
  const poll = result.docs[0] as unknown as { id: string; title: string; description?: string; status: string; allowAnonymous: boolean }

  const questionsResult = await payload.find({
    collection: 'poll-questions',
    where: { poll: { equals: poll.id } },
    sort: 'order',
    overrideAccess: true,
  })
  const questions = questionsResult.docs as unknown as { id: string; text: string; type: string }[]

  return (
    <main className="min-h-screen p-8 max-w-2xl mx-auto">
      <Link href={`/${locale}/projekte/${slug}`} className="text-sm text-blue-600 hover:underline mb-4 block">
        ← {slug}
      </Link>
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-3xl font-bold">{poll.title}</h1>
        <span className={`text-xs px-2 py-1 rounded-full ${poll.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {poll.status === 'active' ? 'Aktiv' : poll.status === 'closed' ? 'Geschlossen' : 'Entwurf'}
        </span>
      </div>
      {poll.description && <p className="text-gray-600 mb-6">{poll.description}</p>}
      {poll.status === 'active' ? (
        <div className="space-y-6">
          {questions.map((q) => (
            <div key={q.id} className="border rounded-lg p-4">
              <p className="font-medium mb-3">{q.text}</p>
              <p className="text-sm text-gray-400">Abstimmung folgt in Phase 6 UI</p>
            </div>
          ))}
          {poll.allowAnonymous && (
            <p className="text-xs text-gray-400">Anonyme Abstimmung möglich</p>
          )}
        </div>
      ) : (
        <p className="text-gray-500">Diese Umfrage ist nicht mehr aktiv.</p>
      )}
    </main>
  )
}
