// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { useEffect, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { Cookie, X } from 'lucide-react'
import { useFocusTrap } from '@/hooks/useFocusTrap'

/**
 * Informational cookie/storage notice — not a consent gate (the platform uses
 * only strictly-necessary, functional storage, so none is required;
 * § 25 Abs. 2 TDDDG).
 *
 * Shows once per browser session and is synchronised across tabs: a
 * BroadcastChannel lets open tabs coordinate so only one shows it, and a
 * dismissal in any tab hides it everywhere. `sessionStorage` carries the
 * "already seen" state within a tab and resets when the browser session ends.
 */
const SS_KEY = 'uk-cookie-notice-ack'
const CHANNEL = 'uk-cookie-notice'

export default function CookieNotice() {
  const t = useTranslations('cookieNotice')
  const locale = useLocale()
  const [visible, setVisible] = useState(false)
  const visibleRef = useRef(false)
  const ackedRef = useRef(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  useFocusTrap(visible, dialogRef)

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SS_KEY) === '1') return
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
          <Cookie className="h-6 w-6 shrink-0 mt-0.5" style={{ color: 'var(--plattform)' }} aria-hidden />
          <div className="pr-4">
            <p className="text-text font-bold mb-1" style={{ color: 'var(--plattform-ink-accent)' }}>{t('title')}</p>
            <p className="text-small leading-relaxed">{t('text')}</p>
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
              <Link
                href={`/${locale}/cookies`}
                onClick={dismiss}
                className="text-small underline transition-colors hover:opacity-70"
                style={{ color: 'var(--plattform-accent)' }}
              >
                {t('more')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
