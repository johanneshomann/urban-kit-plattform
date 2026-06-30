'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, X, ChevronUp, MessageSquare, Pin, Lock, Trash2, MessagesSquare } from 'lucide-react'
import { createThread, toggleThreadVote, deleteThread } from '@/actions/forum'

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

const cardStyle = { background: 'var(--project-white)', borderColor: 'color-mix(in srgb, var(--project-mid) 20%, transparent)' }
const inputStyle = { borderColor: 'color-mix(in srgb, var(--project-mid) 30%, transparent)', color: 'var(--project-dark)', background: 'var(--project-white)' }

export function ForumList({ slug, locale, threads }: { slug: string; locale: string; threads: ForumListItem[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const run = (fn: () => Promise<{ error?: string; ok?: boolean }>, after?: () => void) => {
    setError(null)
    startTransition(async () => {
      const res = await fn()
      if (res.error) { setError(res.error); return }
      after?.(); router.refresh()
    })
  }

  const submit = () => run(() => createThread(slug, locale, { title, body }), () => { setTitle(''); setBody(''); setShowForm(false) })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-title font-bold leading-tight" style={{ color: 'var(--project-dark)' }}>Forum</h1>
        <button type="button" onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-cta font-semibold" style={{ background: 'var(--project-dark)', color: 'var(--project-white)' }}>
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}{showForm ? 'Abbrechen' : 'Neues Thema'}
        </button>
      </div>

      {error && <p className="text-small mb-4 px-4 py-2.5 rounded-lg" style={{ color: '#b91c1c', background: '#fef2f2' }}>{error}</p>}

      {showForm && (
        <div className="rounded-xl border p-5 mb-6 flex flex-col gap-3" style={cardStyle}>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titel des Themas …" className="w-full px-3 py-2 rounded-lg border text-text outline-none" style={inputStyle} />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="Worum geht es? (Markdown)" className="w-full px-3 py-2 rounded-lg border text-text outline-none font-mono" style={inputStyle} />
          <div>
            <button type="button" onClick={submit} disabled={pending || !title.trim()} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-cta font-semibold transition-opacity disabled:opacity-40" style={{ background: 'var(--project-dark)', color: 'var(--project-white)' }}>
              <Plus className="w-4 h-4" /> Thema erstellen
            </button>
          </div>
        </div>
      )}

      {threads.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border py-12" style={cardStyle}>
          <MessagesSquare className="w-8 h-8" style={{ color: 'var(--project-mid)', opacity: 0.5 }} />
          <p className="text-text" style={{ color: 'var(--project-dark)', opacity: 0.5 }}>Noch keine Themen. Starte das erste!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {threads.map((th) => (
            <div key={th.id} className="flex items-center gap-3 rounded-xl border px-4 py-3" style={cardStyle}>
              {/* Upvote */}
              <button type="button" onClick={() => run(() => toggleThreadVote(slug, locale, th.id))} disabled={pending}
                className="flex flex-col items-center justify-center w-12 py-1 rounded-lg border shrink-0 disabled:opacity-40"
                style={{ background: th.hasVoted ? 'var(--project-dark)' : 'transparent', color: th.hasVoted ? 'var(--project-white)' : 'var(--project-dark)', borderColor: th.hasVoted ? 'var(--project-dark)' : 'color-mix(in srgb, var(--project-mid) 30%, transparent)' }}>
                <ChevronUp className="w-4 h-4" /><span className="text-small font-bold">{th.voteCount}</span>
              </button>

              <Link href={`/${locale}/dashboard/projekte/${slug}/m/forum/${th.slug}`} className="flex-1 min-w-0">
                <p className="flex items-center gap-1.5 text-display font-semibold leading-snug truncate" style={{ color: 'var(--project-dark)' }}>
                  {th.pinned && <Pin className="w-4 h-4 shrink-0" style={{ color: 'var(--project-mid)' }} />}
                  {th.locked && <Lock className="w-3.5 h-3.5 shrink-0" style={{ opacity: 0.5 }} />}
                  {th.title}
                </p>
                <p className="text-small mt-0.5" style={{ color: 'var(--project-dark)', opacity: 0.55 }}>
                  {th.authorName} · {new Date(th.createdAt).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}
                  <span className="inline-flex items-center gap-1 ml-2"><MessageSquare className="w-3.5 h-3.5" />{th.commentCount}</span>
                </p>
              </Link>

              {th.canDelete && (
                <div className="flex items-center gap-1 shrink-0">
                  {confirmDelete === th.id ? (
                    <>
                      <button type="button" onClick={() => run(() => deleteThread(slug, locale, th.id), () => setConfirmDelete(null))} disabled={pending} className="px-2 py-1 rounded text-small font-semibold disabled:opacity-40" style={{ background: '#b91c1c', color: 'white' }}>Löschen</button>
                      <button type="button" onClick={() => setConfirmDelete(null)} className="px-1.5 py-1 rounded text-small" style={{ color: 'var(--project-dark)', opacity: 0.7 }}>×</button>
                    </>
                  ) : (
                    <button type="button" title="Mein Thema löschen" onClick={() => setConfirmDelete(th.id)} disabled={pending} className="p-1.5 rounded disabled:opacity-40" style={{ color: '#b91c1c' }}><Trash2 className="w-4 h-4" /></button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
