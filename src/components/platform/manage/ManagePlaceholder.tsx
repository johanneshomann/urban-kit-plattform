// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import { Construction } from 'lucide-react'
import { useTranslations } from 'next-intl'

/** Placeholder for manage sections that aren't built yet. */
export function ManagePlaceholder({ title, hint }: { title: string; hint?: string }) {
  const t = useTranslations('manage')
  return (
    <div>
      <h1 className="sr-only">{title}</h1>
      <div
        className="mt-6 flex items-center gap-3 rounded-xl px-5 py-4"
        style={{ background: 'var(--project-light)', color: 'var(--project-accent)' }}
      >
        <Construction className="w-5 h-5 shrink-0" style={{ opacity: 0.6 }} />
        <p className="text-text" style={{ color: 'var(--project-ink)' }}>{hint ?? t('placeholder.comingSoon')}</p>
      </div>
    </div>
  )
}
