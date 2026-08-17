// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

/**
 * Default legal texts (cookie policy, privacy policy, accessibility statement)
 * as Lexical rich-text documents. The /barrierefreiheit page renders its
 * template whenever the `legal-settings.barrierefreiheit` field is empty, so
 * the statement is present from day one; additionally all three texts are
 * seeded into the `legal-settings` global (src/seed.ts, scripts/seed-legal.ts)
 * so admins can edit them. The Impressum is deliberately never seeded — there
 * is no meaningful default for it.
 *
 * Bracketed […] placeholders MUST be filled by an admin — the seeded texts are
 * fill-in-the-blanks starting points, not finished legal advice. Kept in sync
 * with docs/legal-templates.md — update both together.
 */

import type { Payload } from 'payload'
import { hasRichTextContent } from './richtext-content'

// ── Lexical node factories ────────────────────────────────────────────────
// Minimal shapes matching what Payload's Lexical editor produces, so
// convertLexicalToHTML (the same converter the other legal pages use)
// renders them identically to admin-authored content.
const txt = (text: string, format = 0) => ({ type: 'text', text, format, detail: 0, mode: 'normal', style: '', version: 1 })
const b = (text: string) => txt(text, 1) // bold
const h = (tag: 'h2' | 'h3', text: string) => ({ type: 'heading', tag, format: '', indent: 0, version: 1, direction: 'ltr', children: [txt(text)] })
const ul = (items: unknown[][]) => ({
  type: 'list', listType: 'bullet', tag: 'ul', start: 1, format: '', indent: 0, version: 1, direction: 'ltr',
  children: items.map((children, i) => ({ type: 'listitem', value: i + 1, format: '', indent: 0, version: 1, direction: 'ltr', children })),
})
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

// ── Cookie / local-storage policy ─────────────────────────────────────────
// Editable orientation for what the platform actually stores. Reflects the
// verified inventory: payload-token (src/actions/auth.ts, 7 days, parent-domain
// scoped in production), pollvoted-<id> (src/actions/poll-vote.ts, 1 year,
// anonymous poll dedup), NEXT_LOCALE (next-intl middleware, set on active
// language switch), uk-a11y (src/lib/accessibility.ts),
// uk-cookie-notice-ack (src/components/public/CookieNotice.tsx),
// uk-prototype-notice-ack (src/components/public/PrototypeNotice.tsx) and
// uk-urban-agent-chat:<projekt> (UrbanAgentChat transcript, sessionStorage).
export const cookiePolicyDe = doc([
  h('h2', 'Cookies & lokale Speicherung'),
  p(txt('Diese Plattform verwendet ausschließlich technisch notwendige bzw. funktionale Cookies und lokale Browser-Speicherung. Es findet kein Tracking statt, es werden keine Analyse- oder Marketing-Cookies gesetzt und keine Daten zu Werbezwecken an Dritte weitergegeben. Eine Einwilligung (Cookie-Banner) ist daher nicht erforderlich. Rechtsgrundlage ist § 25 Abs. 2 TDDDG i. V. m. Art. 6 Abs. 1 lit. f DSGVO.')),
  h('h3', 'Cookies'),
  ul([
    [b('payload-token'), txt(' – Anmelde-Sitzung für Ihr Nutzerkonto (Workspace und Verwaltungsbereich). Wird ausschließlich bei der Anmeldung gesetzt, nicht für Besucher:innen ohne Konto. Technisch notwendig, httpOnly, Laufzeit 7 Tage. In der Produktivumgebung gilt das Cookie für die übergeordnete Domain, damit eine Anmeldung sowohl für das öffentliche Portal als auch für den Workspace gültig ist.')],
    [b('pollvoted-…'), txt(' – Wird nur gesetzt, wenn Sie ohne Anmeldung an einer öffentlichen Umfrage teilnehmen, und verhindert eine doppelte Stimmabgabe in derselben Umfrage. Enthält keine identifizierenden Daten. Funktional, httpOnly, Laufzeit 1 Jahr.')],
    [b('NEXT_LOCALE'), txt(' – Speichert die gewählte Sprache (Deutsch/Englisch). Wird nur gesetzt, wenn Sie die Sprache aktiv wechseln. Funktional, First-Party, Sitzungs-Cookie (wird beim Schließen des Browsers gelöscht).')],
  ]),
  h('h3', 'Lokale Speicherung (Local Storage / Session Storage)'),
  p(txt('Die folgenden Daten liegen ausschließlich lokal in Ihrem Browser und werden nicht auf dem Server gespeichert:')),
  ul([
    [b('uk-a11y'), txt(' – Ihre Barrierefreiheit-Einstellungen (Schriftgröße, reduzierte Animationen, hoher Kontrast, unterstrichene Links). Funktional, bleibt bis zum Löschen erhalten.')],
    [b('uk-cookie-notice-ack'), txt(' – Merkt sich, dass Sie den Speicherhinweis geschlossen haben. Session Storage, wird beim Schließen des Tabs gelöscht.')],
    [b('uk-prototype-notice-ack'), txt(' – Merkt sich, dass Sie den Prototyp-Hinweis geschlossen haben (nur sofern dieser aktiviert ist). Session Storage, wird beim Schließen des Tabs gelöscht.')],
    [b('uk-urban-agent-chat-…'), txt(' – Ihr Gesprächsverlauf mit dem Urban-Agent-Assistenten je Projekt (nur für angemeldete Projektmitglieder, sofern das Modul aktiv ist), damit der Verlauf beim Navigieren nicht verloren geht. Liegt ausschließlich in Ihrem Browser, wird nicht auf dem Server gespeichert. Session Storage, wird beim Schließen des Tabs gelöscht.')],
  ]),
  h('h3', 'Ihre Kontrolle'),
  p(txt('Sie können Cookies und lokale Speicherung jederzeit über die Einstellungen Ihres Browsers löschen oder blockieren. Das Löschen der lokalen Speicherung entfernt Ihre Barrierefreiheit-Einstellungen; ohne das Sitzungs-Cookie ist eine Anmeldung nicht möglich, und die Funktionsfähigkeit der Plattform kann eingeschränkt sein.')),
])
export const cookiePolicyEn = doc([
  h('h2', 'Cookies & local storage'),
  p(txt('This platform uses only technically necessary or functional cookies and local browser storage. There is no tracking, no analytics or marketing cookies, and no sharing of data with third parties for advertising purposes. Consent (a cookie banner) is therefore not required. The legal basis is Section 25 (2) TDDDG in conjunction with Art. 6 (1) (f) GDPR.')),
  h('h3', 'Cookies'),
  ul([
    [b('payload-token'), txt(' – Login session for your user account (workspace and administration area). Set exclusively when signing in, never for visitors without an account. Technically necessary, httpOnly, lifetime 7 days. In production the cookie is scoped to the parent domain so one login is valid for both the public portal and the workspace.')],
    [b('pollvoted-…'), txt(' – Only set when you take part in a public poll without signing in; it prevents voting twice in the same poll. Contains no identifying data. Functional, httpOnly, lifetime 1 year.')],
    [b('NEXT_LOCALE'), txt(' – Stores your chosen language (German/English). Only set when you actively switch the language. Functional, first-party, session cookie (deleted when the browser is closed).')],
  ]),
  h('h3', 'Local storage (local storage / session storage)'),
  p(txt('The following data lives only locally in your browser and is not stored on the server:')),
  ul([
    [b('uk-a11y'), txt(' – Your accessibility settings (font size, reduced motion, high contrast, underlined links). Functional, kept until cleared.')],
    [b('uk-cookie-notice-ack'), txt(' – Remembers that you dismissed the storage notice. Session storage, deleted when the tab is closed.')],
    [b('uk-prototype-notice-ack'), txt(' – Remembers that you dismissed the prototype notice (only while that notice is enabled). Session storage, deleted when the tab is closed.')],
    [b('uk-urban-agent-chat-…'), txt(' – Your conversation history with the Urban Agent assistant per project (signed-in project members only, where the module is enabled), so the transcript survives navigation. Lives only in your browser and is never stored on the server. Session storage, deleted when the tab is closed.')],
  ]),
  h('h3', 'Your control'),
  p(txt('You can delete or block cookies and local storage at any time via your browser settings. Clearing local storage removes your accessibility settings; without the session cookie you cannot sign in, and parts of the platform may work with reduced functionality.')),
])

// ── Privacy policy (DSGVO/GDPR) ───────────────────────────────────────────
// Every bracketed placeholder MUST be filled by an admin before go-live — the
// seeded text is a fill-in-the-blanks starting point, not a valid policy.
// Adapted to the platform's processing inventory: accounts & project
// memberships, user-generated content (forum/chat/polls/board/tasks), media on
// S3-compatible object storage, SMTP mail, the Urban-Agent AI module
// (provider-dependent third-country note), profile export & account deletion,
// admin area, data-subject rights.
export const datenschutzDe = doc([
  h('h2', 'Datenschutzerklärung'),
  p(txt('Der Schutz Ihrer persönlichen Daten ist uns wichtig. Diese Beteiligungsplattform verarbeitet personenbezogene Daten nur, soweit es für den Betrieb und die Beteiligungsfunktionen erforderlich ist: Es gibt keine Analyse- oder Tracking-Dienste und keine Weitergabe von Daten zu Werbezwecken. Das öffentliche Portal ist ohne Nutzerkonto nutzbar; ein Konto ist nur für die Mitarbeit im Projekt-Workspace erforderlich.')),
  h('h3', '1. Verantwortliche Stelle'),
  p(txt('[Betreiber:in ergänzen: Name/Institution, Anschrift, E-Mail-Adresse]')),
  p(txt('[Falls vorhanden: Datenschutzbeauftragte:r mit Kontaktdaten ergänzen — andernfalls diesen Absatz löschen]')),
  h('h3', '2. Hosting und Server-Logfiles'),
  p(txt('Diese Plattform wird gehostet bei [Hosting-Anbieter, Ort/Land ergänzen]. Beim Aufruf der Website verarbeitet der Server automatisch technisch notwendige Daten: IP-Adresse, Datum und Uhrzeit, aufgerufene Seite, Browsertyp (User-Agent) und Referrer. Diese Logfiles dienen der Sicherstellung des Betriebs und der Abwehr von Angriffen (Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO) und werden nach [Log-Speicherdauer ergänzen] gelöscht. Mit dem Hosting-Anbieter besteht ein Auftragsverarbeitungsvertrag (Art. 28 DSGVO).')),
  p(txt('[Nur falls ein CDN/Proxy eingesetzt wird, sonst löschen:] Die Auslieferung der Website erfolgt über [CDN/Proxy-Anbieter ergänzen]. Dabei werden Verbindungsdaten (u. a. IP-Adresse) durch den Anbieter verarbeitet. Soweit der Anbieter außerhalb der EU sitzt, erfolgt die Übermittlung auf Grundlage von Standardvertragsklauseln (Art. 46 DSGVO).')),
  h('h3', '3. Cookies und lokale Speicherung'),
  // Locale-prefixed target: the seeded documents are per-locale, and a bare
  // "/cookies" would be redirected to the default locale for EN readers too.
  p(txt('Diese Plattform verwendet ausschließlich technisch notwendige bzw. funktionale Cookies und lokale Browser-Speicherung. Details enthält die '), a('Cookie-Richtlinie', '/de/cookies'), txt('.')),
  h('h3', '4. Nutzerkonto und Projektmitgliedschaften'),
  p(txt('Für die Mitarbeit in Beteiligungsprojekten können Sie ein Nutzerkonto anlegen. Dabei verarbeiten wir die von Ihnen angegebenen Daten: Name, E-Mail-Adresse, Passwort (nur als kryptografischer Hash gespeichert) sowie optionale Profilangaben (z. B. Kurzbeschreibung, Profil- und Galeriebilder). Zusätzlich speichern wir Ihre Projektmitgliedschaften und Rollen, um Ihnen die Inhalte der jeweiligen Projekte zugänglich zu machen. Rechtsgrundlage ist die Erfüllung des Nutzungsverhältnisses (Art. 6 Abs. 1 lit. b DSGVO). Sie können Ihre Profildaten jederzeit im Profilbereich exportieren und Ihr Konto dort selbst löschen; mit der Löschung werden Ihre Profildaten entfernt.')),
  h('h3', '5. Von Ihnen erstellte Inhalte'),
  p(txt('Inhalte, die Sie in Projekt-Modulen erstellen (z. B. Forumsbeiträge, Chat-Nachrichten, Kommentare, Aufgaben, Pinnwand-Inhalte, Umfrage-Antworten), werden zusammen mit Ihrem Konto gespeichert und sind je nach eingestellter Sichtbarkeit für die Öffentlichkeit, die Projektmitglieder oder einzelne Teams sichtbar. An öffentlichen Umfragen können Sie auch ohne Konto teilnehmen; in diesem Fall wird keine Stimme mit Ihrer Person verknüpft, sondern lediglich ein Cookie gegen doppelte Stimmabgabe gesetzt (siehe Cookie-Richtlinie).')),
  h('h3', '6. Medien-Uploads und Speicherung'),
  p(txt('Von Ihnen hochgeladene Dateien und Bilder werden in einem S3-kompatiblen Objektspeicher gespeichert: [Speicher-Anbieter bzw. Eigenbetrieb (z. B. MinIO), Ort/Land ergänzen]. Soweit ein externer Anbieter eingesetzt wird, besteht mit diesem ein Auftragsverarbeitungsvertrag (Art. 28 DSGVO).')),
  h('h3', '7. E-Mail-Versand'),
  p(txt('Transaktionale E-Mails (z. B. Bestätigung der Registrierung, Zurücksetzen des Passworts, Benachrichtigungen zu Ihren Projekten) werden über [SMTP-Anbieter, Ort/Land ergänzen] versendet. Dabei wird Ihre E-Mail-Adresse an den Versanddienstleister übermittelt; mit diesem besteht ein Auftragsverarbeitungsvertrag (Art. 28 DSGVO).')),
  h('h3', '8. Urban-Agent (KI-Assistent)'),
  p(txt('Einzelne Projekte können den optionalen KI-Assistenten „Urban-Agent“ aktivieren. Bei der Nutzung werden Ihre Chat-Eingaben sowie die für Sie sichtbaren Projektinhalte zur Beantwortung an einen KI-Dienst übermittelt: [KI-Anbieter je nach Konfiguration ergänzen, z. B. „Anthropic PBC, USA“ / „OpenAI, L.L.C., USA“ / „selbst betriebenes Ollama, keine Übermittlung an Dritte“]. Es werden keine personenbezogenen Daten anderer Teilnehmender weitergegeben; bitte geben Sie keine sensiblen persönlichen Daten in den Chat ein. Die Nutzung des Assistenten ist freiwillig; Rechtsgrundlage ist Ihre Einwilligung durch die aktive Nutzung (Art. 6 Abs. 1 lit. a DSGVO). [Bei Nicht-EU-Anbietern ergänzen: Die Übermittlung in ein Drittland erfolgt auf Grundlage von Standardvertragsklauseln (Art. 46 DSGVO). Bei rein lokalem Betrieb diesen Satz löschen.]')),
  h('h3', '9. Verwaltungsbereich'),
  p(txt('Für die Administration der Plattform existieren Konten mit erweiterten Rechten. Administrator:innen können die für den Betrieb erforderlichen Konto- und Inhaltsdaten einsehen, soweit dies zur Pflege der Plattform, zur Moderation oder zur Bearbeitung von Anfragen erforderlich ist (Art. 6 Abs. 1 lit. b und f DSGVO).')),
  h('h3', '10. Ihre Rechte'),
  p(txt('Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) sowie Widerspruch gegen Verarbeitungen auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO (Art. 21). Eine erteilte Einwilligung können Sie jederzeit mit Wirkung für die Zukunft widerrufen. Ihre Profildaten können Sie im Profilbereich selbst exportieren; dort können Sie auch Ihr Konto löschen. Zudem haben Sie ein Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde, z. B. bei der für uns zuständigen Behörde: [Aufsichtsbehörde mit Kontaktdaten ergänzen].')),
  p(txt('Stand: [Datum ergänzen]')),
])
export const datenschutzEn = doc([
  h('h2', 'Privacy Policy'),
  p(txt('Protecting your personal data matters to us. This participation platform processes personal data only to the extent required for its operation and participation features: there are no analytics or tracking services and no sharing of data for advertising purposes. The public portal can be used without a user account; an account is only required to collaborate in a project workspace.')),
  h('h3', '1. Controller'),
  p(txt('[Add operator: name/institution, postal address, email address]')),
  p(txt('[If applicable: add data protection officer with contact details — otherwise delete this paragraph]')),
  h('h3', '2. Hosting and server log files'),
  p(txt('This platform is hosted by [add hosting provider, city/country]. When you visit the website, the server automatically processes technically necessary data: IP address, date and time, requested page, browser type (user agent) and referrer. These log files serve to keep the site operational and to defend against attacks (legal basis: Art. 6 (1) (f) GDPR) and are deleted after [add log retention period]. A data processing agreement (Art. 28 GDPR) is in place with the hosting provider.')),
  p(txt('[Only if a CDN/proxy is used, otherwise delete:] The website is delivered via [add CDN/proxy provider]. Connection data (including the IP address) is processed by this provider. Where the provider is located outside the EU, the transfer is based on standard contractual clauses (Art. 46 GDPR).')),
  h('h3', '3. Cookies and local storage'),
  p(txt('This platform uses only technically necessary or functional cookies and local browser storage. Details are provided in the '), a('cookie policy', '/en/cookies'), txt('.')),
  h('h3', '4. User account and project memberships'),
  p(txt('To collaborate in participation projects you can create a user account. We process the data you provide: name, email address, password (stored only as a cryptographic hash) and optional profile information (e.g. a short bio, profile and gallery images). We additionally store your project memberships and roles to give you access to the content of the respective projects. The legal basis is the performance of the usage relationship (Art. 6 (1) (b) GDPR). You can export your profile data in the profile area at any time and delete your account there yourself; deletion removes your profile data.')),
  h('h3', '5. Content you create'),
  p(txt('Content you create in project modules (e.g. forum posts, chat messages, comments, tasks, board content, poll answers) is stored together with your account and — depending on the configured visibility — is visible to the public, to project members or to individual teams. You can also take part in public polls without an account; in that case no vote is linked to you personally, only a cookie is set to prevent duplicate voting (see the cookie policy).')),
  h('h3', '6. Media uploads and storage'),
  p(txt('Files and images you upload are stored in S3-compatible object storage: [add storage provider or self-hosted setup (e.g. MinIO), city/country]. Where an external provider is used, a data processing agreement (Art. 28 GDPR) is in place.')),
  h('h3', '7. Email delivery'),
  p(txt('Transactional emails (e.g. registration confirmation, password resets, notifications about your projects) are sent via [add SMTP provider, city/country]. Your email address is transmitted to the delivery provider; a data processing agreement (Art. 28 GDPR) is in place.')),
  h('h3', '8. Urban Agent (AI assistant)'),
  p(txt('Individual projects can enable the optional AI assistant “Urban Agent”. When you use it, your chat input and the project content visible to you are transmitted to an AI service to generate answers: [add AI provider depending on configuration, e.g. “Anthropic PBC, USA” / “OpenAI, L.L.C., USA” / “self-hosted Ollama, no transfer to third parties”]. No personal data of other participants is shared; please do not enter any sensitive personal data into the chat. Use of the assistant is voluntary; the legal basis is your consent through active use (Art. 6 (1) (a) GDPR). [For non-EU providers add: the third-country transfer is based on standard contractual clauses (Art. 46 GDPR). Delete this sentence for a purely local setup.]')),
  h('h3', '9. Administration area'),
  p(txt('Accounts with elevated rights exist for administering the platform. Administrators can access the account and content data required for operation, to the extent necessary for maintaining the platform, moderation or handling enquiries (Art. 6 (1) (b) and (f) GDPR).')),
  h('h3', '10. Your rights'),
  p(txt('You have the right of access (Art. 15 GDPR), rectification (Art. 16), erasure (Art. 17), restriction of processing (Art. 18), data portability (Art. 20) and objection to processing based on Art. 6 (1) (f) GDPR (Art. 21). You may withdraw any consent at any time with effect for the future. You can export your profile data yourself in the profile area, where you can also delete your account. You also have the right to lodge a complaint with a data protection supervisory authority, e.g. the authority responsible for us: [add supervisory authority with contact details].')),
  p(txt('Last updated: [add date]')),
])

// ── Seeding ───────────────────────────────────────────────────────────────

/**
 * Seeds the default legal texts into the `legal-settings` global, both
 * locales. Fills only effectively-empty fields (saved-but-empty Lexical
 * documents count as empty) unless `force` overwrites; the Impressum is never
 * seeded — there is no meaningful default for it. Shared by src/seed.ts and
 * scripts/seed-legal.ts.
 */
export async function seedLegalTexts(payload: Payload, { force = false }: { force?: boolean } = {}): Promise<void> {
  // City name for the accessibility statement's scope sentence; falls back to
  // the same default getCitySettings uses on a fresh install.
  let cityName = 'Stadt Detmold'
  try {
    const ps = (await payload.findGlobal({ slug: 'platform-settings', depth: 0, overrideAccess: true })) as { cityName?: string | null }
    if (ps?.cityName) cityName = ps.cityName
  } catch { /* fresh DB — keep the default */ }

  const fields = [
    { name: 'datenschutz', label: 'privacy policy — FILL THE [PLACEHOLDERS]', de: datenschutzDe, en: datenschutzEn },
    { name: 'cookies', label: 'cookie policy', de: cookiePolicyDe, en: cookiePolicyEn },
    { name: 'barrierefreiheit', label: 'accessibility statement — FILL THE [PLACEHOLDERS]', de: barrierefreiheitDefault('de', cityName), en: barrierefreiheitDefault('en', cityName) },
  ] as const

  // `locale: 'all'` returns { de, en } per localized field — "already set"
  // means the German source text has renderable content.
  const legal = (await payload.findGlobal({ slug: 'legal-settings', locale: 'all' as 'de', overrideAccess: true })) as unknown as Record<string, { de?: unknown } | undefined>

  console.log(`\n── Legal texts ${force ? '(FORCE: overwriting)' : '(only empty fields)'} ─────`)
  for (const field of fields) {
    if (!force && hasRichTextContent(legal?.[field.name]?.de)) {
      console.log(`  skip   legal-settings / ${field.name} (already set — use seed:legal --force to overwrite)`)
      continue
    }
    await payload.updateGlobal({ slug: 'legal-settings', locale: 'de', data: { [field.name]: field.de }, overrideAccess: true })
    await payload.updateGlobal({ slug: 'legal-settings', locale: 'en', data: { [field.name]: field.en }, overrideAccess: true })
    console.log(`  ${force ? 'update' : 'create'} legal-settings / ${field.name} (${field.label}, de + en)`)
  }
}
