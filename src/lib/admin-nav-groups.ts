// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import type { Plugin } from 'payload'

type Label = { de: string; en: string }

/**
 * Sidebar grouping for the admin. Module collections are contributed by
 * plugins, so the grouping is applied in ONE place as a final plugin instead
 * of an `admin.group` line in ~30 collection files. A collection that sets its
 * own group keeps it. Order of first appearance defines the sidebar order —
 * the collections array is re-sorted accordingly.
 */
export const NAV_GROUPS: { label: Label; slugs: string[] }[] = [
  { label: { de: 'Projekte', en: 'Projects' }, slugs: ['projects', 'project-memberships'] },
  { label: { de: 'Konten & Medien', en: 'Accounts & media' }, slugs: ['users', 'media'] },
  { label: { de: 'Modul-Inhalte', en: 'Module content' }, slugs: ['news-posts', 'calendar-events', 'polls', 'forum-threads', 'tasks', 'board-canvases', 'file-uploads', 'folders'] },
  { label: { de: 'Modul-Details', en: 'Module details' }, slugs: ['news-comments', 'event-attendees', 'poll-questions', 'poll-options', 'poll-votes', 'forum-comments', 'forum-thread-votes', 'task-columns', 'task-assignees'] },
  { label: { de: 'Chat', en: 'Chat' }, slugs: ['chat-rooms', 'chat-room-members', 'chat-messages'] },
  { label: { de: 'System', en: 'System' }, slugs: ['activity', 'notifications', 'saved-items'] },
]

export const SETTINGS_GROUP: Label = { de: 'Einstellungen', en: 'Settings' }

/** Groups that start collapsed on a user's first visit (support data, rarely needed). */
export const COLLAPSED_GROUPS: Label[] = NAV_GROUPS.filter((g) => ['Modul-Details', 'Chat', 'System'].includes(g.label.de)).map((g) => g.label)

export const adminNavGroups: Plugin = (config) => {
  const rank = new Map<string, number>()
  const groupOf = new Map<string, Label>()
  let i = 0
  for (const g of NAV_GROUPS) for (const slug of g.slugs) { rank.set(slug, i++); groupOf.set(slug, g.label) }

  const collections = (config.collections ?? [])
    .map((c) => ({ ...c, admin: { ...c.admin, group: c.admin?.group ?? groupOf.get(c.slug) } }))
    .sort((a, b) => (rank.get(a.slug) ?? 999) - (rank.get(b.slug) ?? 999))
  const globals = (config.globals ?? []).map((g) => ({ ...g, admin: { ...g.admin, group: SETTINGS_GROUP } }))
  return { ...config, collections, globals }
}
