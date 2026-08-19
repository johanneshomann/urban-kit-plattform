// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

/**
 * Standard header row for module workspace pages: filter/sort controls on the
 * left, the primary action (create button …) pinned right via `end`. The page
 * title stays sr-only by default (the breadcrumb already names the page —
 * BITV pattern); pass `showTitle` for a visible heading. Presentational only —
 * usable from server and client components alike.
 */
export function ModulePageHeader({ title, showTitle = false, children, end }: {
  title: string
  showTitle?: boolean
  /** Left-aligned controls (sort toggles, filters …). */
  children?: React.ReactNode
  /** Right-aligned primary action(s). */
  end?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      {showTitle
        ? <h1 className="text-display font-bold mr-2" style={{ color: 'var(--project-accent)' }}>{title}</h1>
        : <h1 className="sr-only">{title}</h1>}
      {children}
      {end && <div className="ml-auto flex flex-wrap items-center gap-2">{end}</div>}
    </div>
  )
}
