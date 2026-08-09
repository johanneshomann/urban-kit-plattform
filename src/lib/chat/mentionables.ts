import 'server-only'
import type { CollectionSlug, Payload } from 'payload'
import { canViewContent } from '@/lib/visibility'
import { relId } from '@/lib/chat/access'

/** A mentionable piece of project content (typeahead item / stored snapshot). */
export interface Mentionable {
  module: string
  docId: string
  title: string
  /** Workspace-relative deep link (`/m/…`) — the client prefixes the project path. */
  href: string
}

type ModuleSpec = {
  collection: CollectionSlug
  title: (doc: Record<string, unknown>) => string | null
  href: (doc: Record<string, unknown>) => string
}

/** Modules whose content can be mentioned, with title + deep-link mapping. */
const MENTIONABLE_MODULES: Record<string, ModuleSpec> = {
  news: {
    collection: 'news-posts',
    title: (d) => (d.title as string) ?? null,
    href: (d) => (d.slug ? `/m/news/${d.slug}` : '/m/news'),
  },
  calendar: {
    collection: 'calendar-events',
    title: (d) => (d.title as string) ?? null,
    href: () => '/m/calendar',
  },
  forum: {
    collection: 'forum-threads',
    title: (d) => (d.title as string) ?? null,
    href: (d) => (d.slug ? `/m/forum/${d.slug}` : '/m/forum'),
  },
  tasks: {
    collection: 'tasks',
    title: (d) => (d.title as string) ?? null,
    href: () => '/m/tasks',
  },
  polls: {
    collection: 'polls',
    title: (d) => (d.title as string) ?? null,
    href: () => '/m/polls',
  },
  files: {
    collection: 'file-uploads',
    title: (d) => ((d.label as string) || (d.filename as string)) ?? null,
    href: () => '/m/files',
  },
  board: {
    collection: 'board-canvases',
    title: (d) => (d.name as string) ?? null,
    href: () => '/m/board',
  },
}

/** The caller's active membership in a project, shaped for canViewContent. */
async function viewerMembershipFor(payload: Payload, userId: string, projectId: string) {
  const res = await payload.find({
    collection: 'project-memberships',
    where: { and: [{ user: { equals: userId } }, { project: { equals: projectId } }, { status: { equals: 'active' } }] },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const m = res.docs[0] as { id: string | number; status?: string; role?: string; teams?: string[] } | undefined
  if (!m) return null
  return { id: String(m.id), status: m.status ?? 'active', role: m.role ?? 'Citizen', teams: m.teams ?? [] }
}

/**
 * Typeahead search over a project's mentionable content — only what the
 * CALLER may see (visibility model included). Small per-module windows,
 * capped total.
 */
export async function searchMentionables(payload: Payload, userId: string, projectId: string, q: string): Promise<Mentionable[]> {
  const membership = await viewerMembershipFor(payload, userId, projectId)
  const query = q.trim().toLowerCase()
  const out: Mentionable[] = []
  for (const [module, spec] of Object.entries(MENTIONABLE_MODULES)) {
    const res = await payload
      .find({
        collection: spec.collection,
        where: { project: { equals: projectId } },
        sort: '-updatedAt',
        limit: 15,
        depth: 0,
        overrideAccess: true,
      })
      .catch(() => ({ docs: [] as Record<string, unknown>[] }))
    for (const doc of res.docs as Record<string, unknown>[]) {
      const title = spec.title(doc)
      if (!title) continue
      if (query && !title.toLowerCase().includes(query)) continue
      if (!canViewContent(membership, doc as { visibility?: string | null; visibilityTeams?: string[] | null })) continue
      out.push({ module, docId: String(doc.id), title, href: spec.href(doc) })
      if (out.length >= 12) return out
    }
  }
  return out
}

/**
 * Validate + snapshot one mention at send time: the doc must belong to the
 * room's project and be visible to the SENDER. Returns null on any mismatch.
 */
export async function resolveMention(
  payload: Payload,
  userId: string,
  projectId: string,
  module: string,
  docId: string,
): Promise<Mentionable | null> {
  const spec = MENTIONABLE_MODULES[module]
  if (!spec) return null
  const doc = (await payload
    .findByID({ collection: spec.collection, id: docId, depth: 0, overrideAccess: true })
    .catch(() => null)) as Record<string, unknown> | null
  if (!doc) return null
  if (relId(doc.project) !== projectId) return null
  const membership = await viewerMembershipFor(payload, userId, projectId)
  if (!canViewContent(membership, doc as { visibility?: string | null; visibilityTeams?: string[] | null })) return null
  const title = spec.title(doc)
  if (!title) return null
  return { module, docId, title, href: spec.href(doc) }
}
