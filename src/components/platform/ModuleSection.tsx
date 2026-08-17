// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import { NewsDashboardCard, type NewsCardPost } from '@/modules/news/components/news-dashboard-card'
import { CalendarDashboardCard, type CalendarCardEvent } from '@/modules/calendar/components/calendar-dashboard-card'
import { PollsDashboardCard, type PollCardData } from '@/modules/polls/components/polls-dashboard-card'
import { ForumDashboardCard } from '@/modules/forum/components/forum-dashboard-card'
import { TasksDashboardCard, type TaskCardItem } from '@/modules/tasks/components/tasks-dashboard-card'
import { BoardDashboardCard } from '@/modules/board/components/board-dashboard-card'
import { FilesDashboardCard, type FileCardItem } from '@/modules/files/components/files-dashboard-card'
import { UrbanAgentDashboardCard } from '@/modules/urban-agent/components/urban-agent-dashboard-card'

export interface ModuleCardData {
  newsPosts: NewsCardPost[]
  newsNewCount: number
  calEvents: CalendarCardEvent[]
  featuredPoll: PollCardData | null
  forumCount: number
  forumNewCount: number
  tasksPreview: TaskCardItem[]
  tasksOpenCount: number
  boardCount: number
  filesPreview: FileCardItem[]
  filesNewCount: number
  /** Per-module count of TEAM docs addressed to the viewer's teams ("davon X für Ihre Teams"). */
  teamCounts?: Record<string, number>
}

interface Props extends ModuleCardData {
  title: string
  /** This section's module ids, in display order. */
  items: string[]
  projectSlug: string
  locale: string
}

/** Workspace section of module content-preview cards in a plain grid. */
export function ModuleSection({
  title, items, projectSlug, locale,
  newsPosts, newsNewCount, calEvents, featuredPoll,
  forumCount, forumNewCount, tasksPreview, tasksOpenCount,
  boardCount, filesPreview, filesNewCount, teamCounts,
}: Props) {
  function renderCard(moduleId: string) {
    switch (moduleId) {
      case 'news': return <NewsDashboardCard posts={newsPosts} newCount={newsNewCount} projectSlug={projectSlug} locale={locale} />
      case 'calendar': return <CalendarDashboardCard events={calEvents} projectSlug={projectSlug} locale={locale} />
      case 'polls': return <PollsDashboardCard poll={featuredPoll} projectSlug={projectSlug} locale={locale} />
      case 'forum': return <ForumDashboardCard count={forumCount} newCount={forumNewCount} projectSlug={projectSlug} locale={locale} />
      case 'tasks': return <TasksDashboardCard tasks={tasksPreview} openCount={tasksOpenCount} projectSlug={projectSlug} locale={locale} />
      case 'board': return <BoardDashboardCard count={boardCount} projectSlug={projectSlug} locale={locale} />
      case 'files': return <FilesDashboardCard files={filesPreview} newCount={filesNewCount} projectSlug={projectSlug} locale={locale} />
      case 'urban-agent': return <UrbanAgentDashboardCard projectSlug={projectSlug} locale={locale} />
      default: return null
    }
  }

  if (items.length === 0) return null

  // Stretch cards to fill the row: columns track the card count, capped at 4.
  const cols = Math.min(items.length, 4)
  const colClass =
    cols <= 1 ? 'grid-cols-1'
    : cols === 2 ? 'grid-cols-1 sm:grid-cols-2'
    : cols === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-small font-semibold uppercase tracking-wide" style={{ color: 'var(--project-ink)' }}>
        {title}
      </h2>
      <div className={`grid gap-4 ${colClass}`}>
        {items.map((moduleId) => {
          const card = renderCard(moduleId)
          if (!card) return null
          const teamCount = teamCounts?.[moduleId] ?? 0
          return (
            <div
              key={moduleId}
              className="rounded-xl overflow-hidden min-h-36 flex flex-col"
              style={{
                border: '1.5px solid var(--project-light)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                background: 'var(--project-white)',
              }}
            >
              <div className="flex-1">{card}</div>
              {teamCount > 0 && (
                <p className="text-small px-4 py-2 border-t" style={{ color: 'var(--project-ink)', borderColor: 'var(--project-light)' }}>
                  davon {teamCount} für Ihre Teams
                </p>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
