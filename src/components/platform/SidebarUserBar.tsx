// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import { User, Languages } from 'lucide-react'

const item = 'flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-[color-mix(in_srgb,var(--project-general)_20%,transparent)]'

/**
 * Icon row at the foot of the project navigation: profile and language only.
 * Back-to-dashboard lives on the sidebar cover / in the mobile sheet; leaving
 * the app entirely (public site, logout) happens from the dashboard.
 */
export function SidebarUserBar({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  const t = useTranslations('platform')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const nextLocale = locale === 'de' ? 'en' : 'de'

  return (
    <div className={`flex items-center gap-1 ${className}`} style={{ color: 'var(--project-accent)', ...style }}>
      <Link href={`/${locale}/dashboard/profil`} className={item} title={t('navMyProfile')}>
        <User aria-hidden="true" className="h-4 w-4" />
        <span className="sr-only">{t('navMyProfile')}</span>
      </Link>

      <button
        type="button"
        onClick={() => router.replace(pathname, { locale: nextLocale })}
        className={item}
        title={locale === 'de' ? 'Switch to English' : 'Zu Deutsch wechseln'}
      >
        <Languages aria-hidden="true" className="h-4 w-4" />
        <span className="sr-only">{locale === 'de' ? 'Switch to English' : 'Zu Deutsch wechseln'}</span>
      </button>

    </div>
  )
}
