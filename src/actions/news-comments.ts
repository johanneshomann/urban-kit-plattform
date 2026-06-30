'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'
import type { Payload } from 'payload'
import { getUser } from '@/lib/auth/getUser'
import { getViewerTier, canView, type Visibility } from '@/lib/visibility'

export type CommentActionState = { error?: string; ok?: boolean }

const relId = (v: unknown): string | null => (v == null ? null : typeof v === 'object' ? String((v as { id: unknown }).id) : String(v))

async function projectBySlug(payload: Payload, slug: string) {
  const res = await payload.find({ collection: 'projects', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true })
  return res.docs[0] as { id: string } | undefined
}

function revalidateComments(locale: string, slug: string, newsSlug?: string) {
  revalidatePath(`/${locale}/dashboard/projekte/${slug}/m/news`)
  if (newsSlug) revalidatePath(`/${locale}/projekte/${slug}/news/${newsSlug}`)
}

export async function postNewsComment(slug: string, locale: string, postId: string, body: string): Promise<CommentActionState> {
  const text = body.trim()
  if (!text) return { error: 'Kommentar darf nicht leer sein.' }
  if (text.length > 2000) return { error: 'Kommentar ist zu lang.' }

  const user = await getUser()
  if (!user) return { error: 'Bitte melde dich an, um zu kommentieren.' }

  try {
    const payload = await getPayload({ config })
    const project = await projectBySlug(payload, slug)
    if (!project) return { error: 'Projekt nicht gefunden.' }

    const tier = await getViewerTier(payload, String(user.id), project.id)
    if (tier === 'public') return { error: 'Nur Projektmitglieder können kommentieren.' }

    const post = await payload.findByID({ collection: 'news-posts', id: postId, depth: 0, overrideAccess: true }).catch(() => null)
    if (!post || relId((post as { project?: unknown }).project) !== String(project.id)) return { error: 'Beitrag nicht gefunden.' }

    const pub = (post as { publishedAt?: string | null }).publishedAt
    const isLive = !!pub && new Date(pub).getTime() <= Date.now()
    if (!isLive || !canView(tier, (post as { visibility?: Visibility }).visibility)) return { error: 'Beitrag nicht verfügbar.' }

    await payload.create({
      collection: 'news-comments',
      data: { post: postId, body: text, author: user.id, project: project.id },
      overrideAccess: true,
    })

    revalidateComments(locale, slug, (post as { slug?: string }).slug)
  } catch {
    return { error: 'Kommentar konnte nicht gespeichert werden.' }
  }

  return { ok: true }
}

/** Delete a comment — allowed for its author or a PM of the project. */
export async function deleteNewsComment(slug: string, locale: string, commentId: string): Promise<CommentActionState> {
  const user = await getUser()
  if (!user) return { error: 'Nicht angemeldet.' }

  try {
    const payload = await getPayload({ config })
    const project = await projectBySlug(payload, slug)
    if (!project) return { error: 'Projekt nicht gefunden.' }

    const comment = await payload.findByID({ collection: 'news-comments', id: commentId, depth: 0, overrideAccess: true }).catch(() => null)
    if (!comment || relId((comment as { project?: unknown }).project) !== String(project.id)) return { error: 'Kommentar nicht gefunden.' }

    const isAuthor = relId((comment as { author?: unknown }).author) === String(user.id)
    let allowed = isAuthor
    if (!allowed) {
      const mem = await payload.find({
        collection: 'project-memberships',
        where: { and: [{ user: { equals: user.id } }, { project: { equals: project.id } }, { role: { equals: 'PM' } }, { status: { equals: 'active' } }] },
        limit: 1, depth: 0, overrideAccess: true,
      })
      allowed = mem.totalDocs > 0
    }
    if (!allowed) return { error: 'Keine Berechtigung.' }

    const postId = relId((comment as { post?: unknown }).post)
    let newsSlug: string | undefined
    if (postId) {
      const post = await payload.findByID({ collection: 'news-posts', id: postId, depth: 0, overrideAccess: true }).catch(() => null)
      newsSlug = (post as { slug?: string } | null)?.slug
    }

    await payload.delete({ collection: 'news-comments', id: commentId, overrideAccess: true })
    revalidateComments(locale, slug, newsSlug)
  } catch {
    return { error: 'Kommentar konnte nicht gelöscht werden.' }
  }

  return { ok: true }
}
