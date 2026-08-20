// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

// Angelehnt an das reale Projekt „Mitmach-Werkstatt“ der Smart City Detmold
// (smartcity-detmold.de/projekte/mitmach-werkstatt): Pop-up-Makerspace in
// temporären Containern an der Adenauerstraße 4 (Okt.–Dez. 2022), 16 Workshops
// mit 58 Teilnehmenden, Schwerpunkt 3D-Druck (u. a. „Kirchen digitalisieren“
// mit Kirche.plus), Partner u. a. Weidmüller; die Drucker gingen anschließend
// an Stadtbibliothek und Jugendarbeit. Das reale Projekt ist abgeschlossen —
// hier als Projekt in der Reflexions- & Evaluationsphase geseedet: Der Pop-up
// war der Test, ausgewertet wird die dauerhafte Werkstatt.
// Personen und Einzelinhalte sind fiktives Mockup-Material.

import type { SeedProject } from './types'

export const mitmachWerkstatt: SeedProject = {
  slug: 'mitmach-werkstatt',
  title: 'Mitmach-Werkstatt',
  shortDescription: 'Der Pop-up-Makerspace hat gezeigt, wie groß die Lust aufs Selbermachen ist: 16 Workshops, 58 Teilnehmende, 3D-Druck für alle Generationen. Jetzt werten wir aus – und prüfen die dauerhafte Werkstatt.',
  projektphase: 'reflexion-evaluation',
  thema: ['bildung', 'stadtentwicklung'],
  startYear: 2022,
  stadtbereich: ['gesamtstadt'],
  altersgruppe: ['kinder', 'jugendliche', 'senioren'],
  gender: ['alle'],
  isPublic: true,
  teams: ['Werkstatt-Team'],
  beschreibung: `Die **Mitmach-Werkstatt** war ein Pop-up-Makerspace in temporären Containern an der Adenauerstraße: offene Werkstattzeiten, buchbare Halbtags-Workshops mit bis zu acht Plätzen und ein Schwerpunkt auf **3D-Druck** — vom ersten Schlüsselanhänger bis zum Themenprojekt **„Kirchen digitalisieren“** mit Kirche.plus.

Die Bilanz nach drei Monaten: **16 Workshops, 58 Teilnehmende** — Kinder, Jugendliche und Senior:innen gleichermaßen. Nach dem Ende des Pop-ups sind die 3D-Drucker in die **Stadtbibliothek** und die **Jugendarbeit** umgezogen, wo sie weiter genutzt werden.

Getragen wurde das Projekt vom Team Digitalisierung mit Partnern aus Wirtschaft (u. a. Weidmüller) und Zivilgesellschaft, gefördert im Programm *Modellprojekte Smart Cities*.`,
  beteiligungsvorhaben: `Der Pop-up ist beendet — jetzt zählt eure Erfahrung:

- **Auswerten**: Was hat die Werkstatt gebracht, was hat gefehlt? Die Evaluation entscheidet mit, ob es weitergeht
- **Verstetigung prüfen**: Braucht die Stadt eine dauerhafte Mitmach-Werkstatt — und wenn ja, wo und mit wem?
- **Weiternutzen**: Die Drucker in Bibliothek und Jugendarbeit stehen allen offen — Rückmeldungen zur Nutzung fließen in die Auswertung ein`,
  kontakt: { email: 'mitmach-werkstatt@urbankit.de', telefon: '05231 977-700', website: 'https://smartcity-detmold.de/projekte/mitmach-werkstatt' },
  projektleitungEmail: 'projektleitung-7@urbankit.de',
  folders: ['Evaluation', 'Workshop-Material'],
  news: [
    {
      title: 'Bilanz: 16 Workshops, 58 Teilnehmende — und wie weiter?',
      body: `Drei Monate Pop-up-Werkstatt sind vorbei. Die Zahlen: **16 Workshops**, **58 Teilnehmende** von 8 bis 80, ausgebuchte 3D-Druck-Kurse und eine Warteliste bis zum Schluss.\n\nDie **3D-Drucker** sind jetzt in der Stadtbibliothek und bei der Jugendarbeit im Einsatz. Und die große Frage lautet: Braucht die Stadt eine dauerhafte Mitmach-Werkstatt? Eure Rückmeldungen entscheiden mit.`,
      visibility: 'PUBLIC', daysAgo: 30, image: 'cover',
    },
    {
      title: 'Kirchen digitalisieren: Ein Rückblick auf das ungewöhnlichste Projekt',
      body: `Gemeinsam mit **Kirche.plus** haben Teilnehmende historische Kirchendetails gescannt und als 3D-Modelle gedruckt — vom Taufstein bis zum Turmornament. Die Modelle sind nun Teil einer kleinen Wanderausstellung.\n\nDas Projekt zeigt, was passiert, wenn Technik auf Stadtgeschichte trifft.`,
      visibility: 'PUBLIC', daysAgo: 45, image: 'galerie-3',
    },
    {
      title: 'Evaluation gestartet: Sagt uns eure Meinung',
      body: `Die Auswertung läuft: Umfrage, Reflexionswerkstatt und Gespräche mit den Partnern. Bis Ende des Monats sammeln wir alles, was für oder gegen eine **dauerhafte Werkstatt** spricht — Ergebnisse gehen danach an Verwaltung und Rat.`,
      visibility: 'PUBLIC', daysAgo: 12, image: 'galerie-1',
    },
    {
      title: 'Werkstatt-Team: Container zurückgegeben, Inventar verteilt',
      body: `Der Rückbau ist abgeschlossen: Container übergeben, Werkzeug inventarisiert und auf Bibliothek, Jugendarbeit und Lager verteilt. Die Inventarliste liegt im Dateien-Bereich — bitte prüft eure Übernahmen und meldet Abweichungen.`,
      visibility: 'TEAM', teams: ['Werkstatt-Team'], daysAgo: 20,
    },
  ],
  events: [
    {
      title: 'Reflexionswerkstatt: Was bleibt vom Pop-up?', inDays: 12,
      body: 'Offene Auswertungsrunde für alle, die dabei waren oder es künftig sein wollen: Was lief gut, was fehlt, wie sähe eine dauerhafte Werkstatt aus?',
      location: 'Stadtbibliothek, Veranstaltungsraum', category: 'Werkstatt', visibility: 'PUBLIC',
    },
    {
      title: '3D-Druck-Sprechstunde in der Bibliothek', inDays: 5,
      body: 'Die Drucker aus der Mitmach-Werkstatt leben weiter: offene Sprechstunde für alle, die drucken lernen oder eigene Projekte mitbringen wollen.',
      location: 'Stadtbibliothek, Lernwerkstatt', category: 'Sprechstunde', visibility: 'PUBLIC',
    },
    {
      title: 'Werkstatt-Team: Evaluationsbericht — Endspurt', inDays: 19,
      body: 'Letzte Abstimmung des Berichts vor der Übergabe an die Verwaltung: Zahlen, Zitate, Empfehlung.',
      location: 'Digital (Link folgt)', category: 'Arbeitstreffen', visibility: 'TEAM', teams: ['Werkstatt-Team'],
    },
  ],
  polls: [
    {
      title: 'Braucht die Stadt eine dauerhafte Mitmach-Werkstatt?',
      description: 'Das Ergebnis fließt direkt in den Evaluationsbericht an Verwaltung und Rat.',
      status: 'active', visibility: 'PUBLIC', showLiveResults: true, allowAnonymous: true,
      questions: [
        { text: 'Sollte es dauerhaft eine offene Werkstatt geben?', type: 'single', options: ['Ja, mit festen Öffnungszeiten', 'Ja, als regelmäßiger Pop-up', 'Nein, die Angebote in Bibliothek & Jugendarbeit reichen'] },
        { text: 'Welche Angebote wären dir am wichtigsten?', type: 'multiple', options: ['3D-Druck', 'Holz- & Metallwerkstatt', 'Elektronik & Löten', 'Repair-Café', 'Textil & Nähen', 'Kurse für Kinder', 'Kurse für Senior:innen'] },
      ],
    },
    {
      title: 'Wo sollte eine dauerhafte Werkstatt hin?',
      description: 'Erste Standort-Ideen aus der Reflexionsrunde — ohne Gewähr, aber mit Gewicht.',
      status: 'active', visibility: 'PROJECT',
      questions: [
        { text: 'Welcher Standort wäre am besten?', type: 'single', options: ['Innenstadt (Leerstand)', 'Bei der Stadtbibliothek', 'Schulzentrum (Kooperation)', 'Wieder Container — dafür wandernd'] },
        { text: 'Kennst du einen konkreten Leerstand?', type: 'text' },
      ],
    },
    {
      title: 'Feedback der Workshop-Teilnehmenden',
      description: 'Abschlussbefragung der 58 Teilnehmenden — geschlossen.',
      status: 'closed', visibility: 'PUBLIC', allowAnonymous: true,
      questions: [
        { text: 'Wie hat dir die Mitmach-Werkstatt gefallen (1 = gar nicht, 5 = sehr)?', type: 'scale' },
        { text: 'Was hättest du dir zusätzlich gewünscht?', type: 'text' },
      ],
    },
  ],
  forum: [
    {
      title: 'Dauerhafte Werkstatt: Wer macht mit?', pinned: true, visibility: 'PROJECT',
      body: 'Wenn aus dem Pop-up etwas Dauerhaftes werden soll, braucht es Menschen: Kursleitungen, Werkzeugspenden, Räume, Träger. Wer kann sich was vorstellen?',
      comments: [
        'Ich gebe weiter 3D-Druck-Kurse — auch zweimal die Woche, wenn es Räume gibt.',
        'Unser Gemeinschaftsgarten hätte Bedarf an einem Repair-Treff im Winter — wir bringen Leute mit.',
        'Fragt doch die Berufskollegs — Werkstatträume stehen abends oft leer.',
      ],
    },
    {
      title: '3D-Drucker in der Bibliothek: Wie buche ich?', visibility: 'PROJECT',
      body: 'Ich würde gern das Ersatzteil für unseren Kinderwagen drucken — wie komme ich an die Drucker in der Bibliothek?',
      comments: [
        'Einfach zur Sprechstunde kommen (Termin steht im Kalender) — Einweisung dauert 20 Minuten.',
        'Danke! Ersatzteil ist gedruckt und hält. Großartige Sache.',
      ],
    },
    {
      title: 'Was ist aus den Kirchen-Scans geworden?', visibility: 'PROJECT',
      body: 'Das Digitalisieren der Kirchendetails war mein Highlight. Sind die 3D-Modelle irgendwo zu sehen — oder sogar nachdruckbar?',
      comments: [
        'Die Wanderausstellung startet in der Marktkirche; die Modelle kommen danach als freie Downloads ins Stadtdaten-Portal.',
      ],
    },
    {
      title: 'Werkstatt-Team: Inventar-Abgleich nach Verteilung', visibility: 'TEAM', teams: ['Werkstatt-Team'],
      body: 'Bitte prüft die Inventarliste gegen eure Übernahmen: Bibliothek (Drucker 1+2, Filament), Jugendarbeit (Drucker 3, Lötstationen), Lager (Rest).',
      comments: [
        'Jugendarbeit bestätigt — nur ein Filament-Karton fehlt, vermutlich noch im Lager.',
        'Karton gefunden, steht beim Pavillon-Material. Liste ist aktualisiert.',
      ],
    },
  ],
  tasks: [
    { title: 'Evaluationsbericht fertigstellen', status: 'in_progress', priority: 'high', labels: ['Evaluation'], visibility: 'TEAM', teams: ['Werkstatt-Team'], description: 'Zahlen + Umfrage-Ergebnisse + Empfehlung; Übergabe an Verwaltung Ende des Monats.' },
    { title: 'Standort-Optionen für dauerhafte Werkstatt recherchieren', status: 'in_progress', priority: 'medium', labels: ['Verstetigung'], visibility: 'PROJECT' },
    { title: 'Gespräch mit Weidmüller über Fortsetzung der Partnerschaft', status: 'todo', priority: 'medium', labels: ['Partner'], visibility: 'PROJECT' },
    { title: 'Kirchen-Modelle als freie Downloads veröffentlichen', status: 'todo', priority: 'low', labels: ['Kirchen digitalisieren'], visibility: 'PROJECT' },
    { title: 'Container-Rückgabe & Inventarverteilung abschließen', status: 'done', priority: 'high', labels: ['Rückbau'], visibility: 'TEAM', teams: ['Werkstatt-Team'] },
  ],
  files: [
    { label: 'UrbanKIT – Kurzvorstellung', source: 'pdf', folder: 'Workshop-Material', visibility: 'PUBLIC' },
    { label: 'Evaluationsbericht (Entwurf)', source: 'pdf', folder: 'Evaluation', visibility: 'TEAM', teams: ['Werkstatt-Team'] },
    { label: 'Foto: 3D-Druck-Workshop', source: 'galerie-2', folder: 'Workshop-Material', visibility: 'PROJECT' },
  ],
  board: {
    name: 'Verstetigung der Werkstatt',
    notes: [
      'Evaluation: Warteliste bis zum Schluss — starkes Argument',
      'Standort-Idee aus dem Forum: Berufskolleg-Räume abends',
      'Weidmüller-Gespräch vor Berichtsabgabe terminieren',
      'Repair-Café als Winterformat mit dem Gemeinschaftsgarten',
      'Kirchen-Modelle → Stadtdaten-Portal (Querbezug!)',
    ],
  },
}
