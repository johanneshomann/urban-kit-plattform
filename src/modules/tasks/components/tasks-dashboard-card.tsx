'use client'

import { CheckSquare, Square, CheckSquare as CheckSquareFilled } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ModuleCardShell } from '@/components/platform/ModuleCardShell'

export interface TaskCardItem {
  id: string
  title: string
  done: boolean
}

export function TasksDashboardCard({ tasks, openCount, projectSlug, locale }: {
  tasks: TaskCardItem[]
  openCount: number
  projectSlug: string
  locale: string
}) {
  const t = useTranslations('projectWorkspace')
  const base = `/${locale}/dashboard/projekte/${projectSlug}/m/tasks`

  return (
    <ModuleCardShell
      icon={CheckSquare}
      title="Aufgaben"
      badge={openCount > 0 ? { label: t('badgeOpen', { count: openCount }), tone: 'neutral' } : null}
      href={base}
      ctaLabel={t('ctaAllTasks')}
    >
      {tasks.length === 0 ? (
        <p className="text-small" style={{ color: 'var(--project-mid)' }}>{t('emptyTasks')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {tasks.map((task) => (
            <li key={task.id} className="flex items-center gap-2">
              {task.done
                ? <CheckSquareFilled className="w-4 h-4 shrink-0" style={{ color: 'var(--project-accent)' }} />
                : <Square className="w-4 h-4 shrink-0" style={{ color: 'var(--project-mid)' }} />}
              <span className="text-small leading-snug line-clamp-1" style={{ color: 'var(--project-dark)', opacity: task.done ? 0.55 : 1, textDecoration: task.done ? 'line-through' : 'none' }}>
                {task.title}
              </span>
            </li>
          ))}
        </ul>
      )}
    </ModuleCardShell>
  )
}
