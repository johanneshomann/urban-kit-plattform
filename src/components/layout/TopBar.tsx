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
    <header className="h-14 border-b flex items-center justify-between px-4 bg-white">
      <div className="flex items-center gap-3">
        <Link href={`/${locale}/app`} className="font-semibold text-sm">
          Urban Kit
        </Link>
        {projectName && (
          <>
            <span className="text-gray-400">/</span>
            <span className="text-sm font-medium">{projectName}</span>
          </>
        )}
      </div>
      <nav className="flex items-center gap-3">
        <span className="text-xs text-gray-400">{t('profile')}</span>
      </nav>
    </header>
  )
}
