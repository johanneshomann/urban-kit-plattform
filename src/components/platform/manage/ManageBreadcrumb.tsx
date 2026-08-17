// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ProjectBreadcrumb } from '@/components/platform/ProjectBreadcrumb'
import { MODULE_ORDER } from '@/lib/options/modules'

/**
 * Breadcrumb for the whole manage subtree: "Verwalten" (linked to the manage
 * root) plus the current section, derived from the pathname — one client
 * component in the layout instead of a breadcrumb per page.
 */
const SECTION_KEYS: Record<string, string> = {
  allgemein: 'general',
  teams: 'teams',
  darstellung: 'appearance',
  module: 'modules',
  mitglieder: 'members',
  anfragen: 'requests',
  einstellungen: 'settings',
}

export function ManageBreadcrumb({ locale, slug }: { locale: string; slug: string }) {
  const tw = useTranslations('projectWorkspace')
  const tm = useTranslations('manage')
  const tModules = useTranslations('modules')
  const pathname = usePathname()

  const base = `/${locale}/dashboard/projekte/${slug}/manage`
  const rest = pathname.startsWith(base) ? pathname.slice(base.length).replace(/^\//, '') : ''
  const [first, second] = rest.split('/')

  let label: string | null = null
  if (first === 'inhalte' && second && (MODULE_ORDER as readonly string[]).includes(second)) {
    label = tModules(second)
  } else if (first && SECTION_KEYS[first]) {
    label = tm(`sidebar.${SECTION_KEYS[first]}`)
  }

  return (
    <ProjectBreadcrumb
      items={label ? [{ label: tw('manage'), href: base }, { label }] : [{ label: tw('manage') }]}
    />
  )
}
