import { getPayload } from 'payload'
import config from '@payload-config'

export interface ContentRef {
  collection: string
  id: string
}

export interface ResolvedRef<T = unknown> {
  found: boolean
  accessible: boolean
  data?: T
}

// Collections that support the visibility field
const VISIBILITY_COLLECTIONS = new Set([
  'news-posts', 'calendar-events', 'polls', 'forum-threads',
  'forum-comments', 'pages', 'media', 'folders',
  'task-columns', 'tasks',
])

export async function resolveReference<T = unknown>(
  ref: ContentRef,
  userId?: string,
): Promise<ResolvedRef<T>> {
  try {
    const payload = await getPayload({ config })

    const doc = await payload.findByID({
      collection: ref.collection as Parameters<typeof payload.findByID>[0]['collection'],
      id: ref.id,
      overrideAccess: true,
    })

    if (!doc) return { found: false, accessible: false }

    // Collections without visibility — accessible to all authenticated users
    if (!VISIBILITY_COLLECTIONS.has(ref.collection)) {
      return { found: true, accessible: Boolean(userId), data: doc as T }
    }

    const visibility = (doc as unknown as { visibility?: string }).visibility ?? 'INTERNAL'

    if (visibility === 'PUBLIC') {
      return { found: true, accessible: true, data: doc as T }
    }

    if (!userId) return { found: true, accessible: false }

    if (visibility === 'INTERNAL') {
      // Any authenticated project member can read INTERNAL
      const projectId = (doc as unknown as { projectModule?: { project?: string } }).projectModule?.project
      if (!projectId) return { found: true, accessible: true, data: doc as T }

      const membership = await payload.find({
        collection: 'project-memberships',
        where: { and: [{ user: { equals: userId } }, { project: { equals: projectId } }] },
        limit: 1,
        overrideAccess: true,
      })
      return { found: true, accessible: membership.totalDocs > 0, data: doc as T }
    }

    if (visibility === 'TEAM') {
      const visibilityTeamId = (doc as unknown as { visibilityTeam?: string }).visibilityTeam
      if (!visibilityTeamId) return { found: true, accessible: false }

      // Check team membership via content-manager-assignments
      const assignment = await payload.find({
        collection: 'content-manager-assignments',
        where: { and: [{ user: { equals: userId } }, { team: { equals: visibilityTeamId } }] },
        limit: 1,
        overrideAccess: true,
      })
      return { found: true, accessible: assignment.totalDocs > 0, data: doc as T }
    }

    return { found: true, accessible: false }
  } catch {
    return { found: false, accessible: false }
  }
}
