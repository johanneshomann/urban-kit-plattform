import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicNavServer } from '@/components/public/PublicNavServer'
import { PublicFooter } from '@/components/public/PublicFooter'
import { EyebrowBadge } from '@/components/public/EyebrowBadge'
import { ScrollHint } from '@/components/public/ScrollHint'
import { getCitySettings } from '@/lib/instance'
import { ChevronLeft, ChevronRight, Route } from 'lucide-react'
import { ProjektplanungAccordion, type ProjektStep } from './ProjektplanungAccordion'
import { PROJEKTPHASEN } from '@/lib/options/projektphasen'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Projektplanung – Grundlagen | Urban KIT',
    description: 'Von der ersten Idee bis zur Umsetzung — ein Leitfaden durch die Phasen eines partizipativen Stadtprojekts.',
  }
}

const STEPS: ProjektStep[] = [
  {
    phase: PROJEKTPHASEN[0].label,
    title: 'Vor dem Anfang',
    ziel: (
      <p>
        Grundverständnis und Motivation schaffen: Wozu machen wir Beteiligung überhaupt?
        Welche Werte, Haltungen und Leitlinien tragen uns? Nur wenn allen klar ist, <strong>warum
        Beteiligung wichtig ist</strong>, entsteht Vertrauen, Offenheit und Energie für den gesamten Prozess.
      </p>
    ),
    intro: (
      <p>
        Stell dir vor: Du hast eine gute Idee — eine neue App, ein Platzumbau, eine Mobilitätsstrategie.
        Bevor du fragst „Was genau wollen wir verändern?", stell dir erst die Frage: <strong>„Warum wollen
        wir Menschen beteiligen?"</strong> Ist es nur Pflicht, oder echter Wille zur Mitgestaltung?
        Ein klar formuliertes „Warum" ist der Startschuss, der Menschen motiviert, überhaupt einzusteigen.
      </p>
    ),
    todos: [
      { bold: 'Motivation klären', text: 'Warum Beteiligung? Pflicht, Image, Qualität, Legitimation, Innovation?' },
      { bold: 'Haltung & Werte definieren', text: 'Offenheit: Welche Fragen sind wirklich offen?' },
      { bold: 'Transparenz', text: 'Wie gehen wir mit Ergebnissen um?' },
      { bold: 'Diversität', text: 'Welche Stimmen wollen wir unbedingt hören?' },
      { bold: 'Rahmenbedingungen benennen', text: 'Ressourcen (Zeit, Budget, Personal) und Grenzen (politisch, rechtlich, organisatorisch)' },
      { bold: 'Vision formulieren', text: 'Ein gemeinsamer Satz, der alle trägt: „Wir machen Beteiligung, weil ..."' },
    ],
    wichtig: (
      <p>
        Ohne ehrliches „Warum" droht Scheinpartizipation. Ein gemeinsames Wertefundament schützt vor
        Konflikten in späteren Schritten. <strong>Haltung prägt den ganzen Prozess — mehr als jedes Tool.</strong>
      </p>
    ),
    methoden: [
      { name: 'Kick-off-Dialog', description: 'Internes Teamgespräch · Vision & Werte sammeln' },
      { name: 'Warum-Workshop', description: '5-Why-Methode · Purpose Statement entwickeln' },
    ],
  },
  {
    phase: PROJEKTPHASEN[1].label,
    title: 'Kontext verstehen',
    ziel: <p>Den Ist-Zustand, die Stakeholder und das Themenfeld kennenlernen.</p>,
    intro: <p>Bevor geplant wird, muss verstanden werden — wer ist betroffen, was gibt es bereits, was wird erwartet?</p>,
    todos: [
      { bold: 'Stakeholder-Analyse', text: 'Wer ist betroffen, wer hat Einfluss, wer sollte einbezogen werden?' },
      { bold: 'Dokumentensichtung', text: 'Bestehende Pläne, Beschlüsse, Gutachten recherchieren' },
      { bold: 'Erste Gespräche', text: 'Informelle Interviews mit Schlüsselpersonen' },
    ],
    wichtig: <p>Ohne solide Einarbeitung entstehen blinde Flecken, die später Vertrauen kosten.</p>,
    methoden: [
      { name: 'Stakeholder-Map', description: 'Visualisierung von Akteuren & Beziehungen' },
      { name: 'Desk Research', description: 'Sichtung bestehender Dokumente & Pläne' },
    ],
  },
  {
    phase: PROJEKTPHASEN[2].label,
    title: 'Beteiligungskonzept entwickeln',
    ziel: <p>Ein schlüssiges Konzept erarbeiten, das Ziele, Zielgruppen, Formate und Zeitplan festlegt.</p>,
    intro: <p>Das Konzept ist der Fahrplan. Es beantwortet: Wen beteiligen wir, womit, wann und wie?</p>,
    todos: [
      { bold: 'Ziele konkretisieren', text: 'Was soll Beteiligung bewirken?' },
      { bold: 'Zielgruppen definieren', text: 'Wen wollen wir erreichen, wen müssen wir erreichen?' },
      { bold: 'Formate auswählen', text: 'Online, analog, hybrid — was passt zum Kontext?' },
      { bold: 'Zeitplan erstellen', text: 'Meilensteine, Puffer, politische Termine berücksichtigen' },
    ],
    wichtig: <p>Ein Konzept ohne Ressourcenplanung ist ein Wunschzettel. Realistisch bleiben.</p>,
    methoden: [
      { name: 'Beteiligungsmatrix', description: 'Formate & Zielgruppen abgleichen' },
      { name: 'Projektstrukturplan', description: 'Aufgaben, Verantwortlichkeiten, Termine' },
    ],
  },
  {
    phase: PROJEKTPHASEN[3].label,
    title: 'Operativ planen',
    ziel: <p>Die operative Ebene klären: Wer macht was bis wann, mit welchen Ressourcen?</p>,
    intro: <p>Jetzt wird aus dem Konzept ein konkreter Aktionsplan mit Verantwortlichkeiten und Budgets.</p>,
    todos: [
      { bold: 'Aufgaben verteilen', text: 'Klare Rollen und Verantwortlichkeiten festlegen' },
      { bold: 'Budget planen', text: 'Kosten für Räume, Materialien, Kommunikation, Personal' },
      { bold: 'Kommunikationsplan', text: 'Wie informieren wir die Öffentlichkeit über die Beteiligung?' },
    ],
    wichtig: <p>Ohne klare Verantwortlichkeiten bleibt alles an einer Person hängen.</p>,
    methoden: [
      { name: 'Gantt-Chart', description: 'Zeitliche Planung visualisieren' },
      { name: 'Kommunikationskonzept', description: 'Zielgruppen & Kanäle festlegen' },
    ],
  },
  {
    phase: PROJEKTPHASEN[4].label,
    title: 'Beteiligung durchführen',
    ziel: <p>Die geplanten Beteiligungsformate umsetzen und dokumentieren.</p>,
    intro: <p>Jetzt passiert das eigentliche Beteiligungsgeschehen — Veranstaltungen, Workshops, Umfragen.</p>,
    todos: [
      { bold: 'Formate durchführen', text: 'Vorbereitung, Moderation, Dokumentation' },
      { bold: 'Ergebnisse sichern', text: 'Protokolle, Fotos, Visualisierungen' },
      { bold: 'Laufende Kommunikation', text: 'Teilnehmende über Fortschritte informieren' },
    ],
    wichtig: <p>Dokumentation ist kein Nachgedanke — sie ist Teil des Prozesses und schafft Vertrauen.</p>,
    methoden: [
      { name: 'World Café', description: 'Gruppenformat für breite Themenexploration' },
      { name: 'Online-Umfrage', description: 'Digitale Beteiligung für breite Zielgruppen' },
    ],
  },
  {
    phase: PROJEKTPHASEN[5].label,
    title: 'Prozess begleiten & steuern',
    ziel: <p>Den laufenden Prozess reflektieren und bei Bedarf nachsteuern.</p>,
    intro: <p>Beteiligung ist kein linearer Prozess. Regelmäßige Reflexion hilft, Kurs zu halten.</p>,
    todos: [
      { bold: 'Zwischenfazit ziehen', text: 'Was läuft gut, was nicht?' },
      { bold: 'Rückmeldungen einholen', text: 'Von Teilnehmenden und intern' },
      { bold: 'Anpassungen vornehmen', text: 'Flexibel auf Veränderungen reagieren' },
    ],
    wichtig: <p>Starre Pläne in dynamischen Kontexten zu verfolgen kostet mehr als flexibles Reagieren.</p>,
    methoden: [
      { name: 'Prozessreview', description: 'Interne Reflexionsrunde' },
      { name: 'Feedback-Bogen', description: 'Strukturierte Rückmeldung von Teilnehmenden' },
    ],
  },
  {
    phase: PROJEKTPHASEN[6].label,
    title: 'Abschließen & übergeben',
    ziel: <p>Die Beteiligung würdig abschließen, Ergebnisse übergeben und Gelerntes festhalten.</p>,
    intro: <p>Der Abschluss ist genauso wichtig wie der Start. Teilnehmende wollen wissen, was aus ihren Beiträgen wurde.</p>,
    todos: [
      { bold: 'Ergebnisbericht erstellen', text: 'Was wurde gehört, was wird umgesetzt, was nicht (und warum)?' },
      { bold: 'Rückmeldung geben', text: 'Teilnehmende über Entscheidungen informieren' },
      { bold: 'Evaluation durchführen', text: 'Was haben wir gelernt für das nächste Mal?' },
    ],
    wichtig: (
      <p>
        Ein fehlender Abschluss zerstört Vertrauen. <strong>Menschen wollen wissen, was mit ihren Beiträgen passiert ist.</strong>
      </p>
    ),
    methoden: [
      { name: 'Abschlussbericht', description: 'Zusammenfassung & Entscheidungsprotokoll' },
      { name: 'Lessons-Learned-Workshop', description: 'Reflexion für zukünftige Projekte' },
    ],
  },
]

export default async function GrundlagenProjektplanungPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const { cityName, cityLogoUrl } = await getCitySettings()
  const base = `/${locale}/bereich/grundlagen`

  return (
    <div className="min-h-svh flex flex-col">
      <PublicNavServer locale={locale} />

      {/* Hero */}
      <section
        className="relative flex-1 min-h-[calc(100svh-3.5rem)] flex flex-col overflow-hidden border-b"
        style={{ background: 'var(--grundlagen-light)' }}
      >
        <ScrollHint color="var(--grundlagen-dark)" />
        <Route
          className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 h-[45%] w-auto opacity-10 pointer-events-none"
          strokeWidth={1}
          aria-hidden="true"
          style={{ color: 'var(--grundlagen-dark)' }}
        />

        <div className="relative z-10 flex-1 flex flex-col justify-start px-6 pt-20 md:pt-28 md:px-16 lg:px-24">
          <EyebrowBadge label="Grundlagen / Projektplanung" bg="var(--grundlagen)" color="var(--plattform-ink)" />
          <h1 className="text-hero font-black leading-none tracking-tight mb-5">
            Projektplanung<span style={{ color: 'var(--grundlagen-dark)' }}>.</span>
          </h1>
          <p className="text-text leading-relaxed max-w-2xl" style={{ color: 'var(--plattform-ink)' }}>
            Von der ersten Idee bis zur Umsetzung — ein Leitfaden durch die Phasen eines partizipativen Stadtprojekts.
          </p>
        </div>
      </section>

      {/* Accordion */}
      <section className="flex-1 px-6 md:px-16 lg:px-24 py-12 md:py-16" style={{ background: 'var(--grundlagen-light)' }}>
        <ProjektplanungAccordion steps={STEPS} />
      </section>

      {/* Bottom nav */}
      <nav className="border-t px-6 md:px-16 lg:px-24 py-6 flex justify-between items-center" style={{ background: 'var(--grundlagen-light)' }}>
        <Link
          href={`${base}/partizipation`}
          className="inline-flex items-center gap-1 text-small transition-opacity opacity-60 hover:opacity-100"
          style={{ color: 'var(--grundlagen-dark)' }}
        >
          <ChevronLeft className="w-[1em] h-[1em] shrink-0" />
          Partizipation
        </Link>
        <Link
          href={`${base}/recht`}
          className="inline-flex items-center gap-1 text-small transition-opacity opacity-60 hover:opacity-100"
          style={{ color: 'var(--grundlagen-dark)' }}
        >
          Rechtlicher Rahmen
          <ChevronRight className="w-[1em] h-[1em] shrink-0" />
        </Link>
      </nav>

      <PublicFooter locale={locale} />
    </div>
  )
}
