'use client'

import { Bot } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ModuleCardShell } from '@/components/platform/ModuleCardShell'

export function UrbanAgentDashboardCard({ projectSlug, locale }: {
  projectSlug: string
  locale: string
}) {
  const t = useTranslations('projectWorkspace')
  const base = `/${locale}/dashboard/projekte/${projectSlug}/m/urban-agent`

  return (
    <ModuleCardShell icon={Bot} title="Urban Agent" href={base} ctaLabel={t('ctaUrbanAgent')}>
      <p className="text-small" style={{ color: 'var(--project-mid)' }}>{t('urbanAgentTeaser')}</p>
    </ModuleCardShell>
  )
}
