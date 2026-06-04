import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicNav } from '@/components/public/PublicNav'
import { PublicFooter } from '@/components/public/PublicFooter'
import { EyebrowBadge } from '@/components/public/EyebrowBadge'
import { ScrollHint } from '@/components/public/ScrollHint'
import { CtaButton } from '@/components/public/CtaButton'
import { getCitySettings } from '@/lib/instance'
import { BookOpen, ExternalLink, Handshake, Route, Scale, type LucideIcon } from 'lucide-react'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Grundlagen & Methoden – Urban KIT',
    description: 'Verstehen, wie Beteiligung funktioniert. Wissen aufbauen. Methoden finden.',
  }
}

const GRUNDLAGEN: { href: string; title: string; icon: LucideIcon; text: string }[] = [
  {
    href: '/grundlagen/partizipation',
    title: 'Partizipation',
    icon: Handshake,
    text: 'Was Beteiligung bedeutet, wie sie funktioniert und warum sie in der Stadtentwicklung entscheidend ist.',
  },
  {
    href: '/grundlagen/projektplanung',
    title: 'Projektplanung',
    icon: Route,
    text: 'Von der ersten Idee bis zur Umsetzung — ein Leitfaden durch die Phasen eines partizipativen Stadtprojekts.',
  },
  {
    href: '/grundlagen/recht',
    title: 'Rechtlicher Rahmen',
    icon: Scale,
    text: 'Gesetze, Beteiligungsrechte und die regulatorischen Grundlagen der Plattform — nachvollziehbar erklärt.',
  },
]

export default async function BereichGrundlagenPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const { cityName, cityLogoUrl } = await getCitySettings()

  return (
    <div className="min-h-svh flex flex-col">
      <PublicNav locale={locale} cityName={cityName} cityLogoUrl={cityLogoUrl} />

      {/* Hero */}
      <section
        className="relative flex-1 min-h-[calc(100svh-3.5rem)] flex flex-col overflow-hidden border-b"
        style={{ background: 'var(--grundlagen-light)' }}
      >
        <ScrollHint color="var(--grundlagen-dark)" />
        <BookOpen
          className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 h-[45%] w-auto opacity-10 pointer-events-none"
          strokeWidth={1}
          aria-hidden="true"
          style={{ color: 'var(--grundlagen-dark)' }}
        />

        {/* Main content — left-aligned, upper area */}
        <div className="relative z-10 flex-1 flex flex-col justify-start px-6 pt-20 md:pt-28 md:px-16 lg:px-24">
          <EyebrowBadge label="Bereich" bg="var(--grundlagen)" color="var(--plattform-ink)" />
          <h1 className="text-hero font-black leading-none tracking-tight mb-5">
            Grundlagenwissen<br />
            <span style={{ color: 'var(--grundlagen-dark)' }}>&</span> Methoden<span style={{ color: 'var(--grundlagen-dark)' }}>.</span>
          </h1>
          <p className="text-text leading-relaxed max-w-2xl" style={{ color: 'var(--plattform-ink)' }}>
            Verstehen, wie Beteiligung funktioniert. Wissen aufbauen. Methoden finden. Beteiligung begründen. Mit Hintergrundwissen, Methoden und Einordnung für Stadtmitarbeitende und alle, die verstehen wollen, wie partizipative Prozesse funktionieren.
          </p>
        </div>

        {/* CTA — bottom right */}
        <div className="relative z-10 flex flex-col items-end gap-3 px-6 pb-8 md:pb-14 md:px-16 lg:px-24 self-end">
          <CtaButton
            href="https://methoden.urbankit.de"
            label="Direkt zur Methodensammlung"
            icon={<ExternalLink />}
            variant="grundlagen"
          />
        </div>
      </section>

      {/* Grundlagen */}
      <section
        id="grundlagen"
        className="relative overflow-hidden min-h-svh flex flex-col justify-center px-6 md:px-16 lg:px-24 py-12 md:py-24 border-b"
        style={{ background: 'var(--grundlagen-light)' }}
      >
        <div className="relative z-10 w-full">
        <EyebrowBadge label="Grundlagen verstehen" bg="var(--grundlagen)" color="var(--plattform-ink)" />

        <h2 className="text-title font-black tracking-tight mb-6">
          Die Grundlagen
        </h2>

        <p className="text-text leading-relaxed max-w-2xl mb-12" style={{ color: 'var(--plattform-ink)' }}>
          Die Grundlagen bilden das Rückgrat — Beteiligung verstehen, Projekte gestalten, den rechtlichen Rahmen kennen.
          Und wer direkt loslegen möchte, findet weiter unten die passenden Methoden.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {GRUNDLAGEN.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={`/${locale}${item.href}`}
                className="group flex flex-col gap-3 p-7 rounded-xl border transition-all hover:shadow-md bg-white hover:bg-[var(--grundlagen-light)]"
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-[1.1em] h-[1.1em] shrink-0 text-text" style={{ color: 'var(--grundlagen-dark)' }} />
                  <h3 className="text-display font-black tracking-tight" style={{ color: 'var(--grundlagen-dark)' }}>{item.title}</h3>
                </div>
                <p className="text-text flex-1" style={{ color: 'var(--plattform-ink)' }}>{item.text}</p>
                <span className="text-small opacity-60 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--grundlagen-dark)' }}>
                  Mehr lesen →
                </span>
              </Link>
            )
          })}
        </div>

        {/* Methoden — two cards */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <Link
            href="#methoden"
            className="group flex flex-col gap-3 p-7 rounded-xl border transition-all hover:shadow-md bg-white hover:bg-[var(--grundlagen-light)]"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-[1.1em] h-[1.1em] shrink-0 text-text" style={{ color: 'var(--grundlagen-dark)' }} />
              <h3 className="text-display font-black tracking-tight" style={{ color: 'var(--grundlagen-dark)' }}>Was sind Methoden?</h3>
            </div>
          </Link>
          <a
            href="https://methoden.urbankit.de"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col gap-3 p-7 rounded-xl border transition-all hover:shadow-md bg-white hover:bg-[var(--grundlagen-light)]"
          >
            <div className="flex items-center gap-2">
              <ExternalLink className="w-[1.1em] h-[1.1em] shrink-0 text-text" style={{ color: 'var(--grundlagen-dark)' }} />
              <h3 className="text-display font-black tracking-tight" style={{ color: 'var(--grundlagen-dark)' }}>Methodensammlung</h3>
            </div>
          </a>
        </div>
        </div>
      </section>

      {/* Methoden */}
      <section
        id="methoden"
        className="relative overflow-hidden min-h-svh flex flex-col justify-center px-6 md:px-16 lg:px-24 py-12 md:py-24"
        style={{ background: 'var(--grundlagen-light)' }}
      >
        <BookOpen
          className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 h-[40%] w-auto opacity-[0.07] pointer-events-none"
          strokeWidth={1}
          aria-hidden="true"
          style={{ color: 'var(--grundlagen-dark)' }}
        />
        <div className="relative z-10 w-full">
          <EyebrowBadge label="Wissen in die Praxis bringen" bg="var(--grundlagen)" color="var(--plattform-ink)" />
          <h2 className="text-title font-black tracking-tight mb-6">
            Die Methoden
          </h2>
          <p className="text-text leading-relaxed max-w-2xl mb-10" style={{ color: 'var(--plattform-ink)' }}>
            Methoden sind das Werkzeug der Beteiligung. Sie beschreiben konkret, wie Prozesse gestaltet, Menschen eingebunden und Ergebnisse gesichert werden. Jede Methode ist aus realen Projekten heraus entstanden und gibt Auskunft über Ziel, Aufwand und Einsatzzweck.
          </p>
          <CtaButton
            href="https://methoden.urbankit.de"
            label="Methodensammlung öffnen"
            icon={<ExternalLink />}
            variant="grundlagen"
          />
        </div>
      </section>

      <PublicFooter locale={locale} />
    </div>
  )
}
