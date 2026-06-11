'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'

interface TopBarProps {
  projectName?: string
  locale: string
}

export function TopBar({ projectName, locale }: TopBarProps) {
  const t = useTranslations('nav')

  return (
    <header className="h-14 border-b flex items-center justify-between px-4 bg-[var(--plattform-light)]">
      <div className="flex items-center gap-3">
        <Link href={`/${locale}/dashboard`} className="text-small font-semibold" style={{ color: 'var(--plattform-ink-accent)' }}>
          Urban Kit
        </Link>
        {projectName && (
          <>
            <span className="text-small opacity-30">/</span>
            <span className="text-small font-medium" style={{ color: 'var(--plattform-ink-accent)' }}>{projectName}</span>
          </>
        )}
      </div>
      <nav className="flex items-center gap-3">
        <span className="text-small opacity-40">{t('profile')}</span>
      </nav>
    </header>
  )
}
