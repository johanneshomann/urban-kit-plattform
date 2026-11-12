// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { Link, useConfig, useTranslation } from '@payloadcms/ui'
import { usePathname } from 'next/navigation'
import React, { useEffect } from 'react'
import { COLLAPSED_GROUPS } from '@/lib/admin-nav-groups'

/**
 * Bottom of the admin sidebar (afterNavLinks): link to the documentation view
 * and to the public portal. Also collapses the support-data groups once per
 * browser — Payload renders every group expanded until a preference exists,
 * which buries the groups editors actually use.
 */
export function NavExtras() {
  const { config } = useConfig()
  const { i18n } = useTranslation()
  const pathname = usePathname()
  const de = i18n.language === 'de'
  const docsHref = `${config.routes.admin}/dokumentation`
  const active = pathname.startsWith(docsHref)

  useEffect(() => {
    const FLAG = 'uk-admin-nav-collapsed'
    if (window.localStorage.getItem(FLAG)) return
    const ids = COLLAPSED_GROUPS.flatMap((g) => [`nav-group-${g.de}`, `nav-group-${g.en}`])
    const collapse = () => {
      const groups = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el)
      if (groups.length === 0) return false
      for (const group of groups) {
        if (!group.classList.contains('nav-group--collapsed')) group.querySelector<HTMLButtonElement>('button.nav-group__toggle')?.click()
      }
      window.localStorage.setItem(FLAG, '1')
      return true
    }
    if (collapse()) return
    const interval = window.setInterval(() => { if (collapse()) window.clearInterval(interval) }, 100)
    const stop = window.setTimeout(() => window.clearInterval(interval), 3000)
    return () => { window.clearInterval(interval); window.clearTimeout(stop) }
  }, [])

  return (
    <div className="uk-bottom-nav">
      <Link className="nav__link" href={docsHref} id="nav-documentation" prefetch={false}>
        {active && <div className="nav__link-indicator" />}
        <span className="nav__link-label">{de ? 'Dokumentation' : 'Documentation'}</span>
      </Link>
      <a className="nav__link" href="/" target="_blank" rel="noopener noreferrer" id="nav-portal">
        <span className="nav__link-label">{de ? 'Zum Portal ↗' : 'Open portal ↗'}</span>
      </a>
    </div>
  )
}
