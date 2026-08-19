// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import { getPayload } from 'payload'
import config from '@payload-config'
import { visibilityWhere, type ViewerContext } from '@/lib/visibility'
import { matchesTeamFilter } from '@/lib/team-scope'
import { getWorkspaceContext } from '@/lib/workspace-context'
import { NewsList, type NewsListPost } from '@/components/platform/modules/news/NewsList'

/** Citizen-facing list of visible, published news posts for a project. */
export async function NewsFeed({ slug, locale, projectId, viewer, userId, teamFilter }: { slug: string; locale: string; projectId: string; viewer: ViewerContext; userId?: string | null; teamFilter?: string | null }) {
  const payload = await getPayload({ config })
  const now = new Date().toISOString()
  const res = await payload.find({
    collection: 'news-posts',
    where: { and: [{ project: { equals: projectId } }, { publishedAt: { less_than_equal: now } }, visibilityWhere(viewer)] },
    sort: '-publishedAt',
    limit: 50,
    depth: 1,
    overrideAccess: true,
  })
  const posts: NewsListPost[] = res.docs
    .filter((d) => matchesTeamFilter(d as { visibility?: string | null; visibilityTeams?: string[] | null }, teamFilter))
    .map((doc) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = doc as any
      const author = p.author && typeof p.author === 'object' ? p.author : null
      const authorName = author
        ? [author.firstName, author.lastName].filter(Boolean).join(' ') || null
        : null
      const authorId = p.author == null ? null : typeof p.author === 'object' ? String(p.author.id) : String(p.author)
      // Mirrors the server guard: PMs manage every post, leads their own.
      const canManage = viewer.isPM || (viewer.leadOf.length > 0 && !!userId && authorId === userId)
      return {
        id: String(p.id),
        title: String(p.title ?? ''),
        slug: String(p.slug ?? ''),
        publishedAt: p.publishedAt ?? null,
        visibility: p.visibility ?? null,
        visibilityTeams: Array.isArray(p.visibilityTeams) ? p.visibilityTeams : [],
        imageUrl: p.featuredImage && typeof p.featuredImage === 'object' ? (p.featuredImage.url ?? null) : null,
        authorName,
        canManage,
      }
    })

  const ctx = await getWorkspaceContext(slug)
  // Team catalog for the edit popup's visibility pills: PMs pick from the
  // whole project catalog, leads only from the teams they lead.
  const teamCatalog = viewer.isPM ? (ctx?.project.teams ?? []) : viewer.leadOf
  const agentEnabled = (ctx?.modules ?? []).includes('urban-agent') && viewer.active

  return <NewsList locale={locale} slug={slug} posts={posts} viewerTeams={viewer.teams} canCreate={viewer.isPM} isPM={viewer.isPM} isLoggedIn={!!userId} agentEnabled={agentEnabled} teamCatalog={teamCatalog} />
}
