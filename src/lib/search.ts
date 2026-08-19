// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import { getPayload } from 'payload'
import config from '@payload-config'
import type { User } from '@/payload-types'
import { getViewerState } from '@/lib/visibility'
import { searchWorkspace, SEARCH_MODULE_COLLECTIONS } from '@/lib/workspace-search'

export interface SearchResult {
  collection: string
  id: string
  title: string
  slug?: string
  score?: number
}

/**
 * Project search on behalf of a user (urban-agent tool, /api/search). Thin
 * collection-slug shim over {@link searchWorkspace}, which applies the full
 * role/visibility model (visibilityWhere + canViewContent + per-module
 * draft/publish rules) and only queries the project's enabled modules.
 */
export async function searchProject(
  user: User,
  projectId: string,
  query: string,
): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) return []

  const payload = await getPayload({ config })
  const project = (await payload
    .findByID({ collection: 'projects', id: projectId, depth: 0, overrideAccess: true })
    .catch(() => null)) as { modules?: string[]; isPublic?: boolean | null } | null
  if (!project) return []

  const { ctx, membership } = await getViewerState(payload, user ? String(user.id) : null, String(projectId))
  // Private projects are invisible to non-members (same rule as the workspace 404)
  if (project.isPublic === false && !ctx.active && (user as { role?: string })?.role !== 'admin') return []

  const results = await searchWorkspace(payload, {
    projectId: String(projectId),
    modules: project.modules ?? ['news', 'calendar'],
    viewer: ctx,
    membership,
    query,
  })

  return results.map((r) => ({
    collection: SEARCH_MODULE_COLLECTIONS[r.module] ?? r.module,
    id: r.docId,
    title: r.title,
    slug: r.slug,
  }))
}
