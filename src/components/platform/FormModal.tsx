// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

/**
 * Centered form dialog in the app's standard idiom (dark blurred backdrop,
 * popover-in card) — the chat dialogs' Shell generalized for content forms.
 * Closes on Escape (capture, so it wins over other listeners), backdrop
 * click and the X button; the caller owns all form state.
 */
export function FormModal({ title, size = 'lg', onClose, children }: {
  title: string
  /** md = compact (schedule picker), lg = standard forms, xl = tall/wide forms, 2xl = two-column editors. */
  size?: 'md' | 'lg' | 'xl' | '2xl'
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

  const maxW = size === 'md' ? 'max-w-md' : size === 'xl' ? 'max-w-3xl' : size === '2xl' ? 'max-w-5xl' : 'max-w-2xl'

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[color-mix(in_srgb,var(--project-black,var(--app-black))_45%,transparent)] backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`popover-in w-full ${maxW} rounded-xl p-6 shadow-xl max-h-[85vh] overflow-y-auto`}
        style={{ background: 'var(--project-white, var(--app-white))', color: 'var(--project-ink, var(--app-ink))' }}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <h2 className="text-display font-bold" style={{ color: 'var(--project-accent, var(--app-ink-accent))' }}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Schließen"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-[color-mix(in_srgb,var(--project-ink,var(--app-ink))_8%,var(--project-white,var(--app-white)))] cursor-pointer"
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
