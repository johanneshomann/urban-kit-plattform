'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { payloadAs } from '@/lib/payload-client'
import { emitActivity } from '@/lib/events'
import type { User } from '@/payload-types'

export async function createThread(user: User, data: {
  title: string
  slug: string
  content: unknown
  category?: string
  projectId: string

  visibility?: string
}) {
  const payload = await getPayload({ config })
  const thread = await payload.create({
    collection: 'forum-threads',
    data: {
      title: data.title,
      slug: data.slug,
      content: data.content as never,
      category: data.category,
      visibility: (data.visibility ?? 'INTERNAL') as 'PUBLIC' | 'INTERNAL' | 'TEAM',
      author: user.id,
      project: data.projectId,
    },
    ...payloadAs(user),
  })
  await emitActivity({ type: 'forum.thread_created', userId: String(user.id), projectId: data.projectId, reference: { collection: 'forum-threads', id: String(thread.id) } })
  return thread
}

export async function createComment(user: User, data: {
  threadId: string
  content: unknown
}) {
  const payload = await getPayload({ config })
  return payload.create({
    collection: 'forum-comments',
    data: {
      thread: data.threadId,
      content: data.content as never,
      author: user.id,
    },
    ...payloadAs(user),
  })
}
