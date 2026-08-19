// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronUp, MessageSquare, Pin, Lock, MessagesSquare, Plus, Trash2 } from 'lucide-react'
import { toggleThreadVote, createThread, deleteThread, toggleThreadPin, toggleThreadLock } from '@/actions/forum'
import { SaveButton } from '@/components/platform/SaveButton'
import { AudienceChip } from '@/components/platform/AudienceChip'
import { FormModal } from '@/components/platform/FormModal'
import { ContentItemMenu } from '@/components/platform/ContentItemMenu'

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
  visibility: string | null
  visibilityTeams: string[]
  canDelete: boolean
}

const cardStyle = { background: 'var(--project-white)', borderColor: 'color-mix(in srgb, var(--project-general) 20%, transparent)' }
const inputStyle = { borderColor: 'color-mix(in srgb, var(--project-general) 30%, transparent)', color: 'var(--project-accent)', background: 'var(--project-white)' }

export function ForumList({ slug, locale, threads, isPM, leadOf, agentEnabled = false }: { slug: string; locale: string; threads: ForumListItem[]; isPM: boolean; leadOf: string[]; agentEnabled?: boolean }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  // Leads scope their thread to led teams (default: all of them). PMs open
  // project-wide threads — the server forces the split either way.
  const [teams, setTeams] = useState<string[]>(leadOf)

  const canCreate = isPM || leadOf.length > 0

  const run = (fn: () => Promise<{ error?: string; ok?: boolean }>, after?: () => void) => {
    setError(null)
    startTransition(async () => {
      const res = await fn()
      if (res.error) { setError(res.error); return }
      after?.()
      router.refresh()
    })
  }

  const vote = (id: string) => run(() => toggleThreadVote(slug, locale, id))
  const submit = () =>
    run(() => createThread(slug, locale, { title, body, visibilityTeams: isPM ? [] : teams }), () => {
      setCreating(false); setTitle(''); setBody(''); setTeams(leadOf)
    })

  return (
    <div>
      <div className="flex items-center justify-end mb-1">
        {/* Visually redundant with the breadcrumb — kept for screen readers (BITV). */}
        <h1 className="sr-only">Forum</h1>
        {canCreate && !creating && (
          <button type="button" onClick={() => setCreating(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-cta font-semibold" style={{ background: 'var(--project-accent)', color: 'var(--project-white)' }}>
            <Plus className="w-4 h-4" /> Neues Thema
          </button>
        )}
      </div>
      <p className="text-text mb-6" style={{ color: 'var(--project-ink)' }}>Diskutiere mit, stimme für Themen ab und antworte.</p>

      {error && <p className="text-small mb-4 px-4 py-2.5 rounded-lg" style={{ color: 'var(--project-danger)', background: 'var(--project-danger-surface)' }}>{error}</p>}

      {creating && (
        <FormModal title="Neues Thema" onClose={() => setCreating(false)}>
          <div className="flex flex-col gap-3">
            {error && <p className="text-small px-4 py-2.5 rounded-lg" style={{ color: 'var(--project-danger)', background: 'var(--project-danger-surface)' }}>{error}</p>}
            <input type="text" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titel …" className="w-full px-3 py-2 rounded-lg border text-text outline-none" style={inputStyle} />
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} placeholder="Worum geht es? (Markdown, optional)" className="w-full px-3 py-2 rounded-lg border text-text outline-none font-mono" style={inputStyle} />
            {isPM ? (
              <p className="text-small" style={{ color: 'var(--project-ink)' }}>Sichtbar für alle Projektmitglieder.</p>
            ) : (
              <div>
                <p className="text-small font-medium mb-1.5" style={{ color: 'var(--project-accent)' }}>Sichtbar für Team</p>
                <div className="flex flex-wrap gap-1.5">
                  {leadOf.map((tag) => {
                    const on = teams.includes(tag)
                    return (
                      <button key={tag} type="button" onClick={() => setTeams((s) => (on ? s.filter((t) => t !== tag) : [...s, tag]))} className="text-small px-2.5 py-1 rounded-full border transition-colors" style={{ background: on ? 'var(--project-dark)' : 'transparent', color: on ? 'var(--project-black)' : 'var(--project-accent)', borderColor: on ? 'var(--project-dark)' : 'color-mix(in srgb, var(--project-general) 35%, transparent)' }}>
                        {tag}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
            <div>
              <button type="button" onClick={submit} disabled={pending || !title.trim()} className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-cta font-semibold transition-opacity disabled:opacity-40" style={{ background: 'var(--project-accent)', color: 'var(--project-white)' }}>
                <Plus className="w-4 h-4" /> Erstellen
              </button>
            </div>
          </div>
        </FormModal>
      )}

      {threads.length === 0 && !creating ? (
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
                <p className="flex items-center gap-1.5 text-display font-semibold leading-snug" style={{ color: 'var(--project-accent)' }}>
                  {th.pinned && <Pin className="w-4 h-4 shrink-0" style={{ color: 'var(--project-ink)' }} />}
                  {th.locked && <Lock className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--project-ink)' }} />}
                  <span className="truncate">{th.title}</span>
                  <AudienceChip visibility={th.visibility} visibilityTeams={th.visibilityTeams} />
                </p>
                <p className="text-small mt-0.5" style={{ color: 'var(--project-ink)' }}>
                  {th.authorName} · {new Date(th.createdAt).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}
                  <span className="inline-flex items-center gap-1 ml-2"><MessageSquare className="w-3.5 h-3.5" />{th.commentCount}</span>
                </p>
              </Link>

              {/* Bookmark for every member; ⋯-menu with the common actions plus
                  pin/lock for PMs and delete for the author or PMs. */}
              <div className="shrink-0 flex items-center">
                <SaveButton slug={slug} module="forum" itemId={th.id} />
                <ContentItemMenu
                  slug={slug}
                  locale={locale}
                  agentEnabled={agentEnabled}
                  item={{ module: 'forum', itemId: th.id, title: th.title, href: `/m/forum/${th.slug}` }}
                  disabled={pending}
                  extraItems={[
                    ...(isPM
                      ? [
                          { key: 'pin', label: th.pinned ? 'Nicht mehr anpinnen' : 'Anpinnen', icon: Pin, onSelect: () => run(() => toggleThreadPin(slug, locale, th.id, !th.pinned)) },
                          { key: 'lock', label: th.locked ? 'Entsperren' : 'Sperren', icon: Lock, onSelect: () => run(() => toggleThreadLock(slug, locale, th.id, !th.locked)) },
                        ]
                      : []),
                    ...(th.canDelete
                      ? [{ key: 'delete', label: 'Löschen', icon: Trash2, variant: 'danger' as const, confirmLabel: 'Wirklich löschen?', onSelect: () => run(() => deleteThread(slug, locale, th.id)) }]
                      : []),
                  ]}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
