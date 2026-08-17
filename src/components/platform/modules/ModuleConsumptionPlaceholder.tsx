// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import { Hammer } from 'lucide-react'

/** Temporary stand-in for module consumption UIs not yet built (filled in per module in Phase B). */
export function ModuleConsumptionPlaceholder({ title }: { title: string }) {
  return (
    <div>
      {/* Visually redundant with the breadcrumb — kept for screen readers (BITV). */}
      <h1 className="sr-only">{title}</h1>
      <div className="flex items-center gap-3 rounded-xl border px-5 py-4" style={{ background: 'var(--project-light)', borderColor: 'color-mix(in srgb, var(--project-general) 20%, transparent)', color: 'var(--project-accent)' }}>
        <Hammer className="w-5 h-5 shrink-0" style={{ color: 'var(--project-ink)' }} />
        <p className="text-text" style={{ color: 'var(--project-ink)' }}>Dieser Bereich wird gerade gebaut.</p>
      </div>
    </div>
  )
}
