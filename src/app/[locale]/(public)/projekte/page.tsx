import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { PublicNav } from '@/components/public/PublicNav'
import { PublicFooter } from '@/components/public/PublicFooter'
import { getCitySettings } from '@/lib/instance'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Projekte – Urban KIT',
    description: 'Alle öffentlichen Stadtentwicklungsprojekte in der Übersicht.',
  }
}

export default async function ProjektePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const { cityName, cityLogoUrl } = await getCitySettings()

  let projects: { id: string; title: string; summary?: string; slug: string; status?: string }[] = []
  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'projects',
      where: { visibility: { equals: 'PUBLIC' } },
      sort: '-createdAt',
      overrideAccess: true,
    })
    projects = result.docs as unknown as typeof projects
  } catch {}

  const active = projects.filter((p) => p.status === 'active')
  const archived = projects.filter((p) => p.status !== 'active')

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav locale={locale} cityName={cityName} cityLogoUrl={cityLogoUrl} />

      <main className="flex-1 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Alle Projekte</h1>
          <p className="text-gray-500 mb-10">Laufende und abgeschlossene Stadtprojekte – dokumentiert und nachvollziehbar. Du siehst, was geplant wird, wer beteiligt ist und wie der aktuelle Stand ist.</p>

          {projects.length === 0 ? (
            <p className="text-gray-400">Noch keine öffentlichen Projekte.</p>
          ) : (
            <>
              {active.length > 0 && (
                <section className="mb-12">
                  <h2 className="text-xl font-semibold mb-4 text-gray-700">Laufend</h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    {active.map((p) => (
                      <Link key={p.id} href={`/${locale}/projekte/${p.slug}`}
                        className="group block p-6 border rounded-xl hover:shadow-md transition-shadow">
                        <h3 className="font-semibold text-lg mb-1 group-hover:text-blue-600 transition-colors">{p.title}</h3>
                        {p.summary && <p className="text-sm text-gray-500 line-clamp-2">{p.summary}</p>}
                        <span className="inline-block mt-3 text-xs text-blue-600">Zum Projekt →</span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
              {archived.length > 0 && (
                <section>
                  <h2 className="text-xl font-semibold mb-4 text-gray-500">Archiv</h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    {archived.map((p) => (
                      <Link key={p.id} href={`/${locale}/projekte/${p.slug}`}
                        className="group block p-6 border rounded-xl bg-gray-50 hover:shadow-md transition-shadow">
                        <h3 className="font-semibold text-lg mb-1 group-hover:text-blue-600 transition-colors">{p.title}</h3>
                        {p.summary && <p className="text-sm text-gray-500 line-clamp-2">{p.summary}</p>}
                        <span className="inline-block mt-3 text-xs text-gray-400">Abgeschlossen</span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </main>

      <PublicFooter locale={locale} />
    </div>
  )
}
