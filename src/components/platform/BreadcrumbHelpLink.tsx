// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { CircleHelp } from 'lucide-react'

/**
 * "?" in the project breadcrumb bar: deep-links to the matching section of
 * the help page. The anchor is derived from the current path, so no call
 * site has to pass anything — module pages → that module's blurb, manage →
 * project-lead section, team page → team-lead section, otherwise the
 * "working in a project" section.
 */
export function BreadcrumbHelpLink() {
  const locale = useLocale()
  const pathname = usePathname()
  const t = useTranslations('help')

  const mod = pathname.match(/\/(?:m|inhalte)\/([a-z-]+)/)?.[1]
  const anchor = pathname.includes('/manage')
    ? 'manage'
    : mod
      ? `modul-${mod}`
      : pathname.endsWith('/team')
        ? 'lead'
        : 'work'

  return (
    <Link
      href={`/${locale}/dashboard/hilfe#${anchor}`}
      title={t('helpForPage')}
      className="inline-flex items-center transition-colors hover:text-[var(--project-accent)]"
      style={{ color: 'var(--project-ink)' }}
    >
      <CircleHelp aria-hidden className="w-4 h-4" />
      <span className="sr-only">{t('helpForPage')}</span>
    </Link>
  )
}
