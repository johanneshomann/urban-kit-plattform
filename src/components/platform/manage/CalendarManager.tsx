'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Plus, Trash2, Pencil, X, MapPin, Tag, Globe, Lock, Users as UsersIcon } from 'lucide-react'
import { createProjectEvent, updateProjectEvent, deleteProjectEvent } from '@/actions/manage/calendar'

export interface EventItem {
  id: string
  title: string
  startDate: string
  endDate?: string | null
  allDay?: boolean | null
  location?: string | null
  category?: string | null
  visibility?: string | null
  body?: string
}

type Result = { error?: string; ok?: boolean }

const VISIBILITY = [
  { value: 'PUBLIC', labelKey: 'calendar.visibilityPublic', icon: Globe },
  { value: 'INTERNAL', labelKey: 'calendar.visibilityInternal', icon: Lock },
  { value: 'TEAM', labelKey: 'calendar.visibilityTeam', icon: UsersIcon },
] as const

const card = 'rounded-xl border'
const cardStyle = { background: 'var(--project-white)', borderColor: 'color-mix(in srgb, var(--project-mid) 20%, transparent)' }
const inputCls = 'px-3 py-2 rounded-lg border text-text outline-none'
const inputStyle = { borderColor: 'color-mix(in srgb, var(--project-mid) 30%, transparent)', color: 'var(--project-dark)', background: 'var(--project-white)' }

const blank: EventItem = { id: '', title: '', startDate: '', endDate: '', allDay: false, location: '', category: '', visibility: 'INTERNAL', body: '' }

function fmt(iso: string, allDay?: boolean | null): string {
  return new Date(iso).toLocaleString('de-DE', allDay ? { dateStyle: 'medium' } : { dateStyle: 'medium', timeStyle: 'short' })
}
// ISO → value for <input type=date|datetime-local>
function toInput(iso: string | null | undefined, allDay: boolean): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  return allDay ? date : `${date}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function CalendarManager({ slug, locale, events }: { slug: string; locale: string; events: EventItem[] }) {
  const t = useTranslations('manage')
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<EventItem | null>(null)
  const [f, setF] = useState<EventItem>(blank)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const now = Date.now()
  const upcoming = events.filter((e) => new Date(e.startDate).getTime() >= now)
  const past = events.filter((e) => new Date(e.startDate).getTime() < now)

  const run = (fn: () => Promise<Result>, after?: () => void) => {
    setError(null)
    startTransition(async () => {
      const res = await fn()
      if (res.error) { setError(res.error); return }
      after?.()
      router.refresh()
    })
  }

  const set = <K extends keyof EventItem>(k: K, v: EventItem[K]) => setF((s) => ({ ...s, [k]: v }))
  const openNew = () => { setEditing(blank); setF(blank) }
  const openEdit = (e: EventItem) => {
    const allDay = !!e.allDay
    setEditing(e)
    setF({ ...e, allDay, startDate: toInput(e.startDate, allDay), endDate: toInput(e.endDate, allDay) })
  }
  const close = () => setEditing(null)

  const save = () => {
    const input = {
      title: f.title, startDate: f.startDate, endDate: f.endDate || undefined,
      allDay: !!f.allDay, location: f.location || undefined, category: f.category || undefined,
      visibility: f.visibility || 'INTERNAL', body: f.body || '',
    }
    if (editing && editing.id) run(() => updateProjectEvent(slug, locale, editing.id, input), close)
    else run(() => createProjectEvent(slug, locale, input), close)
  }

  const Row = ({ e, muted }: { e: EventItem; muted?: boolean }) => {
    const vm = VISIBILITY.find((v) => v.value === e.visibility); const VI = vm?.icon ?? Lock
    return (
      <div className={`${card} px-4 py-3 flex items-center justify-between gap-3`} style={{ ...cardStyle, opacity: muted ? 0.6 : 1 }}>
        <div className="min-w-0">
          <p className="text-text font-medium truncate" style={{ color: 'var(--project-dark)' }}>{e.title}</p>
          <p className="text-small flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5" style={{ color: 'var(--project-dark)', opacity: 0.55 }}>
            <span>{fmt(e.startDate, e.allDay)}{e.endDate ? ` – ${fmt(e.endDate, e.allDay)}` : ''}{e.allDay ? ` · ${t('calendar.allDayIndicator')}` : ''}</span>
            {e.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{e.location}</span>}
            {e.category && <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5" />{e.category}</span>}
            <span className="flex items-center gap-1"><VI className="w-3.5 h-3.5" />{vm ? t(vm.labelKey) : e.visibility}</span>
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button type="button" onClick={() => openEdit(e)} disabled={pending} title={t('calendar.edit')} className="p-2 rounded-lg disabled:opacity-40" style={{ color: 'var(--project-dark)' }}><Pencil className="w-4 h-4" /></button>
          {confirmDelete === e.id ? (
            <>
              <button type="button" onClick={() => run(() => deleteProjectEvent(slug, locale, e.id), () => setConfirmDelete(null))} disabled={pending} className="px-3 py-1.5 rounded-lg text-small font-semibold disabled:opacity-40" style={{ background: '#b91c1c', color: 'white' }}>{t('calendar.delete')}</button>
              <button type="button" onClick={() => setConfirmDelete(null)} className="px-2 py-1.5 rounded-lg text-small" style={{ color: 'var(--project-dark)', opacity: 0.7 }}>{t('calendar.cancel')}</button>
            </>
          ) : (
            <button type="button" onClick={() => setConfirmDelete(e.id)} disabled={pending} title={t('calendar.delete')} className="p-2 rounded-lg disabled:opacity-40" style={{ color: '#b91c1c' }}><Trash2 className="w-4 h-4" /></button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-title font-bold leading-tight" style={{ color: 'var(--project-dark)' }}>{t('calendar.title')}</h1>
        {!editing && (
          <button type="button" onClick={openNew} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-cta font-semibold" style={{ background: 'var(--project-dark)', color: 'var(--project-white)' }}>
            <Plus className="w-4 h-4" /> {t('calendar.newEvent')}
          </button>
        )}
      </div>
      <p className="text-text mb-6" style={{ color: 'var(--project-dark)', opacity: 0.65 }}>{t('calendar.subtitle')}</p>

      {error && <p className="text-small mb-4 px-4 py-2.5 rounded-lg" style={{ color: '#b91c1c', background: '#fef2f2' }}>{error}</p>}

      {editing && (
        <div className={`${card} p-5 mb-6`} style={cardStyle}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-small font-bold uppercase tracking-widest" style={{ color: 'var(--project-dark)', opacity: 0.5 }}>{editing.id ? t('calendar.editEvent') : t('calendar.newEvent')}</h2>
            <button type="button" onClick={close} className="p-1 rounded" style={{ color: 'var(--project-dark)', opacity: 0.6 }}><X className="w-4 h-4" /></button>
          </div>
          <div className="flex flex-col gap-3">
            <input type="text" value={f.title} onChange={(e) => set('title', e.target.value)} placeholder={t('calendar.titlePlaceholder')} className={`${inputCls} w-full`} style={inputStyle} />
            <label className="flex items-center gap-2 text-small cursor-pointer" style={{ color: 'var(--project-dark)' }}>
              <input type="checkbox" checked={!!f.allDay} onChange={(e) => set('allDay', e.target.checked)} /> {t('calendar.allDay')}
            </label>
            <div className="grid sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-small mb-1" style={{ color: 'var(--project-dark)', opacity: 0.6 }}>{t('calendar.startLabel')}</label>
                <input type={f.allDay ? 'date' : 'datetime-local'} value={f.startDate} onChange={(e) => set('startDate', e.target.value)} className={`${inputCls} w-full`} style={inputStyle} />
              </div>
              <div>
                <label className="block text-small mb-1" style={{ color: 'var(--project-dark)', opacity: 0.6 }}>{t('calendar.endLabel')}</label>
                <input type={f.allDay ? 'date' : 'datetime-local'} value={f.endDate ?? ''} onChange={(e) => set('endDate', e.target.value)} className={`${inputCls} w-full`} style={inputStyle} />
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-2">
              <input type="text" value={f.location ?? ''} onChange={(e) => set('location', e.target.value)} placeholder={t('calendar.locationPlaceholder')} className={inputCls} style={inputStyle} />
              <input type="text" value={f.category ?? ''} onChange={(e) => set('category', e.target.value)} placeholder={t('calendar.categoryPlaceholder')} className={inputCls} style={inputStyle} />
              <select value={f.visibility ?? 'INTERNAL'} onChange={(e) => set('visibility', e.target.value)} className={inputCls} style={inputStyle}>
                {VISIBILITY.map((v) => <option key={v.value} value={v.value}>{t(v.labelKey)}</option>)}
              </select>
            </div>
            <div>
              <textarea value={f.body ?? ''} onChange={(e) => set('body', e.target.value)} rows={5} placeholder={t('calendar.bodyPlaceholder')} className={`${inputCls} w-full font-mono`} style={inputStyle} />
            </div>
            <div>
              <button type="button" onClick={save} disabled={pending || !f.title.trim() || !f.startDate} className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-cta font-semibold transition-opacity disabled:opacity-40" style={{ background: 'var(--project-dark)', color: 'var(--project-white)' }}>
                {editing.id ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {editing.id ? t('calendar.save') : t('calendar.createEvent')}
              </button>
            </div>
          </div>
        </div>
      )}

      <h2 className="text-small font-bold uppercase tracking-widest mt-2 mb-3" style={{ color: 'var(--project-dark)', opacity: 0.45 }}>{t('calendar.upcoming', { count: upcoming.length })}</h2>
      {upcoming.length === 0 ? <p className="text-text py-4 text-center" style={{ color: 'var(--project-dark)', opacity: 0.4 }}>{t('calendar.noUpcoming')}</p>
        : <div className="flex flex-col gap-2">{upcoming.map((e) => <Row key={e.id} e={e} />)}</div>}

      {past.length > 0 && (
        <>
          <h2 className="text-small font-bold uppercase tracking-widest mt-8 mb-3" style={{ color: 'var(--project-dark)', opacity: 0.45 }}>{t('calendar.past', { count: past.length })}</h2>
          <div className="flex flex-col gap-2">{past.map((e) => <Row key={e.id} e={e} muted />)}</div>
        </>
      )}
    </div>
  )
}
