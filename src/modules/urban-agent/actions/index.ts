'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { payloadAs } from '@/lib/payload-client'
import type { User } from '@/payload-types'

// Assembles project context for the AI — only surfaces content the user can see (ADR-3)
export async function assembleProjectContext(user: User, projectId: string) {
  const payload = await getPayload({ config })

  const [project, news, events, polls] = await Promise.all([
    payload.findByID({ collection: 'projects', id: projectId, ...payloadAs(user) }).catch(() => null),
    payload.find({ collection: 'news-posts', where: { 'projectModule.project': { equals: projectId } }, limit: 10, ...payloadAs(user) }).catch(() => ({ docs: [] })),
    payload.find({ collection: 'calendar-events', where: { 'projectModule.project': { equals: projectId } }, limit: 10, ...payloadAs(user) }).catch(() => ({ docs: [] })),
    payload.find({ collection: 'polls', where: { 'projectModule.project': { equals: projectId } }, limit: 10, ...payloadAs(user) }).catch(() => ({ docs: [] })),
  ])

  return { project, news: news.docs, events: events.docs, polls: polls.docs }
}
