import { getPayload } from 'payload'
import config from '@payload-config'
import type { User } from '@/payload-types'
import { payloadAs } from './payload-client'

// Searchable collections and the fields indexed for full-text search
const SEARCHABLE_COLLECTIONS = [
  { slug: 'news-posts', fields: ['title'] },
  { slug: 'calendar-events', fields: ['title', 'location'] },
  { slug: 'polls', fields: ['title', 'description'] },
  { slug: 'forum-threads', fields: ['title'] },
  { slug: 'tasks', fields: ['title'] },
  { slug: 'pages', fields: ['title'] },
] as const

export interface SearchResult {
  collection: string
  id: string
  title: string
  slug?: string
  score?: number
}

export async function searchProject(
  user: User,
  projectId: string,
  query: string,
): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) return []

  const payload = await getPayload({ config })
  const results: SearchResult[] = []

  await Promise.all(
    SEARCHABLE_COLLECTIONS.map(async ({ slug }) => {
      try {
        const result = await payload.find({
          collection: slug as Parameters<typeof payload.find>[0]['collection'],
          where: {
            and: [
              { 'project': { equals: projectId } },
              { title: { like: query } },
            ],
          },
          limit: 5,
          ...payloadAs(user),
        })
        for (const doc of result.docs) {
          const d = doc as unknown as { id: string; title?: string; slug?: string }
          results.push({ collection: slug, id: String(d.id), title: d.title ?? '', slug: d.slug })
        }
      } catch {
        // Collection may not be enabled for this project
      }
    }),
  )

  return results
}
