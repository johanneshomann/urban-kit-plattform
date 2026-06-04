import type { Metadata } from 'next'
import { PublicNav } from '@/components/public/PublicNav'
import { PublicFooter } from '@/components/public/PublicFooter'
import { getCitySettings } from '@/lib/instance'
import { ScrollHint } from '@/components/public/ScrollHint'
import { CtaButton } from '@/components/public/CtaButton'
import { EyebrowBadge } from '@/components/public/EyebrowBadge'
import { Circle, ArrowRight, Layers, Users, Layout } from 'lucide-react'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Zusammenarbeit – Urban KIT',
    description: 'Der digitale Projektraum für Teams: Module für Neuigkeiten, Umfragen, Aufgaben und mehr.',
  }
}


export default async function BereichZusammenarbeitPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const { cityName, cityLogoUrl } = await getCitySettings()

  return (
    <div className="min-h-svh flex flex-col">
      <PublicNav locale={locale} cityName={cityName} cityLogoUrl={cityLogoUrl} />

      {/* Hero */}
        <section
          className="relative min-h-[calc(100svh-3.5rem)] flex flex-col overflow-hidden border-b"
          style={{ background: 'var(--zusammenarbeit-light)' }}
        >
          <ScrollHint color="var(--zusammenarbeit-dark)" />

          <Users
            className="absolute right-16 top-1/2 -translate-y-1/2 h-[45%] w-auto opacity-10 pointer-events-none"
            strokeWidth={1}
            aria-hidden="true"
            style={{ color: 'var(--zusammenarbeit-dark)' }}
          />

          {/* Decorative floating dot — echoes the title period */}
          <Circle
            className="absolute pointer-events-none"
            fill="currentColor"
            strokeWidth={0}
            aria-hidden="true"
            style={{
              color: 'var(--plattform-ink-accent)',
              opacity: 0.12,
              width: '1.1rem',
              height: '1.1rem',
              top: '28%',
              left: '42%',
            }}
          />

          <div className="relative z-10 flex-1 flex flex-col justify-start px-6 pt-20 md:pt-28 md:px-16 lg:px-24">
            <EyebrowBadge label="Bereich" bg="var(--zusammenarbeit)" color="var(--plattform-ink)" />

            <h1 className="text-hero font-black leading-none tracking-tight mb-8">
              Zusammenarbeit<span style={{ color: 'var(--zusammenarbeit-dark)' }}>.</span>
            </h1>

            <p className="text-text leading-relaxed max-w-2xl" style={{ color: 'var(--plattform-ink)' }}>
              Das Herzstück der Beteiligung. Hier kommen Menschen zusammen, die Stadt aktiv mitgestalten wollen. Gemeinsam an Projekten arbeiten, diskutieren, sich austauschen, abstimmen und Ideen entwickeln. Bürger:innen, Verwaltung und Stadtgesellschaft kommen hier direkt in Interaktion.
            </p>
          </div>

          {/* CTA — bottom right, matching landing page */}
          <div className="relative z-10 flex flex-col items-end gap-3 px-6 pb-8 md:pb-14 md:px-16 lg:px-24 self-end">
            <CtaButton href={`/${locale}/starten`} label="Jetzt starten" icon={<ArrowRight />} variant="zusammenarbeit" wide />
          </div>
        </section>

        <section
          className="snap-start relative overflow-hidden min-h-svh flex flex-col justify-center px-6 md:px-16 lg:px-24 py-12 md:py-24 border-b"
          style={{ background: 'var(--zusammenarbeit-light)' }}
        >
          <Layers
            className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 h-[45%] w-auto opacity-10 pointer-events-none"
            strokeWidth={1}
            aria-hidden="true"
            style={{ color: 'var(--zusammenarbeit-dark)' }}
          />
          <div className="relative z-10 w-full">
            <EyebrowBadge label="Projektraum" bg="var(--zusammenarbeit)" color="var(--plattform-ink)" />
            <h2 className="text-title font-black tracking-tight mb-5">
              Der Projektraum<span style={{ color: 'var(--zusammenarbeit-dark)' }}>.</span>
            </h2>
            <p className="text-text leading-relaxed max-w-2xl mb-5" style={{ color: 'var(--plattform-ink)' }}>
              Jedes Projekt auf UrbanKIT bekommt einen eigenen Projektraum. Ein gemeinsamer Arbeitsbereich, in dem alle Beteiligten zusammenkommen — Verwaltungsmitarbeiter:innen, eingeladene Bürger:innen, Stadtgesellschaft.
            </p>
            <p className="text-text leading-relaxed max-w-2xl" style={{ color: 'var(--plattform-ink)' }}>
              Welche Module aktiv sind, richtet sich nach dem Projekt. Öffentliche Inhalte sind für alle einsehbar — interne Arbeitsbereiche bleiben dem Team vorbehalten.
            </p>
          </div>
        </section>

        <section
          className="snap-start relative overflow-hidden min-h-svh flex flex-col justify-center px-6 md:px-16 lg:px-24 py-12 md:py-24"
          style={{ background: 'var(--zusammenarbeit-light)' }}
        >
          <Layout
            className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 h-[45%] w-auto opacity-10 pointer-events-none"
            strokeWidth={1}
            aria-hidden="true"
            style={{ color: 'var(--zusammenarbeit-dark)' }}
          />
          <div className="relative z-10">
            <EyebrowBadge label="Module" bg="var(--zusammenarbeit)" color="var(--plattform-ink)" />
            <h2 className="text-title font-black tracking-tight mb-5">
              Werkzeuge<br />für die Zusammenarbeit<span style={{ color: 'var(--zusammenarbeit-dark)' }}>.</span>
            </h2>
            <p className="text-text leading-relaxed max-w-2xl mb-10" style={{ color: 'var(--plattform-ink)' }}>
              Module sind die Bausteine des Projektraums. Jedes Modul erfüllt eine klare Funktion und kann projektspezifisch aktiviert werden. Nur so kann Beteiligung wirklich strukturiert gelingen.
            </p>
            <div className="flex">
              <CtaButton href={`/${locale}/bereich/zusammenarbeit/module`} label="Module anschauen" icon={<Layout />} variant="zusammenarbeit" />
            </div>
          </div>
        </section>

      <PublicFooter locale={locale} />
    </div>
  )
}
