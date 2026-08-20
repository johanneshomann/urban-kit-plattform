// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

// Angelehnt an das reale Projekt „Statt Daten Stadtdaten“ der Smart City
// Detmold (smartcity-detmold.de/projekte/statt-daten-stadtdaten): Urban Data
// Platform mit Gütersloh, LoRaWAN-Ausbau, Wetterstationen für den
// Hochwasserschutz, 3D-Geoportal, LoRaHive-Bienenmonitoring und die
// Partizipations-Toolbox SC PUT mit der TH OWL. Laufzeit bis September 2027.
// Personen und Einzelinhalte sind fiktives Mockup-Material.

import type { SeedProject } from './types'

export const stadtdaten: SeedProject = {
  slug: 'stadtdaten',
  title: 'Statt Daten Stadtdaten',
  shortDescription: 'Nachhaltigkeitsdaten für alle: Sensoren im LoRaWAN, Wetterstationen für den Hochwasserschutz und eine Urban Data Platform machen sichtbar, wie es der Stadt wirklich geht – bis ins Quartier.',
  projektphase: 'projektausfuehrung',
  thema: ['umwelt', 'infrastruktur'],
  startYear: 2022,
  stadtbereich: ['gesamtstadt'],
  altersgruppe: ['jugendliche', 'erwachsene', 'senioren'],
  gender: ['alle'],
  isPublic: true,
  teams: ['Sensorik-Team', 'Datenwerkstatt'],
  beschreibung: `**Statt Daten Stadtdaten** sammelt die Nachhaltigkeitsdaten der Stadt und macht sie digital zugänglich — damit Bürger:innen und Entscheider:innen sehen, wie Planungen zusammenhängen und was das eigene Mobilitäts- und Klimaverhalten bewirkt. Die Bausteine:

- **Urban Data Platform (UDP)** — gemeinsam mit Gütersloh betrieben, das Zuhause aller städtischen Datenströme
- **LoRaWAN-Ausbau** — ein stadtweites Funknetz für Sensoren aller Art
- **Wetterstationen für den Hochwasserschutz** — in Zusammenarbeit mit der Feuerwehr
- **3D-Stadtmodelle im Geoportal** — mit dem GeoService-Team
- **LoRaHive** — Bienenstock-Monitoring per Sensor, zusammen mit den Imkervereinen
- **SC PUT** — die „Partizipation und Usability Toolbox“: gemeinsam mit der TH OWL erforschen wir, wie Stadtdaten verständlich und mitgestaltbar werden

Gefördert im Programm *Modellprojekte Smart Cities*, Laufzeit bis September 2027.`,
  beteiligungsvorhaben: `- **Messpunkte mitbestimmen**: Wo sollen die nächsten Klima- und Verkehrssensoren hängen?
- **Daten spenden**: private Wetterstationen können ans städtische Netz angebunden werden
- **Datenwerkstatt**: offene Abende, an denen wir gemeinsam Dashboards und Visualisierungen aus den offenen Daten bauen
- **SC PUT mittesten**: Prototypen der TH OWL für Quartiers-Displays ausprobieren und bewerten`,
  kontakt: { email: 'stadtdaten@urbankit.de', telefon: '05231 977-400', website: 'https://smartcity-detmold.de/projekte/statt-daten-stadtdaten' },
  projektleitungEmail: 'projektleitung-2@urbankit.de',
  folders: ['Protokolle', 'Datensätze'],
  news: [
    {
      title: 'Design Woche: Unsere Datenprototypen zum Anfassen',
      body: `Auf der Design Woche haben wir gemeinsam mit der TH OWL die ersten **SC-PUT-Prototypen** gezeigt: Quartiers-Displays, die Klima- und Mobilitätsdaten dort sichtbar machen, wo sie entstehen. Das Feedback der Besucher:innen fließt direkt in die nächste Iteration.`,
      visibility: 'PUBLIC', daysAgo: 5, image: 'cover',
    },
    {
      title: 'LoRaHive: Die Bienen senden jetzt',
      body: `Gemeinsam mit den Imkervereinen haben wir die ersten **LoRaHive-Sensoren** an Bienenstöcken installiert. Gewicht, Temperatur und Feuchte laufen jetzt live über das LoRaWAN in die Urban Data Platform — ein kleines Fenster in die Gesundheit unserer Stadtnatur.`,
      visibility: 'PUBLIC', daysAgo: 12, image: 'galerie-3',
    },
    {
      title: 'Hochwasserschutz: Fünf neue Wetterstationen mit der Feuerwehr',
      body: `An den kritischen Bachläufen messen ab sofort fünf neue **Wetterstationen** Niederschlag und Pegel — die Feuerwehr sieht damit früher, wo es eng wird. Die Daten sind offen und landen im Stadtdaten-Portal.`,
      visibility: 'PUBLIC', daysAgo: 20, image: 'galerie-1',
    },
    {
      title: 'Sensorik-Team: Gateway-Ausfall Nord behoben',
      body: `Das LoRaWAN-Gateway Nord war zwei Tage offline (defektes Netzteil, jetzt getauscht). Bitte prüft eure Sensoren im Norden auf Datenlücken und meldet Auffälligkeiten im Forum-Thread.`,
      visibility: 'TEAM', teams: ['Sensorik-Team'], daysAgo: 8,
    },
  ],
  events: [
    {
      title: 'Offene Datenwerkstatt: Dashboards bauen', inDays: 7,
      body: 'Wir bauen gemeinsam Visualisierungen aus den offenen Stadtdaten — bring deinen Laptop, Vorkenntnisse egal.',
      location: 'Stadtbibliothek, Lernwerkstatt', category: 'Werkstatt', visibility: 'PUBLIC',
    },
    {
      title: 'SC PUT: Testrunde Quartiers-Display', inDays: 14,
      body: 'Mit der TH OWL testen wir den zweiten Prototyp der Quartiers-Displays — 30 Minuten mitmachen, ehrlich meckern erwünscht.',
      location: 'Marktplatz, Infocontainer', category: 'Testrunde', visibility: 'PUBLIC',
    },
    {
      title: 'Sensorik-Team: Wartungstour LoRaWAN', inDays: 10,
      body: 'Quartalstour zu allen Gateways: Batterien, Antennen, Firmware. Route und Fahrzeug wie immer.',
      location: 'Treffpunkt Bauhof', category: 'Wartung', visibility: 'TEAM', teams: ['Sensorik-Team'],
    },
  ],
  polls: [
    {
      title: 'Wo sollen die nächsten Klimasensoren hängen?',
      description: 'Zehn weitere Sensoren für Temperatur und Luftqualität sind finanziert — helft uns bei der Standortwahl.',
      status: 'active', visibility: 'PUBLIC', showLiveResults: true, allowAnonymous: true,
      questions: [
        { text: 'Welcher Bereich braucht am dringendsten Messdaten?', type: 'single', options: ['Innenstadt (Hitzeinseln)', 'Schulwege', 'Bachläufe (Hochwasser)', 'Parks & Grünflächen', 'Gewerbegebiete'] },
        { text: 'Hast du einen konkreten Standort-Vorschlag?', type: 'text' },
      ],
    },
    {
      title: 'Welche Daten wollt ihr im Stadtdaten-Portal sehen?',
      description: 'Die Urban Data Platform wächst — was sollen wir als Nächstes veröffentlichen?',
      status: 'active', visibility: 'PROJECT',
      questions: [
        { text: 'Welche Datensätze interessieren dich?', type: 'multiple', options: ['Stadtklima & Hitze', 'Pegel & Niederschlag', 'Verkehrszählungen', 'Radverkehr', 'Bienen & Stadtnatur (LoRaHive)', 'Energieverbrauch städtischer Gebäude'] },
        { text: 'Wie verständlich findest du das bisherige Portal (1 = gar nicht, 5 = sehr)?', type: 'scale' },
      ],
    },
    {
      title: 'Feedback: Erste Testrunde Quartiers-Display',
      description: 'Rückmeldungen aus der SC-PUT-Testrunde auf der Design Woche.',
      status: 'closed', visibility: 'PUBLIC', allowAnonymous: true,
      questions: [
        { text: 'Wie hilfreich fandest du das Display (1 = unnötig, 5 = sehr hilfreich)?', type: 'scale' },
        { text: 'Was sollte das Display unbedingt anzeigen?', type: 'text' },
      ],
    },
  ],
  forum: [
    {
      title: 'Private Wetterstationen anschließen — so geht’s', pinned: true, visibility: 'PROJECT',
      body: 'Viele von euch haben eigene Wetterstationen auf Balkon oder Garage. Hier sammeln wir, wer mitmachen will und welche Geräte sich ans LoRaWAN anbinden lassen.',
      comments: [
        'Meine Station auf dem Balkon läuft seit drei Jahren stabil — wie bekomme ich die Daten zu euch?',
        'Anleitung für die gängigen Modelle kommt in den Dateien-Bereich. Kurzversion: Wir stellen kleine LoRa-Bridges.',
        'Gibt es die Bridges auch leihweise? Dann würde unser Gemeinschaftsgarten mitmachen.',
      ],
    },
    {
      title: 'Datenlücken im Norden (Gateway-Ausfall)', visibility: 'TEAM', teams: ['Sensorik-Team'],
      body: 'Sammelthread nach dem Gateway-Ausfall: Bitte listet hier Sensoren mit Lücken zwischen dem 3. und 5., damit wir die Ausfälle dokumentieren können.',
      comments: [
        'Pegelsensor Bachlauf B fehlt komplett für beide Tage.',
        'Die beiden Klimasensoren am Schulzentrum haben nur Nachts gesendet — vermutlich Reichweite am Limit.',
      ],
    },
    {
      title: 'Was zeigen die Bienendaten eigentlich?', visibility: 'PROJECT',
      body: 'Die LoRaHive-Kurven sind spannend, aber ich verstehe sie nicht ganz: Warum schwankt das Stockgewicht am Tag so stark?',
      comments: [
        'Tagsüber sind die Sammlerinnen unterwegs — ein Stock „verliert“ mittags gern mal zwei Kilo Bienen!',
        'Wir planen eine Erklärseite je Datensatz — genau für solche Fragen.',
      ],
    },
    {
      title: '3D-Stadtmodell: Wofür würdet ihr es nutzen?', visibility: 'PROJECT',
      body: 'Das GeoService-Team baut die 3D-Modelle im Geoportal aus. Welche Anwendungsfälle wären für euch nützlich — Verschattung, Solar-Potenzial, Hochwasser-Simulation?',
      comments: [
        'Solarpotenzial fürs eigene Dach wäre großartig.',
        'Für die Hitze-Debatte: Verschattung von Spielplätzen im Sommer.',
      ],
    },
  ],
  tasks: [
    { title: 'Anleitung „Private Wetterstation anbinden“ schreiben', status: 'in_progress', priority: 'high', labels: ['LoRaWAN', 'Mitmachen'], visibility: 'PROJECT', description: 'Die drei gängigsten Modelle abdecken; Forum-Thread verlinken.' },
    { title: 'Ersatz-Netzteile für alle Gateways beschaffen', status: 'todo', priority: 'high', labels: ['LoRaWAN', 'Wartung'], visibility: 'TEAM', teams: ['Sensorik-Team'], description: 'Lehre aus dem Ausfall Nord: ein Reserve-Netzteil je Standort.' },
    { title: 'SC-PUT-Feedback der Design Woche clustern', status: 'in_progress', priority: 'medium', labels: ['SC PUT'], visibility: 'TEAM', teams: ['Datenwerkstatt'] },
    { title: 'LoRaHive-Erklärseite mit den Imkervereinen abstimmen', status: 'todo', priority: 'medium', labels: ['LoRaHive'], visibility: 'PROJECT' },
    { title: 'Pegel-Datensatz im Portal veröffentlichen', status: 'done', priority: 'medium', labels: ['UDP', 'Open Data'], visibility: 'PROJECT' },
  ],
  files: [
    { label: 'UrbanKIT – Kurzvorstellung', source: 'pdf', folder: 'Datensätze', visibility: 'PUBLIC' },
    { label: 'Wartungsprotokoll LoRaWAN Q3', source: 'pdf', folder: 'Protokolle', visibility: 'TEAM', teams: ['Sensorik-Team'] },
    { label: 'Foto: Prototyp auf der Design Woche', source: 'cover', folder: 'Datensätze', visibility: 'PROJECT' },
  ],
  board: {
    name: 'Sensorik & Portal-Roadmap',
    notes: [
      'Gateway-Netzteile: je Standort ein Reserve-Teil',
      'Quartiers-Display v2: weniger Zahlen, mehr Vergleiche',
      'LoRaHive: Erklärseite mit Imker-Sprechstunde koppeln',
      'Solarpotenzial-Layer fürs 3D-Modell prüfen (Forum-Wunsch)',
      'UDP: Radverkehrs-Zählungen bis Jahresende einspielen',
    ],
  },
}
