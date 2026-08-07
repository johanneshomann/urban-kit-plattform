'use client'

import { useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { BarChart3, Calendar, Newspaper, MessageSquare, CheckSquare, FolderOpen, Kanban, FileText, UserPlus, ArrowUpRight, ChevronDown, LayoutGrid, List, RotateCcw, Search, X } from 'lucide-react'
import { useDashboardExit, isPlainLeftClick } from '@/components/platform/DashboardTransition'

type ActivityItem = {
  type: 'poll' | 'pollActivated' | 'event' | 'eventSoon' | 'news' | 'forum' | 'forumComment' | 'threadPinned' | 'threadLocked' | 'task' | 'taskDone' | 'taskAssigned' | 'taskDueSoon' | 'file' | 'board' | 'newsComment' | 'memberJoined'
  title: string
  projectTitle: string
  projectSlug: string
  projectId: string
  date?: string
  /** Workspace-relative deep link (e.g. `/m/news/<slug>`); empty → project root. */
  href?: string
  schemeGeneral: string
  schemeAccent: string
  schemeLight: string
  schemeDark: string
}

type SortMode = 'project' | 'date'

/** Collapsed row count and the hard cap after expanding. */
const MAX_VISIBLE = 8
const MAX_TOTAL = 20

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
  const tc = useTranslations('common')
  const ta = useTranslations('alleProjekte')
  const [sortMode, setSortMode] = useState<SortMode>('date')
  const [view, setView] = useState<'list' | 'grid'>('list')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [projectFilter, setProjectFilter] = useState<string>('ALL')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [projectOpen, setProjectOpen] = useState(false)
  const [typeOpen, setTypeOpen] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

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

  // Filter items by search text, project and type
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((item) => {
      if (q && !item.title.toLowerCase().includes(q) && !item.projectTitle.toLowerCase().includes(q)) return false
      if (projectFilter !== 'ALL' && item.projectTitle !== projectFilter) return false
      if (typeFilter !== 'ALL' && item.type !== typeFilter) return false
      return true
    })
  }, [items, search, projectFilter, typeFilter])

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

  const flatItems = (
    sortMode === 'project'
      ? Object.entries(groupedByProject).flatMap(([, g]) => g.items)
      : sortedByDate
  ).slice(0, MAX_TOTAL)
  const headItems = flatItems.slice(0, MAX_VISIBLE)
  const tailItems = flatItems.slice(MAX_VISIBLE)
  const hasMore = tailItems.length > 0

  /** Replays the list's card-in stagger whenever the result set changes. */
  const listKey = `${sortMode}|${view}|${projectFilter}|${typeFilter}|${search.trim().toLowerCase()}`
  const listClass = view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2' : 'flex flex-col gap-2'

  const collapse = () => {
    setExpanded(false)
    const reduceMotion =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ||
      document.documentElement.classList.contains('a11y-reduce-motion')
    sectionRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
  }

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
    `absolute top-full left-0 mt-1 w-full rounded-lg shadow-lg z-10 overflow-hidden ${open ? 'dropdown-enter' : 'hidden'}`

  const renderRow = (item: ActivityItem, i: number) => (
    <li key={`${item.type}-${item.projectId}-${item.title}-${i}`} className="card-in" style={{ animationDelay: `${Math.min(i * 30, 240)}ms` }}>
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
  )

  return (
    <section ref={sectionRef} aria-labelledby="activity-heading" className="px-6 md:px-10 py-10 scroll-mt-16">
      <h2 id="activity-heading" className="text-small font-semibold opacity-50">
        {t('activityHeading')}
      </h2>
      <div aria-hidden className="h-px mt-2 mb-4" style={{ background: 'color-mix(in srgb, var(--app-ink) 12%, transparent)' }} />

      {/* Controls — under the heading: search first, then filters, then sort.
          Stacked on mobile, one row on desktop. */}
      <div className="flex flex-col md:flex-row md:items-center gap-2 mb-6">
        {/* Search */}
        <div
          className="md:flex-1 flex items-center gap-2 px-4 h-10 rounded-lg text-small bg-[var(--app-white)] transition-all duration-200 hover:bg-[color-mix(in_srgb,var(--app-ink)_8%,var(--app-white))] hover:shadow-sm focus-within:shadow-md focus-within:ring-2"
          style={{ '--tw-ring-color': 'var(--app-accent)' } as React.CSSProperties}
        >
          <Search aria-hidden className="w-[1em] h-[1em] shrink-0 opacity-40" style={{ color: 'var(--app-ink)' }} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('activitySearchPlaceholder')}
            aria-label={t('activitySearchPlaceholder')}
            className="flex-1 outline-none bg-transparent placeholder:opacity-60"
            style={{ color: 'var(--app-ink)' }}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="opacity-40 hover:opacity-80 transition-all duration-200 hover:rotate-90 cursor-pointer"
              aria-label={tc('clearSearch')}
            >
              <X className="w-[1em] h-[1em]" style={{ color: 'var(--app-ink)' }} />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between md:justify-start gap-2 flex-wrap">
          {/* Filters (only when there's more than one item) */}
          <div className="flex items-center gap-2 flex-wrap">
            {items.length > 1 && (
              <>
                {/* Project filter */}
                <div className="relative w-44">
                  <button
                    type="button"
                    onClick={() => { setProjectOpen((v) => !v); setTypeOpen(false) }}
                    className="w-full flex items-center justify-between gap-1 px-2.5 h-10 rounded-md text-small bg-[var(--app-white)] transition-all duration-200 hover:bg-[color-mix(in_srgb,var(--app-ink)_8%,var(--app-white))] hover:shadow-sm cursor-pointer"
                    style={{ color: 'var(--app-ink)' }}
                    aria-haspopup="listbox"
                    aria-expanded={projectOpen}
                  >
                    <span className="truncate">{projectFilter === 'ALL' ? t('activityFilterAll') : projectFilter}</span>
                    <ChevronDown aria-hidden="true" className={`w-3 h-3 shrink-0 opacity-50 transition-transform duration-200 ${projectOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <div
                    className={dropdownBase(projectOpen)}
                    style={{ background: 'var(--app-white)', transformOrigin: 'top left' }}
                    role="listbox"
                    aria-label={t('activityFilterProject')}
                  >
                    <button
                      type="button"
                      role="option"
                      aria-selected={projectFilter === 'ALL'}
                      onClick={() => { setProjectFilter('ALL'); setProjectOpen(false) }}
                      className="w-full text-left px-3 py-1.5 text-small hover:bg-[color-mix(in_srgb,var(--app-ink)_8%,transparent)] transition-colors cursor-pointer"
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
                        className="w-full text-left px-3 py-1.5 text-small hover:bg-[color-mix(in_srgb,var(--app-ink)_8%,transparent)] transition-colors cursor-pointer"
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
                    className="w-full flex items-center justify-between gap-1 px-2.5 h-10 rounded-md text-small bg-[var(--app-white)] transition-all duration-200 hover:bg-[color-mix(in_srgb,var(--app-ink)_8%,var(--app-white))] hover:shadow-sm cursor-pointer"
                    style={{ color: 'var(--app-ink)' }}
                    aria-haspopup="listbox"
                    aria-expanded={typeOpen}
                  >
                    <span className="truncate">{typeFilter === 'ALL' ? t('activityFilterType') : typeLabelMap[typeFilter] ?? typeFilter}</span>
                    <ChevronDown aria-hidden="true" className={`w-3 h-3 shrink-0 opacity-50 transition-transform duration-200 ${typeOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <div
                    className={dropdownBase(typeOpen)}
                    style={{ background: 'var(--app-white)', transformOrigin: 'top left' }}
                    role="listbox"
                    aria-label={t('activityFilterType')}
                  >
                    <button
                      type="button"
                      role="option"
                      aria-selected={typeFilter === 'ALL'}
                      onClick={() => { setTypeFilter('ALL'); setTypeOpen(false) }}
                      className="w-full text-left px-3 py-1.5 text-small hover:bg-[color-mix(in_srgb,var(--app-ink)_8%,transparent)] transition-colors cursor-pointer"
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
                        className="w-full text-left px-3 py-1.5 text-small hover:bg-[color-mix(in_srgb,var(--app-ink)_8%,transparent)] transition-colors cursor-pointer"
                        style={{ color: 'var(--app-ink)' }}
                      >
                        {typeLabelMap[type] ?? type}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Sort toggle */}
          <div
            className="flex items-center gap-1 rounded-lg p-0.5 h-10 bg-[var(--app-white)] shadow-sm"
          >
            <button
              type="button"
              onClick={() => setSortMode('date')}
              className="px-3 h-full rounded-md text-small font-medium transition-all duration-200 cursor-pointer"
              style={{
                background: sortMode === 'date' ? 'var(--app-accent)' : 'transparent',
                color: sortMode === 'date' ? 'var(--app-white)' : 'var(--app-ink)',
              }}
              aria-pressed={sortMode === 'date'}
            >
              {t('activitySortByDate')}
            </button>
            <button
              type="button"
              onClick={() => setSortMode('project')}
              className="px-3 h-full rounded-md text-small font-medium transition-all duration-200 cursor-pointer"
              style={{
                background: sortMode === 'project' ? 'var(--app-accent)' : 'transparent',
                color: sortMode === 'project' ? 'var(--app-white)' : 'var(--app-ink)',
              }}
              aria-pressed={sortMode === 'project'}
            >
              {t('activitySortByProject')}
            </button>
          </div>

          {/* View toggle — list vs 3-column grid, same row content */}
          <div
            className="flex items-center gap-1 rounded-lg p-0.5 h-10 bg-[var(--app-white)] shadow-sm"
          >
            {(['list', 'grid'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className="px-3 h-full rounded-md transition-all duration-200 cursor-pointer inline-flex items-center"
                style={{
                  background: view === v ? 'var(--app-accent)' : 'transparent',
                  color: view === v ? 'var(--app-white)' : 'var(--app-ink)',
                }}
                aria-pressed={view === v}
                title={v === 'list' ? t('viewList') : t('viewGrid')}
              >
                {v === 'list' ? <List aria-hidden className="w-4 h-4" /> : <LayoutGrid aria-hidden className="w-4 h-4" />}
                <span className="sr-only">{v === 'list' ? t('viewList') : t('viewGrid')}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Active filter pills — mirrors the Alle Projekte pattern */}
      {(projectFilter !== 'ALL' || typeFilter !== 'ALL') && (
        <div className="flex items-center gap-2 flex-wrap -mt-4 mb-6">
          {projectFilter !== 'ALL' && (
            <button
              type="button"
              onClick={() => setProjectFilter('ALL')}
              className="group inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-small bg-[var(--app-white)] transition-all duration-200 hover:shadow-sm cursor-pointer"
              style={{ color: 'var(--app-ink)' }}
            >
              <span className="opacity-60">{t('activityFilterProject')}:</span>
              <span className="font-semibold">{projectFilter}</span>
              <X aria-hidden className="w-[1em] h-[1em] transition-transform duration-300 group-hover:rotate-90" />
            </button>
          )}
          {typeFilter !== 'ALL' && (
            <button
              type="button"
              onClick={() => setTypeFilter('ALL')}
              className="group inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-small bg-[var(--app-white)] transition-all duration-200 hover:shadow-sm cursor-pointer"
              style={{ color: 'var(--app-ink)' }}
            >
              <span className="opacity-60">{t('activityFilterType')}:</span>
              <span className="font-semibold">{typeLabelMap[typeFilter] ?? typeFilter}</span>
              <X aria-hidden className="w-[1em] h-[1em] transition-transform duration-300 group-hover:rotate-90" />
            </button>
          )}
          {projectFilter !== 'ALL' && typeFilter !== 'ALL' && (
            <button
              type="button"
              onClick={() => { setProjectFilter('ALL'); setTypeFilter('ALL') }}
              className="inline-flex items-center gap-1 text-small underline opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
              style={{ color: 'var(--app-ink)' }}
            >
              <RotateCcw aria-hidden className="w-[1em] h-[1em]" />
              {ta('resetFilters')}
            </button>
          )}
        </div>
      )}

      <div className="relative">
        {flatItems.length === 0 ? (
          <p className="text-small" style={{ color: 'var(--app-ink)', opacity: 0.5 }}>
            {t('noActivity')}
          </p>
        ) : (
          <div key={listKey}>
            <ul className={listClass} role="list">
              {headItems.map(renderRow)}
            </ul>

            {/* Collapsible tail — grid-rows trick animates between auto heights */}
            {hasMore && (
              <div
                aria-hidden={!expanded}
                inert={!expanded}
                style={{
                  display: 'grid',
                  gridTemplateRows: expanded ? '1fr' : '0fr',
                  transition: 'grid-template-rows 0.45s cubic-bezier(0.22,1,0.36,1)',
                }}
              >
                <div className="overflow-hidden">
                  <ul className={`${listClass} pt-2`} role="list">
                    {tailItems.map((item, i) => renderRow(item, i + headItems.length))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {hasMore && (
          <>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-24 z-10"
              style={{
                background: 'linear-gradient(to bottom, transparent, var(--app-light))',
                opacity: expanded ? 0 : 1,
                transition: 'opacity 0.35s ease',
              }}
            />
            <button
              type="button"
              onClick={() => (expanded ? collapse() : setExpanded(true))}
              aria-expanded={expanded}
              aria-label={expanded ? t('activityShowLess') : t('activityShowMore')}
              className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 z-20 flex items-center justify-center w-9 h-9 rounded-full shadow-md transition-transform duration-200 hover:scale-110 cursor-pointer"
              style={{ background: 'var(--app-accent)', color: 'var(--app-white)' }}
            >
              <ChevronDown
                className={`w-5 h-5 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
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
  const exitNavigate = useDashboardExit()
  const href = `/${locale}/dashboard/projekte/${item.projectSlug}${item.href ?? ''}`
  return (
    <div
      className="flex items-center justify-between rounded-lg shadow-sm transition-colors px-3 py-2 gap-3 h-full"
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
          href={href}
          onClick={(e) => {
            if (!exitNavigate || !isPlainLeftClick(e)) return
            e.preventDefault()
            exitNavigate(href, item.schemeLight)
          }}
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
          aria-label={`${label} – ${openLabel}`}
        >
          <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}
