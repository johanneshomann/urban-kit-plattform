'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Pencil, X, Upload, Globe, Lock, Users as UsersIcon, Send, CalendarClock, Undo2, ImagePlus } from 'lucide-react'
import {
  createProjectNewsPost, updateProjectNewsPost, deleteProjectNewsPost,
  setNewsFeaturedImage, removeNewsFeaturedImage, setNewsPublish,
} from '@/actions/manage/news'

export interface NewsItem {
  id: string
  title: string
  body: string
  visibility: string
  publishedAt?: string | null
  featuredImageUrl?: string | null
}

type Result = { error?: string; ok?: boolean }

const VISIBILITY = [
  { value: 'PUBLIC', label: 'Öffentlich', icon: Globe },
  { value: 'INTERNAL', label: 'Intern', icon: Lock },
  { value: 'TEAM', label: 'Team', icon: UsersIcon },
] as const

const card = 'rounded-xl border'
const cardStyle = { background: 'var(--project-white)', borderColor: 'color-mix(in srgb, var(--project-mid) 20%, transparent)' }
const inputCls = 'px-3 py-2 rounded-lg border text-text outline-none'
const inputStyle = { borderColor: 'color-mix(in srgb, var(--project-mid) 30%, transparent)', color: 'var(--project-dark)', background: 'var(--project-white)' }

function statusOf(p: NewsItem): 'draft' | 'scheduled' | 'published' {
  if (!p.publishedAt) return 'draft'
  return new Date(p.publishedAt).getTime() > Date.now() ? 'scheduled' : 'published'
}
const STATUS_META = {
  draft: { label: 'Entwurf', bg: '#fef9c3', fg: '#854d0e' },
  scheduled: { label: 'Geplant', bg: '#e0e7ff', fg: '#3730a3' },
  published: { label: 'Veröffentlicht', bg: '#dcfce7', fg: '#166534' },
}

export function NewsManager({ slug, locale, posts }: { slug: string; locale: string; posts: NewsItem[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [editing, setEditing] = useState<NewsItem | null>(null) // null = none; sentinel id '' = new
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [visibility, setVisibility] = useState('INTERNAL')

  const [scheduleFor, setScheduleFor] = useState<string | null>(null) // post id showing the schedule picker
  const [scheduleAt, setScheduleAt] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const run = (fn: () => Promise<Result>, after?: () => void) => {
    setError(null)
    startTransition(async () => {
      const res = await fn()
      if (res.error) { setError(res.error); return }
      after?.()
      router.refresh()
    })
  }

  const openNew = () => { setEditing({ id: '', title: '', body: '', visibility: 'INTERNAL' }); setTitle(''); setBody(''); setVisibility('INTERNAL') }
  const openEdit = (p: NewsItem) => { setEditing(p); setTitle(p.title); setBody(p.body); setVisibility(p.visibility) }
  const closeEditor = () => setEditing(null)

  const save = () => {
    if (!editing) return
    if (editing.id === '') {
      run(() => createProjectNewsPost(slug, locale, { title, body, visibility }), closeEditor)
    } else {
      run(() => updateProjectNewsPost(slug, locale, editing.id, { title, body, visibility }), closeEditor)
    }
  }

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = ''
    if (!file || !editing || editing.id === '') return
    const fd = new FormData(); fd.append('file', file)
    run(() => setNewsFeaturedImage(slug, locale, editing.id, fd))
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-title font-bold leading-tight" style={{ color: 'var(--project-dark)' }}>News</h1>
        {!editing && (
          <button type="button" onClick={openNew}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-cta font-semibold"
            style={{ background: 'var(--project-dark)', color: 'var(--project-white)' }}>
            <Plus className="w-4 h-4" /> Neuer Beitrag
          </button>
        )}
      </div>
      <p className="text-text mb-6" style={{ color: 'var(--project-dark)', opacity: 0.65 }}>Beiträge erstellen, veröffentlichen und verwalten.</p>

      {error && <p className="text-small mb-4 px-4 py-2.5 rounded-lg" style={{ color: '#b91c1c', background: '#fef2f2' }}>{error}</p>}

      {/* Editor */}
      {editing && (
        <div className={`${card} p-5 mb-6`} style={cardStyle}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-small font-bold uppercase tracking-widest" style={{ color: 'var(--project-dark)', opacity: 0.5 }}>
              {editing.id === '' ? 'Neuer Beitrag' : 'Beitrag bearbeiten'}
            </h2>
            <button type="button" onClick={closeEditor} className="p-1 rounded" style={{ color: 'var(--project-dark)', opacity: 0.6 }}><X className="w-4 h-4" /></button>
          </div>

          <div className="flex flex-col gap-3">
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titel …" className={`${inputCls} w-full`} style={inputStyle} />
            <div>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} placeholder={'## Überschrift\n\nText … (Markdown)'} className={`${inputCls} w-full font-mono`} style={inputStyle} />
              <p className="text-small mt-1" style={{ color: 'var(--project-dark)', opacity: 0.5 }}>Markdown — Überschriften (##), **fett**, Listen (-).</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-small font-medium" style={{ color: 'var(--project-dark)' }}>Sichtbarkeit:</span>
              <select value={visibility} onChange={(e) => setVisibility(e.target.value)} className={inputCls} style={inputStyle}>
                {VISIBILITY.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
              </select>
            </div>

            {/* Featured image — only for saved posts */}
            {editing.id !== '' && (
              <div className="flex items-center gap-3">
                <div className="w-28 h-16 rounded-lg overflow-hidden shrink-0 flex items-center justify-center" style={{ background: 'var(--project-light)' }}>
                  {editing.featuredImageUrl
                    ? <img src={editing.featuredImageUrl} alt="" className="w-full h-full object-cover" />
                    : <ImagePlus className="w-5 h-5" style={{ color: 'var(--project-dark)', opacity: 0.4 }} />}
                </div>
                <button type="button" onClick={() => fileInput.current?.click()} disabled={pending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-small font-medium border disabled:opacity-40"
                  style={{ color: 'var(--project-dark)', borderColor: 'color-mix(in srgb, var(--project-mid) 30%, transparent)' }}>
                  <Upload className="w-4 h-4" /> {editing.featuredImageUrl ? 'Titelbild ändern' : 'Titelbild'}
                </button>
                {editing.featuredImageUrl && (
                  <button type="button" onClick={() => run(() => removeNewsFeaturedImage(slug, locale, editing.id))} disabled={pending}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-small disabled:opacity-40" style={{ color: '#b91c1c' }}>
                    <Trash2 className="w-4 h-4" /> Entfernen
                  </button>
                )}
                <input ref={fileInput} type="file" accept="image/*" hidden onChange={onFile} />
              </div>
            )}

            <div>
              <button type="button" onClick={save} disabled={pending || !title.trim()}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-cta font-semibold transition-opacity disabled:opacity-40"
                style={{ background: 'var(--project-dark)', color: 'var(--project-white)' }}>
                {editing.id === '' ? <Plus className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                {editing.id === '' ? 'Als Entwurf anlegen' : 'Speichern'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="flex flex-col gap-2">
        {posts.length === 0 ? (
          <p className="text-text py-8 text-center" style={{ color: 'var(--project-dark)', opacity: 0.4 }}>Noch keine Beiträge.</p>
        ) : posts.map((p) => {
          const status = statusOf(p)
          const meta = STATUS_META[status]
          const visMeta = VISIBILITY.find((v) => v.value === p.visibility)
          const VisIcon = visMeta?.icon ?? Lock
          return (
            <div key={p.id} className={`${card} px-4 py-3`} style={cardStyle}>
              <div className="flex items-center gap-3">
                {p.featuredImageUrl && <img src={p.featuredImageUrl} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-text font-medium truncate" style={{ color: 'var(--project-dark)' }}>{p.title}</p>
                  <p className="text-small flex items-center gap-1.5 mt-0.5" style={{ color: 'var(--project-dark)', opacity: 0.55 }}>
                    <VisIcon className="w-3.5 h-3.5" />{visMeta?.label ?? p.visibility}
                    {status === 'scheduled' && p.publishedAt && <> · {new Date(p.publishedAt).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })}</>}
                  </p>
                </div>
                <span className="text-small font-semibold px-2.5 py-0.5 rounded-full shrink-0" style={{ background: meta.bg, color: meta.fg }}>{meta.label}</span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 mt-3">
                <button type="button" onClick={() => openEdit(p)} disabled={pending}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-small font-medium border disabled:opacity-40"
                  style={{ color: 'var(--project-dark)', borderColor: 'color-mix(in srgb, var(--project-mid) 30%, transparent)' }}>
                  <Pencil className="w-3.5 h-3.5" /> Bearbeiten
                </button>

                {status === 'published' ? (
                  <button type="button" onClick={() => run(() => setNewsPublish(slug, locale, p.id, 'draft'))} disabled={pending}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-small font-medium border disabled:opacity-40"
                    style={{ color: 'var(--project-dark)', borderColor: 'color-mix(in srgb, var(--project-mid) 30%, transparent)' }}>
                    <Undo2 className="w-3.5 h-3.5" /> Zurückziehen
                  </button>
                ) : (
                  <>
                    <button type="button" onClick={() => run(() => setNewsPublish(slug, locale, p.id, 'now'))} disabled={pending}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-small font-semibold disabled:opacity-40"
                      style={{ background: 'var(--project-dark)', color: 'var(--project-white)' }}>
                      <Send className="w-3.5 h-3.5" /> Veröffentlichen
                    </button>
                    <button type="button" onClick={() => { setScheduleFor(scheduleFor === p.id ? null : p.id); setScheduleAt('') }} disabled={pending}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-small font-medium border disabled:opacity-40"
                      style={{ color: 'var(--project-dark)', borderColor: 'color-mix(in srgb, var(--project-mid) 30%, transparent)' }}>
                      <CalendarClock className="w-3.5 h-3.5" /> {status === 'scheduled' ? 'Umplanen' : 'Planen'}
                    </button>
                  </>
                )}

                {confirmDelete === p.id ? (
                  <span className="flex items-center gap-1.5">
                    <button type="button" onClick={() => run(() => deleteProjectNewsPost(slug, locale, p.id), () => setConfirmDelete(null))} disabled={pending}
                      className="px-3 py-1.5 rounded-lg text-small font-semibold disabled:opacity-40" style={{ background: '#b91c1c', color: 'white' }}>Löschen</button>
                    <button type="button" onClick={() => setConfirmDelete(null)} className="px-2 py-1.5 rounded-lg text-small" style={{ color: 'var(--project-dark)', opacity: 0.7 }}>Abbrechen</button>
                  </span>
                ) : (
                  <button type="button" onClick={() => setConfirmDelete(p.id)} disabled={pending} title="Löschen"
                    className="p-2 rounded-lg disabled:opacity-40 ml-auto" style={{ color: '#b91c1c' }}><Trash2 className="w-4 h-4" /></button>
                )}
              </div>

              {scheduleFor === p.id && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t" style={{ borderColor: 'color-mix(in srgb, var(--project-mid) 15%, transparent)' }}>
                  <input type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} className={inputCls} style={inputStyle} />
                  <button type="button" onClick={() => run(() => setNewsPublish(slug, locale, p.id, 'schedule', scheduleAt), () => setScheduleFor(null))}
                    disabled={pending || !scheduleAt}
                    className="px-4 py-2 rounded-lg text-small font-semibold disabled:opacity-40" style={{ background: 'var(--project-dark)', color: 'var(--project-white)' }}>
                    Planen
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
