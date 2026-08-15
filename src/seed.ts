// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

/**
 * Seed script — creates mock data for development/demo.
 *
 * Run: npx tsx src/seed.ts
 * Requires a running MongoDB + Payload instance (start dev server first).
 *
 * Safe to re-run: creates only if collections are empty.
 */

import { getPayload } from 'payload'
import config from '@payload-config'

const NOW = new Date()
const DAY = 24 * 60 * 60 * 1000

/** Poll question text for new projects (idx ≥ 3). */
function getPollQuestionText(idx: number): string {
  const questions: Record<number, string> = {
    4: 'Wo sollen zuerst neue Pflanzbeete entstehen?',
    5: 'Welche Förderung ist am wichtigsten?',
    6: 'Welche Radwegverbindung hat Priorität?',
    7: 'Was ist im Stadtbad am wichtigsten?',
    8: 'Welche Baumarten bevorzugt ihr?',
    9: 'Welche Betreuungszeiten werden benötigt?',
    10: 'Wie soll die Beleuchtung wirken?',
    11: 'Welche Funktionen wünscht ihr euch?',
  }
  return questions[idx] ?? 'Was ist Ihnen besonders wichtig?'
}

/** Poll options for new projects (idx ≥ 3). */
function getPollOptions(idx: number): string[] {
  const options: Record<number, string[]> = {
    4: ['Pflanzbeete in der Fußgängerzone', 'Baumscheiben am Marktplatz', 'Entsiegelte Flächen am Rathaus', 'Dachbegrünung auf städtischen Gebäuden'],
    5: ['Mietzuschüsse für Neueröffnungen', 'Beratung und Coaching', 'Förderung von Ladenumbauten', 'Lokale Marketing-Kampagnen'],
    6: ['Nordring → Bahnhof', 'Innenstadt → Südbahnhof', 'Schulweg-Netz Ost', 'Anbindung Gewerbegebiet'],
    7: ['Sauna-Bereich', 'Familienschwimmen', 'Sportbecken mit Bahnen', 'Café und Ruhebereich', 'Kursangebote'],
    8: ['Eiche', 'Buche', 'Ahorn', 'Lärche', 'Douglasie'],
    9: ['7:00–17:00 Uhr', 'Mit Randzeiten (6:30–18:30)', 'Ganztags mit Mittagessen', 'Nur vormittags'],
    10: ['Warmes, gemütliches Licht', 'Helle, tageslichtähnliche Beleuchtung', 'Buntes, dynamisches Licht', 'Klassische Laternenoptik'],
    11: ['Alle Beteiligungsprojekte anzeigen', 'Baustellen-Filter', 'Barrierefreie Routen', 'Echtzeit-ÖPNV-Daten', 'POI-Suche (Kitas, Ärzte, Sport)'],
  }
  return options[idx] ?? ['Option A', 'Option B', 'Option C']
}

async function seed() {
  const payload = await getPayload({ config })

  const admin = await payload.find({ collection: 'users', where: { email: { equals: 'admin@urbankit.de' } }, limit: 1, overrideAccess: true })
  const citizen = await payload.find({ collection: 'users', where: { email: { equals: 'buegerin@urbankit.de' } }, limit: 1, overrideAccess: true })

  // ── 1. Users ──────────────────────────────────────────────────────────
  let adminId: string, citizenId: string
  if (admin.docs.length === 0) {
    const a = await payload.create({ collection: 'users', data: { email: 'admin@urbankit.de', password: 'demo1234', firstName: 'Stadt', lastName: 'Planer', role: 'admin', affiliations: ['cityEmployee'] }, overrideAccess: true })
    adminId = a.id
  } else {
    adminId = admin.docs[0].id
  }
  if (citizen.docs.length === 0) {
    const c = await payload.create({ collection: 'users', data: { email: 'buegerin@urbankit.de', password: 'demo1234', firstName: 'Lena', lastName: 'Bürger', role: 'user', affiliations: ['citizen'] }, overrideAccess: true })
    citizenId = c.id
  } else {
    citizenId = citizen.docs[0].id
  }

  // ── 2. Check for existing data ────────────────────────────────────────
  const force = process.argv.includes('--force')
  const existingProjects = await payload.find({ collection: 'projects', limit: 1, overrideAccess: true })
  if (existingProjects.docs.length > 0) {
    if (!force) {
      console.log('Database already has data — use --force to re-seed.')
      process.exit(0)
    }
    // Wipe existing data (order matters for referential integrity)
    console.log('Wiping existing data…')
    for (const slug of ['forum-comments', 'forum-threads', 'news-comments', 'news-posts', 'tasks', 'poll-options', 'poll-votes', 'poll-questions', 'polls', 'calendar-events', 'event-attendees', 'project-memberships', 'board-canvases', 'chat-messages', 'chat-room-members', 'chat-rooms', 'file-uploads', 'folders', 'projects', 'activity', 'notifications'] as const) {
      const { docs } = await payload.find({ collection: slug, limit: 1000, overrideAccess: true })
      for (const doc of docs) {
        await payload.delete({ collection: slug, id: doc.id, overrideAccess: true })
      }
    }
    // Remove seed users (created inline below)
    const { docs: seedUsers } = await payload.find({ collection: 'users', where: { email: { in: ['admin@urbankit.de', 'buegerin@urbankit.de'] } }, limit: 10, overrideAccess: true })
    for (const u of seedUsers) {
      await payload.delete({ collection: 'users', id: u.id, overrideAccess: true })
    }
    console.log('Wipe complete.')
  }

  const projectData = [
    {
      title: 'Mobilitätskonzept 2030',
      slug: 'mobilitaetskonzept-2030',
      shortDescription: 'Ein zukunftsfähiges Mobilitätskonzept für die Innenstadt – gemeinsam mit Bürger:innen, Fachleuten und der Verwaltung.',
      colorScheme: 'Sandstein',
      isPublic: true,
      joinRequestsEnabled: true,
      projektphase: 'konzeptentwicklung',
      thema: ['mobilitaet'],
      startYear: 2025,
      modules: ['news', 'calendar', 'polls', 'forum', 'tasks', 'files'],
      teams: ['Kernteam', 'Lenkungsgruppe', 'AG Radverkehr'],
    },
    {
      title: 'Umbau Rathausvorplatz',
      slug: 'umbau-rathausvorplatz',
      shortDescription: 'Der Rathausvorplatz wird neu gestaltet – als Begegnungszone mit mehr Aufenthaltsqualität und Grün.',
      colorScheme: 'Terrakotta',
      isPublic: true,
      joinRequestsEnabled: true,
      projektphase: 'projektplanung',
      thema: ['stadtentwicklung', 'gruenflaechen'],
      startYear: 2024,
      modules: ['news', 'calendar', 'polls', 'forum', 'tasks', 'files', 'board'],
      teams: ['Kernteam', 'Planungsbüro'],
    },
    {
      title: 'Quartier am Stadtpark',
      slug: 'quartier-am-stadtpark',
      shortDescription: 'Entwicklung eines neuen Wohnquartiers am Stadtpark mit bezahlbarem Wohnraum und sozialer Infrastruktur.',
      colorScheme: 'Feldgrau',
      isPublic: true,
      joinRequestsEnabled: false,
      projektphase: 'einarbeitung',
      thema: ['wohnraum', 'stadtentwicklung'],
      stadtbereich: ['norden'],
      startYear: 2025,
      modules: ['news', 'calendar', 'polls', 'forum', 'tasks', 'files', 'board'],
      teams: ['Kernteam', 'Stadtplanung', 'Investor'],
    },
    {
      title: 'Digitales Bürgeramt',
      slug: 'digitales-buergeramt',
      shortDescription: 'Die Stadtverwaltung digitalisiert ihre Dienstleistungen – nutzerfreundlich, barrierefrei und effizient.',
      colorScheme: 'Ozean',
      isPublic: true,
      joinRequestsEnabled: true,
      projektphase: 'projektausfuehrung',
      thema: ['infrastruktur'],
      startYear: 2024,
      modules: ['news', 'calendar', 'polls', 'tasks', 'files'],
      teams: ['Kernteam', 'IT-Referat'],
    },
    {
      title: 'Innenstadtbegrünung',
      slug: 'innenstadt-begruenung',
      shortDescription: 'Mehr Grün in der Innenstadt: neue Pflanzbeete, Baumscheiben und entsiegelte Flächen für ein besseres Stadtklima.',
      colorScheme: 'Kupfer',
      isPublic: true,
      joinRequestsEnabled: true,
      projektphase: 'konzeptentwicklung',
      thema: ['gruenflaechen', 'stadtentwicklung'],
      stadtbereich: ['innenstadt'],
      startYear: 2025,
      modules: ['news', 'calendar', 'polls', 'forum', 'tasks', 'board'],
      teams: ['Kernteam', 'Grünflächenamt', 'Klimaschutz'],
    },
    {
      title: 'Förderung lokaler Einzelhandel',
      slug: 'foerderung-lokaler-einzelhandel',
      shortDescription: 'Leerstände aktivieren und den lokalen Einzelhandel stärken – mit einem Förderprogramm für inhabergeführte Geschäfte.',
      colorScheme: 'Sandstein',
      isPublic: true,
      joinRequestsEnabled: true,
      projektphase: 'einarbeitung',
      thema: ['stadtentwicklung'],
      stadtbereich: ['innenstadt'],
      startYear: 2025,
      modules: ['news', 'calendar', 'polls', 'forum', 'files'],
      teams: ['Kernteam', 'Wirtschaftsförderung', 'Einzelhandelsverband'],
    },
    {
      title: 'Radwegeausbau Nord',
      slug: 'radwegeausbau-nord',
      shortDescription: 'Sichere Radwege im Norden der Stadt: neue Verbindungen, geschützte Kreuzungen und bessere Anbindung an den Bahnhof.',
      colorScheme: 'Ozean',
      isPublic: true,
      joinRequestsEnabled: true,
      projektphase: 'projektausfuehrung',
      thema: ['mobilitaet'],
      stadtbereich: ['norden'],
      startYear: 2024,
      modules: ['news', 'calendar', 'polls', 'tasks'],
      teams: ['Kernteam', 'Tiefbauamt', 'AG Radverkehr'],
    },
    {
      title: 'Sanierung Stadtbad',
      slug: 'sanierung-stadtbad',
      shortDescription: 'Das historische Stadtbad wird saniert und modernisiert – und bleibt dabei ein Ort für alle Generationen.',
      colorScheme: 'Terrakotta',
      isPublic: true,
      joinRequestsEnabled: true,
      projektphase: 'projektplanung',
      thema: ['kultur'],
      stadtbereich: ['innenstadt'],
      startYear: 2023,
      modules: ['news', 'calendar', 'polls', 'forum', 'tasks', 'files'],
      teams: ['Kernteam', 'Denkmalschutz', 'Bäderbetriebe'],
    },
    {
      title: 'Klimafester Stadtwald',
      slug: 'klimafester-stadtwald',
      shortDescription: 'Mischwald statt Monokultur: Der Stadtwald wird schrittweise in einen klimaresistenten Mischwald umgebaut.',
      colorScheme: 'Feldgrau',
      isPublic: true,
      joinRequestsEnabled: false,
      projektphase: 'einarbeitung',
      thema: ['umwelt'],
      stadtbereich: ['gesamtstadt'],
      startYear: 2025,
      modules: ['news', 'calendar', 'polls', 'forum', 'files', 'board'],
      teams: ['Kernteam', 'Forstamt', 'Umweltamt'],
    },
    {
      title: 'Neue Kita im Osten',
      slug: 'neue-kita-osten',
      shortDescription: 'Eine neue Kita mit vier Gruppen und Außengelände im Osten der Stadt – Bedarfsanalyse und Standortsuche laufen.',
      colorScheme: 'Kupfer',
      isPublic: true,
      joinRequestsEnabled: true,
      projektphase: 'konzeptentwicklung',
      thema: ['bildung'],
      stadtbereich: ['osten'],
      startYear: 2025,
      modules: ['news', 'calendar', 'polls', 'tasks', 'files'],
      teams: ['Kernteam', 'Jugendamt', 'Stadtplanung'],
    },
    {
      title: 'Beleuchtungskonzept Innenstadt',
      slug: 'beleuchtungskonzept-innenstadt',
      shortDescription: 'Energieeffiziente, angenehme und sichere Beleuchtung für die Innenstadt – mit WLAN-gesteuerter Technik.',
      colorScheme: 'Ozean',
      isPublic: true,
      joinRequestsEnabled: true,
      projektphase: 'projektausfuehrung',
      thema: ['infrastruktur'],
      stadtbereich: ['innenstadt'],
      startYear: 2024,
      modules: ['news', 'calendar', 'polls', 'forum', 'tasks'],
      teams: ['Kernteam', 'Stadtwerke'],
    },
    {
      title: 'Digitaler Stadtplan',
      slug: 'digitaler-stadtplan',
      shortDescription: 'Ein interaktiver Stadtplan mit allen Beteiligungsprojekten, Baustellen und städtischen Angeboten.',
      colorScheme: 'Sandstein',
      isPublic: true,
      joinRequestsEnabled: true,
      projektphase: 'konzeptentwicklung',
      thema: ['infrastruktur', 'stadtentwicklung'],
      stadtbereich: ['gesamtstadt'],
      startYear: 2025,
      modules: ['news', 'calendar', 'polls', 'forum', 'tasks', 'board', 'files'],
      teams: ['Kernteam', 'IT-Referat', 'Stadtvermessung'],
    },
  ]

  const projectIds: string[] = []
  for (const pd of projectData) {
    const p = await payload.create({ collection: 'projects', data: pd as any, overrideAccess: true })
    projectIds.push(p.id)
  }

  // ── 3. Memberships ────────────────────────────────────────────────────
  const memberships = [
    { user: adminId, project: projectIds[0], role: 'PM', status: 'active', teams: ['Kernteam', 'Lenkungsgruppe'] },
    { user: citizenId, project: projectIds[0], role: 'Citizen', status: 'active', teams: [] },
    { user: adminId, project: projectIds[1], role: 'PM', status: 'active', teams: ['Kernteam', 'Planungsbüro'] },
    { user: citizenId, project: projectIds[1], role: 'Citizen', status: 'active', teams: [] },
    { user: adminId, project: projectIds[2], role: 'PM', status: 'active', teams: ['Kernteam', 'Stadtplanung'] },
    { user: adminId, project: projectIds[3], role: 'PM', status: 'active', teams: ['Kernteam', 'IT-Referat'] },
    { user: citizenId, project: projectIds[3], role: 'Citizen', status: 'active', teams: [] },
    // ── New projects (4–11) ──
    { user: adminId, project: projectIds[4], role: 'PM', status: 'active', teams: ['Kernteam', 'Grünflächenamt'] },
    { user: citizenId, project: projectIds[4], role: 'Citizen', status: 'active', teams: [] },
    { user: adminId, project: projectIds[5], role: 'PM', status: 'active', teams: ['Kernteam', 'Wirtschaftsförderung'] },
    { user: adminId, project: projectIds[6], role: 'PM', status: 'active', teams: ['Kernteam', 'Tiefbauamt'] },
    { user: citizenId, project: projectIds[6], role: 'Citizen', status: 'active', teams: [] },
    { user: adminId, project: projectIds[7], role: 'PM', status: 'active', teams: ['Kernteam', 'Bäderbetriebe'] },
    { user: adminId, project: projectIds[8], role: 'PM', status: 'active', teams: ['Kernteam', 'Forstamt'] },
    { user: adminId, project: projectIds[9], role: 'PM', status: 'active', teams: ['Kernteam', 'Jugendamt'] },
    { user: adminId, project: projectIds[10], role: 'PM', status: 'active', teams: ['Kernteam', 'Stadtwerke'] },
    { user: adminId, project: projectIds[11], role: 'PM', status: 'active', teams: ['Kernteam', 'IT-Referat'] },
    { user: citizenId, project: projectIds[11], role: 'Citizen', status: 'active', teams: [] },
  ]
  for (const m of memberships) {
    await payload.create({ collection: 'project-memberships', data: m as any, overrideAccess: true })
  }

  // ── 4. News posts (last 7 days) ───────────────────────────────────────
  const newsPosts: { title: string; slug: string; projectIdx: number; daysAgo: number }[] = [
    { title: 'Auftaktworkshop erfolgreich', slug: 'auftaktworkshop-erfolgreich', projectIdx: 0, daysAgo: 1 },
    { title: 'Erste Ergebnisse der Online-Befragung', slug: 'erste-ergebnisse-online-befragung', projectIdx: 0, daysAgo: 3 },
    { title: 'Bürger:innen-Werkstatt am 15. Mai', slug: 'buergerinnen-werkstatt-15-mai', projectIdx: 0, daysAgo: 5 },
    { title: 'Planungsentwurf liegt aus', slug: 'planungsentwurf-liegt-aus', projectIdx: 1, daysAgo: 2 },
    { title: 'Rückmeldungen zur Gestaltung gesucht', slug: 'rueckmeldungen-gestaltung-gesucht', projectIdx: 1, daysAgo: 4 },
    { title: 'Auftaktveranstaltung am 10. Juni', slug: 'auftaktveranstaltung-10-juni', projectIdx: 2, daysAgo: 1 },
    { title: 'Erste Bestandsaufnahme abgeschlossen', slug: 'erste-bestandsaufnahme', projectIdx: 2, daysAgo: 6 },
    { title: 'Neue Online-Dienste freigeschaltet', slug: 'neue-online-dienste', projectIdx: 3, daysAgo: 0 },
    { title: 'Testphase gestartet', slug: 'testphase-gestartet', projectIdx: 3, daysAgo: 2 },
    // ── New projects (4–11) ──
    { title: 'Pflanzbeete in der Fußgängerzone', slug: 'pflanzbeete-fussgaengerzone', projectIdx: 4, daysAgo: 1 },
    { title: 'Baumscheiben-Patenschaften gesucht', slug: 'baumscheiben-patenschaften', projectIdx: 4, daysAgo: 4 },
    { title: 'Förderprogramm vorgestellt', slug: 'foerderprogramm-vorgestellt', projectIdx: 5, daysAgo: 2 },
    { title: 'Erste Interessensbekundungen eingegangen', slug: 'erste-interessensbekundungen', projectIdx: 5, daysAgo: 5 },
    { title: 'Baustart für Radweg Nordring', slug: 'baustart-radweg-nordring', projectIdx: 6, daysAgo: 0 },
    { title: 'Kreuzung entschärft: neue Radspur fertig', slug: 'kreuzung-entschaerft', projectIdx: 6, daysAgo: 3 },
    { title: 'Stadtbad schließt für Sanierung', slug: 'stadtbad-schliesst-fuer-sanierung', projectIdx: 7, daysAgo: 1 },
    { title: 'Historische Fassade wird gesichert', slug: 'historische-fassade-gesichert', projectIdx: 7, daysAgo: 6 },
    { title: 'Pflanzaktion im Stadtwald startet', slug: 'pflanzaktion-stadtwald', projectIdx: 8, daysAgo: 2 },
    { title: 'Totholz wird Lebensraum', slug: 'totholz-lebensraum', projectIdx: 8, daysAgo: 7 },
    { title: 'Standort für neue Kita gefunden', slug: 'standort-neue-kita', projectIdx: 9, daysAgo: 1 },
    { title: 'Bürger:innen-Info zur Kita', slug: 'buergerinnen-info-kita', projectIdx: 9, daysAgo: 4 },
    { title: 'Neue LED-Leuchten installiert', slug: 'neue-led-leuchten', projectIdx: 10, daysAgo: 0 },
    { title: 'Beleuchtungsprobe in der Marktstraße', slug: 'beleuchtungsprobe-marktstrasse', projectIdx: 10, daysAgo: 3 },
    { title: 'Beta-Version des Stadtplans online', slug: 'beta-stadtplan-online', projectIdx: 11, daysAgo: 0 },
    { title: 'Feedback-Runde zum Stadtplan', slug: 'feedback-runde-stadtplan', projectIdx: 11, daysAgo: 2 },
  ]
  const newsPostIds: { id: string; projectIdx: number }[] = []
  for (const np of newsPosts) {
    const d = new Date(NOW.getTime() - np.daysAgo * DAY)
    const post = await payload.create({ collection: 'news-posts', data: { title: np.title, slug: np.slug, project: projectIds[np.projectIdx], author: adminId, publishedAt: d.toISOString(), visibility: 'PUBLIC' }, overrideAccess: true })
    newsPostIds.push({ id: post.id, projectIdx: np.projectIdx })
  }

  // ── 5. News comments ──────────────────────────────────────────────────
  const comments = [
    { post: newsPostIds[0].id, body: 'Super Auftakt! Wann gibt es die nächste Gelegenheit?', author: citizenId, project: projectIds[0] },
    { post: newsPostIds[0].id, body: 'Die Präsentation wird in Kürze hochgeladen.', author: adminId, project: projectIds[0] },
    { post: newsPostIds[3].id, body: 'Der Entwurf gefällt mir gut – besonders die Begrünung.', author: citizenId, project: projectIds[1] },
    { post: newsPostIds[5].id, body: 'Wann und wo genau findet die Auftaktveranstaltung statt?', author: citizenId, project: projectIds[2] },
  ]
  for (const c of comments) {
    await payload.create({ collection: 'news-comments', data: c, overrideAccess: true })
  }

  // ── 6. Calendar events ────────────────────────────────────────────────
  const events = [
    { title: 'Workshop: Mobilitätskonzept', slug: 'workshop-mobilitaetskonzept', projectIdx: 0, startDate: new Date(NOW.getTime() + 3 * DAY), endDate: new Date(NOW.getTime() + 3 * DAY + 4 * 60 * 60 * 1000), location: 'Rathaus, Sitzungssaal 1', category: 'Workshop', visibility: 'PUBLIC' },
    { title: 'Online-Bürgersprechstunde', slug: 'online-buergersprechstunde', projectIdx: 0, startDate: new Date(NOW.getTime() + 7 * DAY), endDate: new Date(NOW.getTime() + 7 * DAY + 2 * 60 * 60 * 1000), location: 'Online (Zoom)', category: 'Sprechstunde', visibility: 'PUBLIC' },
    { title: 'Vorstellung Planungsentwurf', slug: 'vorstellung-planungsentwurf', projectIdx: 1, startDate: new Date(NOW.getTime() + 5 * DAY), endDate: new Date(NOW.getTime() + 5 * DAY + 3 * 60 * 60 * 1000), location: 'Stadtbibliothek, Forum', category: 'Veranstaltung', visibility: 'PUBLIC' },
    { title: 'Rundgang Rathausvorplatz', slug: 'rundgang-rathausvorplatz', projectIdx: 1, startDate: new Date(NOW.getTime() - 2 * DAY), endDate: new Date(NOW.getTime() - 2 * DAY + 2 * 60 * 60 * 1000), location: 'Rathausvorplatz', category: 'Rundgang', visibility: 'PUBLIC' },
    { title: 'Auftaktveranstaltung Stadtpark', slug: 'auftakt-stadtpark', projectIdx: 2, startDate: new Date(NOW.getTime() + 10 * DAY), endDate: new Date(NOW.getTime() + 10 * DAY + 3 * 60 * 60 * 1000), location: 'Bürgerhaus Stadtpark', category: 'Veranstaltung', visibility: 'PUBLIC' },
    { title: 'Digitale Sprechstunde', slug: 'digitale-sprechstunde', projectIdx: 3, startDate: new Date(NOW.getTime() + 2 * DAY), endDate: new Date(NOW.getTime() + 2 * DAY + 1 * 60 * 60 * 1000), location: 'Online (MS Teams)', category: 'Sprechstunde', visibility: 'PUBLIC' },
    { title: 'Vergangener Workshop', slug: 'vergangener-workshop', projectIdx: 0, startDate: new Date(NOW.getTime() - 5 * DAY), endDate: new Date(NOW.getTime() - 5 * DAY + 4 * 60 * 60 * 1000), location: 'Rathaus', category: 'Workshop', visibility: 'PUBLIC' },
    { title: 'Letzter Rundgang', slug: 'letzter-rundgang', projectIdx: 1, startDate: new Date(NOW.getTime() - 10 * DAY), endDate: new Date(NOW.getTime() - 10 * DAY + 2 * 60 * 60 * 1000), location: 'Rathausvorplatz', category: 'Rundgang', visibility: 'PUBLIC' },
    // New projects (4–11)
    { title: 'Pflanzaktion in der Fußgängerzone', slug: 'pflanzaktion-fussgaengerzone', projectIdx: 4, startDate: new Date(NOW.getTime() + 4 * DAY), endDate: new Date(NOW.getTime() + 4 * DAY + 3 * 60 * 60 * 1000), location: 'Fußgängerzone', category: 'Workshop', visibility: 'PUBLIC' },
    { title: 'Info-Abend Einzelhandelsförderung', slug: 'info-abend-einzelhandelsfoerderung', projectIdx: 5, startDate: new Date(NOW.getTime() + 9 * DAY), endDate: new Date(NOW.getTime() + 9 * DAY + 2 * 60 * 60 * 1000), location: 'Stadtbibliothek, Forum', category: 'Veranstaltung', visibility: 'PUBLIC' },
    { title: 'Radweg-Eröffnung Nordring', slug: 'radweg-eroeffnung-nordring', projectIdx: 6, startDate: new Date(NOW.getTime() + 12 * DAY), endDate: new Date(NOW.getTime() + 12 * DAY + 2 * 60 * 60 * 1000), location: 'Nordring/Ecke Bahnhofstraße', category: 'Veranstaltung', visibility: 'PUBLIC' },
    { title: 'Tag der offenen Tür im Stadtbad', slug: 'tag-der-offenen-tuer-stadtbad', projectIdx: 7, startDate: new Date(NOW.getTime() + 20 * DAY), endDate: new Date(NOW.getTime() + 20 * DAY + 4 * 60 * 60 * 1000), location: 'Stadtbad', category: 'Veranstaltung', visibility: 'PUBLIC' },
    { title: 'Waldführung: Klimawald entdecken', slug: 'waldfuehrung-klimawald', projectIdx: 8, startDate: new Date(NOW.getTime() + 6 * DAY), endDate: new Date(NOW.getTime() + 6 * DAY + 3 * 60 * 60 * 1000), location: 'Forsthaus Stadtwald', category: 'Rundgang', visibility: 'PUBLIC' },
    { title: 'Info-Nachmittag Kita-Standort', slug: 'info-nachmittag-kita-standort', projectIdx: 9, startDate: new Date(NOW.getTime() + 8 * DAY), endDate: new Date(NOW.getTime() + 8 * DAY + 2 * 60 * 60 * 1000), location: 'Bürgerhaus Ost', category: 'Veranstaltung', visibility: 'PUBLIC' },
    { title: 'Führung: Neue Beleuchtung', slug: 'fuehrung-neue-beleuchtung', projectIdx: 10, startDate: new Date(NOW.getTime() + 5 * DAY), endDate: new Date(NOW.getTime() + 5 * DAY + 2 * 60 * 60 * 1000), location: 'Marktstraße', category: 'Rundgang', visibility: 'PUBLIC' },
    { title: 'Stadtplan-Workshop', slug: 'stadtplan-workshop', projectIdx: 11, startDate: new Date(NOW.getTime() + 7 * DAY), endDate: new Date(NOW.getTime() + 7 * DAY + 3 * 60 * 60 * 1000), location: 'Rathaus, Sitzungssaal 2', category: 'Workshop', visibility: 'PUBLIC' },
  ]
  for (const e of events) {
    await payload.create({ collection: 'calendar-events', data: { ...e, visibility: e.visibility as 'PUBLIC', project: projectIds[e.projectIdx], author: adminId, allDay: false, content: undefined } as any, overrideAccess: true })
  }

  // ── 7. Polls (active) ─────────────────────────────────────────────────
  const pollData = [
    { title: 'Welche Maßnahmen priorisieren?', slug: 'massnahmen-priorisieren', projectIdx: 0, description: 'Welche der folgenden Maßnahmen sollte die Stadt zuerst angehen?', status: 'active', closesAt: new Date(NOW.getTime() + 14 * DAY), visibility: 'PUBLIC' },
    { title: 'Gestaltung Rathausvorplatz', slug: 'gestaltung-rathausvorplatz', projectIdx: 1, description: 'Welche Gestaltungselemente sind Ihnen besonders wichtig?', status: 'active', closesAt: new Date(NOW.getTime() + 21 * DAY), visibility: 'PUBLIC' },
    { title: 'Gewünschte Wohnungstypen', slug: 'gewuenschte-wohnungstypen', projectIdx: 2, description: 'Welche Wohnungstypen werden im neuen Quartier am dringendsten benötigt?', status: 'active', closesAt: new Date(NOW.getTime() + 30 * DAY), visibility: 'PUBLIC' },
    { title: 'Zufriedenheit mit Online-Diensten', slug: 'zufriedenheit-online-dienste', projectIdx: 3, description: 'Wie zufrieden sind Sie mit den neuen Online-Diensten?', status: 'active', closesAt: new Date(NOW.getTime() + 60 * DAY), visibility: 'PUBLIC' },
    // ── New projects (4–11) ──
    { title: 'Welche Standorte für neue Pflanzbeete?', slug: 'standorte-pflanzbeete', projectIdx: 4, description: 'Wo sollen zuerst neue Pflanzbeete und Baumscheiben entstehen?', status: 'active', closesAt: new Date(NOW.getTime() + 18 * DAY), visibility: 'PUBLIC' },
    { title: 'Welche Förderung ist am wichtigsten?', slug: 'foerderung-einzelhandel', projectIdx: 5, description: 'Welche Art der Förderung hilft dem lokalen Einzelhandel am meisten?', status: 'active', closesAt: new Date(NOW.getTime() + 25 * DAY), visibility: 'PUBLIC' },
    { title: 'Prioritäten beim Radwegebau', slug: 'prioritaeten-radwegebau', projectIdx: 6, description: 'Welche Radwegverbindung soll als nächste angegangen werden?', status: 'active', closesAt: new Date(NOW.getTime() + 12 * DAY), visibility: 'PUBLIC' },
    { title: 'Nutzungsschwerpunkte Stadtbad', slug: 'nutzungsschwerpunkte-stadtbad', projectIdx: 7, description: 'Was sollte im sanierten Stadtbad besonders wichtig sein?', status: 'active', closesAt: new Date(NOW.getTime() + 40 * DAY), visibility: 'PUBLIC' },
    { title: 'Baumarten für den Mischwald', slug: 'baumarten-mischwald', projectIdx: 8, description: 'Welche Baumarten sollen im Stadtwald bevorzugt gepflanzt werden?', status: 'active', closesAt: new Date(NOW.getTime() + 30 * DAY), visibility: 'PUBLIC' },
    { title: 'Öffnungszeiten der neuen Kita', slug: 'oeffnungszeiten-kita', projectIdx: 9, description: 'Welche Betreuungszeiten werden am dringendsten benötigt?', status: 'active', closesAt: new Date(NOW.getTime() + 20 * DAY), visibility: 'PUBLIC' },
    { title: 'Beleuchtungsdesign Innenstadt', slug: 'beleuchtungsdesign-innenstadt', projectIdx: 10, description: 'Wie soll die neue Innenstadtbeleuchtung wirken?', status: 'active', closesAt: new Date(NOW.getTime() + 15 * DAY), visibility: 'PUBLIC' },
    { title: 'Features für den Stadtplan', slug: 'features-stadtplan', projectIdx: 11, description: 'Welche Funktionen wünschen Sie sich im Digitalen Stadtplan?', status: 'active', closesAt: new Date(NOW.getTime() + 22 * DAY), visibility: 'PUBLIC' },
  ]
  for (const pd of pollData) {
    const poll = await payload.create({ collection: 'polls', data: { title: pd.title, slug: pd.slug, description: pd.description, project: projectIds[pd.projectIdx], author: adminId, status: 'active', closesAt: pd.closesAt?.toISOString(), visibility: 'PUBLIC', allowAnonymous: true, showLiveResults: true }, overrideAccess: true })

    // Poll questions + options
    if (pd.projectIdx === 0) {
      const q1 = await payload.create({ collection: 'poll-questions', data: { poll: poll.id, text: 'Welche Maßnahme sollte zuerst umgesetzt werden?', type: 'single', order: 0 }, overrideAccess: true })
      await payload.create({ collection: 'poll-options', data: { question: q1.id, text: 'Radwegeausbau Innenstadt', order: 0 }, overrideAccess: true })
      await payload.create({ collection: 'poll-options', data: { question: q1.id, text: 'Tempo-30-Zone erweitern', order: 1 }, overrideAccess: true })
      await payload.create({ collection: 'poll-options', data: { question: q1.id, text: 'ÖPNV-Takt verdichten', order: 2 }, overrideAccess: true })
      await payload.create({ collection: 'poll-options', data: { question: q1.id, text: 'Carsharing-Angebote ausbauen', order: 3 }, overrideAccess: true })
      const q2 = await payload.create({ collection: 'poll-questions', data: { poll: poll.id, text: 'Wie bewerten Sie die aktuelle Verkehrssituation?', type: 'scale', order: 1 }, overrideAccess: true })
      await payload.create({ collection: 'poll-options', data: { question: q2.id, text: '1 (Sehr schlecht)', order: 0 }, overrideAccess: true })
      await payload.create({ collection: 'poll-options', data: { question: q2.id, text: '2', order: 1 }, overrideAccess: true })
      await payload.create({ collection: 'poll-options', data: { question: q2.id, text: '3', order: 2 }, overrideAccess: true })
      await payload.create({ collection: 'poll-options', data: { question: q2.id, text: '4', order: 3 }, overrideAccess: true })
      await payload.create({ collection: 'poll-options', data: { question: q2.id, text: '5 (Sehr gut)', order: 4 }, overrideAccess: true })
    } else if (pd.projectIdx === 1) {
      const q = await payload.create({ collection: 'poll-questions', data: { poll: poll.id, text: 'Welche Elemente sind Ihnen wichtig?', type: 'multiple', order: 0 }, overrideAccess: true })
      await payload.create({ collection: 'poll-options', data: { question: q.id, text: 'Mehr Sitzgelegenheiten', order: 0 }, overrideAccess: true })
      await payload.create({ collection: 'poll-options', data: { question: q.id, text: 'Trinkwasserbrunnen', order: 1 }, overrideAccess: true })
      await payload.create({ collection: 'poll-options', data: { question: q.id, text: 'Schatten spendende Bäume', order: 2 }, overrideAccess: true })
      await payload.create({ collection: 'poll-options', data: { question: q.id, text: 'Spielmöglichkeiten für Kinder', order: 3 }, overrideAccess: true })
      await payload.create({ collection: 'poll-options', data: { question: q.id, text: 'Öffentliches WLAN', order: 4 }, overrideAccess: true })
    } else if (pd.projectIdx === 2) {
      const q = await payload.create({ collection: 'poll-questions', data: { poll: poll.id, text: 'Welche Wohnungstypen werden benötigt?', type: 'multiple', order: 0 }, overrideAccess: true })
      await payload.create({ collection: 'poll-options', data: { question: q.id, text: '1-Zimmer-Wohnungen', order: 0 }, overrideAccess: true })
      await payload.create({ collection: 'poll-options', data: { question: q.id, text: '2-Zimmer-Wohnungen', order: 1 }, overrideAccess: true })
      await payload.create({ collection: 'poll-options', data: { question: q.id, text: '3-Zimmer-Wohnungen (Familien)', order: 2 }, overrideAccess: true })
      await payload.create({ collection: 'poll-options', data: { question: q.id, text: 'Barrierefreie Wohnungen', order: 3 }, overrideAccess: true })
      await payload.create({ collection: 'poll-options', data: { question: q.id, text: 'Maisonette-Wohnungen', order: 4 }, overrideAccess: true })
    } else {
      // Generic single question for projects 3–11 (with project-specific option text)
      const q = await payload.create({ collection: 'poll-questions', data: { poll: poll.id, text: getPollQuestionText(pd.projectIdx), type: 'multiple', order: 0 }, overrideAccess: true })
      for (const [i, opt] of getPollOptions(pd.projectIdx).entries()) {
        await payload.create({ collection: 'poll-options', data: { question: q.id, text: opt, order: i }, overrideAccess: true })
      }
    }
  }

  // ── 8. Forum threads ──────────────────────────────────────────────────
  const forumThreads = [
    { title: 'Ideen für die Innenstadt-Mobilität', slug: 'ideen-innenstadt-mobilitaet', projectIdx: 0, content: 'Welche Ideen habt ihr für die Mobilität der Zukunft in unserer Innenstadt? Hier sammeln wir Vorschläge.' },
    { title: 'Fahrradstraßen – ja oder nein?', slug: 'fahrradstrassen', projectIdx: 0, content: 'Sollten mehr Straßen in der Innenstadt zu Fahrradstraßen werden? Diskutiert mit!' },
    { title: 'Vorschläge für die Sitzgelegenheiten', slug: 'vorschlaege-sitzgelegenheiten', projectIdx: 1, content: 'Welche Art von Sitzgelegenheiten wünscht ihr euch auf dem Rathausvorplatz?' },
    { title: 'Barrierefreiheit am Rathausvorplatz', slug: 'barrierefreiheit-rathausvorplatz', projectIdx: 1, content: 'Der Zugang zum Rathaus muss barrierefrei sein. Was ist zu beachten?' },
    { title: 'Welche Infrastruktur fehlt?', slug: 'infrastruktur-neues-quartier', projectIdx: 2, content: 'Was sollte im neuen Quartier am Stadtpark unbedingt vorhanden sein?' },
    { title: 'Hilfe bei der Bedienung', slug: 'hilfe-bedienung', projectIdx: 3, content: 'Ich komme mit dem neuen Online-Formular nicht zurecht. Gibt es eine Anleitung?' },
    // New projects with forum module (4, 6, 7, 8, 10, 11)
    { title: 'Welche Bäume in die Innenstadt?', slug: 'welche-baeume-innenstadt', projectIdx: 4, content: 'Welche Baumarten passen am besten in die Fußgängerzone? Sammelt Ideen!' },
    { title: 'Leerstand: Eure Ideen', slug: 'leerstand-ideen', projectIdx: 5, content: 'Was kann gegen Leerstände in der Innenstadt getan werden? Diskutiert mit!' },
    { title: 'Kreuzungssituation Nordring', slug: 'kreuzung-nordring', projectIdx: 6, content: 'Wie fühlt sich die neue Kreuzung für Radfahrer:innen an? Feedback willkommen!' },
    { title: 'Erinnerungen ans Stadtbad', slug: 'erinnerungen-stadtbad', projectIdx: 7, content: 'Erzählt von euren schönsten Erinnerungen ans Stadtbad – wir sammeln sie für die Chronik!' },
    { title: 'Ideen für die Walderholung', slug: 'ideen-walderholung', projectIdx: 8, content: 'Wie kann der Stadtwald noch besser für Erholungssuchende nutzbar werden?' },
    { title: 'Lichtverschmutzung reduzieren', slug: 'lichtverschmutzung', projectIdx: 10, content: 'Wie schaffen wir angenehmes Licht ohne unnötige Lichtverschmutzung?' },
    { title: 'Daten, die fehlen', slug: 'fehlende-daten-stadtplan', projectIdx: 11, content: 'Welche Daten und Informationen fehlen euch im Digitalen Stadtplan noch?' },
  ]
  const threadIds: { id: string; projectIdx: number }[] = []
  for (const ft of forumThreads) {
    const t = await payload.create({ collection: 'forum-threads', data: { title: ft.title, slug: ft.slug, content: { root: { type: 'root', format: '', indent: 0, version: 1, children: [{ type: 'paragraph', format: '', indent: 0, version: 1, text: ft.content, children: [{ type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text: ft.content }], direction: 'ltr' }], direction: 'ltr' } }, project: projectIds[ft.projectIdx], author: ft.projectIdx === 0 ? citizenId : adminId, visibility: 'PUBLIC' }, overrideAccess: true })
    threadIds.push({ id: t.id, projectIdx: ft.projectIdx })
  }

  // ── 9. Forum comments ─────────────────────────────────────────────────
  const forumComments = [
    { thread: threadIds[0].id, projectIdx: 0, content: 'Ich fände eine Seilbahn vom Bahnhof zur Innenstadt toll!', author: citizenId },
    { thread: threadIds[0].id, projectIdx: 0, content: 'Gute Idee! Vielleicht sollten wir auch über die Reaktivierung der Straßenbahn nachdenken.', author: adminId },
    { thread: threadIds[1].id, projectIdx: 0, content: 'Auf jeden Fall! Fahrradstraßen machen die Stadt viel lebenswerter.', author: citizenId },
    { thread: threadIds[2].id, projectIdx: 1, content: 'Ich wünsche mir Bänke mit Rückenlehne, keine kalten Steinbänke.', author: citizenId },
    { thread: threadIds[3].id, projectIdx: 1, content: 'Wichtig sind auch taktile Leitsysteme für Sehbehinderte.', author: citizenId },
    { thread: threadIds[4].id, projectIdx: 2, content: 'Ein Supermarkt und eine Apotheke wären wichtig.', author: citizenId },
    { thread: threadIds[5].id, projectIdx: 3, content: 'Ja, es gibt eine Video-Anleitung auf der Startseite.', author: adminId },
    // New thread comments (indices 6–12 → new projects 4–11)
    { thread: threadIds[6].id, projectIdx: 4, content: 'Lindenbäume wären klassisch für die Fußgängerzone!', author: citizenId },
    { thread: threadIds[7].id, projectIdx: 5, content: 'Der Einzelhandel braucht vor allem günstigere Mieten.', author: citizenId },
    { thread: threadIds[8].id, projectIdx: 6, content: 'Die neue Radspur ist super – aber die Ampelphase ist zu kurz.', author: citizenId },
    { thread: threadIds[9].id, projectIdx: 7, content: 'Ich habe dort schwimmen gelernt. Freue mich auf die Wiedereröffnung!', author: citizenId },
    { thread: threadIds[10].id, projectIdx: 8, content: 'Mehr Ruhebänke entlang der Waldwege wären schön.', author: citizenId },
    { thread: threadIds[11].id, projectIdx: 10, content: 'Bitte keine grellen Lichter – die Tiere leiden darunter.', author: citizenId },
    { thread: threadIds[12].id, projectIdx: 11, content: 'Eine App-Version des Stadtplans wäre praktisch.', author: citizenId },
  ]
  for (const fc of forumComments) {
    await payload.create({ collection: 'forum-comments', data: { thread: fc.thread, content: { root: { type: 'root', format: '', indent: 0, version: 1, children: [{ type: 'paragraph', format: '', indent: 0, version: 1, text: fc.content, children: [{ type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text: fc.content }], direction: 'ltr' }], direction: 'ltr' } }, author: fc.author, project: projectIds[fc.projectIdx] } as any, overrideAccess: true })
  }

  // ── 10. Tasks ─────────────────────────────────────────────────────────
  const tasks = [
    { title: 'Leitbild für Mobilitätskonzept erarbeiten', projectIdx: 0, status: 'in_progress', priority: 'high', deadline: new Date(NOW.getTime() + 14 * DAY) },
    { title: 'Bürger:innen-Werkstatt vorbereiten', projectIdx: 0, status: 'done', priority: 'high', deadline: new Date(NOW.getTime() - 2 * DAY) },
    { title: 'Ergebnisse der Online-Befragung auswerten', projectIdx: 0, status: 'todo', priority: 'medium', deadline: new Date(NOW.getTime() + 7 * DAY) },
    { title: 'Präsentation für den Ausschuss erstellen', projectIdx: 1, status: 'in_progress', priority: 'high', deadline: new Date(NOW.getTime() + 5 * DAY) },
    { title: 'Kostenplan aktualisieren', projectIdx: 1, status: 'todo', priority: 'medium', deadline: new Date(NOW.getTime() + 10 * DAY) },
    { title: 'Bestandsaufnahme durchführen', projectIdx: 2, status: 'done', priority: 'high', deadline: new Date(NOW.getTime() - 3 * DAY) },
    { title: 'Anwohner:innen-Information erstellen', projectIdx: 2, status: 'todo', priority: 'medium', deadline: new Date(NOW.getTime() + 21 * DAY) },
    { title: 'Testphase auswerten', projectIdx: 3, status: 'in_progress', priority: 'high', deadline: new Date(NOW.getTime() + 7 * DAY) },
    { title: 'Fehlerbehebung aus dem Feedback', projectIdx: 3, status: 'todo', priority: 'medium', deadline: new Date(NOW.getTime() + 14 * DAY) },
    { title: 'Schulungsunterlagen erstellen', projectIdx: 3, status: 'done', priority: 'low', deadline: new Date(NOW.getTime() - 1 * DAY) },
    // New projects (4–11)
    { title: 'Pflanzbeete-Planung abstimmen', projectIdx: 4, status: 'in_progress', priority: 'high', deadline: new Date(NOW.getTime() + 10 * DAY) },
    { title: 'Patenschaften-Programm starten', projectIdx: 4, status: 'todo', priority: 'medium', deadline: new Date(NOW.getTime() + 20 * DAY) },
    { title: 'Förderanträge sichten', projectIdx: 5, status: 'in_progress', priority: 'high', deadline: new Date(NOW.getTime() + 14 * DAY) },
    { title: 'Informationsmaterial erstellen', projectIdx: 5, status: 'todo', priority: 'medium', deadline: new Date(NOW.getTime() + 7 * DAY) },
    { title: 'Radweg-Baustelle koordinieren', projectIdx: 6, status: 'in_progress', priority: 'high', deadline: new Date(NOW.getTime() + 30 * DAY) },
    { title: 'Ampelschaltung anpassen', projectIdx: 6, status: 'todo', priority: 'high', deadline: new Date(NOW.getTime() + 10 * DAY) },
    { title: 'Sanierungsplan mit Denkmalschutz abstimmen', projectIdx: 7, status: 'in_progress', priority: 'high', deadline: new Date(NOW.getTime() + 60 * DAY) },
    { title: 'Fördermittel beantragen', projectIdx: 7, status: 'todo', priority: 'high', deadline: new Date(NOW.getTime() + 30 * DAY) },
    { title: 'Pflanzplan für Mischwald erstellen', projectIdx: 8, status: 'in_progress', priority: 'medium', deadline: new Date(NOW.getTime() + 21 * DAY) },
    { title: 'Bürger:innen-Pflanzaktion organisieren', projectIdx: 8, status: 'todo', priority: 'medium', deadline: new Date(NOW.getTime() + 14 * DAY) },
    { title: 'Grundstück für Kita prüfen', projectIdx: 9, status: 'in_progress', priority: 'high', deadline: new Date(NOW.getTime() + 14 * DAY) },
    { title: 'Bedarfsanalyse finalisieren', projectIdx: 9, status: 'done', priority: 'high', deadline: new Date(NOW.getTime() - 3 * DAY) },
    { title: 'LED-Umrüstung Etappe 2 planen', projectIdx: 10, status: 'in_progress', priority: 'high', deadline: new Date(NOW.getTime() + 28 * DAY) },
    { title: 'Dimmer-Zeiten einstellen', projectIdx: 10, status: 'todo', priority: 'medium', deadline: new Date(NOW.getTime() + 7 * DAY) },
    { title: 'Stadtplan-Datenquellen integrieren', projectIdx: 11, status: 'todo', priority: 'high', deadline: new Date(NOW.getTime() + 21 * DAY) },
    { title: 'Beta-Tester:innen einladen', projectIdx: 11, status: 'in_progress', priority: 'medium', deadline: new Date(NOW.getTime() + 5 * DAY) },
  ]
  for (const t of tasks) {
    await payload.create({ collection: 'tasks', data: { title: t.title, project: projectIds[t.projectIdx], author: adminId, status: t.status, priority: t.priority, deadline: t.deadline?.toISOString(), visibility: 'PROJECT' } as any, overrideAccess: true })
  }

  console.log('✅ Seed complete! Use --force to re-seed.')
  console.log('   Users:        admin@urbankit.de / demo1234 + buegerin@urbankit.de / demo1234')
  console.log(`   Projects:     ${projectData.length} created`)
  console.log(`   News posts:   ${newsPosts.length} + ${comments.length} comments`)
  console.log(`   Events:       ${events.length}`)
  console.log(`   Polls:        ${pollData.length} with questions & options`)
  console.log(`   Forum:        ${forumThreads.length} threads + ${forumComments.length} comments`)
  console.log(`   Tasks:        ${tasks.length}`)
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
