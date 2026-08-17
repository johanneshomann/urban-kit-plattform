// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import 'server-only'

import { tool, type ToolSet } from 'ai'
import { z } from 'zod'
import type { Payload } from 'payload'
import { payloadAs } from '@/lib/payload-client'
import { canViewContent, type ViewerContext, type ViewerMembership } from '@/lib/visibility'
import { searchProject } from '@/lib/search'
import { lexicalToMarkdown } from '@/lib/richtext'
import { fmtDate, truncate } from './context'
import type {
  User,
  Project,
  NewsPost,
  CalendarEvent,
  Poll,
  PollQuestion,
  PollOption,
  ForumThread,
  ForumComment,
  Task,
  FileUpload,
} from '@/payload-types'

/**
 * Retrieval tools for the Urban Agent — the model's ONLY way to obtain facts.
 *
 * Containment model (per request):
 * - Every query runs through `payloadAs(user)` (ADR-3) and is additionally
 *   scoped to THIS project; `user`/`projectId` are closure state the model
 *   cannot override via parameters.
 * - Per-document TEAM granularity is enforced with `canViewContent` on every
 *   doc that leaves a tool (collection access alone only guarantees
 *   project-level scoping).
 * - The tool list itself is filtered to the project's enabled modules, so
 *   disabled modules don't even exist for the model.
 * - `show_items` only accepts ids the session has actually seen in a tool
 *   result (allow-list) — the model can never surface invented references.
 * - Budgets: max 4 deep reads and max 6 shown cards per request.
 *
 * GDPR: author/member names, e-mails and votes never enter a tool result;
 * forum comments are anonymized ("Kommentar N").
 */

export const AGENT_CONTENT_MODULES = ['news', 'calendar', 'polls', 'forum', 'tasks', 'files'] as const
export type AgentModule = (typeof AGENT_CONTENT_MODULES)[number]

const COLLECTION: Record<AgentModule, 'news-posts' | 'calendar-events' | 'polls' | 'forum-threads' | 'tasks' | 'file-uploads'> = {
  news: 'news-posts',
  calendar: 'calendar-events',
  polls: 'polls',
  forum: 'forum-threads',
  tasks: 'tasks',
  files: 'file-uploads',
}

const MODULE_BY_COLLECTION: Record<string, AgentModule> = Object.fromEntries(
  Object.entries(COLLECTION).map(([m, c]) => [c, m as AgentModule]),
)

const MAX_DEEP_READS = 4
const MAX_SHOWN = 6
const LIST_LIMIT = 10

/** A reference card the UI renders under the reply (link resolved client-side). */
export type AgentCard = { module: AgentModule; id: string; title: string; slug?: string }

export type AgentToolSession = {
  /** `${module}:${id}` → card data; populated by list/search/get, read by show_items. */
  seen: Map<string, AgentCard>
  deepReads: number
  shown: AgentCard[]
}

type ToolDeps = {
  payload: Payload
  user: User
  membership: ViewerMembership | null
  viewer: ViewerContext
  project: Project
}

const projectIdOf = (doc: { project?: unknown }): string | null => {
  const p = doc.project
  if (!p) return null
  return String(typeof p === 'object' ? (p as { id: string | number }).id : p)
}

const isLiveNews = (n: NewsPost): boolean =>
  Boolean(n.publishedAt) && new Date(n.publishedAt as string).getTime() <= Date.now()

export function resolveAgentModules(project: Project, viewer: ViewerContext): AgentModule[] {
  const enabled = (project.modules ?? []) as string[]
  return AGENT_CONTENT_MODULES.filter((m) => {
    if (!enabled.includes(m)) return false
    // Aufgaben board is a TEAM-only module — hide the tool below that tier.
    if (m === 'tasks' && viewer.tier !== 'team') return false
    return true
  })
}

export function buildAgentTools(deps: ToolDeps): { tools: ToolSet; session: AgentToolSession; modules: AgentModule[] } {
  const { payload, user, membership, viewer, project } = deps
  const projectId = String(project.id)
  const modules = resolveAgentModules(project, viewer)
  const session: AgentToolSession = { seen: new Map(), deepReads: 0, shown: [] }

  if (modules.length === 0) return { tools: {}, session, modules }

  const moduleEnum = z.enum(modules as [AgentModule, ...AgentModule[]])

  const register = (module: AgentModule, id: string, title: string, slug?: string): void => {
    session.seen.set(`${module}:${id}`, { module, id: String(id), title, slug })
  }

  /** Doc leaves a tool only if the viewer may see it (per-doc TEAM check). */
  const visible = (doc: { visibility?: string | null; visibilityTeams?: string[] | null }): boolean =>
    canViewContent(membership, doc)

  const listItems = async (module: AgentModule, limit: number): Promise<Record<string, unknown>[]> => {
    const base = { project: { equals: projectId } }
    switch (module) {
      case 'news': {
        const res = await payload.find({
          collection: 'news-posts',
          where: { and: [base, { publishedAt: { less_than_equal: new Date().toISOString() } }] },
          sort: '-publishedAt',
          limit,
          depth: 0,
          ...payloadAs(user),
        })
        return (res.docs as NewsPost[]).filter(visible).filter(isLiveNews).map((n) => {
          register('news', n.id, n.title, n.slug)
          return { id: n.id, titel: n.title, datum: fmtDate(n.publishedAt) }
        })
      }
      case 'calendar': {
        // Upcoming first; fill with the most recent past events if sparse.
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        const upcoming = await payload.find({
          collection: 'calendar-events',
          where: { and: [base, { startDate: { greater_than_equal: cutoff } }] },
          sort: 'startDate',
          limit,
          depth: 0,
          ...payloadAs(user),
        })
        let docs = (upcoming.docs as CalendarEvent[]).filter(visible)
        if (docs.length < limit) {
          const past = await payload.find({
            collection: 'calendar-events',
            where: { and: [base, { startDate: { less_than: cutoff } }] },
            sort: '-startDate',
            limit: limit - docs.length,
            depth: 0,
            ...payloadAs(user),
          })
          docs = docs.concat((past.docs as CalendarEvent[]).filter(visible))
        }
        return docs.map((e) => {
          register('calendar', e.id, e.title, e.slug)
          const when = fmtDate(e.startDate) + (e.endDate && e.endDate !== e.startDate ? ` – ${fmtDate(e.endDate)}` : '')
          return { id: e.id, titel: e.title, wann: when, ort: e.location ?? undefined }
        })
      }
      case 'polls': {
        const res = await payload.find({
          collection: 'polls', where: { and: [base] }, sort: '-createdAt', limit, depth: 0, ...payloadAs(user),
        })
        return (res.docs as Poll[]).filter(visible).map((q) => {
          register('polls', q.id, q.title, q.slug)
          const status = q.status === 'active' ? 'läuft' : q.status === 'closed' ? 'beendet' : 'Entwurf'
          return { id: q.id, titel: q.title, status, endet: q.closesAt ? fmtDate(q.closesAt) : undefined }
        })
      }
      case 'forum': {
        const res = await payload.find({
          collection: 'forum-threads', where: { and: [base] }, sort: '-updatedAt', limit, depth: 0, ...payloadAs(user),
        })
        return (res.docs as ForumThread[]).filter(visible).map((t) => {
          register('forum', t.id, t.title, t.slug)
          return { id: t.id, titel: t.title, kategorie: t.category ?? undefined, zuletztAktiv: fmtDate(t.updatedAt) }
        })
      }
      case 'tasks': {
        const res = await payload.find({
          collection: 'tasks', where: { and: [base] }, sort: '-updatedAt', limit, depth: 0, ...payloadAs(user),
        })
        return (res.docs as Task[]).filter(visible).map((t) => {
          register('tasks', t.id, t.title)
          return {
            id: t.id, titel: t.title, status: t.status ?? undefined,
            prioritaet: t.priority ?? undefined, frist: t.deadline ? fmtDate(t.deadline) : undefined,
          }
        })
      }
      case 'files': {
        const res = await payload.find({
          collection: 'file-uploads', where: { and: [base] }, sort: '-createdAt', limit, depth: 0, ...payloadAs(user),
        })
        return (res.docs as FileUpload[]).filter(visible).map((f) => {
          const title = f.label || f.filename || 'Datei'
          register('files', f.id, title)
          return { id: f.id, titel: title, typ: f.mimeType ?? undefined, hochgeladen: fmtDate(f.createdAt) }
        })
      }
    }
  }

  const getItem = async (module: AgentModule, id: string): Promise<Record<string, unknown>> => {
    if (session.deepReads >= MAX_DEEP_READS) {
      return { fehler: 'Limit für Detailabrufe in dieser Anfrage erreicht. Antworten Sie mit den bereits geladenen Informationen.' }
    }
    session.deepReads++
    const doc = await payload
      .findByID({ collection: COLLECTION[module], id, depth: 0, ...payloadAs(user) })
      .catch(() => null)
    if (!doc || projectIdOf(doc as { project?: unknown }) !== projectId) return { fehler: 'Nicht gefunden.' }
    if (!visible(doc as { visibility?: string | null; visibilityTeams?: string[] | null })) {
      return { fehler: 'Nicht gefunden.' }
    }

    switch (module) {
      case 'news': {
        const n = doc as NewsPost
        if (!isLiveNews(n)) return { fehler: 'Nicht gefunden.' }
        register('news', n.id, n.title, n.slug)
        return {
          id: n.id, titel: n.title, datum: fmtDate(n.publishedAt),
          inhalt: truncate(await lexicalToMarkdown(n.content), 1200),
        }
      }
      case 'calendar': {
        const e = doc as CalendarEvent
        register('calendar', e.id, e.title, e.slug)
        return {
          id: e.id, titel: e.title,
          wann: fmtDate(e.startDate) + (e.endDate && e.endDate !== e.startDate ? ` – ${fmtDate(e.endDate)}` : ''),
          ganztaegig: e.allDay ?? undefined, ort: e.location ?? undefined, kategorie: e.category ?? undefined,
          inhalt: truncate(await lexicalToMarkdown(e.content), 1200),
        }
      }
      case 'polls': {
        const q = doc as Poll
        register('polls', q.id, q.title, q.slug)
        const questions = await payload.find({
          collection: 'poll-questions', where: { poll: { equals: q.id } }, sort: 'order', limit: 10, depth: 0, ...payloadAs(user),
        })
        const qIds = (questions.docs as PollQuestion[]).map((d) => d.id)
        const options = qIds.length
          ? await payload.find({
              collection: 'poll-options', where: { question: { in: qIds } }, sort: 'order', limit: 60, depth: 0, ...payloadAs(user),
            })
          : { docs: [] }
        return {
          id: q.id, titel: q.title, beschreibung: q.description ? truncate(q.description, 600) : undefined,
          status: q.status === 'active' ? 'läuft' : q.status === 'closed' ? 'beendet' : 'Entwurf',
          endet: q.closesAt ? fmtDate(q.closesAt) : undefined,
          fragen: (questions.docs as PollQuestion[]).map((f) => ({
            frage: f.text, typ: f.type ?? undefined,
            optionen: (options.docs as PollOption[])
              .filter((o) => String(typeof o.question === 'object' ? o.question.id : o.question) === String(f.id))
              .map((o) => o.text),
          })),
        }
      }
      case 'forum': {
        const t = doc as ForumThread
        register('forum', t.id, t.title, t.slug)
        const comments = await payload.find({
          collection: 'forum-comments', where: { thread: { equals: t.id } }, sort: 'createdAt', limit: 10, depth: 0, ...payloadAs(user),
        })
        const rendered = await Promise.all(
          (comments.docs as ForumComment[]).map(async (c, i) => ({
            // Anonymized on purpose — no author names toward the LLM (GDPR).
            kommentar: `Kommentar ${i + 1} (${fmtDate(c.createdAt)})`,
            inhalt: truncate(await lexicalToMarkdown(c.content), 300),
          })),
        )
        return {
          id: t.id, titel: t.title, kategorie: t.category ?? undefined,
          inhalt: truncate(await lexicalToMarkdown(t.content), 1200),
          kommentare: rendered,
          hinweis: comments.totalDocs > 10 ? `${comments.totalDocs - 10} weitere Kommentare nicht geladen.` : undefined,
        }
      }
      case 'tasks': {
        const t = doc as Task
        register('tasks', t.id, t.title)
        return {
          id: t.id, titel: t.title, status: t.status ?? undefined, prioritaet: t.priority ?? undefined,
          frist: t.deadline ? fmtDate(t.deadline) : undefined, labels: t.labels ?? undefined,
          beschreibung: truncate(await lexicalToMarkdown(t.description), 800),
        }
      }
      case 'files': {
        const f = doc as FileUpload
        const title = f.label || f.filename || 'Datei'
        register('files', f.id, title)
        return {
          id: f.id, titel: title, dateiname: f.filename ?? undefined, typ: f.mimeType ?? undefined,
          groesseBytes: f.filesize ?? undefined, hochgeladen: fmtDate(f.createdAt),
        }
      }
    }
  }

  const tools: ToolSet = {
    list_items: tool({
      description:
        'Listet aktuelle Einträge eines Inhaltsbereichs dieses Projekts (Titel, Datum, Status). Termine: bevorstehende zuerst.',
      inputSchema: z.object({
        module: moduleEnum.describe('Inhaltsbereich'),
        limit: z.number().int().min(1).max(LIST_LIMIT).optional().describe('Max. Einträge (Standard 10)'),
      }),
      execute: async ({ module, limit }) => {
        const items = await listItems(module, limit ?? LIST_LIMIT)
        return items.length ? { eintraege: items } : { eintraege: [], hinweis: 'Keine sichtbaren Einträge.' }
      },
    }),
    search_project: tool({
      description: 'Durchsucht die Titel aller Inhalte dieses Projekts (Neuigkeiten, Termine, Umfragen, Forum, Aufgaben).',
      inputSchema: z.object({ query: z.string().min(2).max(100).describe('Suchbegriff') }),
      execute: async ({ query }) => {
        const results = await searchProject(user, projectId, query)
        const items = results
          .map((r) => ({ module: MODULE_BY_COLLECTION[r.collection], r }))
          .filter((x): x is { module: AgentModule; r: (typeof results)[number] } => Boolean(x.module) && modules.includes(x.module as AgentModule))
          .map(({ module, r }) => {
            register(module, r.id, r.title, r.slug)
            return { id: r.id, titel: r.title, bereich: module }
          })
        return items.length ? { treffer: items } : { treffer: [], hinweis: 'Keine Treffer — ggf. list_items nutzen.' }
      },
    }),
    get_item: tool({
      description: `Liest einen einzelnen Eintrag im Detail (Inhalt, bei Forum inkl. Kommentaren, bei Umfragen inkl. Fragen). Max. ${MAX_DEEP_READS} Abrufe pro Anfrage.`,
      inputSchema: z.object({ module: moduleEnum, id: z.string().max(64).describe('Id aus einem vorherigen Werkzeug-Ergebnis') }),
      execute: ({ module, id }) => getItem(module, id),
    }),
    show_items: tool({
      description:
        'Zeigt der Person Inhalte als Karten mit Link an — der EINZIGE Weg, Inhalte sichtbar zu machen. Vor jeder Erwähnung konkreter Inhalte aufrufen. Nur Ids aus Werkzeug-Ergebnissen.',
      inputSchema: z.object({
        items: z.array(z.object({ module: moduleEnum, id: z.string().max(64) })).min(1).max(MAX_SHOWN),
      }),
      execute: async ({ items }) => {
        for (const { module, id } of items) {
          const card = session.seen.get(`${module}:${id}`)
          if (!card) continue // not in the allow-list — silently dropped
          if (session.shown.some((s) => s.module === card.module && s.id === card.id)) continue
          if (session.shown.length >= MAX_SHOWN) break
          session.shown.push(card)
        }
        return session.shown.length
          ? { angezeigt: session.shown.map((s) => s.title) }
          : { angezeigt: [], hinweis: 'Keine gültigen Ids — nur Ids aus Werkzeug-Ergebnissen verwenden.' }
      },
    }),
  }

  return { tools, session, modules }
}
