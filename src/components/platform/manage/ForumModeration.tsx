'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Pin, Lock, Trash2, ChevronDown, ChevronUp, MessageSquare, ExternalLink, MessagesSquare, Plus, X } from 'lucide-react'
import { createThread, toggleThreadPin, toggleThreadLock, deleteThread, deleteForumComment } from '@/actions/forum'

export interface ModComment { id: string; authorName: string; createdAt: string; html: string | null }
export interface ModThread {
  id: string; slug: string; title: string; authorName: string; createdAt: string
  pinned: boolean; locked: boolean; voteCount: number; comments: ModComment[]
}

const cardStyle = { background: 'var(--project-white)', borderColor: 'color-mix(in srgb, var(--project-mid) 20%, transparent)' }

export function ForumModeration({ slug, locale, threads }: { slug: string; locale: string; threads: ModThread[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  const run = (fn: () => Promise<{ error?: string; ok?: boolean }>, after?: () => void) => {
    setError(null)
    startTransition(async () => {
      const res = await fn()
      if (res.error) { setError(res.error); return }
      after?.(); router.refresh()
    })
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-title font-bold leading-tight" style={{ color: 'var(--project-dark)' }}>Forum</h1>
        <button type="button" onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-cta font-semibold" style={{ background: 'var(--project-dark)', color: 'var(--project-white)' }}>
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}{showForm ? 'Abbrechen' : 'Neues Thema'}
        </button>
      </div>
      <p className="text-text mb-6" style={{ color: 'var(--project-dark)', opacity: 0.65 }}>
        Themen erstellen und moderieren — anpinnen, sperren, löschen. Mitglieder antworten und stimmen ab.
      </p>

      {error && <p className="text-small mb-4 px-4 py-2.5 rounded-lg" style={{ color: '#b91c1c', background: '#fef2f2' }}>{error}</p>}

      {showForm && (
        <div className="rounded-xl border p-5 mb-6 flex flex-col gap-3" style={cardStyle}>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titel des Themas …" className="w-full px-3 py-2 rounded-lg border text-text outline-none" style={{ borderColor: 'color-mix(in srgb, var(--project-mid) 30%, transparent)', color: 'var(--project-dark)', background: 'var(--project-white)' }} />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="Einleitung / Frage (Markdown, optional)" className="w-full px-3 py-2 rounded-lg border text-text outline-none font-mono" style={{ borderColor: 'color-mix(in srgb, var(--project-mid) 30%, transparent)', color: 'var(--project-dark)', background: 'var(--project-white)' }} />
          <div>
            <button type="button" onClick={() => run(() => createThread(slug, locale, { title, body }), () => { setTitle(''); setBody(''); setShowForm(false) })} disabled={pending || !title.trim()} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-cta font-semibold transition-opacity disabled:opacity-40" style={{ background: 'var(--project-dark)', color: 'var(--project-white)' }}>
              <Plus className="w-4 h-4" /> Thema erstellen
            </button>
          </div>
        </div>
      )}

      {threads.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border py-12" style={cardStyle}>
          <MessagesSquare className="w-8 h-8" style={{ color: 'var(--project-mid)', opacity: 0.5 }} />
          <p className="text-text" style={{ color: 'var(--project-dark)', opacity: 0.5 }}>Noch keine Themen.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {threads.map((th) => (
            <div key={th.id} className="rounded-xl border" style={cardStyle}>
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="flex items-center gap-1.5 text-display font-semibold leading-snug truncate" style={{ color: 'var(--project-dark)' }}>
                    {th.pinned && <Pin className="w-4 h-4 shrink-0" style={{ color: 'var(--project-mid)' }} />}
                    {th.locked && <Lock className="w-3.5 h-3.5 shrink-0" style={{ opacity: 0.5 }} />}
                    {th.title}
                  </p>
                  <p className="text-small mt-0.5" style={{ color: 'var(--project-dark)', opacity: 0.55 }}>
                    {th.authorName} · {new Date(th.createdAt).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })} · ▲ {th.voteCount}
                    <span className="inline-flex items-center gap-1 ml-2"><MessageSquare className="w-3.5 h-3.5" />{th.comments.length}</span>
                  </p>
                </div>
                <Link href={`/${locale}/dashboard/projekte/${slug}/m/forum/${th.slug}`} title="Im Forum öffnen" className="p-1.5 rounded shrink-0" style={{ color: 'var(--project-dark)', opacity: 0.6 }}><ExternalLink className="w-4 h-4" /></Link>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 px-4 pb-3" style={{ color: 'var(--project-dark)' }}>
                <button type="button" onClick={() => run(() => toggleThreadPin(slug, locale, th.id, !th.pinned))} disabled={pending}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-small font-medium border disabled:opacity-40"
                  style={{ borderColor: 'color-mix(in srgb, var(--project-mid) 30%, transparent)', background: th.pinned ? 'var(--project-light)' : 'transparent' }}>
                  <Pin className="w-3.5 h-3.5" /> {th.pinned ? 'Gepinnt' : 'Anpinnen'}
                </button>
                <button type="button" onClick={() => run(() => toggleThreadLock(slug, locale, th.id, !th.locked))} disabled={pending}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-small font-medium border disabled:opacity-40"
                  style={{ borderColor: 'color-mix(in srgb, var(--project-mid) 30%, transparent)', background: th.locked ? 'var(--project-light)' : 'transparent' }}>
                  <Lock className="w-3.5 h-3.5" /> {th.locked ? 'Gesperrt' : 'Sperren'}
                </button>
                {th.comments.length > 0 && (
                  <button type="button" onClick={() => setOpen(open === th.id ? null : th.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-small font-medium border" style={{ borderColor: 'color-mix(in srgb, var(--project-mid) 30%, transparent)' }}>
                    Antworten {open === th.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                )}
                {confirm === th.id ? (
                  <span className="flex items-center gap-1.5 ml-auto">
                    <button type="button" onClick={() => run(() => deleteThread(slug, locale, th.id), () => setConfirm(null))} disabled={pending} className="px-3 py-1.5 rounded-lg text-small font-semibold disabled:opacity-40" style={{ background: '#b91c1c', color: 'white' }}>Thema löschen</button>
                    <button type="button" onClick={() => setConfirm(null)} className="px-2 py-1.5 rounded-lg text-small" style={{ opacity: 0.7 }}>Abbrechen</button>
                  </span>
                ) : (
                  <button type="button" onClick={() => setConfirm(th.id)} disabled={pending} title="Thema löschen" className="p-2 rounded-lg ml-auto disabled:opacity-40" style={{ color: '#b91c1c' }}><Trash2 className="w-4 h-4" /></button>
                )}
              </div>

              {open === th.id && (
                <div className="border-t px-4 py-3 flex flex-col gap-2" style={{ borderColor: 'color-mix(in srgb, var(--project-mid) 15%, transparent)' }}>
                  {th.comments.map((c) => (
                    <div key={c.id} className="flex items-start justify-between gap-3 rounded-lg px-3 py-2" style={{ background: 'var(--project-light)' }}>
                      <div className="min-w-0">
                        <p className="text-small font-semibold" style={{ color: 'var(--project-dark)' }}>{c.authorName} <span className="font-normal" style={{ opacity: 0.5 }}>· {new Date(c.createdAt).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}</span></p>
                        {c.html ? <div className="prose-news text-small" style={{ color: 'var(--project-dark)', opacity: 0.85 }} dangerouslySetInnerHTML={{ __html: c.html }} /> : null}
                      </div>
                      <button type="button" onClick={() => run(() => deleteForumComment(slug, locale, c.id))} disabled={pending} title="Antwort löschen" className="p-1.5 rounded shrink-0 disabled:opacity-40" style={{ color: '#b91c1c' }}><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
