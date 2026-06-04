import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicNav } from '@/components/public/PublicNav'
import { PublicFooter } from '@/components/public/PublicFooter'
import { EyebrowBadge } from '@/components/public/EyebrowBadge'
import { ScrollHint } from '@/components/public/ScrollHint'
import { getCitySettings } from '@/lib/instance'
import { ChevronLeft, ChevronRight, Handshake } from 'lucide-react'
import { PartizipationAccordion } from './PartizipationAccordion'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Partizipation – Grundlagen | Urban KIT',
    description: 'Was ist Partizipation, warum ist sie wichtig und wie gelingt sie in der Stadtentwicklung?',
  }
}

const SECTIONS = [
  {
    title: 'Was wir unter Partizipation verstehen',
    content: (
      <>
        <p>
          Partizipation bedeutet für uns, Interessen und Bedürfnisse der Betroffenen frühzeitig und nachvollziehbar in Entscheidungsprozesse einzubeziehen. Menschen wirken aktiv an Prozessen, Entscheidungen, Systemen und Entwicklungen mit, die sie betreffen.
        </p>
        <p>
          Sie ist kein Mittel, um bereits getroffene Entscheidungen nachträglich zu legitimieren. Sie ist nicht nur ein demokratisches Prinzip, sondern ein bewusst gestalteter Prozess und gelebte Praxis.
        </p>
        <blockquote className="border-l-4 pl-5 py-1 italic" style={{ borderColor: 'var(--grundlagen)', color: 'var(--plattform-ink)' }}>
          Wer einbezogen wird, erlebt bei gelungener Partizipation, dass die eigene Stimme zählt, Entscheidungen nachvollziehbar werden, Vertrauen entsteht und ein Gefühl von Zusammenhalt entstehen kann.
        </blockquote>
        <p>
          Projekte gewinnen dadurch an Qualität, weil sie näher an den tatsächlichen Bedürfnissen der Menschen liegen und weniger anfällig für Konflikte oder Blockaden sind.
        </p>
        <p>
          Entscheidend ist, dass Rollen, Spielräume, Ziele und Entscheidungen transparent benannt werden. <strong>Beteiligung wirkt nur dann, wenn sie ernst genommen, strukturiert umgesetzt und sichtbar in Entscheidungsprozesse eingebunden wird.</strong> Beteiligung wirkt nur dann glaubwürdig, wenn klar ist, welchen Einfluss Beiträge tatsächlich haben.
        </p>
      </>
    ),
  },
  {
    title: 'Warum Partizipation wichtig ist',
    content: (
      <p>
        Beteiligung erhöht die Akzeptanz von Planungsentscheidungen, bringt lokales Wissen in den Prozess und stärkt das Vertrauen zwischen Verwaltung und Bevölkerung. [Inhalt folgt]
      </p>
    ),
  },
  {
    title: 'Rechtlicher Rahmen in Kürze',
    content: (
      <p>
        Formelle Beteiligungsverfahren sind in Deutschland gesetzlich verankert — unter anderem im Baugesetzbuch (BauGB) und in den Gemeindeordnungen der Länder. [Inhalt folgt]
      </p>
    ),
  },
  {
    title: 'Unsere Haltung zu guter Partizipation',
    content: <p>[Inhalt folgt]</p>,
  },
  {
    title: 'Partizipationsmodell',
    content: <p>[Inhalt folgt]</p>,
  },
  {
    title: 'Die Leitfragen für jedes Beteiligungsprojekt',
    content: <p>[Inhalt folgt]</p>,
  },
  {
    title: 'Prozesskern und strukturelle Voraussetzungen',
    content: <p>[Inhalt folgt]</p>,
  },
  {
    title: 'Konflikt- & Machtfragen',
    content: <p>[Inhalt folgt]</p>,
  },
  {
    title: 'Transparenz, Repräsentativität & Nicht-Übernahme',
    content: <p>[Inhalt folgt]</p>,
  },
  {
    title: 'Evaluation',
    content: <p>[Inhalt folgt]</p>,
  },
  {
    title: 'Partizipation im Smart-City-Kontext',
    content: <p>[Inhalt folgt]</p>,
  },
]

export default async function GrundlagenPartizipationPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const { cityName, cityLogoUrl } = await getCitySettings()
  const base = `/${locale}/bereich/grundlagen`

  return (
    <div className="min-h-svh flex flex-col">
      <PublicNav locale={locale} cityName={cityName} cityLogoUrl={cityLogoUrl} />

      {/* Hero */}
      <section
        className="relative flex-1 min-h-[calc(100svh-3.5rem)] flex flex-col overflow-hidden border-b"
        style={{ background: 'var(--grundlagen-light)' }}
      >
        <ScrollHint color="var(--grundlagen-dark)" />
        <Handshake
          className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 h-[45%] w-auto opacity-10 pointer-events-none"
          strokeWidth={1}
          aria-hidden="true"
          style={{ color: 'var(--grundlagen-dark)' }}
        />

        <div className="relative z-10 flex-1 flex flex-col justify-start px-6 pt-20 md:pt-28 md:px-16 lg:px-24">
          <EyebrowBadge label="Grundlagen / Partizipation" bg="var(--grundlagen)" color="var(--plattform-ink)" />
          <h1 className="text-hero font-black leading-none tracking-tight mb-5">
            Partizipation<span style={{ color: 'var(--grundlagen-dark)' }}>.</span>
          </h1>
          <p className="text-text leading-relaxed max-w-2xl" style={{ color: 'var(--plattform-ink)' }}>
            Was wir unter Beteiligung verstehen, warum sie wichtig ist und wie sie in der Praxis gelingt — von der Definition bis zur Evaluation.
          </p>
        </div>
      </section>

      {/* Accordion */}
      <section className="flex-1 px-6 md:px-16 lg:px-24 py-12 md:py-16" style={{ background: 'var(--grundlagen-light)' }}>
        <PartizipationAccordion sections={SECTIONS} />
      </section>

      {/* Bottom nav */}
      <nav className="border-t px-6 md:px-16 lg:px-24 py-6 flex justify-between items-center" style={{ background: 'var(--grundlagen-light)' }}>
        <Link
          href={base}
          className="inline-flex items-center gap-1 text-small transition-opacity opacity-60 hover:opacity-100"
          style={{ color: 'var(--grundlagen-dark)' }}
        >
          <ChevronLeft className="w-[1em] h-[1em] shrink-0" />
          Alle Grundlagen
        </Link>
        <Link
          href={`${base}/projektplanung`}
          className="inline-flex items-center gap-1 text-small transition-opacity opacity-60 hover:opacity-100"
          style={{ color: 'var(--grundlagen-dark)' }}
        >
          Projektplanung
          <ChevronRight className="w-[1em] h-[1em] shrink-0" />
        </Link>
      </nav>

      <PublicFooter locale={locale} />
    </div>
  )
}
