// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { useLocale, useTranslations } from 'next-intl'

/** Compact relative time for launcher lists, reusing the platform date keys. */
export function useRelativeTime() {
  const tp = useTranslations('platform')
  const locale = useLocale()
  return (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime()
    if (diff < 0) return new Date(dateStr).toLocaleDateString(locale === 'en' ? 'en-GB' : 'de-DE', { day: 'numeric', month: 'short' })
    const minutes = Math.floor(diff / 60_000)
    if (minutes < 1) return tp('dateJustNow')
    if (minutes < 60) return tp('dateMinutesAgo', { minutes })
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return tp('dateHoursAgo', { hours })
    const days = Math.floor(hours / 24)
    if (days === 1) return tp('dateYesterday')
    return tp('dateDaysAgo', { days })
  }
}
