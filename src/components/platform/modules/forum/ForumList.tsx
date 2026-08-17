// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronUp, MessageSquare, Pin, Lock, MessagesSquare } from 'lucide-react'
import { toggleThreadVote } from '@/actions/forum'

export interface ForumListItem {
  id: string
  slug: string
  title: string
  authorName: string
  createdAt: string
  commentCount: number
  voteCount: number
  hasVoted: boolean
  pinned: boolean
  locked: boolean
  canDelete: boolean
}

const cardStyle = { background: 'var(--project-white)', borderColor: 'color-mix(in srgb, var(--project-general) 20%, transparent)' }

export function ForumList({ slug, locale, threads }: { slug: string; locale: string; threads: ForumListItem[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const vote = (id: string) => {
    setError(null)
    startTransition(async () => {
      const res = await toggleThreadVote(slug, locale, id)
      if (res.error) { setError(res.error); return }
      router.refresh()
    })
  }

  return (
    <div>
      {/* Visually redundant with the breadcrumb — kept for screen readers (BITV). */}
      <h1 className="sr-only">Forum</h1>
      <p className="text-text mb-6" style={{ color: 'var(--project-ink)' }}>Diskutiere mit, stimme für Themen ab und antworte.</p>

      {error && <p className="text-small mb-4 px-4 py-2.5 rounded-lg" style={{ color: 'var(--project-danger)', background: 'var(--project-danger-surface)' }}>{error}</p>}

      {threads.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border py-12" style={cardStyle}>
          <MessagesSquare className="w-8 h-8" style={{ color: 'var(--project-ink)' }} />
          <p className="text-text" style={{ color: 'var(--project-ink)' }}>Noch keine Themen.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {threads.map((th) => (
            <div key={th.id} className="flex items-center gap-3 rounded-xl border px-4 py-3" style={cardStyle}>
              <button type="button" onClick={() => vote(th.id)} disabled={pending}
                className="flex flex-col items-center justify-center w-12 py-1 rounded-lg border shrink-0 disabled:opacity-40"
                style={{ background: th.hasVoted ? 'var(--project-dark)' : 'transparent', color: th.hasVoted ? 'var(--project-black)' : 'var(--project-accent)', borderColor: th.hasVoted ? 'var(--project-dark)' : 'color-mix(in srgb, var(--project-general) 30%, transparent)' }}>
                <ChevronUp className="w-4 h-4" /><span className="text-small font-bold">{th.voteCount}</span>
              </button>

              <Link href={`/${locale}/dashboard/projekte/${slug}/m/forum/${th.slug}`} className="flex-1 min-w-0">
                <p className="flex items-center gap-1.5 text-display font-semibold leading-snug truncate" style={{ color: 'var(--project-accent)' }}>
                  {th.pinned && <Pin className="w-4 h-4 shrink-0" style={{ color: 'var(--project-ink)' }} />}
                  {th.locked && <Lock className="w-3.5 h-3.5 shrink-0" style={{ opacity: 0.5 }} />}
                  {th.title}
                </p>
                <p className="text-small mt-0.5" style={{ color: 'var(--project-ink)' }}>
                  {th.authorName} · {new Date(th.createdAt).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}
                  <span className="inline-flex items-center gap-1 ml-2"><MessageSquare className="w-3.5 h-3.5" />{th.commentCount}</span>
                </p>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
