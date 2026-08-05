/**
 * Built-in default for the Erklärung zur Barrierefreiheit (BITV 2.0 / EU model
 * declaration), as a Lexical rich-text document. The /barrierefreiheit page
 * renders this whenever the `legal-settings.barrierefreiheit` field is empty,
 * so the statement is present from day one; admins override it in the CMS.
 *
 * Bracketed placeholders (self-evaluation date, feedback address, enforcement
 * body) MUST be filled by an admin — the statement is only valid once they are.
 */

// ── Lexical node factories ────────────────────────────────────────────────
// Minimal shapes matching what Payload's Lexical editor produces, so
// convertLexicalToHTML (the same converter the other legal pages use)
// renders them identically to admin-authored content.
const txt = (text: string, format = 0) => ({ type: 'text', text, format, detail: 0, mode: 'normal', style: '', version: 1 })
const h = (tag: 'h2' | 'h3', text: string) => ({ type: 'heading', tag, format: '', indent: 0, version: 1, direction: 'ltr', children: [txt(text)] })
const p = (...children: unknown[]) => ({ type: 'paragraph', format: '', indent: 0, version: 1, direction: 'ltr', textFormat: 0, children })
const a = (text: string, url: string) => ({
  type: 'link', version: 3, format: '', indent: 0, direction: 'ltr',
  fields: { url, newTab: false, linkType: 'custom' },
  children: [txt(text)],
})
const doc = (children: unknown[]) => ({ root: { type: 'root', format: '', indent: 0, version: 1, direction: 'ltr', children } })

export function barrierefreiheitDefault(locale: string, cityName: string) {
  const kontakt = `/${locale}/kontakt`

  if (locale === 'en') {
    return doc([
      h('h2', 'Accessibility Statement'),
      p(txt(`This accessibility statement applies to the UrbanKIT participation platform of ${cityName}. We strive to make this website accessible in accordance with the German Barrier-Free Information Technology Ordinance (BITV 2.0).`)),
      h('h3', 'Compliance status'),
      p(txt('This website is [compliant / partially compliant — set the status after completing the self-evaluation] with BITV 2.0 (WCAG 2.1, conformance level AA). This assessment is based on a self-evaluation carried out on [add date of self-evaluation].')),
      h('h3', 'Non-accessible content'),
      p(txt('We are currently not aware of any non-accessible content. Should you nevertheless encounter a barrier, we appreciate your feedback.')),
      h('h3', 'Accessibility features of this website'),
      p(txt('Via the accessibility icon you can adjust font size, high contrast, underlined links and reduced animations; the settings are kept locally in your browser. The website is fully keyboard-operable and offers a “skip to content” link.')),
      h('h3', 'Preparation of this statement'),
      p(txt('This statement was prepared on [add date] and last reviewed on [add date].')),
      h('h3', 'Reporting barriers: feedback and contact'),
      p(
        txt('Would you like to report existing barriers or request information on the implementation of accessibility? Please use our '),
        a('contact page', kontakt),
        txt(' or write to [add email address]. We aim to respond to enquiries within two weeks.'),
      ),
      h('h3', 'Enforcement procedure'),
      p(txt('If you believe that our response to your feedback is not satisfactory, you can contact the responsible enforcement/ombudsman body: [add responsible body with contact details — for public bodies of the state of North Rhine-Westphalia this is the Ombudsstelle für barrierefreie Informationstechnik des Landes Nordrhein-Westfalen].')),
    ])
  }

  return doc([
    h('h2', 'Erklärung zur Barrierefreiheit'),
    p(txt(`Diese Erklärung zur Barrierefreiheit gilt für die UrbanKIT-Beteiligungsplattform der Stadt ${cityName}. Wir sind bemüht, diese Website im Einklang mit der Barrierefreie-Informationstechnik-Verordnung (BITV 2.0) barrierefrei zugänglich zu machen.`)),
    h('h3', 'Stand der Vereinbarkeit mit den Anforderungen'),
    p(txt('Diese Website ist mit der BITV 2.0 (WCAG 2.1, Konformitätsstufe AA) [vereinbar / teilweise vereinbar — Status bitte nach durchgeführter Selbstbewertung festlegen]. Grundlage dieser Einschätzung ist eine am [Datum der Selbstbewertung ergänzen] durchgeführte Selbstbewertung.')),
    h('h3', 'Nicht barrierefreie Inhalte'),
    p(txt('Derzeit sind uns keine nicht barrierefreien Inhalte bekannt. Sollten Sie dennoch auf eine Barriere stoßen, freuen wir uns über Ihre Rückmeldung.')),
    h('h3', 'Barrierefreiheitsfunktionen dieser Website'),
    p(txt('Über das Barrierefreiheit-Symbol lassen sich Schriftgröße, hoher Kontrast, unterstrichene Links und reduzierte Animationen einstellen; die Einstellungen bleiben lokal im Browser gespeichert. Die Website ist vollständig per Tastatur bedienbar und bietet einen „Zum Inhalt springen“-Link.')),
    h('h3', 'Erstellung dieser Erklärung'),
    p(txt('Diese Erklärung wurde am [Datum ergänzen] erstellt und zuletzt am [Datum ergänzen] überprüft.')),
    h('h3', 'Barrieren melden: Feedback und Kontakt'),
    p(
      txt('Sie möchten uns bestehende Barrieren mitteilen oder Informationen zur Umsetzung der Barrierefreiheit erfragen? Nutzen Sie gerne unsere '),
      a('Kontaktseite', kontakt),
      txt(' oder schreiben Sie an [E-Mail-Adresse ergänzen]. Wir bemühen uns, Anfragen innerhalb von zwei Wochen zu beantworten.'),
    ),
    h('h3', 'Durchsetzungsverfahren'),
    p(txt('Wenn Sie der Ansicht sind, dass unsere Antwort auf Ihre Rückmeldung nicht zufriedenstellend ist, können Sie sich an die zuständige Durchsetzungs- bzw. Ombudsstelle wenden: [Zuständige Stelle mit Kontaktdaten ergänzen — für öffentliche Stellen des Landes NRW ist dies die Ombudsstelle für barrierefreie Informationstechnik des Landes Nordrhein-Westfalen].')),
  ])
}
