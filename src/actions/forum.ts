'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'
import type { Payload } from 'payload'
import type { ForumThread, ForumComment } from '@/payload-types'
import { getUser } from '@/lib/auth/getUser'
import { isProjectManager } from '@/lib/access/project'
import { getViewerTier } from '@/lib/visibility'
import { markdownToLexical } from '@/lib/richtext'
import { uniqueSlug } from '@/lib/slugify'
import { emitActivity } from '@/lib/events'

export type ForumActionState = { error?: string; ok?: boolean }

const relId = (v: unknown): string | null => (v == null ? null : typeof v === 'object' ? String((v as { id: unknown }).id) : String(v))

function revalidateForum(locale: string, slug: string, threadSlug?: string) {
  revalidatePath(`/${locale}/dashboard/projekte/${slug}/m/forum`)
  if (threadSlug) revalidatePath(`/${locale}/dashboard/projekte/${slug}/m/forum/${threadSlug}`)
}

async function projectBySlug(payload: Payload, slug: string) {
  const res = await payload.find({ collection: 'projects', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true })
  return res.docs[0] as { id: string } | undefined
}

/** Resolve a member context (active member of the project), or an error. */
async function memberCtx(slug: string) {
  const user = await getUser()
  if (!user) return { error: 'Bitte melde dich an.' as const }
  const payload = await getPayload({ config })
  const project = await projectBySlug(payload, slug)
  if (!project) return { error: 'Projekt nicht gefunden.' as const }
  const tier = await getViewerTier(payload, String(user.id), project.id)
  if (tier === 'public') return { error: 'Nur Projektmitglieder haben Zugriff.' as const }
  return { payload, user, project, tier }
}

export async function createThread(slug: string, locale: string, input: { title: string; body?: string }): Promise<ForumActionState> {
  const ctx = await memberCtx(slug)
  if ('error' in ctx) return { error: ctx.error }
  const title = input.title.trim()
  if (!title) return { error: 'Titel darf nicht leer sein.' }

  try {
    const content = input.body?.trim() ? ((await markdownToLexical(input.body)) as ForumThread['content']) : undefined
    const thread = await ctx.payload.create({
      collection: 'forum-threads',
      data: { title, slug: uniqueSlug(title, 'thema'), content, visibility: 'INTERNAL', author: ctx.user.id, project: ctx.project.id },
      overrideAccess: true,
    })
    await emitActivity({ type: 'forum.thread.created', userId: String(ctx.user.id), projectId: ctx.project.id, reference: { collection: 'forum-threads', id: String(thread.id) } })
  } catch {
    return { error: 'Thema konnte nicht erstellt werden.' }
  }
  revalidateForum(locale, slug)
  return { ok: true }
}

/** Verify a thread belongs to the project; returns it or null. */
async function getThread(payload: Payload, projectId: string, threadId: string) {
  const t = await payload.findByID({ collection: 'forum-threads', id: threadId, depth: 0, overrideAccess: true }).catch(() => null)
  if (!t || relId((t as { project?: unknown }).project) !== String(projectId)) return null
  return t
}

export async function deleteThread(slug: string, locale: string, threadId: string): Promise<ForumActionState> {
  const ctx = await memberCtx(slug)
  if ('error' in ctx) return { error: ctx.error }
  try {
    const thread = await getThread(ctx.payload, ctx.project.id, threadId)
    if (!thread) return { error: 'Thema nicht gefunden.' }
    const isAuthor = relId((thread as { author?: unknown }).author) === String(ctx.user.id)
    const isPM = await isProjectManager(ctx.payload, String(ctx.user.id), ctx.project.id)
    if (!isAuthor && !isPM) return { error: 'Keine Berechtigung.' }

    await ctx.payload.delete({ collection: 'forum-comments', where: { thread: { equals: threadId } }, overrideAccess: true })
    await ctx.payload.delete({ collection: 'forum-thread-votes', where: { thread: { equals: threadId } }, overrideAccess: true })
    await ctx.payload.delete({ collection: 'forum-threads', id: threadId, overrideAccess: true })
  } catch {
    return { error: 'Thema konnte nicht gelöscht werden.' }
  }
  revalidateForum(locale, slug)
  return { ok: true }
}

async function setThreadFlag(slug: string, locale: string, threadId: string, field: 'pinned' | 'locked', value: boolean): Promise<ForumActionState> {
  const user = await getUser()
  if (!user) return { error: 'Nicht angemeldet.' }
  const payload = await getPayload({ config })
  const project = await projectBySlug(payload, slug)
  if (!project) return { error: 'Projekt nicht gefunden.' }
  if (!(await isProjectManager(payload, String(user.id), project.id))) return { error: 'Nur Projektmanager:innen.' }
  try {
    const thread = await getThread(payload, project.id, threadId)
    if (!thread) return { error: 'Thema nicht gefunden.' }
    await payload.update({ collection: 'forum-threads', id: threadId, data: { [field]: value }, overrideAccess: true })
  } catch {
    return { error: 'Aktion fehlgeschlagen.' }
  }
  revalidateForum(locale, slug, (await getThreadSlug(payload, threadId)))
  return { ok: true }
}
async function getThreadSlug(payload: Payload, threadId: string): Promise<string | undefined> {
  const t = await payload.findByID({ collection: 'forum-threads', id: threadId, depth: 0, overrideAccess: true }).catch(() => null)
  return (t as { slug?: string } | null)?.slug
}

export async function toggleThreadPin(slug: string, locale: string, threadId: string, pinned: boolean): Promise<ForumActionState> {
  return setThreadFlag(slug, locale, threadId, 'pinned', pinned)
}
export async function toggleThreadLock(slug: string, locale: string, threadId: string, locked: boolean): Promise<ForumActionState> {
  return setThreadFlag(slug, locale, threadId, 'locked', locked)
}

export async function postForumComment(slug: string, locale: string, threadId: string, body: string): Promise<ForumActionState> {
  const ctx = await memberCtx(slug)
  if ('error' in ctx) return { error: ctx.error }
  const text = body.trim()
  if (!text) return { error: 'Kommentar darf nicht leer sein.' }
  try {
    const thread = await getThread(ctx.payload, ctx.project.id, threadId)
    if (!thread) return { error: 'Thema nicht gefunden.' }
    if ((thread as { locked?: boolean }).locked) return { error: 'Dieses Thema ist geschlossen.' }
    const content = (await markdownToLexical(text)) as ForumComment['content']
    await ctx.payload.create({ collection: 'forum-comments', data: { thread: threadId, content, author: ctx.user.id }, overrideAccess: true })
    revalidateForum(locale, slug, (thread as { slug?: string }).slug)
  } catch {
    return { error: 'Kommentar konnte nicht gespeichert werden.' }
  }
  return { ok: true }
}

export async function deleteForumComment(slug: string, locale: string, commentId: string): Promise<ForumActionState> {
  const ctx = await memberCtx(slug)
  if ('error' in ctx) return { error: ctx.error }
  try {
    const comment = await ctx.payload.findByID({ collection: 'forum-comments', id: commentId, depth: 1, overrideAccess: true }).catch(() => null)
    if (!comment) return { error: 'Kommentar nicht gefunden.' }
    const thread = (comment as { thread?: unknown }).thread
    const threadProject = thread && typeof thread === 'object' ? relId((thread as { project?: unknown }).project) : null
    if (threadProject !== String(ctx.project.id)) return { error: 'Kommentar nicht gefunden.' }
    const isAuthor = relId((comment as { author?: unknown }).author) === String(ctx.user.id)
    const isPM = await isProjectManager(ctx.payload, String(ctx.user.id), ctx.project.id)
    if (!isAuthor && !isPM) return { error: 'Keine Berechtigung.' }
    await ctx.payload.delete({ collection: 'forum-comments', id: commentId, overrideAccess: true })
  } catch {
    return { error: 'Kommentar konnte nicht gelöscht werden.' }
  }
  revalidateForum(locale, slug)
  return { ok: true }
}

export async function toggleThreadVote(slug: string, locale: string, threadId: string): Promise<ForumActionState> {
  const ctx = await memberCtx(slug)
  if ('error' in ctx) return { error: ctx.error }
  try {
    const thread = await getThread(ctx.payload, ctx.project.id, threadId)
    if (!thread) return { error: 'Thema nicht gefunden.' }
    const existing = await ctx.payload.find({ collection: 'forum-thread-votes', where: { and: [{ thread: { equals: threadId } }, { user: { equals: ctx.user.id } }] }, limit: 1, depth: 0, overrideAccess: true })
    if (existing.totalDocs > 0) {
      await ctx.payload.delete({ collection: 'forum-thread-votes', id: existing.docs[0].id, overrideAccess: true })
    } else {
      await ctx.payload.create({ collection: 'forum-thread-votes', data: { thread: threadId, user: ctx.user.id, project: ctx.project.id }, overrideAccess: true })
    }
  } catch {
    return { error: 'Aktion fehlgeschlagen.' }
  }
  revalidateForum(locale, slug)
  return { ok: true }
}
