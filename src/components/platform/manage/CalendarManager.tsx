'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, MapPin, Tag, Globe, Lock, Users as UsersIcon } from 'lucide-react'
import { createProjectEvent, deleteProjectEvent } from '@/actions/manage/calendar'

export interface EventItem {
  id: string
  title: string
  startDate: string
  endDate?: string | null
  location?: string | null
  category?: string | null
  visibility?: string | null
}

const VISIBILITY = [
  { value: 'PUBLIC', label: 'Öffentlich', icon: Globe },
  { value: 'INTERNAL', label: 'Intern', icon: Lock },
  { value: 'TEAM', label: 'Team', icon: UsersIcon },
] as const

const card = 'rounded-xl border px-4 py-3'
const cardStyle = { background: 'var(--project-white)', borderColor: 'color-mix(in srgb, var(--project-mid) 20%, transparent)' }
const inputCls = 'px-3 py-2 rounded-lg border text-text outline-none'
const inputStyle = {
  borderColor: 'color-mix(in srgb, var(--project-mid) 30%, transparent)',
  color: 'var(--project-dark)',
  background: 'var(--project-white)',
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })
}

export function CalendarManager({ slug, locale, events }: { slug: string; locale: string; events: EventItem[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [location, setLocation] = useState('')
  const [category, setCategory] = useState('')
  const [visibility, setVisibility] = useState('INTERNAL')

  const now = Date.now()
  const upcoming = events.filter((e) => new Date(e.startDate).getTime() >= now)
  const past = events.filter((e) => new Date(e.startDate).getTime() < now)

  const run = (fn: () => Promise<{ error?: string; ok?: boolean }>, after?: () => void) => {
    setError(null)
    startTransition(async () => {
      const res = await fn()
      if (res.error) { setError(res.error); return }
      after?.()
      router.refresh()
    })
  }

  const submit = () => run(
    () => createProjectEvent(slug, locale, { title, startDate, endDate: endDate || undefined, location, category, visibility }),
    () => { setTitle(''); setStartDate(''); setEndDate(''); setLocation(''); setCategory('') },
  )

  const EventRow = ({ e, muted }: { e: EventItem; muted?: boolean }) => {
    const vis = VISIBILITY.find((v) => v.value === e.visibility)
    const VisIcon = vis?.icon ?? Lock
    return (
      <div className={`${card} flex items-center justify-between gap-3`} style={{ ...cardStyle, opacity: muted ? 0.6 : 1 }}>
        <div className="min-w-0">
          <p className="text-text font-medium truncate" style={{ color: 'var(--project-dark)' }}>{e.title}</p>
          <p className="text-small flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5" style={{ color: 'var(--project-dark)', opacity: 0.55 }}>
            <span>{fmtDate(e.startDate)}{e.endDate ? ` – ${fmtDate(e.endDate)}` : ''}</span>
            {e.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{e.location}</span>}
            {e.category && <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5" />{e.category}</span>}
            <span className="flex items-center gap-1"><VisIcon className="w-3.5 h-3.5" />{vis?.label ?? e.visibility}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => run(() => deleteProjectEvent(slug, locale, e.id))}
          disabled={pending}
          title="Löschen"
          className="shrink-0 p-2 rounded-lg transition-colors disabled:opacity-40"
          style={{ color: '#b91c1c' }}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-title font-bold leading-tight mb-1" style={{ color: 'var(--project-dark)' }}>Kalender</h1>
      <p className="text-text mb-6" style={{ color: 'var(--project-dark)', opacity: 0.65 }}>
        Termine und Veranstaltungen für dieses Projekt verwalten.
      </p>

      {/* Create */}
      <div className={card} style={cardStyle}>
        <label className="block text-small font-semibold mb-2" style={{ color: 'var(--project-dark)' }}>Neuer Termin</label>
        <div className="flex flex-col gap-2">
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titel des Termins …"
            className={`${inputCls} w-full`} style={inputStyle} />
          <div className="grid sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-small mb-1" style={{ color: 'var(--project-dark)', opacity: 0.6 }}>Beginn</label>
              <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={`${inputCls} w-full`} style={inputStyle} />
            </div>
            <div>
              <label className="block text-small mb-1" style={{ color: 'var(--project-dark)', opacity: 0.6 }}>Ende (optional)</label>
              <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={`${inputCls} w-full`} style={inputStyle} />
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-2">
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ort (optional)" className={inputCls} style={inputStyle} />
            <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Kategorie (optional)" className={inputCls} style={inputStyle} />
            <select value={visibility} onChange={(e) => setVisibility(e.target.value)} className={inputCls} style={inputStyle}>
              {VISIBILITY.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <button
              type="button"
              onClick={submit}
              disabled={pending || !title.trim() || !startDate}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-cta font-semibold transition-opacity disabled:opacity-40"
              style={{ background: 'var(--project-dark)', color: 'var(--project-white)' }}
            >
              <Plus className="w-4 h-4" /> Termin erstellen
            </button>
          </div>
        </div>
        {error && <p className="text-small mt-2" style={{ color: '#b91c1c' }}>{error}</p>}
      </div>

      {/* Upcoming */}
      <h2 className="text-small font-bold uppercase tracking-widest mt-8 mb-3" style={{ color: 'var(--project-dark)', opacity: 0.45 }}>
        Anstehend ({upcoming.length})
      </h2>
      {upcoming.length === 0
        ? <p className="text-text py-4 text-center" style={{ color: 'var(--project-dark)', opacity: 0.4 }}>Keine anstehenden Termine.</p>
        : <div className="flex flex-col gap-2">{upcoming.map((e) => <EventRow key={e.id} e={e} />)}</div>}

      {/* Past */}
      {past.length > 0 && (
        <>
          <h2 className="text-small font-bold uppercase tracking-widest mt-8 mb-3" style={{ color: 'var(--project-dark)', opacity: 0.45 }}>
            Vergangen ({past.length})
          </h2>
          <div className="flex flex-col gap-2">{past.map((e) => <EventRow key={e.id} e={e} muted />)}</div>
        </>
      )}
    </div>
  )
}
