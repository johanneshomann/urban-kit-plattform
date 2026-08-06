/** Canonical module ids, ordered. */
export const MODULE_ORDER = [
  'news',
  'calendar',
  'polls',
  'forum',
  'tasks',
  'chat',
  'board',
  'files',
  'urban-agent',
] as const

/**
 * Project-workspace section grouping (logged-in project page).
 *   Mitmachen (participation) vs. Zusammen arbeiten (collaboration).
 * Chat is intentionally excluded — it surfaces as a floating pop-up, not a card.
 */
export const PARTICIPATE_MODULES = ['news', 'calendar', 'polls', 'forum'] as const
export const COLLABORATE_MODULES = ['tasks', 'board', 'files', 'urban-agent'] as const

/**
 * Modules that surface in the manage INHALTE group — either authored there
 * (news/calendar/polls) or managed/moderated there (forum). Grows as more
 * modules gain a manage surface (tasks, board, chat settings).
 */
export const MANAGE_MODULES: ReadonlySet<string> = new Set(['news', 'calendar', 'polls', 'forum', 'files', 'chat', 'board'])
