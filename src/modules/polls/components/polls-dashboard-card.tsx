'use client'

import { BarChart2, Users, Clock } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ModuleCardShell } from '@/components/platform/ModuleCardShell'
import { daysUntil } from '@/lib/format-date'

export interface PollCardData {
  id: string
  title: string
  participants: number
  createdAt?: string | null
  closesAt?: string | null
}

export function PollsDashboardCard({ poll, projectSlug, locale }: {
  poll: PollCardData | null
  projectSlug: string
  locale: string
}) {
  const t = useTranslations('projectWorkspace')
  const base = `/${locale}/dashboard/projekte/${projectSlug}/m/polls`
  const href = poll ? `${base}/${poll.id}` : base

  // Progress = fraction of the poll's active window elapsed (time-based).
  let progress = 0
  if (poll?.closesAt && poll.createdAt) {
    const start = new Date(poll.createdAt).getTime()
    const end = new Date(poll.closesAt).getTime()
    if (end > start) progress = Math.min(1, Math.max(0, (Date.now() - start) / (end - start)))
  }

  return (
    <ModuleCardShell
      icon={BarChart2}
      title="Umfrage"
      badge={poll ? { label: t('badgeActive') } : null}
      href={href}
      ctaLabel={t('ctaPoll')}
    >
      {!poll ? (
        <p className="text-small" style={{ color: 'var(--project-mid)' }}>{t('emptyPolls')}</p>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-small font-medium leading-snug line-clamp-2" style={{ color: 'var(--project-dark)' }}>{poll.title}</p>
          <div className="flex items-center gap-1.5 text-small" style={{ color: 'var(--project-mid)' }}>
            <Users className="w-3.5 h-3.5" /> {t('participants', { count: poll.participants })}
          </div>
          {poll.closesAt && (
            <div className="flex items-center gap-1.5 text-small" style={{ color: 'var(--project-mid)' }}>
              <Clock className="w-3.5 h-3.5" /> {t('daysLeft', { days: daysUntil(poll.closesAt) })}
            </div>
          )}
          {poll.closesAt && poll.createdAt && (
            <div className="h-1.5 rounded-full overflow-hidden mt-1" style={{ background: 'var(--project-light)' }}>
              <div className="h-full rounded-full" style={{ width: `${Math.round(progress * 100)}%`, background: 'var(--project-mid)' }} />
            </div>
          )}
        </div>
      )}
    </ModuleCardShell>
  )
}
