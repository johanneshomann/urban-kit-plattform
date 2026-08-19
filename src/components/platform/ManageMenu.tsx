// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { useEffect, useRef, useState } from 'react'
import { MoreHorizontal } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/**
 * One entry of a {@link ManageMenu}. Callers build the item list from the
 * viewer's role (PM, team lead, author …) — the menu itself is role-agnostic,
 * so the same template renders the right options everywhere.
 */
export interface ManageMenuItem {
  key: string
  label: string
  icon?: LucideIcon
  /** 'danger' renders in the danger color (delete & friends). */
  variant?: 'default' | 'danger'
  /**
   * Two-step guard: the first click swaps the label to this text, only the
   * second click runs `onSelect` (replaces the old inline Löschen/Abbrechen).
   */
  confirmLabel?: string
  disabled?: boolean
  onSelect: () => void
}

/**
 * Gear-icon dropdown for per-content manage actions (edit, activate, close,
 * delete …). Renders nothing when the item list is empty, closes on outside
 * click and Escape, and resets any pending confirmation on close.
 */
export function ManageMenu({ label = 'Mehr', items, disabled }: {
  label?: string
  items: ManageMenuItem[]
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      setConfirming(null)
      return
    }
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    // Capture so Escape closes the menu before a surrounding modal
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey, true)
    }
  }, [open])

  if (items.length === 0) return null

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        title={label}
        className="p-2 rounded-lg transition-colors cursor-pointer hover:bg-[color-mix(in_srgb,var(--project-general,var(--app-ink))_14%,transparent)] disabled:opacity-40"
        style={{ color: 'var(--project-accent, var(--app-ink))' }}
      >
        <MoreHorizontal aria-hidden="true" className="w-4 h-4" />
        <span className="sr-only">{label}</span>
      </button>
      {open && (
        <div
          role="menu"
          aria-label={label}
          className="popover-in absolute right-0 top-full mt-1 z-50 min-w-48 rounded-lg border py-1 shadow-lg"
          style={{
            background: 'var(--project-white, var(--app-white))',
            borderColor: 'color-mix(in srgb, var(--project-general, var(--app-ink)) 25%, transparent)',
          }}
        >
          {items.map((it) => {
            const Icon = it.icon
            const isConfirming = confirming === it.key
            const danger = it.variant === 'danger'
            return (
              <button
                key={it.key}
                type="button"
                role="menuitem"
                disabled={it.disabled}
                onClick={() => {
                  if (it.confirmLabel && !isConfirming) {
                    setConfirming(it.key)
                    return
                  }
                  setOpen(false)
                  it.onSelect()
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-small font-medium transition-colors cursor-pointer disabled:opacity-40 hover:bg-[color-mix(in_srgb,var(--project-general,var(--app-ink))_12%,transparent)]"
                style={{ color: danger ? 'var(--project-danger, #b3261e)' : 'var(--project-accent, var(--app-ink))' }}
              >
                {Icon && <Icon aria-hidden="true" className="w-3.5 h-3.5 shrink-0" />}
                {isConfirming ? (it.confirmLabel ?? it.label) : it.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
