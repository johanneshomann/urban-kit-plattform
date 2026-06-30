/** Canonical module ids, ordered, with their German labels. */
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

export type ModuleId = (typeof MODULE_ORDER)[number]

export const MODULE_LABELS: Record<string, string> = {
  news: 'News',
  calendar: 'Kalender',
  polls: 'Umfragen',
  forum: 'Forum',
  tasks: 'Aufgaben',
  chat: 'Chat',
  board: 'Board',
  files: 'Dateien',
  'urban-agent': 'Urban Agent',
}

/** Modules that currently have a content-authoring UI in the manage area. */
export const AUTHORABLE_MODULES: ReadonlySet<string> = new Set(['news', 'calendar', 'polls', 'files'])

/**
 * Modules that surface in the manage INHALTE group — either authored there
 * (news/calendar/polls) or managed/moderated there (forum). Grows as more
 * modules gain a manage surface (tasks, board, chat settings).
 */
export const MANAGE_MODULES: ReadonlySet<string> = new Set(['news', 'calendar', 'polls', 'forum', 'files', 'chat'])
