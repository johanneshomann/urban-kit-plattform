// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { useState, useTransition } from 'react'
import { Bookmark } from 'lucide-react'
import { toggleSavedItem } from '@/actions/saved'

/**
 * Standalone Merkliste toggle — the bookmark icon (same as the Merkliste nav)
 * on every content item. Fills after toggling on; the initial saved-state is
 * not pre-loaded (the Merkliste page is the source of truth).
 */
export function SaveButton({ slug, module, itemId }: {
  slug: string
  module: string
  itemId: string
}) {
  const [saved, setSaved] = useState<boolean | null>(null)
  const [pending, startTransition] = useTransition()

  const toggle = () => {
    startTransition(async () => {
      const res = await toggleSavedItem(slug, { module, itemId })
      if ('error' in res) return
      setSaved(res.saved)
    })
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      title={saved ? 'Aus der Merkliste entfernen' : 'Merken'}
      aria-label={saved ? 'Aus der Merkliste entfernen' : 'Merken'}
      aria-pressed={saved === true}
      className="p-2 rounded-lg shrink-0 transition-colors cursor-pointer hover:bg-[color-mix(in_srgb,var(--project-general)_14%,transparent)] disabled:opacity-40"
      style={{ color: 'var(--project-accent)' }}
    >
      <Bookmark aria-hidden className="w-4 h-4" fill={saved ? 'currentColor' : 'none'} />
    </button>
  )
}
