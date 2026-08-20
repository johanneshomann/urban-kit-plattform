// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

// Angelehnt an das reale Projekt „Mobilität x Multi“ der Smart City Detmold
// (smartcity-detmold.de/projekte/mobilitaet-x-multi): multifunktionale
// Parkflächen, smarte Baustellen (SVD-Plattform, FixMyCity), digitaler
// Bewohnerparkausweis. Personen und Einzelinhalte sind fiktives Mockup-Material.

import type { SeedProject } from './types'

export const mobilitaetXMulti: SeedProject = {
  slug: 'mobilitaet-x-multi',
  title: 'Mobilität x Multi',
  shortDescription: 'Multimodale Mobilität trifft Mehrfachnutzung: Parkflächen werden zu Orten für Kultur und Märkte, smarte Baustellen zeigen persönliche Umleitungen, und der Bewohnerparkausweis ist digital.',
  projektphase: 'projektausfuehrung',
  thema: ['mobilitaet', 'stadtentwicklung'],
  startYear: 2022,
  stadtbereich: ['gesamtstadt'],
  altersgruppe: ['jugendliche', 'erwachsene', 'senioren'],
  gender: ['alle'],
  isPublic: true,
  teams: ['Aktionsteam', 'Planungsteam'],
  beschreibung: `**Mobilität x Multi** verknüpft multimodale Mobilität mit der Mehrfachnutzung versiegelter Flächen: umweltverträglich und sicher unterwegs sein — und gleichzeitig städtische Flächen effizienter nutzen. Drei Bausteine:

- **Multifunktionale Parkflächen**: Parkplätze können mehr als parken. Pilotflächen werden zeitweise zu Orten für Kulturveranstaltungen, Flohmärkte oder Feste — nach dem Vorbild anderer Städte wie Lippstadt.
- **Smarte Baustellen**: Wer auf eine Baustelle trifft, bekommt nicht nur die Info, sondern gleich eine persönliche, multimodale Alternativroute — als Erweiterung der bestehenden SVD-Mobilitätsplattform, umgesetzt mit FixMyCity.
- **Digitaler Bewohnerparkausweis**: seit April 2023 online beantragbar — Verwaltungsleistung ohne Gang ins Amt.

Das Projekt läuft fortlaufend im Förderprogramm *Modellprojekte Smart Cities* und wird vom Team Digitalisierung koordiniert.`,
  beteiligungsvorhaben: `- Gemeinsam **Pilot-Parkflächen** für die Mehrfachnutzung auswählen und Nutzungsideen sammeln
- Beim jährlichen **Parking Day** ausprobieren, was aus einem Parkplatz werden kann
- Rückmeldungen zu den **smarten Baustellen-Umleitungen** einsammeln: Funktionieren die Alternativrouten im Alltag — zu Fuß, mit Rad und Bus?
- Erfahrungen mit dem **digitalen Bewohnerparkausweis** auswerten und den Antragsweg verbessern`,
  kontakt: { email: 'mobilitaet-x-multi@urbankit.de', telefon: '05231 977-200', website: 'https://smartcity-detmold.de/projekte/mobilitaet-x-multi' },
  projektleitungEmail: 'projektleitung-4@urbankit.de',
  folders: ['Protokolle', 'Aktionen'],
  news: [
    {
      title: 'Parking Day: Aus Parkplätzen wurden Wohnzimmer',
      body: `Beim diesjährigen **Parking Day** haben wir gemeinsam mit Vereinen und Anwohner:innen zwölf Stellplätze in der Innenstadt umgenutzt: Sitzecken, ein Pop-up-Café, Lastenrad-Probefahrten und ein Mini-Flohmarkt.\n\nDanke an alle, die dabei waren! Die Rückmeldungen fließen direkt in die Auswahl der dauerhaften **Pilotflächen** ein.`,
      visibility: 'PUBLIC', daysAgo: 4, image: 'galerie-1',
    },
    {
      title: 'Smarte Baustellen: Erste Umleitung live auf der SVD-Plattform',
      body: `Ab sofort zeigt die SVD-Mobilitätsplattform für die Baustelle an der Bahnhofstraße **persönliche Alternativrouten** — je nachdem, ob ihr zu Fuß, mit dem Rad oder dem Bus unterwegs seid. Umgesetzt gemeinsam mit FixMyCity.\n\nProbiert es aus und meldet uns, ob die Routen alltagstauglich sind.`,
      visibility: 'PUBLIC', daysAgo: 11, image: 'galerie-3',
    },
    {
      title: 'Ratsbeschluss: Pilotflächen für Mehrfachnutzung kommen',
      body: `Der Rat hat den Weg frei gemacht: Zwei Parkflächen dürfen ab dem nächsten Quartal **zeitweise mehrfach genutzt** werden — für Märkte, Kultur und Nachbarschaftsaktionen. Welche Flächen es werden, entscheiden wir mit euch — die Umfrage läuft.`,
      visibility: 'PUBLIC', daysAgo: 18, image: 'galerie-2',
    },
    {
      title: 'Planungsteam: Kriterienkatalog für Pilotflächen liegt vor',
      body: `Der Entwurf des Kriterienkatalogs (Lage, Auslastung, Lärm, Erreichbarkeit) ist fertig und liegt im Dateien-Bereich. Bitte bis Freitag kommentieren — danach geht er in die Abstimmung mit dem Tiefbau.`,
      visibility: 'TEAM', teams: ['Planungsteam'], daysAgo: 7,
    },
  ],
  events: [
    {
      title: 'Infostand: Multifunktionsflächen auf dem Wochenmarkt', inDays: 6,
      body: 'Wir stellen die Kandidaten-Flächen vor und sammeln Nutzungsideen — vom Flohmarkt bis zur Open-Air-Bühne.',
      location: 'Wochenmarkt, Marktplatz', category: 'Infostand', visibility: 'PUBLIC',
    },
    {
      title: 'Werkstatt „Smarte Baustelle“ mit FixMyCity', inDays: 13,
      body: 'Gemeinsamer Praxistest der Umleitungs-Funktion: Wir laufen und radeln die Alternativrouten ab und notieren, was hakt.',
      location: 'Treffpunkt Baustelle Bahnhofstraße', category: 'Werkstatt', visibility: 'PROJECT',
    },
    {
      title: 'Aktionsteam: Nachbereitung Parking Day', inDays: 3,
      body: 'Fotos sichten, Rückmeldungen clustern, Learnings für die Pilotflächen festhalten.',
      location: 'Rathaus, Raum 1.08', category: 'Arbeitstreffen', visibility: 'TEAM', teams: ['Aktionsteam'],
    },
  ],
  polls: [
    {
      title: 'Welche Parkfläche soll Pilotfläche werden?',
      description: 'Zwei Flächen dürfen zeitweise mehrfach genutzt werden — stimmt ab, welche es werden sollen.',
      status: 'active', visibility: 'PUBLIC', showLiveResults: true, allowAnonymous: true,
      questions: [
        { text: 'Welche Fläche eignet sich am besten?', type: 'single', options: ['Parkplatz Lustgarten', 'Stellplätze Marktplatz-Süd', 'Parkdeck Bahnhof (oberste Ebene)', 'Parkplatz Freibad'] },
        { text: 'Wofür sollte die Fläche genutzt werden?', type: 'multiple', options: ['Wochen-/Flohmarkt', 'Kultur & Bühne', 'Nachbarschaftstreff', 'Sport & Spiel', 'Grün & Sitzgelegenheiten'] },
      ],
    },
    {
      title: 'Smarte Baustellen: Welche Infos braucht ihr?',
      description: 'Wir erweitern die Baustellen-Infos auf der SVD-Plattform.',
      status: 'active', visibility: 'PROJECT',
      questions: [
        { text: 'Welche Angaben sind euch am wichtigsten?', type: 'multiple', options: ['Dauer der Baustelle', 'Alternativroute fürs Rad', 'Alternativroute für den Bus', 'Barrierefreie Umleitung', 'Lärm-/Staubinfos'] },
        { text: 'Wie sollen euch die Infos erreichen?', type: 'single', options: ['SVD-Plattform', 'Push in der Stadtapp', 'Aushang vor Ort', 'E-Mail'] },
      ],
    },
    {
      title: 'Feedback zum Parking Day',
      description: 'Kurze Rückschau — hilft uns bei der Planung der Pilotflächen.',
      status: 'closed', visibility: 'PUBLIC', allowAnonymous: true,
      questions: [
        { text: 'Wie fandest du den Parking Day insgesamt (1 = schlecht, 5 = super)?', type: 'scale' },
        { text: 'Was sollten wir beim nächsten Mal anders machen?', type: 'text' },
      ],
    },
  ],
  forum: [
    {
      title: 'Ideen: Was macht ihr aus einem Parkplatz?', pinned: true, visibility: 'PROJECT',
      body: 'Sammelthread für Nutzungsideen auf den künftigen Pilotflächen — vom Bücherflohmarkt bis zum Boule-Turnier. Was fehlt der Stadt?',
      comments: [
        'Ein monatlicher Repair- und Tauschmarkt wäre großartig.',
        'Im Sommer Open-Air-Kino! Die Wand vom Parkdeck ist perfekt dafür.',
        'Bitte an Schatten und Sitzgelegenheiten für Ältere denken.',
      ],
    },
    {
      title: 'Digitaler Bewohnerparkausweis: Antrag hängt', visibility: 'PROJECT',
      body: 'Ich habe den Bewohnerparkausweis online beantragt, aber seit zwei Wochen keine Rückmeldung. Geht es anderen auch so?',
      comments: [
        'Bei mir hat es drei Tage gedauert — schau mal in den Spam-Ordner, die Bestätigung landet gern dort.',
        'Danke für den Hinweis, wir haken beim Bürgerservice nach — die Wartezeit soll unter einer Woche liegen.',
      ],
    },
    {
      title: 'Umleitungen: Radroute über den Wall ist gefährlich', visibility: 'PROJECT',
      body: 'Die vorgeschlagene Alternativroute für die Bahnhofstraßen-Baustelle führt Radfahrende über die Kopfsteinpflaster-Rampe am Wall. Bei Nässe rutschig — gibt es eine bessere Führung?',
      comments: [
        'Können bestätigen, bin dort letzte Woche fast gestürzt.',
        'Wir geben das an FixMyCity weiter — die Route lässt sich über die Gartenstraße legen.',
      ],
    },
    {
      title: 'Aktionsteam: Materialliste Parking Day', visibility: 'TEAM', teams: ['Aktionsteam'],
      body: 'Was wir nächstes Jahr wieder brauchen (und was gefehlt hat): Bitte ergänzen.',
      comments: [
        'Mehr Paletten-Möbel, die waren sofort belegt. Und ein zweites Pavillon-Set.',
        'Absperr-Material war knapp — beim Tiefbau früher anfragen.',
      ],
    },
  ],
  tasks: [
    { title: 'Kriterienkatalog Pilotflächen finalisieren', status: 'in_progress', priority: 'high', labels: ['Pilotflächen'], visibility: 'TEAM', teams: ['Planungsteam'], description: 'Kommentare aus dem Team einarbeiten, dann Abstimmung mit Tiefbau.' },
    { title: 'SVD-Schnittstelle: Radrouten-Korrektur mit FixMyCity testen', status: 'in_progress', priority: 'high', labels: ['Smarte Baustellen'], visibility: 'PROJECT', description: 'Neue Führung über die Gartenstraße prüfen (Forum-Hinweis).' },
    { title: 'Nachbericht Parking Day veröffentlichen', status: 'done', priority: 'medium', labels: ['Parking Day', 'Öffentlichkeitsarbeit'], visibility: 'PROJECT' },
    { title: 'Beschilderung für Mehrfachnutzung mit Ordnungsamt klären', status: 'todo', priority: 'medium', labels: ['Pilotflächen'], visibility: 'PROJECT' },
    { title: 'FAQ zum Bewohnerparkausweis aktualisieren', status: 'todo', priority: 'low', labels: ['Bewohnerparken'], visibility: 'PROJECT' },
  ],
  files: [
    { label: 'UrbanKIT – Kurzvorstellung', source: 'pdf', folder: 'Aktionen', visibility: 'PUBLIC' },
    { label: 'Kriterienkatalog Pilotflächen (Entwurf)', source: 'pdf', folder: 'Protokolle', visibility: 'TEAM', teams: ['Planungsteam'] },
    { label: 'Foto: Parking Day', source: 'galerie-1', folder: 'Aktionen', visibility: 'PROJECT' },
  ],
  board: {
    name: 'Pilotflächen & Aktionen',
    notes: [
      'Lustgarten: viel Zuspruch, aber Lärmschutz prüfen',
      'Parkdeck Bahnhof: Open-Air-Kino-Idee aus dem Forum',
      'Smarte Baustelle: Radroute über Gartenstraße umlegen',
      'Parking Day 2027: früher mit Tiefbau planen',
      'Bewohnerparkausweis: Wartezeit-Monitoring aufsetzen',
    ],
  },
}
