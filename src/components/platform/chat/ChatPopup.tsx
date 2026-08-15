// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, X } from 'lucide-react'
import { useTranslations } from 'next-intl'

/**
 * Responsive shell for the chat popup.
 *
 *  - ≥ sm: non-modal popover anchored above the launcher bubble (the page
 *    stays operable while chatting) — Escape and outside interactions are
 *    handled by the launcher.
 *  - < sm: near-full-height sheet with a backdrop and a Tab focus trap.
 *
 * Colors inherit the chameleon: `--project-*` inside a workspace (via
 * ProjectThemeScope on <html>), falling back to the neutral `--app-*` set.
 */
export function ChatPopup({
  title,
  onBack,
  onClose,
  children,
}: {
  title: React.ReactNode
  onBack?: () => void
  onClose: () => void
  children: React.ReactNode
}) {
  const t = useTranslations('chat')
  const panelRef = useRef<HTMLDivElement>(null)

  // Escape: one level back (room → list), then close. Handled here so it also
  // fires while focus sits inside the message list.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      if (onBack) onBack()
      else onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onBack, onClose])

  // Mobile sheet: trap Tab inside the panel (ProjectTabBar sheet pattern).
  const onPanelKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || window.innerWidth >= 640) return
    const panel = panelRef.current
    if (!panel) return
    const focusables = panel.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, [tabindex]:not([tabindex="-1"])',
    )
    if (focusables.length === 0) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  // Move focus into the panel on open.
  useEffect(() => {
    panelRef.current?.focus()
  }, [])

  return createPortal(
    <>
      {/* Backdrop — mobile sheet only */}
      <div
        aria-hidden
        className="fixed inset-0 z-40 sm:hidden bg-[color-mix(in_srgb,var(--app-black)_45%,transparent)] backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-label={t('title')}
        tabIndex={-1}
        data-chat-popup
        onKeyDown={onPanelKeyDown}
        className="popover-in fixed z-50 flex flex-col overflow-hidden shadow-xl outline-none inset-x-0 bottom-0 top-16 rounded-t-xl sm:inset-x-auto sm:top-auto sm:bottom-24 sm:right-6 sm:w-[22rem] sm:h-[32rem] sm:rounded-xl"
        style={{ background: 'var(--project-white, var(--app-white))', color: 'var(--project-ink, var(--app-ink))' }}
      >
        <div className="min-h-12 shrink-0 flex items-center gap-1 px-3 py-1.5">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label={t('back')}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md cursor-pointer transition-colors hover:bg-[color-mix(in_srgb,var(--project-ink,var(--app-ink))_8%,transparent)]"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
          )}
          <div className="flex-1 min-w-0 px-1 text-text font-semibold" style={{ color: 'var(--project-accent, var(--app-ink-accent))' }}>
            {title}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md cursor-pointer transition-colors hover:bg-[color-mix(in_srgb,var(--project-ink,var(--app-ink))_8%,transparent)]"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <div aria-hidden className="h-px shrink-0" style={{ background: 'color-mix(in srgb, var(--project-ink, var(--app-ink)) 12%, transparent)' }} />
        <div className="flex-1 min-h-0 flex flex-col">{children}</div>
      </div>
    </>,
    document.body,
  )
}
