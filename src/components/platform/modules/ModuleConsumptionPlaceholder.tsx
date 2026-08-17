// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import { Hammer, Lock } from 'lucide-react'

/**
 * Stand-in for a module page that can't render content: either the UI is not
 * built yet (`construction`, default) or the viewer's tier is too low
 * (`membership`) — the latter previously showed the misleading
 * "under construction" text to logged-out/non-member visitors.
 */
export function ModuleConsumptionPlaceholder({ title, reason = 'construction' }: {
  title: string
  reason?: 'construction' | 'membership'
}) {
  const membership = reason === 'membership'
  const Icon = membership ? Lock : Hammer
  return (
    <div>
      {/* Visually redundant with the breadcrumb — kept for screen readers (BITV). */}
      <h1 className="sr-only">{title}</h1>
      <div className="flex items-center gap-3 rounded-xl border px-5 py-4" style={{ background: 'var(--project-light)', borderColor: 'color-mix(in srgb, var(--project-general) 20%, transparent)', color: 'var(--project-accent)' }}>
        <Icon className="w-5 h-5 shrink-0" style={{ color: 'var(--project-ink)' }} />
        <p className="text-text" style={{ color: 'var(--project-ink)' }}>
          {membership
            ? 'Dieser Bereich ist aktiven Projektmitgliedern vorbehalten. Treten Sie dem Projekt bei, um mitzumachen.'
            : 'Dieser Bereich wird gerade gebaut.'}
        </p>
      </div>
    </div>
  )
}
