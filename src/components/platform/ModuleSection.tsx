'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTranslations } from 'next-intl'
import { GripVertical } from 'lucide-react'

import { saveModuleOrderAction } from '@/actions/projects'
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
}

interface Props extends ModuleCardData {
  title: string
  /** This section's module ids, in display order. */
  items: string[]
  /** The full saved module order (all sections) — used for persistence. */
  fullOrder: string[]
  membershipId: string | null
  projectSlug: string
  locale: string
}

function SortableCard({ id, children }: { id: string; children: React.ReactNode }) {
  const t = useTranslations('projectWorkspace')
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div
      ref={setNodeRef}
      style={{
        display: 'flex',
        borderRadius: '0.75rem',
        overflow: 'hidden',
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        border: '1.5px solid var(--project-light)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
        background: 'var(--project-white)',
        minHeight: '9rem',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
      <button
        {...attributes}
        {...listeners}
        style={{
          width: '1.75rem',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'grab',
          borderLeft: '1.5px solid var(--project-light)',
          background: 'var(--project-white)',
          color: 'var(--project-mid)',
        }}
        aria-label={t('moveCard')}
      >
        <GripVertical style={{ width: '1rem', height: '1rem' }} />
      </button>
    </div>
  )
}

export function ModuleSection({
  title, items, fullOrder, membershipId, projectSlug, locale,
  newsPosts, newsNewCount, calEvents, featuredPoll,
  forumCount, forumNewCount, tasksPreview, tasksOpenCount,
  boardCount, filesPreview, filesNewCount,
}: Props) {
  const [order, setOrder] = useState(items)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return
      const oldIndex = order.indexOf(active.id as string)
      const newIndex = order.indexOf(over.id as string)
      if (oldIndex < 0 || newIndex < 0) return
      const newOrder = arrayMove(order, oldIndex, newIndex)
      setOrder(newOrder)
      if (membershipId) {
        // Splice this section's new sequence back into the full order.
        const inSection = new Set(newOrder)
        let k = 0
        const merged = fullOrder.map((id) => (inSection.has(id) ? newOrder[k++] : id))
        saveModuleOrderAction(membershipId, merged)
      }
    },
    [order, fullOrder, membershipId],
  )

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

  if (order.length === 0) return null

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-small font-semibold uppercase tracking-wide" style={{ color: 'color-mix(in srgb, var(--project-dark) 55%, transparent)' }}>
        {title}
      </h2>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={order} strategy={rectSortingStrategy}>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {order.map((moduleId) => {
              const card = renderCard(moduleId)
              if (!card) return null
              return <SortableCard key={moduleId} id={moduleId}>{card}</SortableCard>
            })}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  )
}
