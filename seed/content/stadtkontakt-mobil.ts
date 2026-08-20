// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

// Angelehnt an das reale Projekt „Stadtkontakt Mobil“ der Smart City Detmold
// (smartcity-detmold.de/projekte/stadtkontakt-mobil): ein barrierefreier
// Anhänger als mobiles Bürgerbüro, gemeinsam mit Architekturstudierenden der
// TH OWL entwickelt, seit September 2023 unterwegs in die 27 Ortsteile
// (Saison April–Oktober), Ergänzung zum stationären Stadtkontakt an der
// Bruchstraße. Personen und Einzelinhalte sind fiktives Mockup-Material.

import type { SeedProject } from './types'

export const stadtkontaktMobil: SeedProject = {
  slug: 'stadtkontakt-mobil',
  title: 'Stadtkontakt Mobil',
  shortDescription: 'Das Rathaus kommt vorbei: Ein barrierefreier Anhänger bringt Verwaltungsservices und offene Ohren in alle 27 Ortsteile – mindestens einmal im Jahr, von April bis Oktober.',
  // Real status: „abgeschlossen“ — the build project is done, the trailer
  // continues as seasonal regular operations.
  projektphase: 'projektabschluss',
  thema: ['stadtentwicklung', 'infrastruktur'],
  startYear: 2023,
  stadtbereich: ['gesamtstadt'],
  altersgruppe: ['erwachsene', 'senioren'],
  gender: ['alle'],
  isPublic: true,
  teams: ['Tourenteam'],
  beschreibung: `Nicht jede:r kann ins Rathaus kommen — also kommt das Rathaus vorbei. **Stadtkontakt Mobil** ist ein **barrierefreier Anhänger** mit Rampe und offenem Gesprächsbereich, den Architekturstudierende der **TH OWL** mitentwickelt haben. Seit September 2023 ist er unterwegs.

- **Alle 27 Ortsteile**, mindestens einmal im Jahr — Saison von April bis Oktober
- **Verwaltungsservices vor Ort**: Anträge, Beglaubigungen, Fragen rund ums Bürgerbüro
- **Offenes Ohr**: Anliegen aus dem Ortsteil landen direkt bei den zuständigen Fachbereichen
- Ergänzt den **stationären Stadtkontakt** an der Bruchstraße 36

Entstanden im Programm *Modellprojekte Smart Cities*; der Aufbau ist abgeschlossen, jetzt läuft der Regelbetrieb — begleitet vom Tourenteam.`,
  beteiligungsvorhaben: `- **Tourplanung mitgestalten**: Wo soll der Anhänger halten, zu welchen Zeiten — und fehlen Abend- oder Wochenendtermine?
- **Services erweitern**: Welche Verwaltungsleistungen sollen zusätzlich mobil angeboten werden?
- **Anliegen einbringen**: Jeder Halt sammelt Themen aus dem Ortsteil und gibt sie nachvollziehbar an die Fachbereiche weiter
- **Rückmeldungen zur Barrierefreiheit**: Rampe, Ausstattung, Verständlichkeit — was können wir besser machen?`,
  kontakt: { email: 'stadtkontakt-mobil@urbankit.de', telefon: '05231 977-600', website: 'https://smartcity-detmold.de/projekte/stadtkontakt-mobil' },
  projektleitungEmail: 'projektleitung-3@urbankit.de',
  folders: ['Tourpläne', 'Einsatzberichte'],
  news: [
    {
      title: 'Herbst-Tour: Diese Ortsteile stehen an',
      body: `Die zweite Saisonhälfte ist geplant: Bis Oktober hält **Stadtkontakt Mobil** noch in acht Ortsteilen — darunter **Hiddesen**, **Pivitsheide** und **Berlebeck**. Der komplette Tourplan liegt im Dateien-Bereich und hängt an jedem Halt aus.\n\nIhr wünscht euch einen zusätzlichen Halt? Ab in die Umfrage!`,
      visibility: 'PUBLIC', daysAgo: 5, image: 'cover',
    },
    {
      title: 'Rückblick Jerxen-Orbke: Vom Bordstein bis zum Buswartehäuschen',
      body: `Beim Halt in **Jerxen-Orbke** kamen über 40 Anliegen zusammen — vom abgesenkten Bordstein bis zur Beleuchtung am Spielplatz. Alle Themen sind erfasst und den Fachbereichen zugeordnet; den Zwischenstand veröffentlichen wir hier.\n\nDanke für den freundlichen Empfang und den Kuchen!`,
      visibility: 'PUBLIC', daysAgo: 14, image: 'galerie-2',
    },
    {
      title: 'Gebaut mit der TH OWL: Unser Anhänger im Porträt',
      body: `Rampe statt Stufen, offene Theke statt Schalterglas: Der Anhänger wurde gemeinsam mit **Architekturstudierenden der TH OWL** entworfen — barrierefrei und bewusst einladend. Im Porträt erzählen wir, welche Ideen aus dem Seminar es in den Bau geschafft haben.`,
      visibility: 'PUBLIC', daysAgo: 25, image: 'galerie-3',
    },
    {
      title: 'Tourenteam: Neue Einsatz-Checkliste ab sofort',
      body: `Die überarbeitete Checkliste (Aufbau, Technik, Anliegen-Erfassung, Abbau) liegt im Dateien-Bereich. Wichtigste Änderung: Anliegen bitte direkt vor Ort digital erfassen — die Zettelwirtschaft entfällt.`,
      visibility: 'TEAM', teams: ['Tourenteam'], daysAgo: 9,
    },
  ],
  events: [
    {
      title: 'Stadtkontakt Mobil in Hiddesen', inDays: 8,
      body: 'Der Anhänger steht am Dorfplatz: Verwaltungsservices, Fragen und offene Ohren — kommt vorbei!',
      location: 'Hiddesen, Dorfplatz', category: 'Einsatz', visibility: 'PUBLIC',
    },
    {
      title: 'Stadtkontakt Mobil in Pivitsheide', inDays: 22,
      body: 'Halt in Pivitsheide — diesmal mit Beratung des Seniorenbüros an Bord.',
      location: 'Pivitsheide, Parkplatz am Sportheim', category: 'Einsatz', visibility: 'PUBLIC',
    },
    {
      title: 'Tourenteam: Saisonabschluss & Planung nächstes Jahr', inDays: 45,
      body: 'Auswertung der Saison: Besucherzahlen, Anliegen-Statistik, Wunschliste der Ortsteile. Danach: Grobplanung für die neue Saison.',
      location: 'Stadtkontakt, Bruchstraße 36', category: 'Arbeitstreffen', visibility: 'TEAM', teams: ['Tourenteam'],
    },
  ],
  polls: [
    {
      title: 'Wo soll Stadtkontakt Mobil zusätzlich halten?',
      description: 'Für die restliche Saison ist noch ein Zusatzhalt drin — ihr entscheidet, wo.',
      status: 'active', visibility: 'PUBLIC', showLiveResults: true, allowAnonymous: true,
      questions: [
        { text: 'Welcher Ort braucht am dringendsten einen Halt?', type: 'single', options: ['Bruchberg', 'Remmighausen', 'Klüt', 'Spork-Eichholz', 'Diestelbruch'] },
        { text: 'Welche Uhrzeiten passen euch am besten?', type: 'single', options: ['Vormittags', 'Nachmittags', 'Abends (17–19 Uhr)', 'Samstagvormittag'] },
      ],
    },
    {
      title: 'Welche Services sollen mobil dazukommen?',
      description: 'Der Anhänger kann mehr — was fehlt euch vor Ort am meisten?',
      status: 'active', visibility: 'PROJECT',
      questions: [
        { text: 'Welche Leistungen wünscht ihr euch mobil?', type: 'multiple', options: ['An-/Ummeldung', 'Beglaubigungen', 'Führungszeugnis-Antrag', 'Rentenberatung', 'Wohngeld-Erstberatung', 'Fundbüro'] },
        { text: 'Was hindert dich, ins Rathaus zu kommen?', type: 'text' },
      ],
    },
    {
      title: 'Feedback zur Frühjahrs-Tour',
      description: 'Rückschau auf die ersten zehn Halte der Saison.',
      status: 'closed', visibility: 'PUBLIC', allowAnonymous: true,
      questions: [
        { text: 'Wie zufrieden warst du mit dem Besuch (1 = gar nicht, 5 = sehr)?', type: 'scale' },
        { text: 'Was sollten wir am Ablauf verbessern?', type: 'text' },
      ],
    },
  ],
  forum: [
    {
      title: 'Welche Anliegen bringt ihr zum nächsten Halt mit?', pinned: true, visibility: 'PROJECT',
      body: 'Damit wir vorbereitet sind: Schreibt hier, welche Themen ihr beim nächsten Halt besprechen wollt — dann bringen wir die richtigen Unterlagen (und die richtigen Leute) mit.',
      comments: [
        'In Hiddesen: die Querung an der Bushaltestelle — da traut sich kein Kind allein rüber.',
        'Ich hätte Fragen zur Grundsteuer-Bescheinigung, geht das mobil?',
        'Ja, Bescheinigungen gehen — bringt den Bescheid mit, dann klären wir das vor Ort.',
      ],
    },
    {
      title: 'Termine auch abends oder am Wochenende?', visibility: 'PROJECT',
      body: 'Die Halte sind fast immer vormittags — wer arbeitet, schaut in die Röhre. Wären Abend- oder Samstagstermine möglich?',
      comments: [
        'Volle Zustimmung, ich verpasse den Anhänger jedes Mal.',
        'Wir pilotieren zwei Abendtermine im Herbst — die Umfrage entscheidet, wo.',
      ],
    },
    {
      title: 'Was passiert eigentlich mit den Anliegen?', visibility: 'PROJECT',
      body: 'Beim Halt in Jerxen-Orbke wurden viele Anliegen aufgenommen. Wie erfahren wir, was daraus geworden ist?',
      comments: [
        'Jedes Anliegen bekommt eine Nummer und einen Fachbereich; den Zwischenstand posten wir als News je Ortsteil.',
        'Der Bordstein an der Hauptstraße ist übrigens schon abgesenkt — ging schneller als gedacht!',
      ],
    },
    {
      title: 'Tourenteam: Erfahrungsaustausch nach den ersten Halten', visibility: 'TEAM', teams: ['Tourenteam'],
      body: 'Was läuft gut, was hakt? Bitte nach jedem Einsatz kurz hier hinein — daraus bauen wir die Checkliste weiter.',
      comments: [
        'Die digitale Anliegen-Erfassung spart uns abends eine Stunde Abtippen. Klare Empfehlung.',
        'Bei Regen fehlt ein zweiter Pavillon für die Warteschlange.',
      ],
    },
  ],
  tasks: [
    { title: 'Zusatzhalt laut Umfrage einplanen', status: 'todo', priority: 'high', labels: ['Tourplanung'], visibility: 'TEAM', teams: ['Tourenteam'], description: 'Nach Umfrage-Ende Standort fixieren und Ortsvorsteher:in informieren.' },
    { title: 'Zwei Abendtermine im Herbst pilotieren', status: 'in_progress', priority: 'high', labels: ['Tourplanung'], visibility: 'PROJECT' },
    { title: 'Rampe warten & zweiten Pavillon beschaffen', status: 'todo', priority: 'medium', labels: ['Anhänger'], visibility: 'TEAM', teams: ['Tourenteam'] },
    { title: 'Anliegen-Zwischenstand Jerxen-Orbke veröffentlichen', status: 'in_progress', priority: 'medium', labels: ['Anliegen'], visibility: 'PROJECT' },
    { title: 'Tourplan-Aushänge für alle Ortsteile drucken', status: 'done', priority: 'low', labels: ['Öffentlichkeitsarbeit'], visibility: 'PROJECT' },
  ],
  files: [
    { label: 'UrbanKIT – Kurzvorstellung', source: 'pdf', folder: 'Tourpläne', visibility: 'PUBLIC' },
    { label: 'Tourplan Herbst (alle Halte)', source: 'pdf', folder: 'Tourpläne', visibility: 'PUBLIC' },
    { label: 'Foto: Einsatz in Jerxen-Orbke', source: 'galerie-1', folder: 'Einsatzberichte', visibility: 'PROJECT' },
  ],
  board: {
    name: 'Saisonplanung & Anliegen',
    notes: [
      'Abendtermine: Hiddesen + Pivitsheide als Pilot',
      'Anliegen-Tracking: News je Ortsteil nach 6 Wochen',
      'Zweiter Pavillon für Regentage (Team-Feedback)',
      'Wunsch aus Umfrage: Rentenberatung an Bord',
      'Saisonabschluss: Statistik für den Rat aufbereiten',
    ],
  },
}
