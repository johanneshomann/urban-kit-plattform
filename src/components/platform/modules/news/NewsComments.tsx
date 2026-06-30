'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Trash2, MessageSquare } from 'lucide-react'
import { postNewsComment, deleteNewsComment } from '@/actions/news-comments'

export interface CommentItem {
  id: string
  body: string
  authorName: string
  createdAt: string
  canDelete: boolean
}

export function NewsComments({
  slug, locale, postId, comments, canComment, loginHref,
}: {
  slug: string; locale: string; postId: string; comments: CommentItem[]; canComment: boolean; loginHref?: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = () => {
    setError(null)
    startTransition(async () => {
      const res = await postNewsComment(slug, locale, postId, body)
      if (res.error) { setError(res.error); return }
      setBody(''); router.refresh()
    })
  }
  const remove = (id: string) => {
    setError(null)
    startTransition(async () => {
      const res = await deleteNewsComment(slug, locale, id)
      if (res.error) { setError(res.error); return }
      router.refresh()
    })
  }

  return (
    <section className="mt-8">
      <h2 className="flex items-center gap-2 text-display font-bold mb-4" style={{ color: 'var(--project-dark)' }}>
        <MessageSquare className="w-5 h-5" /> Kommentare ({comments.length})
      </h2>

      {canComment ? (
        <div className="rounded-xl border p-3 mb-5" style={{ background: 'var(--project-white)', borderColor: 'color-mix(in srgb, var(--project-mid) 20%, transparent)' }}>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="Schreibe einen Kommentar …"
            className="w-full px-3 py-2 rounded-lg border text-text outline-none"
            style={{ borderColor: 'color-mix(in srgb, var(--project-mid) 30%, transparent)', color: 'var(--project-dark)', background: 'var(--project-white)' }}
          />
          <div className="flex items-center gap-3 mt-2">
            <button type="button" onClick={submit} disabled={pending || !body.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-cta font-semibold transition-opacity disabled:opacity-40"
              style={{ background: 'var(--project-dark)', color: 'var(--project-white)' }}>
              <Send className="w-4 h-4" /> Kommentieren
            </button>
            {error && <span className="text-small" style={{ color: '#b91c1c' }}>{error}</span>}
          </div>
        </div>
      ) : (
        <p className="text-small mb-5 px-4 py-3 rounded-lg" style={{ background: 'var(--project-light)', color: 'var(--project-dark)', opacity: 0.8 }}>
          {loginHref
            ? <>Bitte <a href={loginHref} className="underline font-medium">melde dich an</a>, um zu kommentieren.</>
            : 'Nur Projektmitglieder können kommentieren.'}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {comments.length === 0 ? (
          <p className="text-text" style={{ color: 'var(--project-dark)', opacity: 0.4 }}>Noch keine Kommentare.</p>
        ) : comments.map((c) => (
          <div key={c.id} className="rounded-xl border px-4 py-3" style={{ background: 'var(--project-white)', borderColor: 'color-mix(in srgb, var(--project-mid) 20%, transparent)' }}>
            <div className="flex items-center justify-between gap-3 mb-1">
              <span className="text-small font-semibold" style={{ color: 'var(--project-dark)' }}>{c.authorName}</span>
              <span className="flex items-center gap-2">
                <span className="text-small" style={{ color: 'var(--project-dark)', opacity: 0.45 }}>{new Date(c.createdAt).toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                {c.canDelete && (
                  <button type="button" onClick={() => remove(c.id)} disabled={pending} title="Löschen" className="p-1 rounded disabled:opacity-40" style={{ color: '#b91c1c' }}><Trash2 className="w-3.5 h-3.5" /></button>
                )}
              </span>
            </div>
            <p className="text-text whitespace-pre-wrap" style={{ color: 'var(--project-dark)', opacity: 0.85 }}>{c.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
