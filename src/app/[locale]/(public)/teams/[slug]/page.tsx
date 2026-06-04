import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'

export default async function PublicTeamPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { slug } = await params
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'teams',
    where: { slug: { equals: slug } },
    limit: 1,
    overrideAccess: true,
  })

  if (result.totalDocs === 0) notFound()
  const team = result.docs[0] as unknown as { name: string; groups?: { name: string }[] }

  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">{team.name}</h1>
      {team.groups && team.groups.length > 0 && (
        <div className="mt-4">
          <h2 className="font-semibold mb-2">Gruppen</h2>
          <ul className="list-disc list-inside text-gray-600">
            {team.groups.map((g, i) => (
              <li key={i}>{g.name}</li>
            ))}
          </ul>
        </div>
      )}
    </main>
  )
}
