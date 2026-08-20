// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

/**
 * Typed authoring schema for the seedable prototype projects. These files are
 * CONTENT ONLY — the seed script maps them onto Payload collections (uploads
 * the images from seed/assets/<slug>/, converts markdown bodies via
 * markdownToLexical, builds the board Yjs state, …).
 */

export type SeedVisibility = 'PUBLIC' | 'PROJECT' | 'TEAM'
export type SeedImage = 'cover' | 'galerie-1' | 'galerie-2' | 'galerie-3'

export interface SeedNews {
  title: string
  /** Markdown. */
  body: string
  visibility?: SeedVisibility
  teams?: string[]
  /** Published n days before seeding. */
  daysAgo: number
  image?: SeedImage
  authorEmail?: string
}

export interface SeedEvent {
  title: string
  body?: string
  location?: string
  category?: string
  /** Starts n days after seeding (negative = past event). */
  inDays: number
  allDay?: boolean
  visibility?: SeedVisibility
  teams?: string[]
}

export interface SeedPollQuestion {
  text: string
  type: 'single' | 'multiple' | 'text' | 'scale'
  options?: string[]
}

export interface SeedPoll {
  title: string
  description?: string
  status: 'active' | 'closed'
  visibility?: SeedVisibility
  teams?: string[]
  showLiveResults?: boolean
  allowAnonymous?: boolean
  questions: SeedPollQuestion[]
}

export interface SeedForumThread {
  title: string
  /** Markdown. */
  body: string
  visibility?: SeedVisibility
  teams?: string[]
  pinned?: boolean
  authorEmail?: string
  /** Comment bodies, assigned round-robin to project members. */
  comments: string[]
}

export interface SeedTask {
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  labels?: string[]
  visibility: 'PROJECT' | 'TEAM'
  teams?: string[]
  assigneeEmails?: string[]
}

export interface SeedFile {
  label: string
  /** 'pdf' = the shared UrbanKIT mockup PDF; otherwise one of the project images. */
  source: 'pdf' | SeedImage
  folder?: string
  visibility?: SeedVisibility
  teams?: string[]
}

export interface SeedBoard {
  name: string
  /** Sticky-note texts placed on the premade canvas. */
  notes: string[]
}

export interface SeedProject {
  slug: string
  title: string
  shortDescription: string
  projektphase: string
  thema: string[]
  startYear: number
  stadtbereich: string[]
  altersgruppe: string[]
  gender: string[]
  isPublic: boolean
  /** Team catalog. */
  teams: string[]
  /** Markdown → projektbeschreibung. */
  beschreibung: string
  /** Markdown → beteiligungsvorhaben. */
  beteiligungsvorhaben: string
  kontakt: { email: string; telefon?: string; website?: string }
  /** Must match a roster email; also becomes the project's PM. */
  projektleitungEmail: string
  folders: string[]
  news: SeedNews[]
  events: SeedEvent[]
  polls: SeedPoll[]
  forum: SeedForumThread[]
  tasks: SeedTask[]
  files: SeedFile[]
  board: SeedBoard
}

export interface SeedUser {
  email: string
  firstName: string
  lastName: string
  gender?: 'female' | 'male' | 'diverse' | 'noAnswer'
  birthYear?: number
  stadtbereich?: 'innenstadt' | 'norden' | 'sueden' | 'osten' | 'westen'
  affiliations: ('citizen' | 'student' | 'cityEmployee' | 'academia' | 'other')[]
  bio: string
  cityInfo?: { organization?: string; fachbereich?: string; position?: string }
  /** File name in seed/assets/avatare/ (e.g. 'sabine-krueger.jpg'). */
  avatar?: string
}

export interface SeedMembership {
  /** Project slug. */
  project: string
  role: 'PM' | 'Citizen'
  teams?: string[]
  leadOf?: string[]
}

export interface SeedUserWithMemberships extends SeedUser {
  memberships: SeedMembership[]
}
