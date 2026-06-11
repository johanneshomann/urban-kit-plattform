import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicNavServer } from '@/components/public/PublicNavServer'
import { PublicFooter } from '@/components/public/PublicFooter'
import { EyebrowBadge } from '@/components/public/EyebrowBadge'
import { ScrollHint } from '@/components/public/ScrollHint'
import { getCitySettings } from '@/lib/instance'
import { ChevronLeft, Scale } from 'lucide-react'
import { PartizipationAccordion } from '../partizipation/PartizipationAccordion'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Rechtlicher Rahmen – Grundlagen | Urban KIT',
    description: 'Gesetzliche Grundlagen und Anforderungen für kommunale Bürgerbeteiligung in Deutschland.',
  }
}

const SECTIONS = [
  {
    title: 'Formelle Beteiligung nach BauGB',
    content: (
      <>
        <p>
          Das Baugesetzbuch (BauGB) ist die wichtigste gesetzliche Grundlage für formelle Bürgerbeteiligung in der Stadtplanung. Es schreibt vor, dass Bürgerinnen und Bürger frühzeitig und umfassend an Bauleitplanverfahren beteiligt werden müssen.
        </p>
        <p>
          Die <strong>frühzeitige Öffentlichkeitsbeteiligung</strong> (§ 3 Abs. 1 BauGB) soll stattfinden, bevor ein Bebauungsplan oder Flächennutzungsplan beschlossen wird. Ziel ist es, die Öffentlichkeit über die allgemeinen Ziele und Zwecke der Planung zu unterrichten und ihr Gelegenheit zur Äußerung und Erörterung zu geben.
        </p>
        <blockquote className="border-l-4 pl-5 py-1 italic" style={{ borderColor: 'var(--grundlagen)', color: 'var(--plattform-ink)' }}>
          Die förmliche Auslegung (§ 3 Abs. 2 BauGB) verpflichtet Kommunen, Planentwürfe für mindestens 30 Tage öffentlich auszulegen und Einwendungen entgegenzunehmen.
        </blockquote>
        <p>
          Alle eingegangenen Stellungnahmen müssen geprüft und das Ergebnis den Einwendenden mitgeteilt werden. Nicht berücksichtigte Einwände sind zu begründen.
        </p>
      </>
    ),
  },
  {
    title: 'Gemeindeordnungen der Länder',
    content: (
      <>
        <p>
          Neben dem BauGB regeln die Gemeindeordnungen der 16 Bundesländer die Bürgerbeteiligung auf kommunaler Ebene. Sie unterscheiden sich erheblich — von einfachen Informationspflichten bis hin zu weitreichenden Mitwirkungsrechten.
        </p>
        <p>
          Typische Instrumente in den Gemeindeordnungen sind:
        </p>
        <ul className="flex flex-col gap-1 pl-2">
          <li><strong>Bürgerbegehren & Bürgerentscheid:</strong> Direkte Demokratie auf kommunaler Ebene — Bürger können Sachentscheidungen erzwingen.</li>
          <li><strong>Einwohnerantrag:</strong> Recht, bestimmte Themen auf die Tagesordnung des Gemeinderats zu setzen.</li>
          <li><strong>Einwohnerfragestunde:</strong> Öffentliche Befragung von Gemeinderatsmitgliedern.</li>
          <li><strong>Informationsrechte:</strong> Anspruch auf Auskunft über Gemeindeangelegenheiten.</li>
        </ul>
        <p>
          Bayern, Baden-Württemberg und NRW haben besonders ausdifferenzierte Regelungen. Es empfiehlt sich, die konkrete Gemeindeordnung des jeweiligen Bundeslandes zu prüfen.
        </p>
      </>
    ),
  },
  {
    title: 'Informelle Beteiligung',
    content: (
      <>
        <p>
          Informelle Beteiligungsverfahren sind gesetzlich nicht vorgeschrieben, aber politisch und fachlich anerkannt. Sie ergänzen die formellen Verfahren und erlauben kreativere, niedrigschwelligere Formate.
        </p>
        <p>
          Typische informelle Formate sind Zukunftswerkstätten, Planungszellen, Bürgerforen, Online-Konsultationen oder Quartiersgespräche. Sie sind flexibel gestaltbar — müssen aber transparent und klar abgegrenzt von formellen Verfahren kommuniziert werden.
        </p>
        <blockquote className="border-l-4 pl-5 py-1 italic" style={{ borderColor: 'var(--grundlagen)', color: 'var(--plattform-ink)' }}>
          Wichtig: Informelle Beteiligung ersetzt keine formellen Verfahren. Sie kann diese vorbereiten, begleiten oder ergänzen — aber nicht ersetzen.
        </blockquote>
        <p>
          Ergebnisse informeller Verfahren haben keine bindende Rechtswirkung. Umso wichtiger ist es, transparent zu kommunizieren, welchen Stellenwert die Ergebnisse im Gesamtprozess haben.
        </p>
      </>
    ),
  },
  {
    title: 'Datenschutz (DSGVO)',
    content: (
      <>
        <p>
          Bei Beteiligungsverfahren werden häufig personenbezogene Daten erhoben — Namen, E-Mail-Adressen, Standortdaten oder Meinungsäußerungen. Die Datenschutz-Grundverordnung (DSGVO) und das Bundesdatenschutzgesetz (BDSG) setzen hierfür klare Rahmenbedingungen.
        </p>
        <p>
          Zentrale Pflichten bei Beteiligungsformaten:
        </p>
        <ul className="flex flex-col gap-1 pl-2">
          <li><strong>Rechtsgrundlage klären:</strong> Datenerhebung braucht eine Grundlage — meist Einwilligung oder öffentliches Interesse.</li>
          <li><strong>Datenschutzerklärung bereitstellen:</strong> Transparenz über Zweck, Speicherdauer und Weitergabe.</li>
          <li><strong>Datensparsamkeit:</strong> Nur so viele Daten erheben wie nötig.</li>
          <li><strong>Löschfristen einhalten:</strong> Daten nach Zweckerfüllung löschen.</li>
        </ul>
        <p>
          Bei digitalen Beteiligungsplattformen sollte die datenschutzrechtliche Konformität vor dem Launch geprüft werden. Ein Datenschutz-Impact-Assessment (DSFA) kann bei risikobehafteten Verfahren nötig sein.
        </p>
      </>
    ),
  },
  {
    title: 'Barrierefreiheit und Gleichstellung',
    content: (
      <>
        <p>
          Echte Beteiligung setzt Zugänglichkeit voraus. Mehrere Gesetze verpflichten öffentliche Stellen, Barrieren abzubauen:
        </p>
        <ul className="flex flex-col gap-1 pl-2">
          <li><strong>Behindertengleichstellungsgesetz (BGG):</strong> Barrierefreie Kommunikation und Zugänglichkeit öffentlicher Angebote.</li>
          <li><strong>Landesgleichstellungsgesetze:</strong> Gendergerechtigkeit in Planung und Beteiligung.</li>
          <li><strong>WCAG (Web Content Accessibility Guidelines):</strong> Standard für barrierefreie digitale Angebote — Pflicht für öffentliche Stellen ab WCAG 2.1 AA.</li>
        </ul>
        <p>
          In der Praxis bedeutet das: Veranstaltungen in barrierefreien Räumen, mehrsprachige Materialien, einfache Sprache, Gebärdensprachdolmetscher bei Bedarf und technisch barrierefreie Online-Tools.
        </p>
        <blockquote className="border-l-4 pl-5 py-1 italic" style={{ borderColor: 'var(--grundlagen)', color: 'var(--plattform-ink)' }}>
          Barrierefreiheit ist kein Zusatz — sie ist Grundvoraussetzung für eine Beteiligung, die alle erreicht.
        </blockquote>
      </>
    ),
  },
  {
    title: 'Haftung und Verbindlichkeit von Beteiligungsergebnissen',
    content: (
      <>
        <p>
          Eine häufig unterschätzte rechtliche Frage: Welche Bindungswirkung haben Beteiligungsergebnisse? Die Antwort ist klar — <strong>grundsätzlich keine.</strong> Beteiligungsergebnisse sind politisch bedeutsam, aber rechtlich nicht verbindlich.
        </p>
        <p>
          Entscheidungen liegen weiterhin bei den demokratisch gewählten Gremien. Kein Beteiligungsformat kann deren Entscheidungskompetenz ersetzen oder einschränken.
        </p>
        <p>
          Das schafft Verantwortung für die Kommunikation: Wenn Beteiligungsergebnisse nicht oder nur teilweise umgesetzt werden, muss das nachvollziehbar begründet werden — sonst droht Vertrauensverlust.
        </p>
        <p>
          Haftungsrechtlich relevant wird Beteiligung vor allem bei Verfahrensfehlern im formellen Bereich: Werden gesetzlich vorgeschriebene Beteiligungsschritte ausgelassen, kann das zur Nichtigkeit von Planungsbeschlüssen führen.
        </p>
      </>
    ),
  },
  {
    title: 'Checkliste: Rechtssicher beteiligen',
    content: (
      <>
        <p>Eine praktische Orientierung für die Vorbereitung von Beteiligungsverfahren:</p>
        <ul className="flex flex-col gap-2 pl-2">
          <li><strong>Formelle Pflichten geprüft?</strong> BauGB, Gemeindeordnung, Fachgesetze checken.</li>
          <li><strong>Datenschutz geklärt?</strong> Rechtsgrundlage, Datenschutzerklärung, Löschkonzept.</li>
          <li><strong>Barrierefreiheit sichergestellt?</strong> Raum, Sprache, digitale Tools.</li>
          <li><strong>Verbindlichkeit transparent kommuniziert?</strong> Was passiert mit den Ergebnissen?</li>
          <li><strong>Dokumentation geplant?</strong> Nachweis der Beteiligung für spätere Verfahrensschritte.</li>
          <li><strong>Rechtsmittelbelehrung?</strong> Bei formellen Verfahren: Hinweis auf Einwendungsfristen.</li>
        </ul>
      </>
    ),
  },
]

export default async function GrundlagenRechtPage({ params }: { params: Promise<{ locale: string }> }) {
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
        <Scale
          className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 h-[45%] w-auto opacity-10 pointer-events-none"
          strokeWidth={1}
          aria-hidden="true"
          style={{ color: 'var(--grundlagen-dark)' }}
        />

        <div className="relative z-10 flex-1 flex flex-col justify-start px-6 pt-20 md:pt-28 md:px-16 lg:px-24">
          <EyebrowBadge label="Grundlagen / Rechtlicher Rahmen" bg="var(--grundlagen)" color="var(--plattform-ink)" />
          <h1 className="text-hero font-black leading-none tracking-tight mb-5">
            Rechtlicher Rahmen<span style={{ color: 'var(--grundlagen-dark)' }}>.</span>
          </h1>
          <p className="text-text leading-relaxed max-w-2xl" style={{ color: 'var(--plattform-ink)' }}>
            Welche Gesetze gelten, was Kommunen verpflichtet sind und wie Beteiligung rechtssicher gestaltet wird.
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
          href={`${base}/projektplanung`}
          className="inline-flex items-center gap-1 text-small transition-opacity opacity-60 hover:opacity-100"
          style={{ color: 'var(--grundlagen-dark)' }}
        >
          <ChevronLeft className="w-[1em] h-[1em] shrink-0" />
          Projektplanung
        </Link>
        <Link
          href={base}
          className="inline-flex items-center gap-1 text-small transition-opacity opacity-60 hover:opacity-100"
          style={{ color: 'var(--grundlagen-dark)' }}
        >
          Alle Grundlagen
        </Link>
      </nav>

      <PublicFooter locale={locale} />
    </div>
  )
}
