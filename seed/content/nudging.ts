// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

// Angelehnt an das reale Projekt „Nudging von nachhaltigem Mobilitätsverhalten“
// der Smart City Detmold (smartcity-detmold.de/projekte/nudging): eine
// Belohnungs-App, die Punkte für nachhaltige Wege vergibt (Rad, Lastenrad,
// Fußverkehr, ÖPNV, Umsteigen) — einlösbar u. a. über Stadtgutscheine. Das
// Projekt erkennt an, dass im ländlich geprägten Umfeld das Auto nicht
// verschwindet — es geht um den Anstoß („anstupsen“) zu nachhaltigeren
// Teilstrecken. Personen und Einzelinhalte sind fiktives Mockup-Material.

import type { SeedProject } from './types'

export const nudging: SeedProject = {
  slug: 'nudging',
  title: 'Nudging – nachhaltige Mobilität',
  shortDescription: 'Kleine Anstöße, große Wirkung: Die Nudging-App belohnt nachhaltige Wege – zu Fuß, mit Rad, Lastenrad oder Bus – mit Punkten, die ihr als Stadtgutscheine einlösen könnt.',
  projektphase: 'projektausfuehrung',
  thema: ['mobilitaet', 'umwelt'],
  startYear: 2023,
  stadtbereich: ['gesamtstadt'],
  altersgruppe: ['jugendliche', 'erwachsene', 'senioren'],
  gender: ['alle'],
  isPublic: true,
  teams: ['Kernteam'],
  beschreibung: `**Nudging** heißt anstupsen: Statt Verbote auszusprechen, belohnt das Projekt nachhaltiges Mobilitätsverhalten. Herzstück ist eine **App**, die Punkte vergibt, wenn ihr Wege klimafreundlich zurücklegt:

- mit dem **Rad** oder **Lastenrad** (auch Sharing)
- **zu Fuß**
- mit **Bus und Bahn**
- oder beim **Umsteigen unterwegs** — auch nachhaltige Teilstrecken zählen

Die gesammelten Punkte lassen sich u. a. als **Stadtgutscheine** bei lokalen Geschäften einlösen. Klar ist auch: In unserer ländlich geprägten Region wird das Auto nicht verschwinden — es geht um den Anstoß, einzelne Wege anders zu denken.

Gefördert im Programm *Modellprojekte Smart Cities*, koordiniert vom Team Digitalisierung.`,
  beteiligungsvorhaben: `- **Beta-Testen**: Die App ist im offenen Test — Rückmeldungen zu Tracking, Punkten und Bedienung fließen wöchentlich ein
- **Prämien mitbestimmen**: Welche Belohnungen motivieren wirklich? Welche lokalen Partner sollen dabei sein?
- **Hürden benennen**: Was hält euch vom Umsteigen ab — fehlende Abstellplätze, Taktung, Sicherheit? Die Antworten gehen an die Fachbereiche
- **Challenges gestalten**: Gemeinsame Aktionen wie Team-Wettbewerbe zwischen Nachbarschaften, Schulen und Betrieben`,
  kontakt: { email: 'nudging@urbankit.de', telefon: '05231 977-500', website: 'https://smartcity-detmold.de/projekte/nudging' },
  projektleitungEmail: 'projektleitung-5@urbankit.de',
  folders: ['Protokolle', 'App & Prämien'],
  news: [
    {
      title: 'Die Nudging-App ist im offenen Beta-Test',
      body: `Ab sofort könnt ihr mitmachen: Die **Nudging-App** erkennt eure Wege und vergibt Punkte für alles, was klimafreundlich rollt oder läuft — Rad, Lastenrad, Bus, zu Fuß. Auch **Teilstrecken** zählen: Wer unterwegs vom Auto auf den Bus umsteigt, sammelt trotzdem.\n\nDie Punkte lassen sich als **Stadtgutscheine** einlösen. Feedback bitte über die App oder das Forum!`,
      visibility: 'PUBLIC', daysAgo: 6, image: 'cover',
    },
    {
      title: 'Zwölf lokale Geschäfte machen als Gutschein-Partner mit',
      body: `Vom Buchladen bis zum Café: Zwölf Geschäfte akzeptieren jetzt die **Stadtgutscheine** aus der App. So bleibt die Belohnung fürs nachhaltige Unterwegssein direkt in der Stadt.\n\nIhr kennt Läden, die dabei sein sollten? Schreibt es in den Prämien-Thread im Forum.`,
      visibility: 'PUBLIC', daysAgo: 13, image: 'galerie-1',
    },
    {
      title: 'Lastenrad-Wochen: Doppelte Punkte im Oktober',
      body: `Wer im Oktober mit dem **Lastenrad** unterwegs ist — egal ob eigenes oder Sharing — sammelt **doppelte Punkte**. Perfekt für den Großeinkauf oder den Weg zur Kita.`,
      visibility: 'PUBLIC', daysAgo: 2, image: 'galerie-2',
    },
    {
      title: 'Kernteam: Beta-Auswertung Woche 4',
      body: `Kurzstand: 480 aktive Tester:innen, 9.200 erfasste Wege. Häufigstes Problem bleibt die **Verkehrsmittel-Erkennung** bei langsamer Fahrt (Rad wird als Fußweg gezählt). Details und Maßnahmen im Protokoll — bitte vor dem Treffen lesen.`,
      visibility: 'TEAM', teams: ['Kernteam'], daysAgo: 4,
    },
  ],
  events: [
    {
      title: 'App-Sprechstunde auf dem Wochenmarkt', inDays: 4,
      body: 'Installation, Fragen, Feedback: Wir helfen beim Einrichten der Nudging-App und nehmen Rückmeldungen direkt auf.',
      location: 'Wochenmarkt, Stand am Brunnen', category: 'Sprechstunde', visibility: 'PUBLIC',
    },
    {
      title: 'Auftakt: Team-Challenge „Wer radelt die Schule?“', inDays: 16,
      body: 'Drei Schulen treten gegeneinander an: Welche Schulgemeinschaft sammelt in vier Wochen die meisten nachhaltigen Wege?',
      location: 'Schulzentrum Süd, Aula', category: 'Challenge', visibility: 'PUBLIC',
    },
    {
      title: 'Kernteam: Punkte-Kalibrierung & Missbrauchs-Check', inDays: 11,
      body: 'Sind die Punktwerte fair austariert? Auswertung der Plausibilitätsprüfungen und Entscheidung über Anpassungen.',
      location: 'Rathaus, Raum 1.08', category: 'Arbeitstreffen', visibility: 'TEAM', teams: ['Kernteam'],
    },
  ],
  polls: [
    {
      title: 'Welche Prämien motivieren euch?',
      description: 'Die Punkte sollen sich lohnen — was wünscht ihr euch neben den Stadtgutscheinen?',
      status: 'active', visibility: 'PUBLIC', showLiveResults: true, allowAnonymous: true,
      questions: [
        { text: 'Welche Prämien fändet ihr am besten?', type: 'multiple', options: ['Stadtgutscheine für lokale Läden', 'Freibad- & Kultur-Tickets', 'ÖPNV-Guthaben', 'Lastenrad-Sharing-Minuten', 'Spende an lokale Vereine'] },
        { text: 'Ab wie vielen Punkten sollte die erste Prämie erreichbar sein?', type: 'single', options: ['Schnell (nach ~1 Woche Alltag)', 'Mittel (nach ~1 Monat)', 'Selten, dafür größer'] },
      ],
    },
    {
      title: 'Was hält dich vom Umsteigen ab?',
      description: 'Ehrliche Antworten helfen den Fachbereichen mehr als jede Statistik.',
      status: 'active', visibility: 'PROJECT',
      questions: [
        { text: 'Was sind deine größten Hürden im Alltag?', type: 'multiple', options: ['Fehlende sichere Abstellplätze', 'Bus-Taktung passt nicht', 'Zu weite Wege', 'Wetter', 'Sicherheitsgefühl im Verkehr', 'Transport von Einkäufen/Kindern'] },
        { text: 'Was müsste passieren, damit du eine Autofahrt pro Woche ersetzt?', type: 'text' },
      ],
    },
    {
      title: 'Beta-Feedback: Die ersten vier Wochen',
      description: 'Kurzes Stimmungsbild der Tester:innen — geschlossen, Ergebnisse fließen in Update 1.1.',
      status: 'closed', visibility: 'PROJECT',
      questions: [
        { text: 'Wie zuverlässig erkennt die App deine Verkehrsmittel (1 = nie, 5 = immer)?', type: 'scale' },
        { text: 'Was nervt am meisten?', type: 'text' },
      ],
    },
  ],
  forum: [
    {
      title: 'Prämien-Wünsche: Welche Läden fehlen?', pinned: true, visibility: 'PROJECT',
      body: 'Zwölf Gutschein-Partner sind ein Anfang. Welche Geschäfte, Cafés oder Angebote würden euch wirklich zum Sammeln motivieren?',
      comments: [
        'Der Unverpackt-Laden wäre perfekt — nachhaltig einkaufen, nachhaltig hinkommen.',
        'Bitte auch was für Jugendliche: Kino oder der Skate-Shop.',
        'Wir fragen beide an — der Skate-Shop hat schon zugesagt!',
      ],
    },
    {
      title: 'App zählt meine Radwege als Fußwege', visibility: 'PROJECT',
      body: 'Bei gemütlichem Tempo (Kinderanhänger!) erkennt die App mein Rad ständig als Fußweg — die Punkte stimmen dann nicht. Geht das anderen auch so?',
      comments: [
        'Ja, vor allem bergauf. Workaround: in der App den Weg nachträglich korrigieren.',
        'Bekanntes Beta-Thema — die Erkennung wird mit Update 1.1 besser, die Korrektur-Funktion bleibt.',
      ],
    },
    {
      title: 'Datenschutz: Was passiert mit meinen Bewegungsdaten?', visibility: 'PROJECT',
      body: 'Bevor ich die App installiere: Wer sieht meine Wege? Werden die Daten verkauft oder mit der Verwaltung geteilt?',
      comments: [
        'Kurzfassung: Auswertung nur aggregiert, keine Weitergabe, Löschung jederzeit in der App. Das ausführliche Infoblatt liegt im Dateien-Bereich.',
        'Danke — genau so ein Infoblatt hatte ich gesucht.',
      ],
    },
    {
      title: 'Kernteam: Plausibilitätsprüfung — Auffälligkeiten', visibility: 'TEAM', teams: ['Kernteam'],
      body: 'Sammelthread für auffällige Muster (z. B. „Radwege“ mit 60 km/h). Bitte nur Muster, keine Einzelpersonen — Auswertung bleibt aggregiert.',
      comments: [
        'Cluster von identischen Pendelwegen mit unrealistischen Zeiten — vermutlich GPS-Drift im Bahnhofstunnel.',
        'Vorschlag: Wege über 45 km/h automatisch als ÖPNV/Auto klassifizieren statt verwerfen.',
      ],
    },
  ],
  tasks: [
    { title: 'Verkehrsmittel-Erkennung bei langsamer Fahrt verbessern', status: 'in_progress', priority: 'high', labels: ['App', 'Beta'], visibility: 'PROJECT', description: 'Häufigstes Beta-Feedback; Fix ist für Update 1.1 eingeplant.' },
    { title: 'Datenschutz-Infoblatt veröffentlichen', status: 'done', priority: 'high', labels: ['Datenschutz'], visibility: 'PROJECT' },
    { title: 'Unverpackt-Laden & Skate-Shop als Partner onboarden', status: 'in_progress', priority: 'medium', labels: ['Prämien'], visibility: 'PROJECT' },
    { title: 'Schul-Challenge: Ablauf & Fairness-Regeln festlegen', status: 'todo', priority: 'medium', labels: ['Challenge'], visibility: 'TEAM', teams: ['Kernteam'] },
    { title: 'Punktwerte für Teilstrecken kalibrieren', status: 'todo', priority: 'medium', labels: ['App'], visibility: 'TEAM', teams: ['Kernteam'] },
  ],
  files: [
    { label: 'UrbanKIT – Kurzvorstellung', source: 'pdf', folder: 'App & Prämien', visibility: 'PUBLIC' },
    { label: 'Datenschutz-Infoblatt zur Nudging-App', source: 'pdf', folder: 'App & Prämien', visibility: 'PROJECT' },
    { label: 'Foto: Unterwegs mit dem Rad', source: 'galerie-3', folder: 'App & Prämien', visibility: 'PROJECT' },
  ],
  board: {
    name: 'App-Roadmap & Challenges',
    notes: [
      'Update 1.1: Erkennung langsamer Radfahrten fixen',
      'Prämien: Skate-Shop zugesagt, Unverpackt-Laden im Gespräch',
      'Schul-Challenge: Fairness-Regeln vor Auftakt klären',
      'Idee aus dem Forum: Spenden-Prämie an Vereine',
      'Hürden-Umfrage: Abstellplätze an Fachbereich Tiefbau melden',
    ],
  },
}
