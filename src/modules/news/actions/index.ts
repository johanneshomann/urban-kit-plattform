'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { payloadAs } from '@/lib/payload-client'
import { emitActivity } from '@/lib/events'
import type { User } from '@/payload-types'

export async function createNewsPost(user: User, data: {
  title: string
  slug: string
  projectId: string
  moduleId: string
  visibility?: string
}) {
  const payload = await getPayload({ config })
  const post = await payload.create({
    collection: 'news-posts',
    data: {
      title: data.title,
      slug: data.slug,
      visibility: (data.visibility ?? 'INTERNAL') as 'PUBLIC' | 'INTERNAL' | 'TEAM',
      author: user.id,
      projectModule: { project: data.projectId, module: data.moduleId },
    },
    ...payloadAs(user),
  })
  await emitActivity({ type: 'news.created', userId: String(user.id), projectId: data.projectId, reference: { collection: 'news-posts', id: String(post.id) } })
  return post
}

export async function publishNewsPost(user: User, postId: string) {
  const payload = await getPayload({ config })
  const post = await payload.update({
    collection: 'news-posts',
    id: postId,
    data: { publishedAt: new Date().toISOString() },
    ...payloadAs(user),
  })
  await emitActivity({ type: 'news.published', userId: String(user.id), reference: { collection: 'news-posts', id: postId } })
  return post
}

export async function deleteNewsPost(user: User, postId: string) {
  const payload = await getPayload({ config })
  await payload.delete({ collection: 'news-posts', id: postId, ...payloadAs(user) })
}
