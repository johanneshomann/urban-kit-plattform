// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

/**
 * Canonical module ids, ordered. Chat is NOT a module — it is a platform-wide
 * feature (floating launcher in the dashboard layout); projects only structure
 * the room list via project rooms and project-assigned groups.
 */
export const MODULE_ORDER = [
  'news',
  'calendar',
  'polls',
  'forum',
  'tasks',
  'board',
  'files',
  'urban-agent',
] as const

/**
 * Project-workspace section grouping (logged-in project page).
 *   Mitmachen (participation) vs. Zusammen arbeiten (collaboration).
 */
export const PARTICIPATE_MODULES = ['news', 'calendar', 'polls', 'forum'] as const
export const COLLABORATE_MODULES = ['tasks', 'board', 'files', 'urban-agent'] as const

/**
 * Modules that surface in the manage INHALTE group — either authored there
 * (news/calendar/polls) or managed/moderated there (forum). Grows as more
 * modules gain a manage surface (tasks, board).
 */
export const MANAGE_MODULES: ReadonlySet<string> = new Set(['news', 'calendar', 'polls', 'forum', 'files', 'board'])
