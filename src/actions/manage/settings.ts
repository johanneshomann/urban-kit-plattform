'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Payload, CollectionSlug, Where } from 'payload'
import { getProjectManagerContext } from '@/lib/auth/requireProjectManager'

export type SettingsActionState = { error?: string; ok?: boolean }

export async function updateProjectVisibility(
  slug: string,
  locale: string,
  input: { isPublic: boolean; joinRequestsEnabled: boolean },
): Promise<SettingsActionState> {
  const ctx = await getProjectManagerContext(slug)
  if (!ctx) return { error: 'Nicht berechtigt.' }

  try {
    const payload = await getPayload({ config })
    const data: Record<string, unknown> = {
      isPublic: !!input.isPublic,
      joinRequestsEnabled: !!input.joinRequestsEnabled,
    }
    await payload.update({ collection: 'projects', id: ctx.project.id, data, overrideAccess: true })
  } catch {
    return { error: 'Einstellungen konnten nicht gespeichert werden.' }
  }

  revalidatePath(`/${locale}/dashboard/projekte/${slug}`)
  revalidatePath(`/${locale}/dashboard/projekte/${slug}/manage/einstellungen`)
  return { ok: true }
}

/** Collect document ids matching a query (no pagination). */
async function idsOf(payload: Payload, collection: CollectionSlug, where: Where): Promise<string[]> {
  const res = await payload.find({ collection, where, limit: 0, depth: 0, overrideAccess: true })
  return res.docs.map((d) => String((d as { id: string | number }).id))
}

/** Best-effort delete — never throws, so one module's cleanup can't block the rest. */
async function tryDeleteMany(payload: Payload, collection: CollectionSlug, where: Where): Promise<void> {
  try {
    await payload.delete({ collection, where, overrideAccess: true })
  } catch {
    // ignore — orphaned content is preferable to a half-deleted project
  }
}

/**
 * Permanently delete a project and all of its project-scoped content. Requires
 * the PM to retype the project title. Cascades across modules (incl. nested
 * children like poll options/votes, forum comments, chat messages, task
 * assignees), then removes the project itself and redirects to the dashboard.
 */
export async function deleteProject(slug: string, locale: string, confirmTitle: string): Promise<SettingsActionState> {
  const ctx = await getProjectManagerContext(slug)
  if (!ctx) return { error: 'Nicht berechtigt.' }

  if (confirmTitle.trim() !== ctx.project.title.trim()) {
    return { error: 'Der eingegebene Projektname stimmt nicht überein.' }
  }

  const id = ctx.project.id
  const byProject: Where = { project: { equals: id } }

  try {
    const payload = await getPayload({ config })

    // Polls → votes, options, questions, polls
    const pollIds = await idsOf(payload, 'polls', byProject)
    if (pollIds.length) {
      const questionIds = await idsOf(payload, 'poll-questions', { poll: { in: pollIds } })
      await tryDeleteMany(payload, 'poll-votes', { poll: { in: pollIds } })
      if (questionIds.length) await tryDeleteMany(payload, 'poll-options', { question: { in: questionIds } })
      await tryDeleteMany(payload, 'poll-questions', { poll: { in: pollIds } })
      await tryDeleteMany(payload, 'polls', byProject)
    }

    // Forum → comments, threads
    const threadIds = await idsOf(payload, 'forum-threads', byProject)
    if (threadIds.length) {
      await tryDeleteMany(payload, 'forum-comments', { thread: { in: threadIds } })
      await tryDeleteMany(payload, 'forum-threads', byProject)
    }

    // Chat → messages, members, rooms (project-scoped rooms only)
    const roomIds = await idsOf(payload, 'chat-rooms', byProject)
    if (roomIds.length) {
      await tryDeleteMany(payload, 'chat-messages', { room: { in: roomIds } })
      await tryDeleteMany(payload, 'chat-room-members', { room: { in: roomIds } })
      await tryDeleteMany(payload, 'chat-rooms', byProject)
    }

    // Tasks → assignees, tasks, columns
    const taskIds = await idsOf(payload, 'tasks', byProject)
    if (taskIds.length) {
      await tryDeleteMany(payload, 'task-assignees', { task: { in: taskIds } })
      await tryDeleteMany(payload, 'tasks', byProject)
    }
    await tryDeleteMany(payload, 'task-columns', byProject)

    // Remaining directly project-scoped collections
    await tryDeleteMany(payload, 'calendar-events', byProject)
    await tryDeleteMany(payload, 'event-attendees', byProject)
    await tryDeleteMany(payload, 'news-posts', byProject)
    await tryDeleteMany(payload, 'news-comments', byProject)
    await tryDeleteMany(payload, 'forum-thread-votes', byProject)
    await tryDeleteMany(payload, 'board-canvases', byProject)
    await tryDeleteMany(payload, 'file-uploads', byProject)
    await tryDeleteMany(payload, 'folders', byProject)
    await tryDeleteMany(payload, 'media', byProject)
    await tryDeleteMany(payload, 'activity', byProject)
    await tryDeleteMany(payload, 'teams', byProject)
    await tryDeleteMany(payload, 'project-memberships', byProject)

    // Finally the project itself — this one must succeed
    await payload.delete({ collection: 'projects', id, overrideAccess: true })
  } catch {
    return { error: 'Projekt konnte nicht gelöscht werden.' }
  }

  revalidatePath(`/${locale}/dashboard`)
  redirect(`/${locale}/dashboard`)
}
