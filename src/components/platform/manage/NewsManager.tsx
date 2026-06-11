'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Globe, Lock, Users as UsersIcon } from 'lucide-react'
import { createProjectNewsPost, deleteProjectNewsPost } from '@/actions/manage/news'

export interface NewsItem {
  id: string
  title: string
  publishedAt?: string | null
  visibility?: string | null
}

const VISIBILITY = [
  { value: 'PUBLIC', label: 'Öffentlich', icon: Globe },
  { value: 'INTERNAL', label: 'Intern', icon: Lock },
  { value: 'TEAM', label: 'Team', icon: UsersIcon },
] as const

const card = 'rounded-xl border px-4 py-3'
const cardStyle = { background: 'var(--project-white)', borderColor: 'color-mix(in srgb, var(--project-mid) 20%, transparent)' }

export function NewsManager({ slug, locale, posts }: { slug: string; locale: string; posts: NewsItem[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [title, setTitle] = useState('')
  const [visibility, setVisibility] = useState<string>('INTERNAL')
  const [error, setError] = useState<string | null>(null)

  const submit = () => {
    setError(null)
    startTransition(async () => {
      const res = await createProjectNewsPost(slug, locale, { title, visibility })
      if (res.error) { setError(res.error); return }
      setTitle('')
      router.refresh()
    })
  }

  const remove = (id: string) => {
    setError(null)
    startTransition(async () => {
      const res = await deleteProjectNewsPost(slug, locale, id)
      if (res.error) { setError(res.error); return }
      router.refresh()
    })
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-title font-bold leading-tight mb-1" style={{ color: 'var(--project-dark)' }}>News</h1>
      <p className="text-text mb-6" style={{ color: 'var(--project-dark)', opacity: 0.65 }}>
        Beiträge für dieses Projekt erstellen und verwalten.
      </p>

      {/* Create */}
      <div className={card} style={cardStyle}>
        <label className="block text-small font-semibold mb-1" style={{ color: 'var(--project-dark)' }}>Neuer Beitrag</label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && title.trim() && !pending) submit() }}
            placeholder="Titel des Beitrags …"
            className="flex-1 px-3 py-2 rounded-lg border text-text outline-none"
            style={{ borderColor: 'color-mix(in srgb, var(--project-mid) 30%, transparent)', color: 'var(--project-dark)', background: 'var(--project-white)' }}
          />
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="px-3 py-2 rounded-lg border text-text outline-none"
            style={{ borderColor: 'color-mix(in srgb, var(--project-mid) 30%, transparent)', color: 'var(--project-dark)', background: 'var(--project-white)' }}
          >
            {VISIBILITY.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
          </select>
          <button
            type="button"
            onClick={submit}
            disabled={pending || !title.trim()}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-cta font-semibold transition-opacity disabled:opacity-40"
            style={{ background: 'var(--project-dark)', color: 'var(--project-white)' }}
          >
            <Plus className="w-4 h-4" />
            Erstellen
          </button>
        </div>
        {error && <p className="text-small mt-2" style={{ color: '#b91c1c' }}>{error}</p>}
      </div>

      {/* List */}
      <div className="mt-6 flex flex-col gap-2">
        {posts.length === 0 ? (
          <p className="text-text py-8 text-center" style={{ color: 'var(--project-dark)', opacity: 0.4 }}>
            Noch keine Beiträge.
          </p>
        ) : (
          posts.map((p) => {
            const vis = VISIBILITY.find((v) => v.value === p.visibility)
            const VisIcon = vis?.icon ?? Lock
            return (
              <div key={p.id} className={`${card} flex items-center justify-between gap-3`} style={cardStyle}>
                <div className="min-w-0">
                  <p className="text-text font-medium truncate" style={{ color: 'var(--project-dark)' }}>{p.title}</p>
                  <p className="text-small flex items-center gap-1.5 mt-0.5" style={{ color: 'var(--project-dark)', opacity: 0.55 }}>
                    <VisIcon className="w-3.5 h-3.5" />
                    {vis?.label ?? p.visibility}
                    {' · '}
                    {p.publishedAt ? 'Veröffentlicht' : 'Entwurf'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(p.id)}
                  disabled={pending}
                  title="Löschen"
                  className="shrink-0 p-2 rounded-lg transition-colors disabled:opacity-40"
                  style={{ color: '#b91c1c' }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
