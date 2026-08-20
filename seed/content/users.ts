// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

/**
 * Roster for the prototype: 22 Personen, 8–15 pro Projekt, einige in mehreren.
 * E-Mail-Lokalteile bewusst ohne Umlaute (buerger-in statt bürger-in) —
 * Umlaut-Lokalteile scheitern an vielen Mail-Validierungen.
 * Avatar-Dateien: seed/assets/avatare/<vorname-nachname>.jpg (noch zu liefern).
 */

import type { SeedUserWithMemberships } from './types'

const avatar = (name: string) => `${name}.jpg`

export const SEED_USERS: SeedUserWithMemberships[] = [
  // ── Projektleitungen ──────────────────────────────────────────────────────
  {
    email: 'projektleitung-1@urbankit.de', firstName: 'Sabine', lastName: 'Krüger',
    gender: 'female', birthYear: 1978, stadtbereich: 'innenstadt', affiliations: ['cityEmployee'],
    bio: 'Leitet die Smart-City-Kommunikation der Stadt. Überzeugt davon, dass Informationen zu den Menschen kommen müssen – nicht umgekehrt.',
    cityInfo: { organization: 'Stadtverwaltung', fachbereich: 'Digitalisierung & Kommunikation', position: 'Projektleitung Push statt Pull' },
    avatar: avatar('sabine-krueger'),
    memberships: [
      { project: 'push-statt-pull', role: 'PM' },
      { project: 'stadtkontakt-mobil', role: 'Citizen' },
    ],
  },
  {
    email: 'projektleitung-2@urbankit.de', firstName: 'Jonas', lastName: 'Weber',
    gender: 'male', birthYear: 1985, stadtbereich: 'westen', affiliations: ['cityEmployee'],
    bio: 'Datenmensch im Amt für Stadtentwicklung. Baut mit dem Sensorik-Team das städtische Klimadatennetz auf.',
    cityInfo: { organization: 'Stadtverwaltung', fachbereich: 'Stadtentwicklung', position: 'Projektleitung Stadtdaten' },
    avatar: avatar('jonas-weber'),
    memberships: [
      { project: 'stadtdaten', role: 'PM' },
      { project: 'mobilitaet-x-multi', role: 'Citizen' },
    ],
  },
  {
    email: 'projektleitung-3@urbankit.de', firstName: 'Fatma', lastName: 'Yılmaz',
    gender: 'female', birthYear: 1982, stadtbereich: 'norden', affiliations: ['cityEmployee'],
    bio: 'Bringt das Rathaus dorthin, wo die Menschen sind: auf Wochenmärkte, Dorfplätze und Schulfeste.',
    cityInfo: { organization: 'Stadtverwaltung', fachbereich: 'Bürgerservice', position: 'Projektleitung Stadtkontakt Mobil' },
    avatar: avatar('fatma-yilmaz'),
    memberships: [{ project: 'stadtkontakt-mobil', role: 'PM' }],
  },
  {
    email: 'projektleitung-4@urbankit.de', firstName: 'Miriam', lastName: 'Brandt',
    gender: 'female', birthYear: 1988, stadtbereich: 'osten', affiliations: ['cityEmployee'],
    bio: 'Verkehrsplanerin mit Faible für Lastenräder. Koordiniert Mobilität x Multi und den jährlichen Parking Day.',
    cityInfo: { organization: 'Stadtverwaltung', fachbereich: 'Mobilität', position: 'Projektleitung Mobilität x Multi' },
    avatar: avatar('miriam-brandt'),
    memberships: [
      { project: 'mobilitaet-x-multi', role: 'PM' },
      { project: 'nudging', role: 'Citizen', teams: ['Kernteam'] },
    ],
  },
  {
    email: 'projektleitung-5@urbankit.de', firstName: 'Tobias', lastName: 'Lindner',
    gender: 'male', birthYear: 1990, stadtbereich: 'sueden', affiliations: ['cityEmployee'],
    bio: 'Verhaltensökonomie trifft Straßenraum: kleine Anstöße, große Wirkung. Radelt bei jedem Wetter.',
    cityInfo: { organization: 'Stadtverwaltung', fachbereich: 'Mobilität', position: 'Projektleitung Nudging' },
    avatar: avatar('tobias-lindner'),
    memberships: [
      { project: 'nudging', role: 'PM' },
      { project: 'mobilitaet-x-multi', role: 'Citizen', teams: ['Aktionsteam'] },
    ],
  },
  {
    email: 'projektleitung-6@urbankit.de', firstName: 'Clara', lastName: 'Hoffmann',
    gender: 'female', birthYear: 1986, stadtbereich: 'innenstadt', affiliations: ['cityEmployee', 'other'],
    bio: 'Kulturwissenschaftlerin und Streaming-Enthusiastin. Verbindet Bühnen, Museen und digitale Formate.',
    cityInfo: { organization: 'Stadtverwaltung', fachbereich: 'Kultur', position: 'Projektleitung Kultur trifft Digital' },
    avatar: avatar('clara-hoffmann'),
    memberships: [
      { project: 'kultur-trifft-digital', role: 'PM' },
      { project: 'mitmach-werkstatt', role: 'Citizen' },
    ],
  },
  {
    email: 'projektleitung-7@urbankit.de', firstName: 'David', lastName: 'Neumann',
    gender: 'male', birthYear: 1983, stadtbereich: 'westen', affiliations: ['cityEmployee'],
    bio: 'Tüftler mit Verwaltungshintergrund. Glaubt an offene Werkstätten als dritte Orte der Stadt.',
    cityInfo: { organization: 'Stadtverwaltung', fachbereich: 'Wirtschaft & Bildung', position: 'Projektleitung Mitmach-Werkstatt' },
    avatar: avatar('david-neumann'),
    memberships: [{ project: 'mitmach-werkstatt', role: 'PM' }],
  },

  // ── Teamleitungen ─────────────────────────────────────────────────────────
  {
    email: 'teamleitung-1@urbankit.de', firstName: 'Anna', lastName: 'Schröder',
    gender: 'female', birthYear: 1992, stadtbereich: 'innenstadt', affiliations: ['citizen'],
    bio: 'Redakteurin aus Leidenschaft. Schreibt im Push-statt-Pull-Kernteam die Meldungen, die wirklich ankommen.',
    avatar: avatar('anna-schroeder'),
    memberships: [
      { project: 'push-statt-pull', role: 'Citizen', teams: ['Redaktion'], leadOf: ['Redaktion'] },
      { project: 'stadtdaten', role: 'Citizen' },
    ],
  },
  {
    email: 'teamleitung-2@urbankit.de', firstName: 'Murat', lastName: 'Demir',
    gender: 'male', birthYear: 1987, stadtbereich: 'norden', affiliations: ['citizen', 'other'],
    bio: 'Elektrotechniker und LoRaWAN-Bastler. Leitet das Sensorik-Team und hängt Messboxen in halbe Stadt.',
    avatar: avatar('murat-demir'),
    memberships: [
      { project: 'stadtdaten', role: 'Citizen', teams: ['Sensorik-Team'], leadOf: ['Sensorik-Team'] },
      { project: 'mitmach-werkstatt', role: 'Citizen', teams: ['Werkstatt-Team'] },
    ],
  },
  {
    email: 'teamleitung-3@urbankit.de', firstName: 'Lea', lastName: 'Winkler',
    gender: 'female', birthYear: 1995, stadtbereich: 'sueden', affiliations: ['citizen', 'student'],
    bio: 'Produktdesign-Studentin, gibt 3D-Druck-Kurse in der Mitmach-Werkstatt und liebt Reparatur-Cafés.',
    avatar: avatar('lea-winkler'),
    memberships: [
      { project: 'mitmach-werkstatt', role: 'Citizen', teams: ['Werkstatt-Team'], leadOf: ['Werkstatt-Team'] },
      { project: 'kultur-trifft-digital', role: 'Citizen', teams: ['Technik-Team'] },
    ],
  },
  {
    email: 'teamleitung-4@urbankit.de', firstName: 'Ole', lastName: 'Petersen',
    gender: 'male', birthYear: 1979, stadtbereich: 'osten', affiliations: ['citizen'],
    bio: 'Organisiert seit Jahren den Parking Day mit. Leitet das Aktionsteam von Mobilität x Multi.',
    avatar: avatar('ole-petersen'),
    memberships: [
      { project: 'mobilitaet-x-multi', role: 'Citizen', teams: ['Aktionsteam'], leadOf: ['Aktionsteam'] },
      { project: 'nudging', role: 'Citizen', teams: ['Kernteam'] },
    ],
  },

  // ── Bürger:innen ──────────────────────────────────────────────────────────
  {
    email: 'buerger-in-1@urbankit.de', firstName: 'Heinz', lastName: 'Albrecht',
    gender: 'male', birthYear: 1951, stadtbereich: 'norden', affiliations: ['citizen'],
    bio: 'Rentner, früher Busfahrer. Kommt zu jedem Termin des mobilen Rathauses und sagt, was Sache ist.',
    avatar: avatar('heinz-albrecht'),
    memberships: [
      { project: 'stadtkontakt-mobil', role: 'Citizen' },
      { project: 'push-statt-pull', role: 'Citizen' },
    ],
  },
  {
    email: 'buerger-in-2@urbankit.de', firstName: 'Gisela', lastName: 'Mohr',
    gender: 'female', birthYear: 1958, stadtbereich: 'westen', affiliations: ['citizen'],
    bio: 'Hobbygärtnerin mit Wetterstation auf dem Balkon. Teilt ihre Messwerte mit dem Stadtdaten-Projekt.',
    avatar: avatar('gisela-mohr'),
    memberships: [
      { project: 'stadtdaten', role: 'Citizen' },
      { project: 'stadtkontakt-mobil', role: 'Citizen' },
    ],
  },
  {
    email: 'buerger-in-3@urbankit.de', firstName: 'Pawel', lastName: 'Kowalski',
    gender: 'male', birthYear: 1989, stadtbereich: 'innenstadt', affiliations: ['citizen'],
    bio: 'Pendelt täglich mit Rad und Bahn. Testet jede neue Mobilstation und schreibt ehrliche Rückmeldungen.',
    avatar: avatar('pawel-kowalski'),
    memberships: [
      { project: 'mobilitaet-x-multi', role: 'Citizen' },
      { project: 'nudging', role: 'Citizen' },
    ],
  },
  {
    email: 'buerger-in-4@urbankit.de', firstName: 'Sofia', lastName: 'Ricci',
    gender: 'female', birthYear: 1993, stadtbereich: 'innenstadt', affiliations: ['citizen', 'other'],
    bio: 'Freie Illustratorin. Interessiert sich für alles, was Kultur und digitale Räume zusammenbringt.',
    avatar: avatar('sofia-ricci'),
    memberships: [
      { project: 'kultur-trifft-digital', role: 'Citizen' },
      { project: 'mitmach-werkstatt', role: 'Citizen' },
    ],
  },
  {
    email: 'buerger-in-5@urbankit.de', firstName: 'Maren', lastName: 'Buschmann',
    gender: 'female', birthYear: 1975, stadtbereich: 'sueden', affiliations: ['citizen'],
    bio: 'Elternvertreterin an der Grundschule Süd. Möchte sichere Schulwege und weniger Elterntaxis.',
    avatar: avatar('maren-buschmann'),
    memberships: [
      { project: 'nudging', role: 'Citizen' },
      { project: 'mobilitaet-x-multi', role: 'Citizen' },
      { project: 'push-statt-pull', role: 'Citizen' },
    ],
  },
  {
    email: 'buerger-in-6@urbankit.de', firstName: 'Erik', lastName: 'Johansson',
    gender: 'male', birthYear: 1997, stadtbereich: 'osten', affiliations: ['citizen', 'student'],
    bio: 'Informatikstudent, Open-Data-Fan. Baut Dashboards aus den städtischen Sensordaten.',
    avatar: avatar('erik-johansson'),
    memberships: [
      { project: 'stadtdaten', role: 'Citizen', teams: ['Datenwerkstatt'] },
      { project: 'push-statt-pull', role: 'Citizen' },
    ],
  },
  {
    email: 'buerger-in-7@urbankit.de', firstName: 'Tanja', lastName: 'Vogt',
    gender: 'female', birthYear: 1984, stadtbereich: 'norden', affiliations: ['citizen'],
    bio: 'Pflegt den Gemeinschaftsgarten im Norden. Nutzt die Werkstatt für alles, was der Garten braucht.',
    avatar: avatar('tanja-vogt'),
    memberships: [
      { project: 'mitmach-werkstatt', role: 'Citizen' },
      { project: 'stadtkontakt-mobil', role: 'Citizen' },
    ],
  },
  {
    email: 'buerger-in-8@urbankit.de', firstName: 'Kemal', lastName: 'Aydin',
    gender: 'male', birthYear: 1969, stadtbereich: 'westen', affiliations: ['citizen', 'other'],
    bio: 'Betreibt ein Café am Marktplatz und stellt für Kulturaktionen gern seine Fensterfront zur Verfügung.',
    avatar: avatar('kemal-aydin'),
    memberships: [
      { project: 'kultur-trifft-digital', role: 'Citizen' },
      { project: 'mobilitaet-x-multi', role: 'Citizen' },
    ],
  },

  // ── Besondere Perspektiven ────────────────────────────────────────────────
  {
    email: 'betroffene-person@urbankit.de', firstName: 'Renate', lastName: 'Sommerfeld',
    gender: 'female', birthYear: 1948, stadtbereich: 'sueden', affiliations: ['citizen'],
    bio: 'Wohnt direkt an der umgestalteten Kreuzung und ist auf den Rollator angewiesen. Meldet sich, wenn Planung und Alltag auseinanderlaufen.',
    avatar: avatar('renate-sommerfeld'),
    memberships: [
      { project: 'nudging', role: 'Citizen' },
      { project: 'stadtkontakt-mobil', role: 'Citizen' },
      { project: 'mobilitaet-x-multi', role: 'Citizen' },
    ],
  },
  {
    email: 'verwaltung-1@urbankit.de', firstName: 'Petra', lastName: 'Kaminski',
    gender: 'female', birthYear: 1971, stadtbereich: 'innenstadt', affiliations: ['cityEmployee'],
    bio: 'Sachgebietsleiterin Stadtentwicklung. Sorgt dafür, dass Beteiligungsergebnisse in echte Beschlüsse münden.',
    cityInfo: { organization: 'Stadtverwaltung', fachbereich: 'Stadtentwicklung', position: 'Sachgebietsleitung' },
    avatar: avatar('petra-kaminski'),
    memberships: [
      { project: 'push-statt-pull', role: 'Citizen', teams: ['Kernteam'] },
      { project: 'stadtdaten', role: 'Citizen' },
      { project: 'stadtkontakt-mobil', role: 'Citizen' },
    ],
  },
  {
    email: 'verwaltung-2@urbankit.de', firstName: 'Stefan', lastName: 'Ruhl',
    gender: 'male', birthYear: 1980, stadtbereich: 'osten', affiliations: ['cityEmployee'],
    bio: 'Tiefbauamt. Wenn Markierungen, Poller oder Sensormasten gebraucht werden, ist er der Mann dafür.',
    cityInfo: { organization: 'Stadtverwaltung', fachbereich: 'Tiefbau', position: 'Technische Koordination' },
    avatar: avatar('stefan-ruhl'),
    memberships: [
      { project: 'nudging', role: 'Citizen', teams: ['Kernteam'] },
      { project: 'mobilitaet-x-multi', role: 'Citizen', teams: ['Planungsteam'] },
      { project: 'stadtdaten', role: 'Citizen', teams: ['Sensorik-Team'] },
    ],
  },
  {
    email: 'studierende-1@urbankit.de', firstName: 'Zoe', lastName: 'Albers',
    gender: 'female', birthYear: 2001, stadtbereich: 'innenstadt', affiliations: ['student'],
    bio: 'Studiert Stadtplanung an der TH OWL. Schreibt ihre Bachelorarbeit über mobile Beteiligungsformate.',
    avatar: avatar('zoe-albers'),
    memberships: [
      { project: 'stadtkontakt-mobil', role: 'Citizen', teams: ['Tourenteam'] },
      { project: 'push-statt-pull', role: 'Citizen' },
      { project: 'kultur-trifft-digital', role: 'Citizen' },
    ],
  },
  {
    email: 'studierende-2@urbankit.de', firstName: 'Leon', lastName: 'Brinkmann',
    gender: 'male', birthYear: 1999, stadtbereich: 'sueden', affiliations: ['student'],
    bio: 'Medienproduktion-Student. Filmt Kulturformate und schneidet die Aftermovies der Werkstatt-Events.',
    avatar: avatar('leon-brinkmann'),
    memberships: [
      { project: 'kultur-trifft-digital', role: 'Citizen', teams: ['Technik-Team'] },
      { project: 'mitmach-werkstatt', role: 'Citizen' },
      { project: 'mobilitaet-x-multi', role: 'Citizen' },
    ],
  },
  {
    email: 'wissenschaft-1@urbankit.de', firstName: 'Hannah', lastName: 'Fromm',
    gender: 'female', birthYear: 1976, stadtbereich: 'westen', affiliations: ['academia'],
    bio: 'Forscht an der TH OWL zu urbaner Klimaanpassung und begleitet das Stadtdaten-Projekt wissenschaftlich.',
    avatar: avatar('hannah-fromm'),
    memberships: [
      { project: 'stadtdaten', role: 'Citizen', teams: ['Datenwerkstatt'], leadOf: ['Datenwerkstatt'] },
      { project: 'nudging', role: 'Citizen' },
    ],
  },
]
