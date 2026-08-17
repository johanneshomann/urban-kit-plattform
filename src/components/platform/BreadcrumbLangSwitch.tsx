// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { useLocale } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'

/**
 * Language switch in the project breadcrumb bar — shows the TARGET locale
 * ("EN" while on German), same convention as the dashboard/public headers.
 */
export function BreadcrumbLangSwitch() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const nextLocale = locale === 'de' ? 'en' : 'de'
  const label = locale === 'de' ? 'Switch to English' : 'Zu Deutsch wechseln'

  return (
    <button
      type="button"
      onClick={() => router.replace(pathname, { locale: nextLocale })}
      className="text-small font-medium cursor-pointer transition-colors hover:text-[var(--project-accent)]"
      style={{ color: 'var(--project-ink)' }}
    >
      {nextLocale.toUpperCase()}
      <span className="sr-only">{label}</span>
    </button>
  )
}
