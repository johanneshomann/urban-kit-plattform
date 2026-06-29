'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'
import type { Payload } from 'payload'
import type { NewsPost } from '@/payload-types'
import { getProjectManagerContext } from '@/lib/auth/requireProjectManager'
import { markdownToLexical } from '@/lib/richtext'
import { readImageFile, uploadProjectMedia } from '@/lib/upload-media'
import { emitActivity, emitNotification } from '@/lib/events'
import { uniqueSlug } from '@/lib/slugify'

export type NewsActionState = { error?: string; ok?: boolean }

const VISIBILITIES = new Set(['PUBLIC', 'INTERNAL', 'TEAM'])
const vis = (v: unknown): 'PUBLIC' | 'INTERNAL' | 'TEAM' => (VISIBILITIES.has(v as string) ? (v as 'PUBLIC' | 'INTERNAL' | 'TEAM') : 'INTERNAL')

function revalidateNews(locale: string, slug: string) {
  revalidatePath(`/${locale}/dashboard/projekte/${slug}/manage/inhalte/news`)
  revalidatePath(`/${locale}/dashboard/projekte/${slug}`)
  revalidatePath(`/${locale}/projekte/${slug}`)
}

/** Load a news post and verify it belongs to the managed project. */
async function getProjectNewsPost(payload: Payload, projectId: string, postId: string) {
  const post = await payload.findByID({ collection: 'news-posts', id: postId, depth: 0, overrideAccess: true }).catch(() => null)
  if (!post) return null
  const pid = typeof post.project === 'object' ? (post.project as { id: unknown })?.id : post.project
  return String(pid) === String(projectId) ? post : null
}

/** Notify all active members (except the author) of newly published content. */
async function notifyMembers(payload: Payload, projectId: string, exceptUserId: string, reference: { collection: string; id: string }) {
  const members = await payload.find({
    collection: 'project-memberships',
    where: { and: [{ project: { equals: projectId } }, { status: { equals: 'active' } }] },
    limit: 500,
    depth: 0,
    overrideAccess: true,
  })
  for (const m of members.docs) {
    const u = (m as { user?: unknown }).user
    const userId = u == null ? null : typeof u === 'object' ? String((u as { id: unknown }).id) : String(u)
    if (userId && userId !== exceptUserId) {
      await emitNotification({ type: 'new_content', userId, reference })
    }
  }
}

export async function createProjectNewsPost(
  slug: string,
  locale: string,
  input: { title: string; body?: string; visibility?: string },
): Promise<NewsActionState> {
  const ctx = await getProjectManagerContext(slug)
  if (!ctx) return { error: 'Nicht berechtigt.' }

  const title = input.title.trim()
  if (!title) return { error: 'Titel darf nicht leer sein.' }

  try {
    const payload = await getPayload({ config })
    const content = typeof input.body === 'string' && input.body.trim()
      ? ((await markdownToLexical(input.body)) as NewsPost['content'])
      : undefined
    const post = await payload.create({
      collection: 'news-posts',
      data: {
        title,
        slug: uniqueSlug(title, 'news'),
        content,
        visibility: vis(input.visibility),
        author: ctx.user.id,
        project: ctx.project.id,
        // publishedAt left null → draft
      },
      overrideAccess: true,
    })
    await emitActivity({ type: 'news.created', userId: String(ctx.user.id), projectId: ctx.project.id, reference: { collection: 'news-posts', id: String(post.id) } })
  } catch {
    return { error: 'Beitrag konnte nicht erstellt werden.' }
  }

  revalidateNews(locale, slug)
  return { ok: true }
}

export async function updateProjectNewsPost(
  slug: string,
  locale: string,
  postId: string,
  input: { title: string; body?: string; visibility?: string },
): Promise<NewsActionState> {
  const ctx = await getProjectManagerContext(slug)
  if (!ctx) return { error: 'Nicht berechtigt.' }

  const title = input.title.trim()
  if (!title) return { error: 'Titel darf nicht leer sein.' }

  try {
    const payload = await getPayload({ config })
    if (!(await getProjectNewsPost(payload, ctx.project.id, postId))) return { error: 'Beitrag nicht gefunden.' }
    const data: Record<string, unknown> = {
      title,
      content: typeof input.body === 'string' ? (input.body.trim() ? await markdownToLexical(input.body) : null) : undefined,
      visibility: vis(input.visibility),
    }
    await payload.update({ collection: 'news-posts', id: postId, data, overrideAccess: true })
  } catch {
    return { error: 'Beitrag konnte nicht gespeichert werden.' }
  }

  revalidateNews(locale, slug)
  return { ok: true }
}

export async function setNewsFeaturedImage(slug: string, locale: string, postId: string, formData: FormData): Promise<NewsActionState> {
  const ctx = await getProjectManagerContext(slug)
  if (!ctx) return { error: 'Nicht berechtigt.' }

  const parsed = await readImageFile(formData)
  if ('error' in parsed) return { error: parsed.error }

  try {
    const payload = await getPayload({ config })
    if (!(await getProjectNewsPost(payload, ctx.project.id, postId))) return { error: 'Beitrag nicht gefunden.' }
    const mediaId = await uploadProjectMedia(payload, { projectId: ctx.project.id, userId: String(ctx.user.id), alt: `News – ${ctx.project.title}` }, parsed.file)
    await payload.update({ collection: 'news-posts', id: postId, data: { featuredImage: mediaId }, overrideAccess: true })
  } catch {
    return { error: 'Bild konnte nicht hochgeladen werden.' }
  }

  revalidateNews(locale, slug)
  return { ok: true }
}

export async function removeNewsFeaturedImage(slug: string, locale: string, postId: string): Promise<NewsActionState> {
  const ctx = await getProjectManagerContext(slug)
  if (!ctx) return { error: 'Nicht berechtigt.' }
  try {
    const payload = await getPayload({ config })
    if (!(await getProjectNewsPost(payload, ctx.project.id, postId))) return { error: 'Beitrag nicht gefunden.' }
    await payload.update({ collection: 'news-posts', id: postId, data: { featuredImage: null }, overrideAccess: true })
  } catch {
    return { error: 'Bild konnte nicht entfernt werden.' }
  }
  revalidateNews(locale, slug)
  return { ok: true }
}

/**
 * Set publish state. 'draft' → unpublished; 'now' → publish immediately (+notify
 * members); 'schedule' → publishedAt set to a future date (news queries gate on
 * publishedAt <= now, so it appears automatically; no notification fires for
 * scheduled posts since there's no scheduler).
 */
export async function setNewsPublish(
  slug: string,
  locale: string,
  postId: string,
  mode: 'draft' | 'now' | 'schedule',
  scheduledAt?: string,
): Promise<NewsActionState> {
  const ctx = await getProjectManagerContext(slug)
  if (!ctx) return { error: 'Nicht berechtigt.' }

  try {
    const payload = await getPayload({ config })
    const post = await getProjectNewsPost(payload, ctx.project.id, postId)
    if (!post) return { error: 'Beitrag nicht gefunden.' }

    const prevPublishedAt = (post as { publishedAt?: string | null }).publishedAt ?? null
    const wasLive = !!prevPublishedAt && new Date(prevPublishedAt).getTime() <= Date.now()

    let publishedAt: string | null
    if (mode === 'draft') {
      publishedAt = null
    } else if (mode === 'now') {
      publishedAt = new Date().toISOString()
    } else {
      if (!scheduledAt) return { error: 'Bitte ein Datum wählen.' }
      const d = new Date(scheduledAt)
      if (Number.isNaN(d.getTime())) return { error: 'Ungültiges Datum.' }
      if (d.getTime() <= Date.now()) return { error: 'Der Zeitpunkt muss in der Zukunft liegen.' }
      publishedAt = d.toISOString()
    }

    await payload.update({ collection: 'news-posts', id: postId, data: { publishedAt }, overrideAccess: true })

    if (mode === 'now' && !wasLive) {
      await emitActivity({ type: 'news.published', userId: String(ctx.user.id), projectId: ctx.project.id, reference: { collection: 'news-posts', id: postId } })
      await notifyMembers(payload, ctx.project.id, String(ctx.user.id), { collection: 'news-posts', id: postId })
    }
  } catch {
    return { error: 'Status konnte nicht geändert werden.' }
  }

  revalidateNews(locale, slug)
  return { ok: true }
}

export async function deleteProjectNewsPost(slug: string, locale: string, postId: string): Promise<NewsActionState> {
  const ctx = await getProjectManagerContext(slug)
  if (!ctx) return { error: 'Nicht berechtigt.' }

  try {
    const payload = await getPayload({ config })
    if (!(await getProjectNewsPost(payload, ctx.project.id, postId))) return { error: 'Beitrag nicht gefunden.' }
    await payload.delete({ collection: 'news-posts', id: postId, overrideAccess: true })
  } catch {
    return { error: 'Beitrag konnte nicht gelöscht werden.' }
  }

  revalidateNews(locale, slug)
  return { ok: true }
}
