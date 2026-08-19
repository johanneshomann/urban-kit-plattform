// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bot, Check, Flag, Globe, Link2, MessagesSquare, Share2 } from 'lucide-react'
import { ManageMenu, type ManageMenuItem } from '@/components/platform/ManageMenu'
import { FormModal } from '@/components/platform/FormModal'
import { urbanAgentAskKey } from '@/components/platform/modules/urban-agent/UrbanAgentChat'
import { reportContent } from '@/actions/report'

/** The content item a ⋯-menu acts on. */
export interface ContentRef {
  module: string
  itemId: string
  title: string
  /** Workspace-relative deep link (`/m/…`). */
  href: string
  /** Absolute path of the PUBLIC page for this item, when one exists (e.g. `/{locale}/projekte/{slug}/news/{newsSlug}` for PUBLIC news). */
  publicHref?: string
}

type ChatRoom = { id: string; name: string | null; type: string; project?: { slug?: string } | null }

/**
 * Room picker for "Im Chat teilen": lists the viewer's chat rooms of THIS
 * project; picking one posts a message with the item as a validated mention
 * card (the messages API re-checks project + visibility server-side).
 */
function ShareToChatModal({ slug, item, onClose }: { slug: string; item: ContentRef; onClose: () => void }) {
  const [rooms, setRooms] = useState<ChatRoom[] | null>(null)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    fetch('/api/chat/overview')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { rooms?: ChatRoom[] }) => {
        if (!alive) return
        setRooms((data.rooms ?? []).filter((r) => r.type !== 'dm' && r.project?.slug === slug))
      })
      .catch(() => { if (alive) setRooms([]) })
    return () => { alive = false }
  }, [slug])

  const share = async (roomId: string) => {
    setSending(true)
    setError(null)
    try {
      const res = await fetch(`/api/chat/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content: `„${item.title}“`, mentions: [{ module: item.module, id: item.itemId }] }),
      })
      if (!res.ok) throw new Error()
      setSent(true)
      setTimeout(onClose, 900)
    } catch {
      setError('Teilen fehlgeschlagen.')
    } finally {
      setSending(false)
    }
  }

  return (
    <FormModal title="Im Chat teilen" size="md" onClose={onClose}>
      {error && <p className="text-small mb-3 px-3 py-2 rounded-lg" style={{ color: 'var(--project-danger)', background: 'var(--project-danger-surface)' }}>{error}</p>}
      {sent ? (
        <p className="flex items-center gap-2 text-text" style={{ color: 'var(--project-accent)' }}><Check className="w-4 h-4" aria-hidden /> Geteilt!</p>
      ) : rooms === null ? (
        <p className="text-small" style={{ color: 'var(--project-ink)' }}>Räume werden geladen …</p>
      ) : rooms.length === 0 ? (
        <p className="text-small" style={{ color: 'var(--project-ink)' }}>Keine Chat-Räume in diesem Projekt gefunden.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {rooms.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => share(r.id)}
                disabled={sending}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-small font-medium transition-colors cursor-pointer disabled:opacity-40 hover:bg-[color-mix(in_srgb,var(--project-general)_14%,transparent)]"
                style={{ color: 'var(--project-accent)' }}
              >
                <MessagesSquare aria-hidden className="w-4 h-4 shrink-0" style={{ color: 'var(--project-ink)' }} />
                <span className="truncate">{r.name || 'Projekt-Chat'}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </FormModal>
  )
}

/**
 * The standard ⋯-menu for one piece of project content. Common actions for
 * every logged-in viewer — Link kopieren, Urban Agent fragen (when the module
 * is enabled for the viewer), Im Chat teilen, Melden — plus the caller's
 * role-scoped `extraItems` (edit/delete …). Servers re-check every action.
 */
export function ContentItemMenu({ slug, locale, agentEnabled, item, extraItems = [], disabled }: {
  slug: string
  locale: string
  /** urban-agent module enabled AND the viewer may use it (active member). */
  agentEnabled: boolean
  item: ContentRef
  extraItems?: ManageMenuItem[]
  disabled?: boolean
}) {
  const router = useRouter()
  const [shareOpen, setShareOpen] = useState(false)
  const base = `/${locale}/dashboard/projekte/${slug}`

  const items: ManageMenuItem[] = [
    {
      key: 'copy',
      label: 'Link kopieren',
      icon: Link2,
      onSelect: () => { void navigator.clipboard?.writeText(window.location.origin + base + item.href) },
    },
    ...(item.publicHref
      ? [{
          key: 'copy-public',
          label: 'Öffentlichen Link kopieren',
          icon: Globe,
          onSelect: () => { void navigator.clipboard?.writeText(window.location.origin + item.publicHref) },
        }]
      : []),
    ...(agentEnabled
      ? [{
          key: 'agent',
          label: 'Den Urban Agent fragen',
          icon: Bot,
          onSelect: () => {
            try { sessionStorage.setItem(urbanAgentAskKey(slug), `Worum geht es in „${item.title}“?`) } catch { /* storage blocked */ }
            router.push(`${base}/m/urban-agent`)
          },
        }]
      : []),
    { key: 'share', label: 'Im Chat teilen', icon: Share2, onSelect: () => setShareOpen(true) },
    { key: 'report', label: 'Melden', icon: Flag, variant: 'danger', confirmLabel: 'Wirklich melden?', onSelect: () => { void reportContent(slug, { module: item.module, itemId: item.itemId }) } },
    ...extraItems,
  ]

  return (
    <>
      <ManageMenu items={items} disabled={disabled} />
      {shareOpen && <ShareToChatModal slug={slug} item={item} onClose={() => setShareOpen(false)} />}
    </>
  )
}
