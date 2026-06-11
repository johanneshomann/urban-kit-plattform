import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicNavServer } from '@/components/public/PublicNavServer'
import { PublicFooter } from '@/components/public/PublicFooter'
import { EyebrowBadge } from '@/components/public/EyebrowBadge'
import { CtaButton } from '@/components/public/CtaButton'
import { ScrollHint } from '@/components/public/ScrollHint'
import { getCitySettings } from '@/lib/instance'
import { Flag, Landmark, Circle, Info } from 'lucide-react'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'UrbanKIT erklärt – Stadtentwicklung nachvollziehbar machen',
    description: 'Was ist UrbanKIT? Wie funktioniert die Plattform? Alles über das digitale Tool für Bürgerbeteiligung.',
  }
}


export default async function UeberUrbanKITPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const { cityName, cityLogoUrl } = await getCitySettings()

  return (
    <div className="min-h-svh flex flex-col">
      <PublicNavServer locale={locale} />

      {/* Hero */}
      <section className="relative min-h-[calc(100svh-3.5rem)] flex flex-col justify-start px-6 md:px-16 lg:px-24 pt-20 pb-10 md:pt-28 md:pb-20 border-b overflow-hidden" style={{ background: 'var(--plattform-light)' }}>
        <Info
          className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 h-[45%] w-auto opacity-10 pointer-events-none"
          strokeWidth={1}
          aria-hidden="true"
          style={{ color: 'var(--plattform)' }}
        />
        <ScrollHint />
        <div className="relative z-10 max-w-2xl">
          <EyebrowBadge label="UrbanKIT – Was ist das?" opacity={0.6} />
          <h1 className="text-hero font-black leading-none tracking-tight mb-5">
            Urban<span style={{ color: 'var(--plattform)' }}>KIT</span> erklärt<span style={{ color: 'var(--plattform)' }}>.</span>
          </h1>
          <p className="text-text leading-relaxed max-w-2xl">
            UrbanKIT ist das digitale Tool für Bürger:innenbeteiligung der Stadt {cityName}.{' '}
            Transparent, zugänglich und offen für alle. Hier kannst du Stadtentwicklung verfolgen,
            verstehen und dich aktiv einbringen.
          </p>
        </div>
      </section>

      {/* Stadt & Entwicklung */}
      <section className="relative overflow-hidden min-h-svh flex flex-col justify-center px-6 md:px-16 lg:px-24 py-12 md:py-24 border-b" style={{ background: 'var(--plattform-light)' }}>
        {/* Ghost illustration */}
        <Landmark
          className="absolute right-16 top-1/2 -translate-y-1/2 h-[45%] w-auto opacity-10 pointer-events-none"
          strokeWidth={1}
          aria-hidden="true"
          style={{ color: 'var(--plattform)' }}
        />

        <div className="relative z-10 w-full">
          <EyebrowBadge label="Hintergrund" opacity={0.6} />
          <h2 className="text-title font-black tracking-tight mb-10 max-w-5xl">
            Stadt <span style={{ color: 'var(--plattform)' }}>&</span> Entwicklung, nachvollziehbar<span style={{ color: 'var(--plattform)' }}>.</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-4">
            <p className="text-text leading-relaxed" style={{ color: 'var(--plattform-ink)' }}>
              UrbanKIT ist das digitale Beteiligungstool, das im Rahmen des Projekts{' '}
              <strong>SC PUT – Smart City Participation and Usability Toolbox</strong> von einem Team des Institutes for
              Design Strategies in Zusammenarbeit mit der Stadt {cityName} entwickelt wurde. Ziel ist es, städtische
              Entscheidungen sichtbar, verständlich und mitgestaltbar zu machen — für alle, die in {cityName} leben,
              arbeiten oder sich engagieren.
            </p>
            <p className="text-text leading-relaxed" style={{ color: 'var(--plattform-ink)' }}>
              Auf UrbanKIT siehst du, welche Projekte gerade laufen, welche Entscheidungen getroffen wurden und wo du
              dich einbringen kannst. Du brauchst kein Vorwissen. Die Plattform erklärt Zusammenhänge, zeigt
              Hintergründe und unterstützt dich dabei, mitzureden, bevor Entscheidungen fallen.
            </p>
            <p className="text-text leading-relaxed md:col-span-1" style={{ color: 'var(--plattform-ink)' }}>
              UrbanKIT verbindet Information, Austausch und Mitgestaltung an einem Ort. Du entscheidest selbst, wie
              aktiv du dich beteiligen möchtest.
            </p>
          </div>
        </div>
      </section>

      {/* Drei Bereiche */}
      <section className="min-h-svh flex flex-col justify-center px-6 md:px-16 lg:px-24 py-12 md:py-24 border-b" style={{ background: 'var(--plattform-light)' }}>
        <div className="w-full">
          <EyebrowBadge label="Die Plattform" opacity={0.6} />
          <h2 className="text-title font-black tracking-tight mb-2">
            Drei Bereiche<span style={{ color: 'var(--plattform)' }}>.</span> Ein Ziel<span style={{ color: 'var(--plattform)' }}>.</span>
          </h2>
          <p className="text-text mb-12 max-w-2xl" style={{ color: 'var(--plattform-ink)' }}>
            UrbanKIT ist in drei Bereiche gegliedert, die unterschiedliche Zugänge bieten, aber auf ein gemeinsames
            Ziel einzahlen: Stadtentwicklung verständlich und zugänglich zu machen.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href={`/${locale}/bereich/projekte-archiv`} className="group block bg-white rounded-xl p-8 border hover:shadow-md hover:bg-[var(--projekte-light)] transition-all min-h-48">
              <div className="flex items-center gap-3 mb-5">
                <Circle className="text-display w-[0.8em] h-[0.8em] shrink-0" fill="currentColor" strokeWidth={0} style={{ color: 'var(--projekte-dark)' }} />
                <h3 className="text-display font-black tracking-tight transition-colors" style={{ color: 'var(--projekte-dark)' }}>
                  Projekte & Archiv
                </h3>
              </div>
              <p className="text-text" style={{ color: 'var(--plattform-ink)' }}>
                Laufende und abgeschlossene Projekte einsehen und nachvollziehen, was entschieden wird, wer beteiligt
                ist und wie der aktuelle Stand ist.
              </p>
            </Link>

            <Link href={`/${locale}/bereich/zusammenarbeit`} className="group block bg-white rounded-xl p-8 border hover:shadow-md hover:bg-[var(--zusammenarbeit-light)] transition-all min-h-48">
              <div className="flex items-center gap-3 mb-5">
                <Circle className="text-display w-[0.8em] h-[0.8em] shrink-0" fill="currentColor" strokeWidth={0} style={{ color: 'var(--zusammenarbeit-dark)' }} />
                <h3 className="text-display font-black tracking-tight transition-colors" style={{ color: 'var(--zusammenarbeit-dark)' }}>
                  Zusammenarbeit
                </h3>
              </div>
              <p className="text-text" style={{ color: 'var(--plattform-ink)' }}>
                Das Herzstück der Beteiligung. Hier kommen Menschen zusammen, die Stadt aktiv mitgestalten wollen.
                Gemeinsam an Projekten arbeiten, diskutieren, sich austauschen, abstimmen und Ideen entwickeln.
              </p>
            </Link>

            <Link href={`/${locale}/bereich/grundlagen`} className="group block bg-white rounded-xl p-8 border hover:shadow-md hover:bg-[var(--grundlagen-light)] transition-all min-h-48">
              <div className="flex items-center gap-3 mb-5">
                <Circle className="text-display w-[0.8em] h-[0.8em] shrink-0" fill="currentColor" strokeWidth={0} style={{ color: 'var(--grundlagen-dark)' }} />
                <h3 className="text-display font-black tracking-tight transition-colors" style={{ color: 'var(--grundlagen-dark)' }}>
                  Grundlagen & Methoden
                </h3>
              </div>
              <p className="text-text" style={{ color: 'var(--plattform-ink)' }}>
                Verstehen, wie Beteiligung funktioniert. Wissen aufbauen, Methoden finden, Beteiligung begründen. Mit
                Hintergrundwissen und Einordnung für alle, die partizipative Prozesse verstehen wollen.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="min-h-svh flex flex-col justify-center px-6 md:px-16 lg:px-24 py-12 md:py-24" style={{ background: 'var(--plattform-light)' }}>
        <EyebrowBadge label="Jetzt loslegen" opacity={0.6} />
        <h2 className="text-hero font-black leading-none tracking-tight mb-5">
          Jetzt einsteigen<span style={{ color: 'var(--plattform)' }}>.</span>
        </h2>
        <p className="text-text leading-relaxed mb-10 max-w-sm">
          Registriere dich kostenlos und fang an — entdecke Projekte, informiere dich und bring dich aktiv ein.
        </p>
        <div className="flex">
          <CtaButton href={`/${locale}/starten`} label="Jetzt starten" icon={<Flag />} />
        </div>
      </section>

      <PublicFooter locale={locale} />
    </div>
  )
}
