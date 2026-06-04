import type { Metadata } from 'next'
import { PublicNav } from '@/components/public/PublicNav'
import { PublicFooter } from '@/components/public/PublicFooter'
import { EyebrowBadge } from '@/components/public/EyebrowBadge'
import { CtaButton } from '@/components/public/CtaButton'
import { InvitationForm } from './InvitationForm'
import { FeatureAccordion } from './FeatureAccordion'
import { getCitySettings } from '@/lib/instance'
import { Flag, Folders, Info } from 'lucide-react'
import { ScrollHint } from '@/components/public/ScrollHint'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'So gestaltest du mit – UrbanKIT',
    description: 'In drei Schritten zur Beteiligung: Konto erstellen, Projekt finden, mitgestalten.',
  }
}

const STEPS = [
  {
    number: '1',
    title: 'Konto erstellen',
    description: 'Registriere dich in unter einer Minute. Entscheide selbst, wie sichtbar du bist. Mit Konto kannst du Projekte nicht nur ansehen, sondern aktiv mitgestalten.',
    cta: { label: 'Registrieren', href: 'platform/register', icon: Flag },
  },
  {
    number: '2',
    title: 'Projekt finden',
    description: 'Finde Projekte, die dich betreffen oder interessieren und verschaffe dir einen schnellen Überblick. Schau welche Stadtprojekte gerade aktiv sind — von Verkehrsführung bis Grünflächen. Jedes Projekt zeigt dir, was gerade entschieden wird und wo du dich einbringen kannst.',
    cta: { label: 'Alle Projekte', href: 'bereich/projekte-archiv/alle-projekte', icon: Folders },
  },
  {
    number: '3',
    title: 'Mitgestalten',
    description: 'Im Projekt arbeitest du gemeinsam mit der Stadt und anderen Bürger:innen daran, das Ergebnis in die Richtung zu bringen, die du dir vorstellst. Bring deine Perspektive ein, gib Feedback und verfolge, wie deine Beiträge in den weiteren Prozess einfließen.',
    cta: null,
  },
]

const EVENTS = [
  { day: '24', month: 'JAN', title: 'Posh statt Poll – Bürgerforum', time: '10:30 Uhr · Stadthaus Detmold, Raum 1' },
  { day: '08', month: 'MAR', title: 'Marktplatz Neugestaltung – Workshop', time: '17:00 Uhr · Marktplatz Detmold, Foyer' },
  { day: '15', month: 'APR', title: 'Radwege Innenstadt – Infoabend', time: '19:00 Uhr · VHS Detmold, Saal A' },
]

export default async function StartenPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const { cityName, cityLogoUrl } = await getCitySettings()

  return (
    <div className="min-h-svh flex flex-col">
      <PublicNav locale={locale} cityName={cityName} cityLogoUrl={cityLogoUrl} />

      {/* Hero */}
      <section className="relative min-h-[calc(100svh-3.5rem)] flex flex-col justify-start px-6 md:px-16 lg:px-24 pt-20 pb-10 md:pt-28 md:pb-20 border-b overflow-hidden" style={{ background: 'var(--plattform-light)' }}>
        <Flag
          className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 h-[45%] w-auto opacity-10 pointer-events-none"
          strokeWidth={1}
          aria-hidden="true"
          style={{ color: 'var(--plattform)' }}
        />
        <ScrollHint />
        <EyebrowBadge label={`UrbanKIT · So kannst du mitmachen`} opacity={0.6} />
        <h1 className="text-hero font-black leading-none tracking-tight mb-5">
          So gestaltest<br />du mit<span style={{ color: 'var(--plattform)' }}>.</span>
        </h1>
        <p className="text-text leading-relaxed max-w-2xl">
          Registrieren. Projekte entdecken. Mitgestalten. So funktioniert Beteiligung in {cityName}.
        </p>
      </section>

      {/* Steps */}
      {STEPS.map((step) => (
        <section
          key={step.number}
          className="relative overflow-hidden min-h-svh flex flex-col justify-center px-6 md:px-16 lg:px-24 py-12 md:py-24 border-b"
          style={{ background: 'var(--plattform-light)' }}
        >
          {/* Ghost number */}
          <span
            className="absolute right-0 top-1/2 -translate-y-1/2 font-black leading-none select-none pointer-events-none"
            style={{ fontSize: '32rem', color: 'var(--plattform-ink)', opacity: 0.04, lineHeight: 1 }}
            aria-hidden="true"
          >
            {step.number}
          </span>

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            {/* Left */}
            <div>
              <EyebrowBadge label={`Schritt ${step.number}`} opacity={0.6} />
              <h2 className="text-title font-black tracking-tight mb-5">
                <span style={{ color: 'var(--plattform)' }}>{step.number}. </span>{step.title}
              </h2>
              <p className="text-text leading-relaxed mb-10">{step.description}</p>
              {step.cta && (
                <CtaButton href={`/${locale}/${step.cta.href}`} label={step.cta.label} icon={<step.cta.icon />} />
              )}
            </div>

            {/* Right — feature accordion */}
            <FeatureAccordion stepIndex={parseInt(step.number) - 1} />
          </div>
        </section>
      ))}

      {/* Invitation + Events */}
      <section className="relative min-h-svh flex flex-col justify-center px-6 md:px-16 lg:px-24 py-12 md:py-24 border-b" style={{ background: 'var(--plattform-light)' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          {/* Left */}
          <div>
            <EyebrowBadge label="Einladung" opacity={0.6} />
            <h2 className="text-title font-black tracking-tight mb-5">
              Du hast eine<br />Einladung<span style={{ color: 'var(--plattform)' }}>?</span>
            </h2>
            <p className="text-text leading-relaxed opacity-70">
              Mitarbeiter:innen der Stadt {cityName} können Bürger:innen direkt zur Mitarbeit einladen. Den Code findest du in der Einladung per Post oder E-Mail.
            </p>
          </div>

          {/* Right */}
          <div className="flex flex-col gap-4">
            {/* Code form card */}
            <div className="bg-white rounded-xl border p-6 flex flex-col gap-3 hover:shadow-md transition-all">
              <p className="text-small font-normal tracking-widest uppercase" style={{ color: 'var(--plattform-ink)' }}>Dein Einladungscode</p>
              <InvitationForm />
              <p className="text-small" style={{ color: 'var(--plattform-ink)' }}>Du gelangst direkt in das entsprechende Projekt — ohne weitere Hürden.</p>
            </div>

            {/* Events card */}
            <div className="bg-white rounded-xl border p-6 flex flex-col gap-4 hover:shadow-md transition-all">
              <p className="text-small font-normal tracking-widest uppercase" style={{ color: 'var(--plattform-ink)' }}>Nächste öffentliche Termine</p>
              {EVENTS.map((ev) => (
                <div key={ev.title} className="flex gap-4 items-center border-t pt-4 first:border-t-0 first:pt-0">
                  <div className="shrink-0 w-10 text-center">
                    <p className="text-display font-black leading-none" style={{ color: 'var(--plattform)' }}>{ev.day}</p>
                    <p className="text-small font-normal tracking-widest" style={{ color: 'var(--plattform-ink)' }}>{ev.month}</p>
                  </div>
                  <div>
                    <p className="text-text font-semibold" style={{ color: 'var(--plattform-ink-accent)' }}>{ev.title}</p>
                    <p className="text-small" style={{ color: 'var(--plattform-ink)' }}>{ev.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="min-h-svh flex flex-col justify-center px-6 md:px-16 lg:px-24 py-12 md:py-24" style={{ background: 'var(--plattform-light)' }}>
        <EyebrowBadge label="Jetzt mitmachen" opacity={0.6} />
        <h2 className="text-hero font-black leading-none tracking-tight mb-5">
          Bist du bereit<span style={{ color: 'var(--plattform)' }}>?</span>
        </h2>
        <p className="text-text leading-relaxed mb-10 max-w-sm">
          Registriere dich jetzt und fang direkt an — es dauert weniger als eine Minute.
        </p>
        <div className="flex flex-wrap gap-3">
          <CtaButton href={`/${locale}/platform/register`} label="Jetzt registrieren" icon={<Flag />} />
          <CtaButton href={`/${locale}/ueber-urbankit`} label="Mehr über UrbanKIT" icon={<Info />} />
        </div>
      </section>

      <PublicFooter locale={locale} />
    </div>
  )
}
