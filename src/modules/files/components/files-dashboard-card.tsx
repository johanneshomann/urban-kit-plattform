'use client'

import { FolderOpen, FileText } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ModuleCardShell } from '@/components/platform/ModuleCardShell'

export interface FileCardItem {
  id: string
  name: string
}

export function FilesDashboardCard({ files, newCount, projectSlug, locale }: {
  files: FileCardItem[]
  newCount: number
  projectSlug: string
  locale: string
}) {
  const t = useTranslations('projectWorkspace')
  const base = `/${locale}/dashboard/projekte/${projectSlug}/m/files`

  return (
    <ModuleCardShell
      icon={FolderOpen}
      title="Dateien"
      badge={newCount > 0 ? { label: t('badgeNew', { count: newCount }) } : null}
      href={base}
      ctaLabel={t('ctaAllFiles')}
    >
      {files.length === 0 ? (
        <p className="text-small" style={{ color: 'var(--project-mid)' }}>{t('emptyFiles')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {files.map((f) => (
            <li key={f.id} className="flex items-center gap-2">
              <FileText className="w-4 h-4 shrink-0" style={{ color: 'var(--project-mid)' }} />
              <span className="text-small leading-snug line-clamp-1" style={{ color: 'var(--project-dark)' }}>{f.name}</span>
            </li>
          ))}
        </ul>
      )}
    </ModuleCardShell>
  )
}
