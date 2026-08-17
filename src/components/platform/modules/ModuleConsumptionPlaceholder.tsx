// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import { Hammer, Lock } from 'lucide-react'

/**
 * Stand-in for a module page that can't render content: the UI is not built
 * yet (`construction`, default), the viewer isn't an active member
 * (`membership`), or the area is team-tier only (`team` — an active member
 * without team tags must not read "members only" when they ARE a member).
 */
export function ModuleConsumptionPlaceholder({ title, reason = 'construction' }: {
  title: string
  reason?: 'construction' | 'membership' | 'team'
}) {
  const gated = reason !== 'construction'
  const Icon = gated ? Lock : Hammer
  return (
    <div>
      {/* Visually redundant with the breadcrumb — kept for screen readers (BITV). */}
      <h1 className="sr-only">{title}</h1>
      <div className="flex items-center gap-3 rounded-xl border px-5 py-4" style={{ background: 'var(--project-light)', borderColor: 'color-mix(in srgb, var(--project-general) 20%, transparent)', color: 'var(--project-accent)' }}>
        <Icon className="w-5 h-5 shrink-0" style={{ color: 'var(--project-ink)' }} />
        <p className="text-text" style={{ color: 'var(--project-ink)' }}>
          {reason === 'membership'
            ? 'Dieser Bereich ist aktiven Projektmitgliedern vorbehalten. Treten Sie dem Projekt bei, um mitzumachen.'
            : reason === 'team'
              ? 'Dieser Bereich ist dem Projektteam vorbehalten.'
              : 'Dieser Bereich wird gerade gebaut.'}
        </p>
      </div>
    </div>
  )
}
