// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bookmark, ChevronRight, FolderOpen, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { MODULE_ICONS } from '@/components/platform/ProjectSidebar'
import { toggleSavedItem } from '@/actions/saved'

export interface SavedListItem {
  module: string
  itemId: string
  title: string
  /** Workspace-relative deep link (`/m/…`). */
  href: string
  savedAt: string
}

const cardStyle = { background: 'var(--project-white)', borderColor: 'color-mix(in srgb, var(--project-general) 20%, transparent)', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }

/** Merkliste rows — link to the content, X removes the bookmark. */
export function SavedItemsList({ slug, base, items }: {
  slug: string
  /** Absolute workspace prefix (`/{locale}/dashboard/projekte/{slug}`). */
  base: string
  items: SavedListItem[]
}) {
  const router = useRouter()
  const tModules = useTranslations('modules')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const remove = (it: SavedListItem) => {
    setError(null)
    startTransition(async () => {
      const res = await toggleSavedItem(slug, { module: it.module, itemId: it.itemId })
      if ('error' in res) { setError(res.error); return }
      router.refresh()
    })
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border py-12" style={cardStyle}>
        <Bookmark className="w-8 h-8" style={{ color: 'var(--project-ink)' }} />
        <p className="text-text" style={{ color: 'var(--project-ink)' }}>
          Noch nichts gemerkt — über das ⋯-Menü an Inhalten können Sie Einträge hier ablegen.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-small px-4 py-2.5 rounded-lg" style={{ color: 'var(--project-danger)', background: 'var(--project-danger-surface)' }}>{error}</p>}
      {items.map((it) => {
        const Icon = MODULE_ICONS[it.module] ?? FolderOpen
        return (
          <div key={`${it.module}:${it.itemId}`} className="flex items-center gap-3 rounded-xl border px-4 py-3" style={cardStyle}>
            <Icon aria-hidden className="w-4 h-4 shrink-0" style={{ color: 'var(--project-ink)' }} />
            <Link href={`${base}${it.href}`} className="flex-1 min-w-0 group">
              <p className="text-text font-medium truncate group-hover:underline" style={{ color: 'var(--project-accent)' }}>{it.title}</p>
              <p className="text-small mt-0.5" style={{ color: 'var(--project-ink)' }}>
                {/* folders belong to the files module label-wise */}
                {tModules(it.module === 'folders' ? 'files' : it.module)} · gemerkt am {new Date(it.savedAt).toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </Link>
            <ChevronRight aria-hidden className="w-4 h-4 shrink-0" style={{ color: 'var(--project-ink)' }} />
            <button
              type="button"
              onClick={() => remove(it)}
              disabled={pending}
              title="Aus der Merkliste entfernen"
              className="group p-2 rounded-lg shrink-0 transition-colors cursor-pointer hover:bg-[color-mix(in_srgb,var(--project-general)_14%,transparent)] disabled:opacity-40"
              style={{ color: 'var(--project-ink)' }}
            >
              <X aria-hidden className="w-4 h-4 transition-transform duration-300 group-hover:rotate-90" />
              <span className="sr-only">Aus der Merkliste entfernen</span>
            </button>
          </div>
        )
      })}
    </div>
  )
}
