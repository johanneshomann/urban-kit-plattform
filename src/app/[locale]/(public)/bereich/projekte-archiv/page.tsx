import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { PublicNavServer } from '@/components/public/PublicNavServer'
import { PublicFooter } from '@/components/public/PublicFooter'
import { EyebrowBadge } from '@/components/public/EyebrowBadge'
import { getCitySettings } from '@/lib/instance'
import { FolderOpen, Archive, Circle } from 'lucide-react'
import { ScrollHint } from '@/components/public/ScrollHint'
import { ProjekteFeatureAccordion } from './ProjekteFeatureAccordion'
import { CtaButton } from '@/components/public/CtaButton'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Projekte & Archiv – Urban KIT',
    description: 'Alle laufenden und abgeschlossenen Stadtentwicklungsprojekte in der Übersicht.',
  }
}

async function getProjects() {
  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'projects',
      where: { visibility: { equals: 'PUBLIC' } },
      sort: '-createdAt',
      overrideAccess: true,
    })
    return result.docs as unknown as { id: string; title: string; slug: string; summary?: string; status?: string }[]
  } catch {
    return []
  }
}

export default async function BereichProjektePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const { cityName, cityLogoUrl } = await getCitySettings()
  const projects = await getProjects()

  const active = projects.filter((p) => p.status === 'active')
  const archived = projects.filter((p) => p.status !== 'active')

  return (
    <div className="min-h-svh flex flex-col">
      <PublicNavServer locale={locale} />

      {/* Hero */}
      <section className="relative flex-1 min-h-[calc(100svh-3.5rem)] flex flex-col overflow-hidden border-b" style={{ background: 'var(--projekte-light)' }}>
        <ScrollHint color="var(--projekte-dark)" />
        <FolderOpen
          className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 h-[45%] w-auto opacity-10 pointer-events-none"
          strokeWidth={1}
          aria-hidden="true"
          style={{ color: 'var(--projekte-dark)' }}
        />

        {/* Main content — left-aligned, upper area */}
        <div className="relative z-10 flex-1 flex flex-col justify-start px-6 pt-20 md:pt-28 md:px-16 lg:px-24">
          <EyebrowBadge label="Bereich" bg="var(--projekte)" color="var(--plattform-ink)" />
          <h1 className="text-hero font-black leading-none tracking-tight mb-5">
            Projekte <span style={{ color: 'var(--projekte-dark)' }}>&</span><br />
            Archiv<span style={{ color: 'var(--projekte-dark)' }}>.</span>
          </h1>
          <p className="text-text leading-relaxed max-w-2xl" style={{ color: 'var(--plattform-ink)' }}>
            Laufende und abgeschlossene Stadtprojekte – dokumentiert und nachvollziehbar. Du siehst, was geplant wird, wer beteiligt ist und wie der aktuelle Stand ist.
          </p>
        </div>

        {/* CTAs — bottom right */}
        <div className="relative z-10 flex flex-col items-end gap-3 px-6 pb-8 md:pb-14 md:px-16 lg:px-24 self-end">
          <CtaButton href="#laufend" label="Aktuelle Projekte" icon={<FolderOpen />} variant="projekte" wide />
          <CtaButton href={`/${locale}/bereich/projekte-archiv/alle-projekte`} label="Alle Projekte" icon={<Archive />} variant="projekte" wide />
        </div>
      </section>

      {/* Intro — Wieso, Weshalb & Warum */}
      <section className="relative overflow-hidden min-h-svh flex flex-col justify-center px-6 md:px-16 lg:px-24 py-12 md:py-24 border-b" style={{ background: 'var(--projekte-light)' }}>
        <FolderOpen
          className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 h-[40%] w-auto opacity-[0.07] pointer-events-none"
          strokeWidth={1}
          aria-hidden="true"
          style={{ color: 'var(--projekte-dark)' }}
        />
        <div className="relative z-10 w-full">
          <EyebrowBadge label="Wieso, Weshalb & Warum?" bg="var(--projekte)" color="var(--plattform-ink)" />
          <h2 className="text-title font-black tracking-tight mb-10 max-w-2xl">
            Stadt <span style={{ color: 'var(--projekte-dark)' }}>&</span> Entwicklung, nachvollziehbar<span style={{ color: 'var(--projekte-dark)' }}>.</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
            {/* Left */}
            <div className="flex flex-col gap-4">
              <p className="text-text leading-relaxed" style={{ color: 'var(--plattform-ink)' }}>
                Hier siehst du, was in {cityName} geplant, entschieden und umgesetzt wird. Alle Projekte sind dokumentiert – vom aktuellen Stand bis zur Entscheidung.
              </p>
              <p className="text-text leading-relaxed" style={{ color: 'var(--plattform-ink)' }}>
                Du kannst gezielt nach Themen oder Orten suchen und verfolgen, was sich in deinem Umfeld verändert. Neue Entwicklungen, Beschlüsse und Dokumente werden laufend ergänzt.
              </p>
            </div>
            {/* Right */}
            <ProjekteFeatureAccordion />
          </div>
        </div>
      </section>

      {/* Aktuelle Projekte */}
      <section id="laufend" className="min-h-svh flex flex-col justify-center pt-8 pb-14 md:pt-12 md:pb-28 px-6 md:px-16 lg:px-24 border-b" style={{ background: 'var(--projekte-light)' }}>
        <div className="w-full">
          <EyebrowBadge label="Entdecken" bg="var(--projekte)" color="var(--plattform-ink)" />
          <h2 className="text-title font-black tracking-tight mb-2">
            Aktuelle Projekte<span style={{ color: 'var(--projekte)' }}>:</span>
          </h2>
          <p className="text-text mb-12 max-w-2xl" style={{ color: 'var(--plattform-ink)' }}>
            Hier siehst du, woran auf UrbanKIT gerade gearbeitet wird. Jedes Projekt ist ein Ort für Information, Diskussion und echte Mitgestaltung.
          </p>
          {active.length === 0 ? (
            <p className="text-text mb-12" style={{ color: 'var(--plattform-ink)' }}>Aktuell keine öffentlichen Projekte.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {active.map((p) => (
                <Link
                  key={p.id}
                  href={`/${locale}/projekte/${p.slug}`}
                  className="group block bg-white rounded-xl p-8 border hover:shadow-md hover:bg-[var(--projekte-light)] transition-all min-h-48"
                >
                  <h3 className="text-display font-black tracking-tight mb-5 transition-colors" style={{ color: 'var(--projekte-dark)' }}>
                    {p.title}
                  </h3>
                  {p.summary && <p className="text-text line-clamp-2" style={{ color: 'var(--plattform-ink)' }}>{p.summary}</p>}
                </Link>
              ))}
            </div>
          )}
          <CtaButton href={`/${locale}/bereich/projekte-archiv/alle-projekte`} label="Alle Projekte" icon={<FolderOpen />} variant="projekte" />
        </div>
      </section>

      {/* Archiv */}
      {archived.length > 0 && (
        <section id="archiv" className="relative overflow-hidden min-h-svh flex flex-col justify-center pt-8 pb-14 md:pt-12 md:pb-28 px-6 md:px-16 lg:px-24 border-b" style={{ background: 'white' }}>
          <Archive
            className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 h-[40%] w-auto opacity-[0.06] pointer-events-none"
            strokeWidth={1}
            aria-hidden="true"
            style={{ color: 'var(--plattform-ink)' }}
          />
          <div className="relative z-10 w-full">
            <EyebrowBadge label="Archiv" opacity={0.5} />
            <h2 className="text-title font-black tracking-tight mb-2">
              Abgeschlossene Projekte<span style={{ color: 'var(--plattform)' }}>.</span>
            </h2>
            <p className="text-text mb-12 max-w-2xl" style={{ color: 'var(--plattform-ink)' }}>
              Diese Projekte sind abgeschlossen. Alle Informationen und Ergebnisse bleiben weiterhin einsehbar.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {archived.map((p) => (
                <Link
                  key={p.id}
                  href={`/${locale}/projekte/${p.slug}`}
                  className="group block bg-[var(--plattform-light)] rounded-xl p-8 border hover:shadow-md transition-all min-h-48"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Circle className="w-[0.55em] h-[0.55em] shrink-0 opacity-40" fill="currentColor" strokeWidth={0} style={{ color: 'var(--plattform-ink)' }} />
                    <h3 className="text-display font-black tracking-tight" style={{ color: 'var(--plattform-ink-accent)' }}>
                      {p.title}
                    </h3>
                  </div>
                  {p.summary && <p className="text-text line-clamp-2" style={{ color: 'var(--plattform-ink)' }}>{p.summary}</p>}
                  <span className="inline-block mt-4 text-small opacity-50" style={{ color: 'var(--plattform-ink)' }}>Abgeschlossen</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}


<PublicFooter locale={locale} />
    </div>
  )
}
