'use client'

import { Kanban } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ModuleCardShell } from '@/components/platform/ModuleCardShell'

export function BoardDashboardCard({ count, projectSlug, locale }: {
  count: number
  projectSlug: string
  locale: string
}) {
  const t = useTranslations('projectWorkspace')
  const base = `/${locale}/dashboard/projekte/${projectSlug}/m/board`

  return (
    <ModuleCardShell
      icon={Kanban}
      title="Board"
      badge={count > 0 ? { label: t('boardCanvases', { count }), tone: 'neutral' } : null}
      href={base}
      ctaLabel={t('ctaBoard')}
    >
      <div className="flex flex-col gap-2">
        <p className="text-small" style={{ color: 'var(--project-mid)' }}>{t('boardTeaser')}</p>
        {count === 0 && (
          <p className="text-small font-medium" style={{ color: 'var(--project-dark)' }}>{t('boardInactive')}</p>
        )}
      </div>
    </ModuleCardShell>
  )
}
