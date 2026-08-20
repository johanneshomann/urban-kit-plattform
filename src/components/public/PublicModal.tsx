// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

/**
 * Centered dialog for the PUBLIC pages, same idiom as the platform's
 * FormModal (dark blurred backdrop, popover-in card, Escape/backdrop/X) but
 * styled with the --plattform-* tokens — the platform/app vars don't exist on
 * the public root, so FormModal would render colorless here.
 */
export function PublicModal({ title, leading, size = 'lg', onClose, children }: {
  title: string
  /** Optional element left of the title (e.g. a small thumbnail). */
  leading?: React.ReactNode
  /** lg = standard (2xl), xl = wide (4xl, e.g. news quick-read). */
  size?: 'lg' | 'xl'
  onClose: () => void
  children: React.ReactNode
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ background: 'color-mix(in srgb, #000 45%, transparent)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`popover-in w-full ${size === 'xl' ? 'max-w-4xl' : 'max-w-2xl'} rounded-xl p-6 shadow-xl max-h-[85vh] overflow-y-auto`}
        style={{ background: 'var(--plattform-white)', color: 'var(--plattform-ink)' }}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-4 min-w-0">
            {leading}
            <h2 className="text-display font-bold" style={{ color: 'var(--plattform-ink-accent)' }}>{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Schließen"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-[var(--plattform-light)] cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}
