// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

// Angelehnt an das reale Projekt „Kultur trifft Digital“ der Smart City
// Detmold (smartcity-detmold.de/projekte/kultur-trifft-digital):
// medienpraktische Workshops für sozial benachteiligte Kinder und Jugendliche
// (6–18), vier Themenfelder (Digitaler Sound, Digitale Sprache, Digitale
// Realität, Digitale Technik), zweisprachige Angebote für geflüchtete Kinder,
// gefördert über „Kultur macht stark. Bündnisse für Bildung“ (BMBF).
// Das reale Projekt ist abgeschlossen — hier als Projekt in der
// Abschluss-&-Wirkung-Phase geseedet. Personen/Einzelinhalte sind Mockup.

import type { SeedProject } from './types'

export const kulturTrifftDigital: SeedProject = {
  slug: 'kultur-trifft-digital',
  title: 'Kultur trifft Digital',
  shortDescription: 'Medienpraktische Workshops für Kinder und Jugendliche von 6 bis 18: Digitaler Sound, Digitale Sprache, Digitale Realität und Digitale Technik – kostenfrei, inklusiv und zweisprachig.',
  projektphase: 'abschluss-wirkung',
  thema: ['kultur', 'bildung'],
  startYear: 2022,
  stadtbereich: ['gesamtstadt'],
  altersgruppe: ['kinder', 'jugendliche'],
  gender: ['alle'],
  isPublic: true,
  teams: ['Technik-Team', 'Kulturpartner'],
  beschreibung: `**Kultur trifft Digital** brachte Kindern und Jugendlichen zwischen 6 und 18 Jahren digitale Medien praktisch näher — mit besonderem Augenmerk auf sozial und bildungsbenachteiligte junge Menschen. In drei Workshop-Reihen wurden vier Themenfelder erkundet:

- **Digitaler Sound** — eigene Beats, Hörspiele und Klangcollagen
- **Digitale Sprache** — vom Podcast bis zur Programmier-Logik
- **Digitale Realität** — erste Schritte in VR und Augmented Reality
- **Digitale Technik** — Tüfteln mit Mikrocontrollern und Sensoren

Wegen des Ukraine-Kriegs wurden die Workshops **zweisprachig** angeboten, damit auch geflüchtete Kinder und Jugendliche teilnehmen konnten. Gefördert wurde das Projekt über das Bundesprogramm *„Kultur macht stark. Bündnisse für Bildung“* — gemeinsam getragen mit der Bürgerstiftung und der Stiftung Digitale Chancen.`,
  beteiligungsvorhaben: `Das Projekt ist abgeschlossen — jetzt geht es um **Wirkung und Verstetigung**:

- Rückmeldungen von Kindern, Eltern und Bündnispartnern auswerten
- Klären, ob und wie die Workshop-Reihe fortgesetzt werden kann
- Die angeschafften Geräte (Tablets, VR-Brillen, Mikrocontroller) sinnvoll weiternutzen — z. B. über einen Verleih an Schulen und die Mitmach-Werkstatt`,
  kontakt: { email: 'kultur-trifft-digital@urbankit.de', telefon: '05231 977-300', website: 'https://smartcity-detmold.de/projekte/kultur-trifft-digital' },
  projektleitungEmail: 'projektleitung-6@urbankit.de',
  folders: ['Dokumentation', 'Workshop-Material'],
  news: [
    {
      title: 'Abschluss: Drei Workshop-Reihen, vier Themen, viele strahlende Gesichter',
      body: `Von Mai bis Juli liefen unsere medienpraktischen Workshops — von **Digitalem Sound** bis **Digitaler Realität**. Über 60 Kinder und Jugendliche haben eigene Beats gebaut, Podcasts aufgenommen und zum ersten Mal eine VR-Brille aufgesetzt.\n\nDanke an die Bürgerstiftung und die Stiftung Digitale Chancen, die das Bündnis mitgetragen haben!`,
      visibility: 'PUBLIC', daysAgo: 35, image: 'galerie-2',
    },
    {
      title: 'Zweisprachige Workshops: Ankommen mit Technik',
      body: `Kurzfristig haben wir alle Workshops **zweisprachig** angeboten, damit auch aus der Ukraine geflüchtete Kinder mitmachen konnten. Was als Improvisation begann, wurde zum Herzstück: Technik braucht keine perfekte Sprache — Tüfteln verbindet.`,
      visibility: 'PUBLIC', daysAgo: 50, image: 'galerie-1',
    },
    {
      title: 'Abschlusspräsentation: Die Ergebnisse sind online',
      body: `Bei der Abschlusspräsentation haben die Teilnehmenden ihre Hörspiele, AR-Experimente und Mikrocontroller-Projekte gezeigt. Eine Auswahl der Ergebnisse und der **Abschlussbericht** liegen im Dateien-Bereich.`,
      visibility: 'PUBLIC', daysAgo: 28, image: 'galerie-3',
    },
    {
      title: 'Technik-Team: Geräte-Inventur vor der Weitergabe',
      body: `Bevor Tablets, VR-Brillen und Mikrocontroller in den Verleih gehen: Bitte bis Ende des Monats alle Geräte zurückbringen und in die Inventarliste eintragen. Fehlende Netzteile bitte vermerken.`,
      visibility: 'TEAM', teams: ['Technik-Team'], daysAgo: 14,
    },
  ],
  events: [
    {
      title: 'Nachtreffen: Wie geht es weiter?', inDays: 9,
      body: 'Offenes Treffen zur Verstetigung: Auswertung der Rückmeldungen und Ideen für eine Fortsetzung 2027 — Eltern, Teilnehmende und Partner willkommen.',
      location: 'Stadtbibliothek, Veranstaltungsraum', category: 'Austausch', visibility: 'PUBLIC',
    },
    {
      title: 'Abschlusspräsentation der Workshop-Ergebnisse', inDays: -28,
      body: 'Hörspiele, AR-Experimente und Mikrocontroller-Projekte — präsentiert von den Teilnehmenden selbst.',
      location: 'Stadthalle, kleiner Saal', category: 'Präsentation', visibility: 'PUBLIC',
    },
    {
      title: 'Bündnistreffen mit Bürgerstiftung & Stiftung Digitale Chancen', inDays: -45,
      body: 'Gemeinsame Zwischenauswertung der Workshop-Reihen mit den Bündnispartnern.',
      location: 'Rathaus, Raum 3.02', category: 'Arbeitstreffen', visibility: 'TEAM', teams: ['Kulturpartner'],
    },
  ],
  polls: [
    {
      title: 'Soll Kultur trifft Digital 2027 fortgesetzt werden?',
      description: 'Das Bundesprogramm ist ausgelaufen — wir loten eine Fortsetzung aus. Eure Stimme hilft bei der Begründung.',
      status: 'active', visibility: 'PUBLIC', showLiveResults: true, allowAnonymous: true,
      questions: [
        { text: 'Sollte die Workshop-Reihe fortgesetzt werden?', type: 'single', options: ['Ja, unbedingt', 'Ja, aber mit anderen Themen', 'Nein'] },
        { text: 'Welche Themen wären für eine Fortsetzung spannend?', type: 'multiple', options: ['Digitaler Sound', 'Digitale Sprache', 'Digitale Realität (VR/AR)', 'Digitale Technik', 'KI verstehen', 'Games & Coding'] },
      ],
    },
    {
      title: 'Eltern-Feedback zu den Workshops',
      description: 'Rückschau aus Elternsicht — anonym.',
      status: 'closed', visibility: 'PUBLIC', allowAnonymous: true,
      questions: [
        { text: 'Wie zufrieden wart ihr insgesamt (1 = gar nicht, 5 = sehr)?', type: 'scale' },
        { text: 'Was hat eurem Kind am meisten gebracht?', type: 'text' },
      ],
    },
    {
      title: 'Wohin mit den Geräten?',
      description: 'Tablets, VR-Brillen und Mikrocontroller suchen eine sinnvolle Weiternutzung.',
      status: 'closed', visibility: 'PROJECT',
      questions: [
        { text: 'Welche Weiternutzung ist am sinnvollsten?', type: 'single', options: ['Verleih an Schulen', 'Dauerleihgabe an die Mitmach-Werkstatt', 'Offener Geräte-Verleih über die Bibliothek', 'Mix aus allem'] },
      ],
    },
  ],
  forum: [
    {
      title: 'Verstetigung: Wer macht mit beim Bündnis 2027?', pinned: true, visibility: 'PROJECT',
      body: 'Für eine Neuauflage brauchen wir wieder ein Bündnis aus mindestens drei Partnern. Wer kann sich eine Beteiligung vorstellen — mit Räumen, Technik oder Kursleitung?',
      comments: [
        'Das Café am Markt stellt gern wieder Räume für die Sound-Workshops.',
        'Die Werkstatt hätte Platz und Werkzeug für die Technik-Kurse.',
        'Ich könnte einen VR-Schnupperkurs für Eltern anbieten — Nachfrage war da.',
      ],
    },
    {
      title: 'Erfahrungsbericht: Mein Sohn und die Mikrocontroller', visibility: 'PROJECT',
      body: 'Kurzer Dank ans Team: Mein Sohn (11) war im Digitale-Technik-Kurs und lötet jetzt zu Hause weiter. Gibt es Empfehlungen, wie es nach dem Workshop weitergehen kann?',
      comments: [
        'Wie schön! Die Mitmach-Werkstatt hat einen offenen Elektronik-Abend — dort ist er richtig.',
        'Es gibt außerdem Leih-Kits mit Anleitungen, sobald die Inventur durch ist.',
      ],
    },
    {
      title: 'Können Schulen die VR-Brillen ausleihen?', visibility: 'PROJECT',
      body: 'Unsere Klasse würde die VR-Brillen gern für ein Geschichtsprojekt nutzen. An wen wenden wir uns?',
      comments: [
        'Der Verleih startet nach der Inventur — Anfragen gern schon jetzt an die Projektleitung.',
      ],
    },
    {
      title: 'Technik-Team: Inventarliste & fehlende Teile', visibility: 'TEAM', teams: ['Technik-Team'],
      body: 'Stand der Inventur: 14 von 18 Tablets zurück, eine VR-Brille mit defektem Controller. Bitte Rückgaben hier vermerken.',
      comments: [
        'Tablets 15+16 bringe ich Donnerstag mit.',
        'Der Controller lässt sich reparieren — Ersatzteil ist bestellt.',
      ],
    },
  ],
  tasks: [
    { title: 'Verwendungsnachweis für „Kultur macht stark“ einreichen', status: 'in_progress', priority: 'high', labels: ['Förderung'], visibility: 'PROJECT', description: 'Frist Ende des Quartals; Belege der Bündnispartner liegen vor.' },
    { title: 'Geräte-Inventur abschließen', status: 'in_progress', priority: 'high', labels: ['Technik'], visibility: 'TEAM', teams: ['Technik-Team'] },
    { title: 'Verleih-Konzept für Tablets & VR-Brillen entwerfen', status: 'todo', priority: 'medium', labels: ['Verstetigung'], visibility: 'PROJECT' },
    { title: 'Abschlussbericht veröffentlichen', status: 'done', priority: 'medium', labels: ['Dokumentation'], visibility: 'PROJECT' },
    { title: 'Foto-Einverständnisse archivieren (DSGVO)', status: 'done', priority: 'low', labels: ['Dokumentation'], visibility: 'PROJECT' },
  ],
  files: [
    { label: 'UrbanKIT – Kurzvorstellung', source: 'pdf', folder: 'Dokumentation', visibility: 'PUBLIC' },
    { label: 'Abschlussbericht Kultur trifft Digital', source: 'pdf', folder: 'Dokumentation', visibility: 'PROJECT' },
    { label: 'Foto: Workshop-Impression', source: 'galerie-2', folder: 'Workshop-Material', visibility: 'PROJECT' },
  ],
  board: {
    name: 'Verstetigung 2027',
    notes: [
      'Bündnis 2027: Café am Markt + Werkstatt sind dabei',
      'Neues Themenfeld „KI verstehen“ prüfen',
      'Geräte-Verleih: Bibliothek als neutraler Ort?',
      'Zweisprachigkeit beibehalten — war der Schlüssel',
      'Förderlinien-Recherche: Nachfolger von Kultur macht stark',
    ],
  },
}
