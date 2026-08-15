// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Star } from 'lucide-react'
import { toggleProjectStar } from '@/actions/projects'

/**
 * Public project page favorite ("star") toggle. Mirrors the JoinRequestButton
 * styling (solid platform pill, label + icon). When starred the point is
 * inverted: accent background + filled star.
 */
export function StarButton({ projectId, initialStarred }: { projectId: string; initialStarred: boolean }) {
  const t = useTranslations('projectDetail')
  const [starred, setStarred] = useState(initialStarred)
  const [pending, setPending] = useState(false)

  const handleClick = () => {
    setPending(true)
    toggleProjectStar(projectId, starred)
      .then((res) => {
        if (!res.error) setStarred((v) => !v)
      })
      .finally(() => setPending(false))
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={starred}
      aria-label={starred ? t('starRemove') : t('starAdd')}
      className={`inline-flex items-center gap-2 px-6 py-3 text-cta font-normal rounded-lg transition-colors cursor-pointer disabled:opacity-40 ${
        starred
          ? 'text-[var(--plattform)] bg-[var(--plattform-accent)] hover:bg-[var(--plattform-dark)]'
          : 'text-[var(--plattform-white)] bg-[var(--plattform)] hover:bg-[var(--plattform-accent)]'
      }`}
    >
      <Star
        className="w-[1em] h-[1em] shrink-0"
        fill={starred ? 'currentColor' : 'none'}
        strokeWidth={starred ? 2 : 1.6}
      />
      {starred ? t('starActive') : t('ctaStar')}
    </button>
  )
}