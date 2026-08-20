// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

// Angelehnt an das reale Projekt „Push statt Pull“ der Smart City Detmold
// (smartcity-detmold.de/projekte/push-statt-pull): Stadtapp „Appmold“,
// QR-Code-Würfel, Consul-Beteiligungsplattform, Strategie-Analyse-Tool.
// Personen und Einzelinhalte sind fiktives Mockup-Material.

import type { SeedProject } from './types'

export const pushStattPull: SeedProject = {
  slug: 'push-statt-pull',
  title: 'Push statt Pull',
  shortDescription: 'Den öffentlichen Raum interaktiver machen und den Informationsfluss verbessern: Stadtapp „Appmold“, QR-Code-Würfel und die Beteiligungsplattform Consul bringen städtische Infos aktiv zu den Menschen.',
  projektphase: 'projektausfuehrung',
  thema: ['stadtentwicklung', 'infrastruktur'],
  startYear: 2022,
  stadtbereich: ['gesamtstadt'],
  altersgruppe: ['jugendliche', 'erwachsene', 'senioren'],
  gender: ['alle'],
  isPublic: true,
  teams: ['Kernteam', 'Redaktion'],
  beschreibung: `Wer wissen will, was die Stadt plant, soll nicht mehr suchen müssen — die Information kommt zu den Menschen. **Push statt Pull** bündelt dafür mehrere Bausteine:

- Die **Stadtapp „Appmold“**, interkommunal auf Open-Source-Basis entwickelt, mit Push-Benachrichtigungen und Stadtwerke-Modul
- **QR-Code-Würfel** im öffentlichen Raum, die vor Ort direkt zu laufenden Beteiligungen führen
- Die Online-Beteiligungsplattform **Consul**, die barrierefrei ausgebaut und an die **BundID** angebunden wird
- Ein **Strategie- und Maßnahmen-Analyse-Tool**, das den Stand städtischer Maßnahmen bürgerfreundlich sichtbar macht

Das Projekt läuft fortlaufend im Rahmen des Förderprogramms *Modellprojekte Smart Cities* und wird vom Team Digitalisierung getragen.`,
  beteiligungsvorhaben: `- Themen-Abos und Push-Kanäle in **Appmold** gemeinsam mit den Nutzer:innen weiterentwickeln
- **QR-Code-Würfel** für blinde und sehbeeinträchtigte Menschen zugänglich machen (taktile Elemente, Audio) und um Bewegungs- und Sportangebote erweitern
- **Consul** barrierefrei ausbauen und den Login über die BundID vereinheitlichen
- Offene Redaktionsrunden: Verwaltungssprache wird gemeinsam in verständliche Alltagsinformation übersetzt`,
  kontakt: { email: 'push-statt-pull@urbankit.de', telefon: '05231 977-100', website: 'https://smartcity-detmold.de/projekte/push-statt-pull' },
  projektleitungEmail: 'projektleitung-1@urbankit.de',
  folders: ['Protokolle', 'Kampagnenmaterial'],
  news: [
    {
      title: 'Neue QR-Code-Würfel in der Innenstadt',
      body: `Sechs weitere **QR-Code-Würfel** stehen jetzt im Stadtgebiet – am Marktplatz, vor der Stadtbibliothek und an vier Haltestellen. Ein Scan führt direkt zur passenden Beteiligung auf Consul.\n\nNeu: Die Würfel der zweiten Generation bekommen **taktile Elemente**, damit auch blinde und sehbeeinträchtigte Menschen sie nutzen können. Probiert die Standorte aus und sagt uns, ob sie gut gewählt sind!`,
      visibility: 'PUBLIC', daysAgo: 3, image: 'galerie-2',
    },
    {
      title: 'Appmold-Update: Themen-Abos und Stadtwerke-Modul',
      body: `Die Stadtapp **Appmold** kann jetzt mehr: Push-Benachrichtigungen lassen sich nach Themen abonnieren, und über das neue **Stadtwerke-Modul** habt ihr Zählerstände und Störungsmeldungen direkt in der App.\n\nAm beliebtesten bisher: die Themen *Baustellen* und *Veranstaltungen*. Was fehlt euch? Schreibt es ins Forum.`,
      visibility: 'PUBLIC', daysAgo: 9, image: 'galerie-3',
    },
    {
      title: 'Redaktionsleitfaden Version 2 ist da',
      body: `Der überarbeitete Leitfaden für verständliche Meldungen liegt jetzt im Dateien-Bereich: kürzere Sätze, klare Betreffzeilen, immer ein nächster Schritt am Ende. Bitte ab sofort für alle Appmold- und Consul-Meldungen verwenden.`,
      visibility: 'TEAM', teams: ['Redaktion'], daysAgo: 6,
    },
    {
      title: 'Consul: BundID-Login ist live',
      body: `Auf unserer Beteiligungsplattform **Consul** könnt ihr euch ab sofort mit der **BundID** anmelden – ein Konto für alle Verwaltungs- und Beteiligungsangebote. Parallel arbeiten wir mit Expert:innen daran, die Plattform vollständig barrierefrei zu machen.\n\nDanke an alle, die im Testlauf Rückmeldungen gegeben haben!`,
      visibility: 'PUBLIC', daysAgo: 21, image: 'galerie-1',
    },
  ],
  events: [
    {
      title: 'Offene Redaktionssitzung', inDays: 5,
      body: 'Wir planen die Meldungen der nächsten zwei Wochen für Appmold und Consul. Neue Gesichter ausdrücklich willkommen – keine Vorkenntnisse nötig.',
      location: 'Rathaus, Raum 2.14', category: 'Redaktion', visibility: 'PROJECT',
    },
    {
      title: 'QR-Würfel-Tour: Standort- und Barrierefreiheits-Check', inDays: 12,
      body: 'Gemeinsamer Rundgang zu allen Würfel-Standorten – zusammen mit Vertreter:innen des Sehbehindertenvereins testen wir die neuen taktilen Elemente.',
      location: 'Treffpunkt Marktplatz', category: 'Aktion', visibility: 'PUBLIC',
    },
    {
      title: 'Kernteam: Zwischenbilanz Appmold', inDays: 19,
      body: 'Auswertung der Download- und Abo-Zahlen mit dem Entwicklungsverbund der interkommunalen Stadtapp.',
      location: 'Digital (Link folgt)', category: 'Arbeitstreffen', visibility: 'TEAM', teams: ['Kernteam'],
    },
  ],
  polls: [
    {
      title: 'Welche Themen soll Appmold pushen?',
      description: 'Wir erweitern die abonnierbaren Themen der Stadtapp. Was interessiert euch am meisten?',
      status: 'active', visibility: 'PUBLIC', showLiveResults: true, allowAnonymous: true,
      questions: [
        { text: 'Welche neuen Themen wünschst du dir?', type: 'multiple', options: ['Verkehrslage & Sperrungen', 'Kita & Schule', 'Kultur-Tipps', 'Rats-Entscheidungen', 'Warnmeldungen', 'Stadtwerke & Versorgung'] },
        { text: 'Wie oft dürfen wir dich benachrichtigen?', type: 'single', options: ['Sofort bei jeder Meldung', 'Tägliche Zusammenfassung', 'Wöchentliche Zusammenfassung'] },
      ],
    },
    {
      title: 'Standorte für die nächsten QR-Würfel',
      description: 'Weitere Würfel sind über das Smart-Cities-Programm finanziert – wohin damit?',
      status: 'active', visibility: 'PUBLIC', allowAnonymous: true,
      questions: [
        { text: 'Wo fehlt ein Würfel am dringendsten?', type: 'single', options: ['Bahnhof', 'Freibad', 'Schulzentrum Süd', 'Wochenmarkt Nord', 'Stadtpark'] },
        { text: 'Hast du einen konkreten Ort-Vorschlag?', type: 'text' },
      ],
    },
    {
      title: 'Verständlichkeit unserer Meldungen',
      description: 'Kurzer Check nach dem ersten Redaktionsmonat.',
      status: 'closed', visibility: 'PROJECT',
      questions: [
        { text: 'Wie verständlich findest du die städtischen Meldungen (1 = unverständlich, 5 = sehr klar)?', type: 'scale' },
        { text: 'Was sollten wir an der Sprache ändern?', type: 'text' },
      ],
    },
  ],
  forum: [
    {
      title: 'Welche Kanäle nutzt ihr wirklich?', pinned: true, visibility: 'PROJECT',
      body: 'Ehrliche Frage an alle: Wo erreichen euch städtische Infos wirklich – Appmold, Consul, Aushang, Zeitung? Wir wollen keine Kanäle bespielen, die niemand liest.',
      comments: [
        'Bei mir tatsächlich nur die App. Die Stadtseite besuche ich nie von selbst.',
        'Die Aushänge am Supermarkt lese ich beim Warten – die bitte nicht abschaffen!',
        'Push-Nachrichten ja, aber bitte nicht mehr als eine pro Tag.',
      ],
    },
    {
      title: 'QR-Würfel am Marktplatz beschmiert', visibility: 'PROJECT',
      body: 'Der Würfel am Marktplatz ist besprüht worden, der Code ist kaum noch scanbar. An wen melde ich so etwas am besten?',
      comments: [
        'Danke für den Hinweis – ist an den Bauhof weitergegeben, Folie wird getauscht.',
        'Bei den neuen Würfeln mit taktilen Elementen wäre so etwas doppelt ärgerlich.',
      ],
    },
    {
      title: 'Barrierefreiheit: Wie testet ihr Consul?', visibility: 'PROJECT',
      body: 'Meine Nachbarin ist stark sehbeeinträchtigt und würde gern mitmachen. Wie läuft der barrierefreie Ausbau von Consul ab – kann man sich als Testperson melden?',
      comments: [
        'Ja! Wir suchen laufend Tester:innen mit Screenreader-Erfahrung – gern per Nachricht an die Projektleitung.',
        'Wichtig wäre auch einfache Sprache, nicht nur technische Barrierefreiheit.',
      ],
    },
    {
      title: 'Redaktion: Themenspeicher fürs Sommerloch', visibility: 'TEAM', teams: ['Redaktion'],
      body: 'Sammelt hier Ideen für Meldungen, die wir jederzeit bringen können: Servicethemen, Blicke hinter die Kulissen, Porträts.',
      comments: [
        'Serie „Was macht eigentlich …?“ über Ämter, die niemand kennt.',
        'Erklärstück: Wie funktioniert das Strategie- und Maßnahmen-Tool?',
      ],
    },
  ],
  tasks: [
    { title: 'Folie des Marktplatz-Würfels tauschen', status: 'in_progress', priority: 'high', labels: ['QR-Würfel'], visibility: 'PROJECT', description: 'Vandalismus-Schaden, Bauhof hat Ersatzfolie.' },
    { title: 'Taktile Elemente mit Sehbehindertenverein testen', status: 'todo', priority: 'high', labels: ['QR-Würfel', 'Barrierefreiheit'], visibility: 'PROJECT', description: 'Testtermin bei der Würfel-Tour nutzen, Rückmeldungen protokollieren.' },
    { title: 'Appmold Abo-Statistik für Zwischenbilanz aufbereiten', status: 'todo', priority: 'medium', labels: ['Appmold', 'Evaluation'], visibility: 'TEAM', teams: ['Kernteam'] },
    { title: 'Meldungsvorlage „Kurz erklärt“ entwerfen', status: 'in_progress', priority: 'medium', labels: ['Redaktion'], visibility: 'TEAM', teams: ['Redaktion'] },
    { title: 'BundID-Login: Pressemitteilung versenden', status: 'done', priority: 'low', labels: ['Öffentlichkeitsarbeit', 'Consul'], visibility: 'PROJECT' },
  ],
  files: [
    { label: 'UrbanKIT – Kurzvorstellung', source: 'pdf', folder: 'Kampagnenmaterial', visibility: 'PUBLIC' },
    { label: 'Redaktionsleitfaden v2', source: 'pdf', folder: 'Protokolle', visibility: 'TEAM', teams: ['Redaktion'] },
    { label: 'Foto: QR-Würfel Marktplatz', source: 'galerie-2', folder: 'Kampagnenmaterial', visibility: 'PROJECT' },
  ],
  board: {
    name: 'Maßnahmenplanung Herbst',
    notes: [
      'Appmold: Thema „Baustellen“ läuft am besten – ausbauen',
      'QR-Würfel Gen. 2: taktile Elemente + Audio testen',
      'Consul-Barrierefreiheit: Testrunde mit Screenreader-Nutzer:innen',
      'Strategie-Tool: bürgerfreundliche Visualisierung abstimmen',
      'Frage an Kernteam: Budget für 6 weitere Würfel?',
    ],
  },
}
