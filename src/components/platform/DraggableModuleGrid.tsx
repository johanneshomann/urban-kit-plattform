'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

import { saveModuleOrderAction } from '@/actions/projects'
import { NewsDashboardCard } from '@/modules/news/components/news-dashboard-card'
import { CalendarDashboardCard } from '@/modules/calendar/components/calendar-dashboard-card'
import { PollsDashboardCard } from '@/modules/polls/components/polls-dashboard-card'
import { ForumDashboardCard } from '@/modules/forum/components/forum-dashboard-card'
import { TasksDashboardCard } from '@/modules/tasks/components/tasks-dashboard-card'
import { BoardDashboardCard } from '@/modules/board/components/board-dashboard-card'
import { FilesDashboardCard } from '@/modules/files/components/files-dashboard-card'
import { UrbanAgentDashboardCard } from '@/modules/urban-agent/components/urban-agent-dashboard-card'

type NewsPost = { id: string; title: string; slug: string; publishedAt?: string | null }
type CalEvent = { id: string; title: string; startDate: string; location?: string | null }
type Poll = { id: string; title: string }

interface Props {
  initialOrder: string[]
  membershipId: string | null
  projectSlug: string
  locale: string
  newsPosts: NewsPost[]
  calEvents: CalEvent[]
  moduleCountMap: Record<string, number>
  activePolls: Poll[]
}

function SortableCard({ id, children }: { id: string; children: React.ReactNode }) {
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
          width: '2rem',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'grab',
          borderLeft: '1.5px solid var(--project-light)',
          background: 'var(--project-white)',
          color: 'var(--project-mid)',
        }}
        aria-label="Karte verschieben"
      >
        <GripVertical style={{ width: '1rem', height: '1rem' }} />
      </button>
    </div>
  )
}

export function DraggableModuleGrid({
  initialOrder,
  membershipId,
  projectSlug,
  locale,
  newsPosts,
  calEvents,
  moduleCountMap,
  activePolls,
}: Props) {
  const [order, setOrder] = useState(initialOrder)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return
      const oldIndex = order.indexOf(active.id as string)
      const newIndex = order.indexOf(over.id as string)
      const newOrder = arrayMove(order, oldIndex, newIndex)
      setOrder(newOrder)
      if (membershipId) {
        saveModuleOrderAction(membershipId, newOrder)
      }
    },
    [order, membershipId]
  )

  function renderCard(moduleId: string) {
    const count = moduleCountMap[moduleId] ?? 0
    switch (moduleId) {
      case 'news':
        return <NewsDashboardCard posts={newsPosts} projectSlug={projectSlug} locale={locale} />
      case 'calendar':
        return <CalendarDashboardCard events={calEvents} projectSlug={projectSlug} locale={locale} />
      case 'polls':
        return <PollsDashboardCard polls={activePolls} projectSlug={projectSlug} locale={locale} />
      case 'forum':
        return <ForumDashboardCard count={count} projectSlug={projectSlug} locale={locale} />
      case 'tasks':
        return <TasksDashboardCard count={count} projectSlug={projectSlug} locale={locale} />
      case 'board':
        return <BoardDashboardCard count={count} projectSlug={projectSlug} locale={locale} />
      case 'files':
        return <FilesDashboardCard count={count} projectSlug={projectSlug} locale={locale} />
      case 'urban-agent':
        return <UrbanAgentDashboardCard projectSlug={projectSlug} locale={locale} />
      default:
        return null
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={order} strategy={rectSortingStrategy}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {order.map((moduleId) => {
            const card = renderCard(moduleId)
            if (!card) return null
            return (
              <SortableCard key={moduleId} id={moduleId}>
                {card}
              </SortableCard>
            )
          })}
        </div>
      </SortableContext>
    </DndContext>
  )
}
