// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'
import type { Payload } from 'payload'
import type { NewsPost } from '@/payload-types'
import { getProjectManagerContext, getContentAuthorContext } from '@/lib/auth/requireProjectManager'
import { clampTeamsToCatalog, clampAuthorVisibility } from '@/lib/team-scope'
import { markdownToLexical } from '@/lib/richtext'
import { readImageFile, uploadProjectMedia } from '@/lib/upload-media'
import { emitActivity, emitNotifications } from '@/lib/events'
import { uniqueSlug } from '@/lib/slugify'

export type NewsActionState = { error?: string; ok?: boolean }

const VISIBILITIES = new Set(['PUBLIC', 'PROJECT', 'TEAM'])
const vis = (v: unknown): 'PUBLIC' | 'PROJECT' | 'TEAM' => (VISIBILITIES.has(v as string) ? (v as 'PUBLIC' | 'PROJECT' | 'TEAM') : 'PROJECT')

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

type LexNode = { type?: string; children?: LexNode[]; [k: string]: unknown }

/**
 * Link nodes differ between vanilla Lexical (editor popup: `url` on the node)
 * and Payload's LinkFeature (storage: `fields.url`). Convert recursively so
 * states round-trip between the frontend editor and Payload validation.
 */
function mapLinkNodes(node: LexNode, dir: 'toPayload' | 'toVanilla'): LexNode {
  const out: LexNode = { ...node }
  if (node.type === 'link' || node.type === 'autolink') {
    if (dir === 'toPayload' && typeof node.url === 'string') {
      out.fields = { linkType: 'custom', url: node.url, newTab: false }
      out.version = 3
      delete out.url
      delete out.rel
      delete out.target
      delete out.title
    } else if (dir === 'toVanilla' && node.fields && typeof node.fields === 'object') {
      const f = node.fields as { url?: string; newTab?: boolean }
      out.url = f.url ?? ''
      out.rel = null
      out.target = f.newTab ? '_blank' : null
      out.title = null
      out.version = 1
      delete out.fields
    }
  }
  // The serialized state nests everything under `root` (not `children`)
  if (node.root && typeof node.root === 'object') out.root = mapLinkNodes(node.root as LexNode, dir)
  if (Array.isArray(node.children)) out.children = node.children.map((c) => mapLinkNodes(c, dir))
  return out
}

/**
 * PM-or-author context for ONE existing post: PMs manage every post, team
 * leads only the posts they authored (their team-scoped news). Null when the
 * caller has no rights on this post — callers answer 'Nicht berechtigt.'.
 */
async function getNewsManageContext(slug: string, postId: string) {
  const ctx = await getContentAuthorContext(slug)
  if (!ctx) return null
  const post = await getProjectNewsPost(ctx.payload, ctx.project.id, postId)
  if (!post) return null
  if (!ctx.isPM) {
    const authorId = typeof post.author === 'object' ? (post.author as { id?: unknown } | null)?.id : post.author
    if (String(authorId) !== String(ctx.user.id)) return null
  }
  return { ...ctx, post }
}

/** Notify all active members (except the author) of newly published content. */
async function notifyMembers(payload: Payload, projectId: string, exceptUserId: string, reference: { collectionSlug: string; id: string }) {
  const members = await payload.find({
    collection: 'project-memberships',
    where: { and: [{ project: { equals: projectId } }, { status: { equals: 'active' } }] },
    limit: 500,
    depth: 0,
    overrideAccess: true,
  })
  const userIds = members.docs
    .map((m) => {
      const u = (m as { user?: unknown }).user
      return u == null ? null : typeof u === 'object' ? String((u as { id: unknown }).id) : String(u)
    })
    .filter((id): id is string => !!id && id !== exceptUserId)
  // Chunked-concurrent — publishing to a big project must not serialize
  // hundreds of notification writes.
  await emitNotifications(userIds.map((userId) => ({ type: 'new_content' as const, userId, reference })))
}

export async function createProjectNewsPost(
  slug: string,
  locale: string,
  input: { title: string; body?: string; visibility?: string; visibilityTeams?: string[] },
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
        visibilityTeams: vis(input.visibility) === 'TEAM' ? clampTeamsToCatalog(input.visibilityTeams, ctx.project.teams) : [],
        author: ctx.user.id,
        project: ctx.project.id,
        // publishedAt left null → draft
      },
      overrideAccess: true,
    })
    await emitActivity({ type: 'news.created', userId: String(ctx.user.id), projectId: ctx.project.id, reference: { collectionSlug: 'news-posts', id: String(post.id) } })
  } catch {
    return { error: 'Beitrag konnte nicht erstellt werden.' }
  }

  revalidateNews(locale, slug)
  return { ok: true }
}

export interface NewsEditData {
  title: string
  /** Serialized Lexical editor state (Payload's storage shape) — no markdown round-trip. */
  content: string | null
  visibility: string
  visibilityTeams: string[]
  featuredImageUrl: string | null
  publishedAt: string | null
}

/** Edit payload for the news edit popup (body converted back to markdown). */
export async function getNewsEditData(
  slug: string,
  postId: string,
): Promise<{ data: NewsEditData } | { error: string }> {
  const ctx = await getNewsManageContext(slug, postId)
  if (!ctx) return { error: 'Nicht berechtigt.' }

  try {
    const { payload, post } = ctx
    // Featured image is an id at depth 0 — resolve its URL separately
    let featuredImageUrl: string | null = null
    if (post.featuredImage) {
      const mediaId = typeof post.featuredImage === 'object' ? (post.featuredImage as { id: unknown }).id : post.featuredImage
      const media = await payload.findByID({ collection: 'media', id: String(mediaId), depth: 0, overrideAccess: true }).catch(() => null)
      featuredImageUrl = (media as { url?: string } | null)?.url ?? null
    }
    return {
      data: {
        title: post.title ?? '',
        content: post.content ? JSON.stringify(mapLinkNodes(post.content as unknown as LexNode, 'toVanilla')) : null,
        visibility: vis(post.visibility),
        visibilityTeams: Array.isArray(post.visibilityTeams) ? post.visibilityTeams : [],
        featuredImageUrl,
        publishedAt: post.publishedAt ?? null,
      },
    }
  } catch {
    return { error: 'Beitrag konnte nicht geladen werden.' }
  }
}

export async function updateProjectNewsPost(
  slug: string,
  locale: string,
  postId: string,
  input: { title: string; body?: string; contentState?: string; visibility?: string; visibilityTeams?: string[] },
): Promise<NewsActionState> {
  const ctx = await getNewsManageContext(slug, postId)
  if (!ctx) return { error: 'Nicht berechtigt.' }

  const title = input.title.trim()
  if (!title) return { error: 'Titel darf nicht leer sein.' }

  // Content: `contentState` = serialized Lexical state (popup editor);
  // `body` = markdown (legacy manager textarea); neither = leave untouched.
  let content: unknown
  if (typeof input.contentState === 'string') {
    if (!input.contentState.trim()) {
      content = null
    } else {
      try {
        const parsed: unknown = JSON.parse(input.contentState)
        if (!parsed || typeof parsed !== 'object' || !(parsed as { root?: unknown }).root) return { error: 'Ungültiger Inhalt.' }
        content = mapLinkNodes(parsed as LexNode, 'toPayload')
      } catch {
        return { error: 'Ungültiger Inhalt.' }
      }
    }
  } else if (typeof input.body === 'string') {
    content = input.body.trim() ? await markdownToLexical(input.body) : null
  }

  try {
    const { payload } = ctx
    // PMs keep their visibility choice; leads are clamped to their led teams
    const clamped = clampAuthorVisibility(ctx, input.visibility, input.visibilityTeams, ctx.project.teams)
    const data: Record<string, unknown> = {
      title,
      content,
      visibility: clamped.visibility,
      visibilityTeams: clamped.visibilityTeams,
    }
    await payload.update({ collection: 'news-posts', id: postId, data, overrideAccess: true })
  } catch (e) {
    // Surface the real cause in the dev console — the user only sees the generic message.
    console.error('[news] updateProjectNewsPost failed:', e)
    const err = e as { data?: unknown }
    if (err.data) console.error('[news] error data:', JSON.stringify(err.data))
    return { error: 'Beitrag konnte nicht gespeichert werden.' }
  }

  revalidateNews(locale, slug)
  return { ok: true }
}

export async function setNewsFeaturedImage(slug: string, locale: string, postId: string, formData: FormData): Promise<NewsActionState> {
  const ctx = await getNewsManageContext(slug, postId)
  if (!ctx) return { error: 'Nicht berechtigt.' }

  const parsed = await readImageFile(formData)
  if ('error' in parsed) return { error: parsed.error }

  try {
    const { payload } = ctx
    const mediaId = await uploadProjectMedia(payload, { projectId: ctx.project.id, userId: String(ctx.user.id), alt: `News – ${ctx.project.title}` }, parsed.file)
    await payload.update({ collection: 'news-posts', id: postId, data: { featuredImage: mediaId }, overrideAccess: true })
  } catch {
    return { error: 'Bild konnte nicht hochgeladen werden.' }
  }

  revalidateNews(locale, slug)
  return { ok: true }
}

export async function removeNewsFeaturedImage(slug: string, locale: string, postId: string): Promise<NewsActionState> {
  const ctx = await getNewsManageContext(slug, postId)
  if (!ctx) return { error: 'Nicht berechtigt.' }
  try {
    await ctx.payload.update({ collection: 'news-posts', id: postId, data: { featuredImage: null }, overrideAccess: true })
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
  const ctx = await getNewsManageContext(slug, postId)
  if (!ctx) return { error: 'Nicht berechtigt.' }

  try {
    const { payload, post } = ctx

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
      await emitActivity({ type: 'news.published', userId: String(ctx.user.id), projectId: ctx.project.id, reference: { collectionSlug: 'news-posts', id: postId } })
      await notifyMembers(payload, ctx.project.id, String(ctx.user.id), { collectionSlug: 'news-posts', id: postId })
    }
  } catch {
    return { error: 'Status konnte nicht geändert werden.' }
  }

  revalidateNews(locale, slug)
  return { ok: true }
}

export async function deleteProjectNewsPost(slug: string, locale: string, postId: string): Promise<NewsActionState> {
  const ctx = await getNewsManageContext(slug, postId)
  if (!ctx) return { error: 'Nicht berechtigt.' }

  try {
    await ctx.payload.delete({ collection: 'news-posts', id: postId, overrideAccess: true })
  } catch {
    return { error: 'Beitrag konnte nicht gelöscht werden.' }
  }

  revalidateNews(locale, slug)
  return { ok: true }
}
