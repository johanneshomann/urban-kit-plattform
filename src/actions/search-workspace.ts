// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { getUser } from '@/lib/auth/getUser'
import { getWorkspaceContext } from '@/lib/workspace-context'
import {
  searchAllWorkspaces,
  searchWorkspace,
  type CrossProjectSearchResult,
  type WorkspaceSearchResult,
} from '@/lib/workspace-search'

/**
 * Workspace search for the ⌘K palette. Open to everyone who can see the
 * workspace (private projects 404 in getWorkspaceContext); all role/visibility
 * scoping lives in {@link searchWorkspace} via the resolved viewer context.
 */
export async function searchWorkspaceAction(params: {
  slug: string
  query: string
}): Promise<{ results: WorkspaceSearchResult[] } | { error: string }> {
  const ctx = await getWorkspaceContext(params.slug)
  if (!ctx) return { error: 'Projekt nicht gefunden.' }

  const query = (params.query ?? '').trim().slice(0, 100)
  if (query.length < 2) return { results: [] }

  const membership = ctx.membershipId
    ? { id: ctx.membershipId, status: ctx.membershipStatus, role: ctx.role, teams: ctx.teams, leadOf: ctx.viewer.leadOf }
    : null

  try {
    const payload = await getPayload({ config })
    const results = await searchWorkspace(payload, {
      projectId: ctx.project.id,
      modules: ctx.modules,
      viewer: ctx.viewer,
      membership,
      query,
    })
    return { results }
  } catch {
    return { error: 'Suche fehlgeschlagen.' }
  }
}

/**
 * Cross-project search (palette with the project chip removed, dashboard).
 * Only projects the caller is an ACTIVE member of; each project is searched
 * with the viewer context of that membership.
 */
export async function searchAllProjectsAction(params: {
  query: string
}): Promise<{ results: CrossProjectSearchResult[] } | { error: string }> {
  const user = await getUser()
  if (!user) return { error: 'Nicht angemeldet.' }

  const query = (params.query ?? '').trim().slice(0, 100)
  if (query.length < 2) return { results: [] }

  try {
    const payload = await getPayload({ config })
    const results = await searchAllWorkspaces(payload, String(user.id), query)
    return { results }
  } catch {
    return { error: 'Suche fehlgeschlagen.' }
  }
}
