// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { FlaskConical, X } from 'lucide-react'
import { useFocusTrap } from '@/hooks/useFocusTrap'

/**
 * Admin-toggleable prototype disclaimer (platform-settings → Prototyp-Hinweis):
 * the platform is a prototype and the shown projects are mockups derived from
 * real projects.
 *
 * Same presentation contract as CookieNotice: once per browser session,
 * cross-tab deduplicated via BroadcastChannel, focus-trapped dialog with
 * Escape close. Whenever this notice resolves in this tab — dismissed here,
 * dismissed elsewhere, or already acknowledged — it fires the DONE_EVENT so
 * CookieNotice can take its turn instead of stacking on top.
 */
const SS_KEY = 'uk-prototype-notice-ack'
const CHANNEL = 'uk-prototype-notice'
export const PROTOTYPE_NOTICE_DONE_EVENT = 'uk-prototype-notice-done'
export const PROTOTYPE_NOTICE_SS_KEY = SS_KEY

const emitDone = () => {
  window.dispatchEvent(new CustomEvent(PROTOTYPE_NOTICE_DONE_EVENT))
}

export default function PrototypeNotice({ text }: { text: string | null }) {
  const t = useTranslations('prototypeNotice')
  const [visible, setVisible] = useState(false)
  const visibleRef = useRef(false)
  const ackedRef = useRef(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  useFocusTrap(visible, dialogRef)

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SS_KEY) === '1') {
        emitDone()
        return
      }
    } catch {
      /* storage blocked — fall through and just show it */
    }

    const bc = 'BroadcastChannel' in window ? new BroadcastChannel(CHANNEL) : null

    const ack = () => {
      ackedRef.current = true
      try { sessionStorage.setItem(SS_KEY, '1') } catch { /* ignore */ }
    }
    const suppress = () => {
      visibleRef.current = false
      setVisible(false)
      ack()
      emitDone()
    }
    const present = () => {
      if (ackedRef.current) return
      visibleRef.current = true
      setVisible(true)
      bc?.postMessage({ type: 'present' })
    }

    if (bc) {
      bc.onmessage = (e: MessageEvent) => {
        const type = (e.data || {}).type
        if (type === 'present' || type === 'dismiss') suppress()
        // A newcomer is asking — if we already own or acknowledged it, tell them to stand down.
        else if (type === 'hello' && (visibleRef.current || ackedRef.current)) bc.postMessage({ type: 'present' })
      }
      bc.postMessage({ type: 'hello' })
    }

    // Give peers a moment to claim the notice first; jitter avoids two fresh tabs racing.
    const delay = 150 + Math.floor(Math.random() * 150)
    const timer = window.setTimeout(() => {
      if (!ackedRef.current && !visibleRef.current) present()
    }, delay)

    return () => {
      window.clearTimeout(timer)
      bc?.close()
    }
  }, [])

  const dismiss = () => {
    visibleRef.current = false
    ackedRef.current = true
    setVisible(false)
    try { sessionStorage.setItem(SS_KEY, '1') } catch { /* ignore */ }
    if ('BroadcastChannel' in window) {
      const bc = new BroadcastChannel(CHANNEL)
      bc.postMessage({ type: 'dismiss' })
      bc.close()
    }
    emitDone()
  }

  // Escape closes the notice — required while the focus trap is active (WCAG 2.1.2).
  useEffect(() => {
    if (!visible) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [visible])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)' }}
      onClick={dismiss}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('title')}
        onClick={e => e.stopPropagation()}
        className="notice-in relative w-full max-w-xl rounded-2xl p-6"
        style={{
          background: 'var(--plattform-white)',
          color: 'var(--plattform-ink)',
          boxShadow: '0 10px 25px rgba(0,0,0,0.12), 0 4px 10px rgba(0,0,0,0.08)',
        }}
      >
        <button
          onClick={dismiss}
          aria-label={t('close')}
          className="absolute top-3 right-3 inline-flex items-center justify-center rounded-md p-1 transition-opacity opacity-50 hover:opacity-100"
          style={{ color: 'var(--plattform-ink)' }}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3">
          <FlaskConical className="h-6 w-6 shrink-0 mt-0.5" style={{ color: 'var(--plattform)' }} aria-hidden />
          <div className="pr-4">
            <p className="text-text font-bold mb-1" style={{ color: 'var(--plattform-ink-accent)' }}>{t('title')}</p>
            <p className="text-small leading-relaxed whitespace-pre-line">{text ?? t('text')}</p>
            <div className="mt-4 flex items-center gap-4">
              <button
                onClick={dismiss}
                data-autofocus
                className="text-small font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
                style={{ background: 'var(--plattform)', color: 'var(--plattform-white)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--plattform-accent)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--plattform)' }}
              >
                {t('dismiss')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
