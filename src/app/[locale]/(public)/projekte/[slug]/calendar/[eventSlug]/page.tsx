import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function PublicCalendarEventPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string; eventSlug: string }>
}) {
  const { locale, slug, eventSlug } = await params
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'calendar-events',
    where: { and: [{ slug: { equals: eventSlug } }, { visibility: { equals: 'PUBLIC' } }] },
    limit: 1,
    overrideAccess: true,
  })

  if (result.totalDocs === 0) notFound()
  const event = result.docs[0] as unknown as { title: string; startDate: string; endDate?: string; location?: string }

  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto">
      <Link href={`/${locale}/projekte/${slug}`} className="text-sm text-blue-600 hover:underline mb-4 block">
        ← {slug}
      </Link>
      <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
      <p className="text-gray-600 mb-1">
        {new Date(event.startDate).toLocaleDateString('de-DE')}
        {event.endDate && ` – ${new Date(event.endDate).toLocaleDateString('de-DE')}`}
      </p>
      {event.location && <p className="text-gray-500 text-sm">{event.location}</p>}
    </main>
  )
}
