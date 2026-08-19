// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import 'server-only'
import type { CollectionSlug, Payload, Where } from 'payload'
import { canViewContent, visibilityWhere, type ViewerContext, type ViewerMembership } from '@/lib/visibility'
import { resolveColorScheme, schemeToCssVars } from '@/lib/colorScheme'
import { getColorSchemes } from '@/lib/color-schemes-store'

/** One workspace search hit (module-grouped in the UI). */
export interface WorkspaceSearchResult {
  module: string
  docId: string
  title: string
  /** Workspace-relative deep link (`/m/…`) — callers prefix the project path. */
  href: string
  /** Doc slug where the collection has one (news/forum detail links, agent cards). */
  slug?: string
  /** Secondary line (location, filename, category …) when available. */
  meta?: string
}

type Doc = Record<string, unknown>

type ModuleSpec = {
  collection: CollectionSlug
  /** Text fields matched with `like` (regex on MongoDB). */
  fields: string[]
  /** Collection carries visibility/visibilityTeams (board-canvases does not). */
  hasVisibility: boolean
  /** Extra constraint mirroring the module page's own list query. */
  extra?: () => Where
  title: (doc: Doc) => string | null
  meta?: (doc: Doc) => string | null
  href: (doc: Doc) => string
}

/**
 * Searchable workspace modules, in MODULE_ORDER. Fields and extra clauses
 * mirror what each citizen module page queries — search must never surface a
 * doc its module list would hide (drafts, unpublished news).
 */
const SEARCH_MODULES: Record<string, ModuleSpec> = {
  news: {
    collection: 'news-posts',
    fields: ['title'],
    hasVisibility: true,
    // null publishedAt (draft) never satisfies less_than_equal — same as NewsFeed
    extra: () => ({ publishedAt: { less_than_equal: new Date().toISOString() } }),
    title: (d) => (d.title as string) ?? null,
    href: (d) => (d.slug ? `/m/news/${d.slug}` : '/m/news'),
  },
  calendar: {
    collection: 'calendar-events',
    fields: ['title', 'location', 'category'],
    hasVisibility: true,
    title: (d) => (d.title as string) ?? null,
    meta: (d) => (d.location as string) || null,
    href: () => '/m/calendar',
  },
  polls: {
    collection: 'polls',
    fields: ['title', 'description'],
    hasVisibility: true,
    // drafts are author/PM-only surfaces — same as citizen-polls.ts
    extra: () => ({ status: { in: ['active', 'closed'] } }),
    title: (d) => (d.title as string) ?? null,
    href: () => '/m/polls',
  },
  forum: {
    collection: 'forum-threads',
    fields: ['title', 'category'],
    hasVisibility: true,
    title: (d) => (d.title as string) ?? null,
    meta: (d) => (d.category as string) || null,
    href: (d) => (d.slug ? `/m/forum/${d.slug}` : '/m/forum'),
  },
  tasks: {
    collection: 'tasks',
    fields: ['title', 'labels'],
    hasVisibility: true,
    title: (d) => (d.title as string) ?? null,
    href: () => '/m/tasks',
  },
  board: {
    collection: 'board-canvases',
    fields: ['name'],
    hasVisibility: false,
    title: (d) => (d.name as string) ?? null,
    href: () => '/m/board',
  },
  files: {
    collection: 'file-uploads',
    fields: ['label', 'filename'],
    hasVisibility: true,
    title: (d) => ((d.label as string) || (d.filename as string)) ?? null,
    meta: (d) => ((d.label as string) ? ((d.filename as string) || null) : null),
    href: () => '/m/files',
  },
}

/** module id → backing collection, for callers speaking collection slugs. */
export const SEARCH_MODULE_COLLECTIONS: Record<string, string> = Object.fromEntries(
  Object.entries(SEARCH_MODULES).map(([m, s]) => [m, s.collection]),
)

/** Saveable content (Merkliste): the searchable modules plus folders. */
export const SAVEABLE_MODULE_COLLECTIONS: Record<string, string> = {
  ...SEARCH_MODULE_COLLECTIONS,
  folders: 'folders',
}

const LIMIT_PER_MODULE = 5

/** A cross-project hit — workspace hit plus the project it lives in. */
export interface CrossProjectSearchResult extends WorkspaceSearchResult {
  projectSlug: string
  projectTitle: string
  /** The project's resolved `--project-*` CSS vars so hits render in its scheme. */
  projectVars: Record<string, string>
}

/**
 * Cross-module search over a project's workspace content — only what the
 * VIEWER may see. Belt and braces like every module loader: `visibilityWhere`
 * in the query plus `canViewContent` per doc (legacy TEAM docs without tags).
 * Modules not enabled for the project are never queried.
 */
export async function searchWorkspace(
  payload: Payload,
  opts: {
    projectId: string
    modules: string[]
    viewer: ViewerContext
    membership: ViewerMembership | null
    query: string
    /** Hits per module (default 5; the cross-project search uses less). */
    limitPerModule?: number
  },
): Promise<WorkspaceSearchResult[]> {
  const q = opts.query.trim()
  if (q.length < 2) return []

  const jobs = Object.entries(SEARCH_MODULES)
    .filter(([module, spec]) => {
      if (!opts.modules.includes(module)) return false
      // board-canvases carry no visibility field — PROJECT-level by definition
      if (!spec.hasVisibility && !opts.viewer.active) return false
      return true
    })
    .map(async ([module, spec]) => {
      const and: Where[] = [
        { project: { equals: opts.projectId } },
        { or: spec.fields.map((f) => ({ [f]: { like: q } })) },
      ]
      if (spec.hasVisibility) and.push(visibilityWhere(opts.viewer))
      if (spec.extra) and.push(spec.extra())
      const res = await payload
        .find({
          collection: spec.collection,
          where: { and },
          sort: '-updatedAt',
          limit: opts.limitPerModule ?? LIMIT_PER_MODULE,
          depth: 0,
          overrideAccess: true,
        })
        .catch(() => ({ docs: [] as Doc[] }))
      const out: WorkspaceSearchResult[] = []
      for (const doc of res.docs as Doc[]) {
        const title = spec.title(doc)
        if (!title) continue
        if (!canViewContent(opts.membership, doc as { visibility?: string | null; visibilityTeams?: string[] | null })) continue
        out.push({
          module,
          docId: String(doc.id),
          title,
          href: spec.href(doc),
          slug: typeof doc.slug === 'string' ? doc.slug : undefined,
          meta: spec.meta?.(doc) ?? undefined,
        })
      }
      return out
    })

  return (await Promise.all(jobs)).flat()
}

const CROSS_PROJECT_CAP = 30


/**
 * Search across ALL projects the user is an active member of — one
 * {@link searchWorkspace} per membership, each with the viewer context derived
 * from THAT membership (PM here, plain citizen there). Smaller per-module
 * window so many projects can't flood the palette.
 */
export async function searchAllWorkspaces(
  payload: Payload,
  userId: string,
  query: string,
): Promise<CrossProjectSearchResult[]> {
  if (query.trim().length < 2) return []

  const ms = await payload.find({
    collection: 'project-memberships',
    where: { and: [{ user: { equals: userId } }, { status: { equals: 'active' } }] },
    limit: CROSS_PROJECT_CAP,
    depth: 0,
    overrideAccess: true,
  })
  const memberships = ms.docs as { id: string | number; project?: unknown; role?: string; teams?: string[] | null; leadOf?: string[] | null }[]
  if (memberships.length === 0) return []

  const relId = (v: unknown) => (v && typeof v === 'object' ? String((v as { id: unknown }).id) : String(v))
  const projectIds = memberships.map((m) => relId(m.project))
  const [pr, schemes] = await Promise.all([
    payload.find({
      collection: 'projects',
      where: { id: { in: projectIds } },
      limit: CROSS_PROJECT_CAP,
      depth: 0,
      overrideAccess: true,
    }),
    getColorSchemes(),
  ])
  const projects = new Map(
    (pr.docs as { id: string | number; slug?: string; title?: string; modules?: string[]; colorScheme?: string | null }[]).map((p) => [String(p.id), p]),
  )

  // Projects themselves are hits too — a title match links to the workspace
  // overview (pseudo-module 'project', href '' = the workspace root).
  const ql = query.trim().toLowerCase()
  const projectHits: CrossProjectSearchResult[] = [...projects.values()]
    .filter((p) => p.slug && (p.title ?? p.slug ?? '').toLowerCase().includes(ql))
    .map((p) => ({
      module: 'project',
      docId: String(p.id),
      title: p.title ?? (p.slug as string),
      href: '',
      projectSlug: p.slug as string,
      projectTitle: p.title ?? (p.slug as string),
      projectVars: schemeToCssVars(resolveColorScheme(p.colorScheme ?? null, schemes)),
    }))

  const jobs = memberships.map(async (m) => {
    const projectId = relId(m.project)
    const project = projects.get(projectId)
    if (!project?.slug) return []
    const isPM = m.role === 'PM'
    const leadOf = Array.isArray(m.leadOf) ? m.leadOf : []
    // Leading implies belonging — same derivation as getViewerState
    const teams = [...new Set([...(Array.isArray(m.teams) ? m.teams : []), ...leadOf])]
    const viewer: ViewerContext = {
      tier: isPM || teams.length > 0 ? 'team' : 'member',
      teams,
      leadOf,
      isPM,
      active: true,
    }
    const results = await searchWorkspace(payload, {
      projectId,
      modules: project.modules ?? ['news', 'calendar'],
      viewer,
      membership: { id: m.id, status: 'active', role: m.role, teams, leadOf },
      query,
      limitPerModule: 3,
    })
    const projectVars = schemeToCssVars(resolveColorScheme(project.colorScheme ?? null, schemes))
    return results.map((r) => ({
      ...r,
      projectSlug: project.slug as string,
      projectTitle: project.title ?? (project.slug as string),
      projectVars,
    }))
  })

  return [...projectHits, ...(await Promise.all(jobs)).flat()]
}
