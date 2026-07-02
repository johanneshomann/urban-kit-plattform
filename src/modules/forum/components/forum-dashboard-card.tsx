'use client'

import { MessageSquare } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ModuleCardShell } from '@/components/platform/ModuleCardShell'

export function ForumDashboardCard({ count, newCount, projectSlug, locale }: {
  count: number
  newCount: number
  projectSlug: string
  locale: string
}) {
  const t = useTranslations('projectWorkspace')
  const base = `/${locale}/dashboard/projekte/${projectSlug}/m/forum`

  return (
    <ModuleCardShell
      icon={MessageSquare}
      title="Forum"
      badge={newCount > 0 ? { label: t('badgeNew', { count: newCount }) } : null}
      href={base}
      ctaLabel={t('ctaForum')}
    >
      <div className="flex flex-col gap-2">
        <p className="text-small" style={{ color: 'var(--project-mid)' }}>{t('forumTeaser')}</p>
        {count > 0 && (
          <p className="text-small font-medium" style={{ color: 'var(--project-dark)' }}>{t('forumNewPosts', { count })}</p>
        )}
      </div>
    </ModuleCardShell>
  )
}
