// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft } from 'lucide-react'

/**
 * History-aware back control for project sub-pages. Returns via browser
 * history (so the slide + scroll-restore stack applies); falls back to
 * `fallback` when the page was opened directly and there is no in-app history.
 */
export function ProjectBackButton({
  fallback = '/',
}: {
  fallback?: string
}) {
  const router = useRouter()
  const t = useTranslations('common')
  const label = t('back')

  function handleBack() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push(fallback)
    }
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label={label}
      title={label}
      className="inline-flex items-center justify-center px-2 py-1 rounded-md text-small leading-none shrink-0 transition-colors cursor-pointer hover:bg-[var(--plattform-ink-accent)]"
      style={{ color: 'var(--plattform-white)', background: 'var(--plattform-ink)' }}
    >
      <ArrowLeft className="w-[1em] h-[1em]" aria-hidden />
    </button>
  )
}