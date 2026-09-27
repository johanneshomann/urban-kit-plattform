// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import type { Payload, CollectionSlug, Where } from 'payload'

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
 * Permanently delete a project and all of its project-scoped content, across
 * every module incl. nested children (poll options/votes, forum comments, chat
 * messages, task assignees), then the project itself (that delete must
 * succeed and throws otherwise). Shared by the PM "Projekt löschen" action and
 * maintenance scripts — never delete a project through the bare Payload admin,
 * it leaves all of this orphaned.
 */
export async function cascadeDeleteProject(payload: Payload, id: string | number): Promise<void> {
  const byProject: Where = { project: { equals: id } }
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
    await tryDeleteMany(payload, 'project-memberships', byProject)
    // Finally the project itself — this one must succeed
    await payload.delete({ collection: 'projects', id, overrideAccess: true })
}
