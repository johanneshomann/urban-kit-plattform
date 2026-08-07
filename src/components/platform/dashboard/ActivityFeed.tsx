'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { BarChart3, Calendar, Newspaper, MessageSquare, CheckSquare, FolderOpen, Kanban, FileText, UserPlus, ArrowUpRight, ChevronDown } from 'lucide-react'

type ActivityItem = {
  type: 'poll' | 'pollActivated' | 'event' | 'eventSoon' | 'news' | 'forum' | 'forumComment' | 'threadPinned' | 'threadLocked' | 'task' | 'taskDone' | 'taskAssigned' | 'taskDueSoon' | 'file' | 'board' | 'newsComment' | 'memberJoined'
  title: string
  projectTitle: string
  projectSlug: string
  projectId: string
  date?: string
  schemeGeneral: string
  schemeAccent: string
  schemeLight: string
  schemeDark: string
}

type SortMode = 'project' | 'date'

function activityIcon(type: ActivityItem['type']) {
  const className = 'h-4 w-4'
  switch (type) {
    case 'poll':
    case 'pollActivated': return <BarChart3 className={className} />
    case 'event':
    case 'eventSoon': return <Calendar className={className} />
    case 'news': return <Newspaper className={className} />
    case 'forum':
    case 'forumComment':
    case 'threadPinned':
    case 'threadLocked': return <MessageSquare className={className} />
    case 'task':
    case 'taskDone':
    case 'taskAssigned':
    case 'taskDueSoon': return <CheckSquare className={className} />
    case 'file': return <FolderOpen className={className} />
    case 'board': return <Kanban className={className} />
    case 'newsComment': return <FileText className={className} />
    case 'memberJoined': return <UserPlus className={className} />
  }
}


export function ActivityFeed({
  items,
  projects,
  locale,
}: {
  items: ActivityItem[]
  projects: { id: string; title: string }[]
  locale: string
}) {
  const t = useTranslations('dashboard')
  const tp = useTranslations('platform')
  const [sortMode, setSortMode] = useState<SortMode>('project')
  const [expanded, setExpanded] = useState(false)
  const [projectFilter, setProjectFilter] = useState<string>('ALL')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [projectOpen, setProjectOpen] = useState(false)
  const [typeOpen, setTypeOpen] = useState(false)
  const MAX_VISIBLE = 8

  const formatRelativeDate = (dateStr?: string): string | null => {
    if (!dateStr) return null
    const diff = Date.now() - new Date(dateStr).getTime()
    if (diff < 0) {
      return new Date(dateStr).toLocaleDateString(
        locale === 'en' ? 'en-GB' : 'de-DE',
        { day: 'numeric', month: 'short' },
      )
    }
    const seconds = Math.floor(diff / 1000)
    if (seconds < 60) return tp('dateJustNow')
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return tp('dateMinutesAgo', { minutes })
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return tp('dateHoursAgo', { hours })
    const days = Math.floor(hours / 24)
    if (days === 1) return tp('dateYesterday')
    return tp('dateDaysAgo', { days })
  }

  // Derive unique project titles from items
  const projectOptions = useMemo(() => {
    const seen = new Set<string>()
    const opts: string[] = []
    for (const item of items) {
      if (!seen.has(item.projectTitle)) {
        seen.add(item.projectTitle)
        opts.push(item.projectTitle)
      }
    }
    return opts
  }, [items])

  // Derive unique types actually present in items
  const presentTypes = useMemo(() => {
    const seen = new Set<ActivityItem['type']>()
    for (const item of items) {
      seen.add(item.type)
    }
    return Array.from(seen)
  }, [items])

  // Type label mapping
  const typeLabelMap: Record<string, string> = useMemo(() => ({
    poll: t('activityPoll', { title: '' }).replace(': ', '').trim(),
    pollActivated: t('activityPollActivated', { title: '' }).replace(': ', '').trim(),
    event: t('activityEvent', { title: '' }).replace(': ', '').trim(),
    eventSoon: t('activityEventSoon', { title: '' }).replace(': ', '').trim(),
    news: t('activityNews', { title: '' }).replace(': ', '').trim(),
    forum: t('activityForum', { title: '' }).replace(': ', '').trim(),
    forumComment: t('activityForumComment', { title: '' }).replace(': ', '').trim(),
    threadPinned: t('activityThreadPinned', { title: '' }).replace(': ', '').trim(),
    threadLocked: t('activityThreadLocked', { title: '' }).replace(': ', '').trim(),
    task: t('activityTask', { title: '' }).replace(': ', '').trim(),
    taskDone: t('activityTaskDone', { title: '' }).replace(': ', '').trim(),
    taskAssigned: t('activityTaskAssigned', { title: '' }).replace(': ', '').trim(),
    taskDueSoon: t('activityTaskDueSoon', { title: '' }).replace(': ', '').trim(),
    file: t('activityFile', { title: '' }).replace(': ', '').trim(),
    board: t('activityBoard', { title: '' }).replace(': ', '').trim(),
    newsComment: t('activityNewsComment', { title: '' }).replace(': ', '').trim(),
    memberJoined: t('activityMemberJoined', { name: '' }).trim(),
  }), [t])

  // Filter items by project + type
  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (projectFilter !== 'ALL' && item.projectTitle !== projectFilter) return false
      if (typeFilter !== 'ALL' && item.type !== typeFilter) return false
      return true
    })
  }, [items, projectFilter, typeFilter])

  const groupedByProject: Record<string, { title: string; items: ActivityItem[] }> = {}
  for (const item of filtered) {
    if (!groupedByProject[item.projectId]) {
      const p = projects.find((x) => x.id === item.projectId)
      if (!p) continue
      groupedByProject[item.projectId] = { title: p.title, items: [] }
    }
    groupedByProject[item.projectId].items.push(item)
  }

  const sortedByDate = [...filtered].sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0
    const db = b.date ? new Date(b.date).getTime() : 0
    return db - da
  })

  const flatItems =
    sortMode === 'project'
      ? Object.entries(groupedByProject).flatMap(([, g]) => g.items)
      : sortedByDate
  const visibleItems = expanded ? flatItems : flatItems.slice(0, MAX_VISIBLE)
  const hasMore = flatItems.length > MAX_VISIBLE

  const activityLabel = (item: ActivityItem) => {
    switch (item.type) {
      case 'poll': return t('activityPoll', { title: item.title })
      case 'pollActivated': return t('activityPollActivated', { title: item.title })
      case 'event': return t('activityEvent', { title: item.title })
      case 'eventSoon': return t('activityEventSoon', { title: item.title })
      case 'news': return t('activityNews', { title: item.title })
      case 'forum': return t('activityForum', { title: item.title })
      case 'forumComment': return t('activityForumComment', { title: item.title })
      case 'threadPinned': return t('activityThreadPinned', { title: item.title })
      case 'threadLocked': return t('activityThreadLocked', { title: item.title })
      case 'task': return t('activityTask', { title: item.title })
      case 'taskDone': return t('activityTaskDone', { title: item.title })
      case 'taskAssigned': return t('activityTaskAssigned', { title: item.title })
      case 'taskDueSoon': return t('activityTaskDueSoon', { title: item.title })
      case 'file': return t('activityFile', { title: item.title })
      case 'board': return t('activityBoard', { title: item.title })
      case 'newsComment': return t('activityNewsComment', { title: item.title })
      case 'memberJoined': return t('activityMemberJoined', { name: item.title })
    }
  }

  if (items.length === 0) return null

  const dropdownBase = (open: boolean) =>
    `absolute top-full left-0 mt-1 w-full rounded-lg border bg-white shadow-lg z-10 overflow-hidden ${open ? 'dropdown-enter' : 'hidden'}`

  return (
    <section aria-labelledby="activity-heading" className="px-6 md:px-10 py-10">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h2 id="activity-heading" className="text-small font-semibold uppercase tracking-wide opacity-50">
          {t('activityHeading')}
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filters (only when there's more than one item) */}
          {items.length > 1 && (
            <>
              {/* Project filter */}
              <div className="relative w-44">
                <button
                  type="button"
                  onClick={() => { setProjectOpen((v) => !v); setTypeOpen(false) }}
                  className="w-full flex items-center justify-between gap-1 px-2.5 py-1.5 rounded-md text-small border transition-colors hover:bg-black/5"
                  style={{ color: 'var(--app-ink)', borderColor: 'color-mix(in srgb, var(--app-ink) 15%, transparent)' }}
                  aria-haspopup="listbox"
                  aria-expanded={projectOpen}
                >
                  <span className="truncate">{projectFilter === 'ALL' ? t('activityFilterAll') : projectFilter}</span>
                  <ChevronDown aria-hidden="true" className="w-3 h-3 shrink-0 opacity-50" />
                </button>
                <div className={dropdownBase(projectOpen)} role="listbox" aria-label={t('activityFilterProject')}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={projectFilter === 'ALL'}
                    onClick={() => { setProjectFilter('ALL'); setProjectOpen(false) }}
                    className="w-full text-left px-3 py-1.5 text-small hover:bg-black/5 transition-colors"
                    style={{ color: 'var(--app-ink)' }}
                  >
                    {t('activityFilterAll')}
                  </button>
                  {projectOptions.map((title) => (
                    <button
                      key={title}
                      type="button"
                      role="option"
                      aria-selected={projectFilter === title}
                      onClick={() => { setProjectFilter(title); setProjectOpen(false) }}
                      className="w-full text-left px-3 py-1.5 text-small hover:bg-black/5 transition-colors"
                      style={{ color: 'var(--app-ink)' }}
                    >
                      {title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Type filter */}
              <div className="relative w-44">
                <button
                  type="button"
                  onClick={() => { setTypeOpen((v) => !v); setProjectOpen(false) }}
                  className="w-full flex items-center justify-between gap-1 px-2.5 py-1.5 rounded-md text-small border transition-colors hover:bg-black/5"
                  style={{ color: 'var(--app-ink)', borderColor: 'color-mix(in srgb, var(--app-ink) 15%, transparent)' }}
                  aria-haspopup="listbox"
                  aria-expanded={typeOpen}
                >
                  <span className="truncate">{typeFilter === 'ALL' ? t('activityFilterType') : typeLabelMap[typeFilter] ?? typeFilter}</span>
                  <ChevronDown aria-hidden="true" className="w-3 h-3 shrink-0 opacity-50" />
                </button>
                <div className={dropdownBase(typeOpen)} role="listbox" aria-label={t('activityFilterType')}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={typeFilter === 'ALL'}
                    onClick={() => { setTypeFilter('ALL'); setTypeOpen(false) }}
                    className="w-full text-left px-3 py-1.5 text-small hover:bg-black/5 transition-colors"
                    style={{ color: 'var(--app-ink)' }}
                  >
                    {t('activityFilterAll')}
                  </button>
                  {presentTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      role="option"
                      aria-selected={typeFilter === type}
                      onClick={() => { setTypeFilter(type); setTypeOpen(false) }}
                      className="w-full text-left px-3 py-1.5 text-small hover:bg-black/5 transition-colors"
                      style={{ color: 'var(--app-ink)' }}
                    >
                      {typeLabelMap[type] ?? type}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Sort toggle */}
          <div
            className="flex items-center gap-1 rounded-lg border p-0.5"
            style={{ borderColor: 'color-mix(in srgb, var(--app-ink) 15%, transparent)' }}
          >
            <button
              type="button"
              onClick={() => setSortMode('project')}
              className="px-3 py-1.5 rounded-md text-small font-medium transition-colors"
              style={{
                background: sortMode === 'project' ? 'var(--app-accent)' : 'transparent',
                color: sortMode === 'project' ? 'var(--app-white)' : 'var(--app-ink)',
              }}
              aria-pressed={sortMode === 'project'}
            >
              {t('activitySortByProject')}
            </button>
            <button
              type="button"
              onClick={() => setSortMode('date')}
              className="px-3 py-1.5 rounded-md text-small font-medium transition-colors"
              style={{
                background: sortMode === 'date' ? 'var(--app-accent)' : 'transparent',
                color: sortMode === 'date' ? 'var(--app-white)' : 'var(--app-ink)',
              }}
              aria-pressed={sortMode === 'date'}
            >
              {t('activitySortByDate')}
            </button>
          </div>
        </div>
      </div>

      <div className="relative">
        {filtered.length === 0 ? (
          <p className="text-small" style={{ color: 'var(--app-ink)', opacity: 0.5 }}>
            {t('noActivity')}
          </p>
        ) : (
          <ul className="flex flex-col gap-2" role="list">
            {visibleItems.map((item, i) => (
              <li key={`${item.type}-${item.title}-${i}`}>
                <ActivityRow
                  item={item}
                  locale={locale}
                  label={activityLabel(item)}
                  icon={activityIcon(item.type)}
                  openLabel={t('openWorkspace')}
                  inProjectLabel={t('activityInProject', { project: item.projectTitle })}
                  relativeDate={formatRelativeDate(item.date)}
                />
              </li>
            ))}
          </ul>
        )}

        {hasMore && (
          <>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-24 z-10 transition-opacity duration-300"
              style={{
                background: 'linear-gradient(to bottom, transparent, var(--app-light))',
                opacity: expanded ? 0 : 1,
                transition: 'opacity 0.35s ease',
              }}
            />
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              aria-expanded={expanded}
              aria-label={expanded ? t('activityShowLess') : t('activityShowMore')}
              className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 z-20 flex items-center justify-center w-9 h-9 rounded-full shadow-md transition-transform hover:scale-110"
              style={{ background: 'var(--app-accent)', color: 'var(--app-white)' }}
            >
              <ChevronDown
                className={`w-5 h-5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                aria-hidden
              />
            </button>
          </>
        )}
      </div>
    </section>
  )
}

function ActivityRow({
  item,
  locale,
  label,
  icon,
  openLabel,
  inProjectLabel,
  relativeDate,
}: {
  item: ActivityItem
  locale: string
  label: string
  icon: React.ReactNode
  openLabel: string
  inProjectLabel: string
  relativeDate?: string | null
}) {
  return (
    <div
      className="flex items-center justify-between rounded-lg shadow-sm transition-colors px-3 py-2 gap-3"
      style={{ background: item.schemeLight }}
    >
      <div className="flex items-start gap-3 min-w-0">
        <span
          className="inline-flex items-center justify-center h-8 w-8 shrink-0 rounded-md mt-0.5"
          style={{ background: item.schemeGeneral, color: item.schemeAccent }}
          aria-hidden="true"
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-text font-medium leading-snug" style={{ color: 'var(--app-ink-accent)' }}>
            {label}
          </p>
          <p className="text-small mt-0.5" style={{ color: 'var(--app-ink)', opacity: 0.6 }}>
            {inProjectLabel}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {relativeDate && (
          <span className="text-small" style={{ color: 'var(--app-ink)', opacity: 0.5, whiteSpace: 'nowrap' }}>
            {relativeDate}
          </span>
        )}
        <Link
          href={`/${locale}/dashboard/projekte/${item.projectSlug}`}
          className="inline-flex items-center justify-center h-10 w-10 shrink-0 rounded-lg"
          style={{
            background: item.schemeGeneral,
            color: item.schemeAccent,
            minWidth: 40,
            minHeight: 40,
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = item.schemeDark }}
          onMouseLeave={(e) => { e.currentTarget.style.background = item.schemeGeneral }}
          aria-label={openLabel}
        >
          <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}