import type { Metadata } from 'next'
import { PublicNavServer } from '@/components/public/PublicNavServer'
import { PublicFooter } from '@/components/public/PublicFooter'
import { EyebrowBadge } from '@/components/public/EyebrowBadge'
import { ScrollHint } from '@/components/public/ScrollHint'
import { getCitySettings } from '@/lib/instance'
import { ShieldCheck } from 'lucide-react'

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Datenschutz – Urban KIT' }
}

export default async function DatenschutzPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const { cityName, cityLogoUrl } = await getCitySettings()

  return (
    <div className="min-h-svh flex flex-col">
      <PublicNavServer locale={locale} />

      {/* Hero */}
      <section
        className="relative min-h-[calc(100svh-3.5rem)] flex flex-col justify-start overflow-hidden border-b px-6 md:px-16 lg:px-24 pt-20 pb-10 md:pt-28 md:pb-20"
        style={{ background: 'var(--plattform-light)' }}
      >
        <ShieldCheck
          className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 h-[45%] w-auto opacity-10 pointer-events-none"
          strokeWidth={1}
          aria-hidden="true"
          style={{ color: 'var(--plattform)' }}
        />
        <ScrollHint />
        <div className="relative z-10 max-w-2xl">
          <EyebrowBadge label="Rechtliches" opacity={0.6} />
          <h1 className="text-hero font-black leading-none tracking-tight mb-5">
            Datenschutz<span style={{ color: 'var(--plattform)' }}>.</span>
          </h1>
          <p className="text-text leading-relaxed max-w-2xl" style={{ color: 'var(--plattform-ink)' }}>
            Datenschutzerklärung gemäß Art. 13 DSGVO — Informationen zur Verarbeitung
            personenbezogener Daten auf dieser Plattform.
          </p>
        </div>
      </section>

      {/* Content */}
      <section
        className="flex-1 px-6 md:px-16 lg:px-24 py-12 md:py-24"
        style={{ background: 'var(--plattform-light)' }}
      >
        <div className="max-w-3xl flex flex-col gap-14">

          {/* 1. Verantwortlicher */}
          <div>
            <EyebrowBadge label="1. Verantwortlicher" opacity={0.6} />
            <h2 className="text-title font-black tracking-tight mb-6">
              Verantwortlicher<span style={{ color: 'var(--plattform)' }}>.</span>
            </h2>
            <div className="flex flex-col gap-4 text-text leading-relaxed" style={{ color: 'var(--plattform-ink)' }}>
              <p>
                Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) für die
                Verarbeitung personenbezogener Daten auf dieser Plattform ist:
              </p>
              <address className="not-italic bg-white rounded-xl border p-6 flex flex-col gap-1 text-text" style={{ color: 'var(--plattform-ink)' }}>
                <span className="font-semibold" style={{ color: 'var(--plattform-ink-accent)' }}>{cityName}</span>
                <span>Musterstraße 1</span>
                <span>12345 Musterstadt</span>
                <span className="mt-2">
                  E-Mail:{' '}
                  <a
                    href="mailto:urbankit@musterstadt.de"
                    className="transition-opacity hover:opacity-70"
                    style={{ color: 'var(--plattform)' }}
                  >
                    urbankit@musterstadt.de
                  </a>
                </span>
                <span>
                  Telefon: +49 (0) 1234 56789-0
                </span>
              </address>
            </div>
          </div>

          {/* 2. Datenerhebung */}
          <div>
            <EyebrowBadge label="2. Datenerhebung" opacity={0.6} />
            <h2 className="text-title font-black tracking-tight mb-6">
              Datenerhebung<span style={{ color: 'var(--plattform)' }}>.</span>
            </h2>
            <div className="flex flex-col gap-6 text-text leading-relaxed" style={{ color: 'var(--plattform-ink)' }}>
              <div>
                <h3 className="font-black mb-2" style={{ color: 'var(--plattform-ink-accent)' }}>Beim Besuch der Plattform</h3>
                <p>
                  Beim Aufrufen der UrbanKIT-Plattform werden durch den Webserver automatisch
                  Zugriffsdaten in sogenannten Server-Logfiles gespeichert. Dazu gehören:
                  IP-Adresse, aufgerufene Seiten, Datum und Uhrzeit des Zugriffs, übertragene
                  Datenmenge, Browsertyp und -version sowie das Betriebssystem. Diese Daten
                  werden ausschließlich zu technischen und sicherheitsbezogenen Zwecken
                  verarbeitet und nach spätestens 30 Tagen gelöscht.
                </p>
                <p className="mt-3">
                  Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigte Interessen des
                  Verantwortlichen an der Sicherheit und dem ordnungsgemäßen Betrieb der
                  Plattform).
                </p>
              </div>
              <div>
                <h3 className="font-black mb-2" style={{ color: 'var(--plattform-ink-accent)' }}>Registrierung und Nutzerkonto</h3>
                <p>
                  Zur Nutzung des vollen Funktionsumfangs der UrbanKIT-Plattform ist eine
                  Registrierung erforderlich. Dabei werden folgende Daten erhoben und
                  verarbeitet: Name, E-Mail-Adresse, ggf. Organisationszugehörigkeit sowie
                  die bei der Nutzung erstellten Inhalte (z. B. Beiträge, Projekte,
                  Kommentare). Diese Daten werden nur für den Betrieb der Plattform verwendet
                  und nicht an Dritte weitergegeben.
                </p>
                <p className="mt-3">
                  Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) sowie
                  Art. 6 Abs. 1 lit. a DSGVO (Einwilligung).
                </p>
              </div>
              <div>
                <h3 className="font-black mb-2" style={{ color: 'var(--plattform-ink-accent)' }}>Kontaktformular und E-Mail</h3>
                <p>
                  Wenn Sie uns über das Kontaktformular oder per E-Mail kontaktieren, werden
                  die von Ihnen übermittelten Daten (z. B. Name, E-Mail-Adresse, Nachrichteninhalt)
                  zur Bearbeitung Ihrer Anfrage gespeichert. Diese Daten werden nicht ohne Ihre
                  Einwilligung an Dritte weitergegeben und nach Abschluss der Kommunikation
                  gelöscht, sofern keine gesetzlichen Aufbewahrungspflichten bestehen.
                </p>
                <p className="mt-3">
                  Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO bzw. Art. 6 Abs. 1 lit. b DSGVO,
                  sofern die Kontaktaufnahme auf den Abschluss eines Vertrags gerichtet ist.
                </p>
              </div>
            </div>
          </div>

          {/* 3. Cookies */}
          <div>
            <EyebrowBadge label="3. Cookies" opacity={0.6} />
            <h2 className="text-title font-black tracking-tight mb-6">
              Cookies<span style={{ color: 'var(--plattform)' }}>.</span>
            </h2>
            <div className="flex flex-col gap-6 text-text leading-relaxed" style={{ color: 'var(--plattform-ink)' }}>
              <p>
                Die UrbanKIT-Plattform setzt technisch notwendige Cookies ein, um den Betrieb
                der Plattform zu gewährleisten. Diese Cookies speichern keine
                personenbezogenen Daten und dienen ausschließlich technischen Zwecken wie
                der Session-Verwaltung und der Sicherheit.
              </p>
              <div className="bg-white rounded-xl border p-6 flex flex-col gap-4">
                <div>
                  <p className="text-small uppercase tracking-widest font-black mb-1" style={{ color: 'var(--plattform-ink)' }}>Notwendige Cookies</p>
                  <p className="text-text" style={{ color: 'var(--plattform-ink)' }}>
                    Session-Cookies für die Anmeldung und Authentifizierung. Diese werden
                    nach dem Schließen des Browsers oder nach Ablauf der Sitzung automatisch
                    gelöscht. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO.
                  </p>
                </div>
                <div>
                  <p className="text-small uppercase tracking-widest font-black mb-1" style={{ color: 'var(--plattform-ink)' }}>Keine Tracking-Cookies</p>
                  <p className="text-text" style={{ color: 'var(--plattform-ink)' }}>
                    Wir verwenden keine Analyse-, Werbe- oder Tracking-Cookies von
                    Drittanbietern. Es werden keine Nutzerprofile für Werbezwecke erstellt.
                  </p>
                </div>
              </div>
              <p>
                Sie können die Verwendung von Cookies in Ihren Browsereinstellungen
                einschränken oder deaktivieren. Bitte beachten Sie, dass die Deaktivierung
                notwendiger Cookies die Funktionalität der Plattform beeinträchtigen kann.
              </p>
            </div>
          </div>

          {/* 4. Speicherdauer */}
          <div>
            <EyebrowBadge label="4. Speicherdauer" opacity={0.6} />
            <h2 className="text-title font-black tracking-tight mb-6">
              Speicherdauer<span style={{ color: 'var(--plattform)' }}>.</span>
            </h2>
            <div className="flex flex-col gap-4 text-text leading-relaxed" style={{ color: 'var(--plattform-ink)' }}>
              <p>
                Personenbezogene Daten werden nur so lange gespeichert, wie es für den
                jeweiligen Zweck erforderlich ist oder gesetzliche Aufbewahrungspflichten
                bestehen. Nutzerkontodaten werden nach Löschung des Kontos oder nach
                dauerhafter Inaktivität (mehr als 24 Monate) gelöscht, sofern keine
                gesetzlichen Pflichten entgegenstehen.
              </p>
              <p>
                Inhalte, die im Rahmen öffentlicher Beteiligungsverfahren eingereicht wurden,
                können im Rahmen der gesetzlichen Dokumentationspflichten für Verwaltungsverfahren
                über die Kontoaktivität hinaus aufbewahrt werden. In diesem Fall werden die
                personenbezogenen Zuordnungen nach Möglichkeit anonymisiert.
              </p>
            </div>
          </div>

          {/* 5. Ihre Rechte */}
          <div>
            <EyebrowBadge label="5. Ihre Rechte" opacity={0.6} />
            <h2 className="text-title font-black tracking-tight mb-6">
              Ihre Rechte<span style={{ color: 'var(--plattform)' }}>.</span>
            </h2>
            <div className="flex flex-col gap-6 text-text leading-relaxed" style={{ color: 'var(--plattform-ink)' }}>
              <p>
                Sie haben gegenüber dem Verantwortlichen folgende Rechte hinsichtlich Ihrer
                personenbezogenen Daten:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { title: 'Auskunft', desc: 'Sie können Auskunft über die bei uns gespeicherten Daten verlangen (Art. 15 DSGVO).' },
                  { title: 'Berichtigung', desc: 'Sie können die Berichtigung unrichtiger Daten verlangen (Art. 16 DSGVO).' },
                  { title: 'Löschung', desc: 'Sie können die Löschung Ihrer Daten verlangen, sofern keine gesetzlichen Aufbewahrungspflichten bestehen (Art. 17 DSGVO).' },
                  { title: 'Einschränkung', desc: 'Sie können die Einschränkung der Verarbeitung verlangen (Art. 18 DSGVO).' },
                  { title: 'Datenübertragbarkeit', desc: 'Sie können Ihre Daten in einem maschinenlesbaren Format erhalten (Art. 20 DSGVO).' },
                  { title: 'Widerspruch', desc: 'Sie können der Verarbeitung Ihrer Daten widersprechen, sofern diese auf berechtigten Interessen basiert (Art. 21 DSGVO).' },
                ].map(({ title, desc }) => (
                  <div key={title} className="bg-white rounded-xl border p-5 flex flex-col gap-2 hover:shadow-md transition-all">
                    <p className="text-small uppercase tracking-widest font-black" style={{ color: 'var(--plattform-ink)' }}>{title}</p>
                    <p className="text-text" style={{ color: 'var(--plattform-ink)' }}>{desc}</p>
                  </div>
                ))}
              </div>
              <p>
                Zur Ausübung Ihrer Rechte wenden Sie sich bitte an den oben genannten
                Verantwortlichen. Sie haben zudem das Recht, bei der zuständigen
                Datenschutzaufsichtsbehörde Beschwerde einzulegen.
              </p>
              <p>
                Wenn die Verarbeitung Ihrer Daten auf einer Einwilligung beruht, haben Sie
                das Recht, diese Einwilligung jederzeit mit Wirkung für die Zukunft zu
                widerrufen, ohne dass die Rechtmäßigkeit der bis zum Widerruf erfolgten
                Verarbeitung berührt wird.
              </p>
            </div>
          </div>

          {/* 6. Kontakt Datenschutz */}
          <div>
            <EyebrowBadge label="6. Kontakt" opacity={0.6} />
            <h2 className="text-title font-black tracking-tight mb-6">
              Datenschutzkontakt<span style={{ color: 'var(--plattform)' }}>.</span>
            </h2>
            <div className="flex flex-col gap-4 text-text leading-relaxed" style={{ color: 'var(--plattform-ink)' }}>
              <p>
                Bei Fragen zum Datenschutz oder zur Ausübung Ihrer Rechte können Sie sich
                jederzeit an uns wenden:
              </p>
              <div className="bg-white rounded-xl border p-6 flex flex-col gap-3 text-text hover:shadow-md transition-all" style={{ color: 'var(--plattform-ink)' }}>
                <div>
                  <p className="text-small uppercase tracking-widest font-black mb-1" style={{ color: 'var(--plattform-ink)' }}>E-Mail</p>
                  <a
                    href="mailto:datenschutz@musterstadt.de"
                    className="transition-opacity hover:opacity-70"
                    style={{ color: 'var(--plattform)' }}
                  >
                    datenschutz@musterstadt.de
                  </a>
                </div>
                <div>
                  <p className="text-small uppercase tracking-widest font-black mb-1" style={{ color: 'var(--plattform-ink)' }}>Postalisch</p>
                  <address className="not-italic" style={{ color: 'var(--plattform-ink)' }}>
                    {cityName}<br />
                    — Datenschutzbeauftragte/r —<br />
                    Musterstraße 1<br />
                    12345 Musterstadt
                  </address>
                </div>
              </div>
              <p className="text-small" style={{ color: 'var(--plattform-ink)' }}>
                Stand dieser Datenschutzerklärung: Juni 2025. Wir behalten uns vor, diese
                Erklärung bei Änderungen der rechtlichen Grundlagen oder der eingesetzten
                Technologien zu aktualisieren.
              </p>
            </div>
          </div>

        </div>
      </section>

      <PublicFooter locale={locale} />
    </div>
  )
}
