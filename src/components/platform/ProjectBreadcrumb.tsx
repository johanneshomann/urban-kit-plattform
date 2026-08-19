// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { BreadcrumbLangSwitch } from '@/components/platform/BreadcrumbLangSwitch'
import { WorkspaceSearchTrigger } from '@/components/platform/WorkspaceSearchPalette'

export interface Crumb {
  label: string
  href?: string
}

/**
 * Breadcrumb bar for workspace/manage pages: Projektname / News / Beitragstitel
 * on the left, the language switch on the right. The last crumb is plain text;
 * earlier crumbs link back up the hierarchy.
 */
export function ProjectBreadcrumb({ items }: { items: Crumb[] }) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 md:px-8 pt-5">
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 flex-wrap text-small min-w-0">
      {items.map((item, i) => {
        const last = i === items.length - 1
        return (
          <span key={i} className="flex items-center gap-1.5 min-w-0">
            {item.href && !last ? (
              <Link href={item.href} className="transition-colors font-medium hover:text-[var(--project-accent)]" style={{ color: 'var(--project-ink)' }}>
                {item.label}
              </Link>
            ) : (
              <span className="font-semibold truncate max-w-[16rem]" style={{ color: 'var(--project-accent)' }}>{item.label}</span>
            )}
            {!last && <ChevronRight className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--project-ink)' }} />}
          </span>
        )
      })}
    </nav>
    <div className="flex items-center gap-4 shrink-0">
      <WorkspaceSearchTrigger />
      <BreadcrumbLangSwitch />
    </div>
    </div>
  )
}
