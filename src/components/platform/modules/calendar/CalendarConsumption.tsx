// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, List, MapPin, Tag, Check, Plus, Download, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { toggleEventAttendance } from '@/actions/event-attend'
import { AudienceChip } from '@/components/platform/AudienceChip'
import { EventFormModal } from '@/components/platform/manage/CalendarManager'

/** Authoring rights of the viewer on this calendar (PM or team lead). */
export interface CalendarAuthor {
  isPM: boolean
  /** PM: full catalog; lead: their led teams. */
  teamCatalog: string[]
}

export interface ConsumptionEvent {
  id: string
  title: string
  startDate: string
  endDate?: string | null
  allDay?: boolean | null
  location?: string | null
  category?: string | null
  bodyHtml?: string | null
  visibility?: string | null
  visibilityTeams?: string[]
  attendeeCount: number
  attending: boolean
}

const cardStyle = { background: 'var(--project-white)', borderColor: 'color-mix(in srgb, var(--project-general) 20%, transparent)' }
const fmt = (iso: string, allDay?: boolean | null) => new Date(iso).toLocaleString('de-DE', allDay ? { dateStyle: 'medium' } : { dateStyle: 'medium', timeStyle: 'short' })
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

export function CalendarConsumption({ slug, locale, events, canAttend, author = null }: { slug: string; locale: string; events: ConsumptionEvent[]; canAttend: boolean; author?: CalendarAuthor | null }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [view, setView] = useState<'list' | 'grid'>('list')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [month, setMonth] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() } })

  const now = Date.now()
  const upcoming = events.filter((e) => new Date(e.startDate).getTime() >= now)
  const past = events.filter((e) => new Date(e.startDate).getTime() < now)

  const attend = (id: string) => {
    setError(null)
    startTransition(async () => {
      const res = await toggleEventAttendance(slug, locale, id)
      if (res.error) { setError(res.error); return }
      router.refresh()
    })
  }

  const Item = ({ e, muted }: { e: ConsumptionEvent; muted?: boolean }) => (
    <div className="rounded-xl border px-4 py-3" style={{ ...cardStyle, ...(muted ? { background: 'var(--project-light)' } : {}) }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-display font-semibold leading-snug" style={{ color: 'var(--project-accent)' }}>
            {e.title}
            <AudienceChip visibility={e.visibility} visibilityTeams={e.visibilityTeams} />
          </p>
          <p className="text-small flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1" style={{ color: 'var(--project-ink)' }}>
            <span>{fmt(e.startDate, e.allDay)}{e.endDate ? ` – ${fmt(e.endDate, e.allDay)}` : ''}{e.allDay ? ' · ganztägig' : ''}</span>
            {e.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{e.location}</span>}
            {e.category && <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5" />{e.category}</span>}
          </p>
        </div>
        <a href={`/api/ics/event/${e.id}`} title="Zum Kalender hinzufügen" className="shrink-0 p-2 rounded-lg" style={{ color: 'var(--project-accent)' }}><Download className="w-4 h-4" /></a>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-3">
        {canAttend && (
          <button type="button" onClick={() => attend(e.id)} disabled={pending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-small font-medium border transition-colors disabled:opacity-40"
            style={{ background: e.attending ? 'var(--project-dark)' : 'transparent', color: e.attending ? 'var(--project-black)' : 'var(--project-accent)', borderColor: e.attending ? 'var(--project-dark)' : 'color-mix(in srgb, var(--project-general) 35%, transparent)' }}>
            {e.attending ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {e.attending ? 'Ich nehme teil' : 'Teilnehmen'}
          </button>
        )}
        <span className="text-small" style={{ color: 'var(--project-ink)' }}>{e.attendeeCount} {e.attendeeCount === 1 ? 'Teilnehmer:in' : 'Teilnehmer:innen'}</span>
        {e.bodyHtml && (
          <button type="button" onClick={() => setExpanded(expanded === e.id ? null : e.id)} className="flex items-center gap-1 text-small font-medium ml-auto" style={{ color: 'var(--project-accent)' }}>
            Details <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded === e.id ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>
      {expanded === e.id && e.bodyHtml && (
        <div className="prose-news text-text leading-relaxed mt-3 pt-3 border-t" style={{ color: 'var(--project-accent)', borderColor: 'color-mix(in srgb, var(--project-general) 15%, transparent)' }} dangerouslySetInnerHTML={{ __html: e.bodyHtml }} />
      )}
    </div>
  )

  // month grid cells
  const grid = useMemo(() => {
    const first = new Date(month.y, month.m, 1)
    const startOffset = (first.getDay() + 6) % 7 // Mon=0
    const daysInMonth = new Date(month.y, month.m + 1, 0).getDate()
    const cells: { day: number | null; events: ConsumptionEvent[] }[] = []
    for (let i = 0; i < startOffset; i++) cells.push({ day: null, events: [] })
    for (let d = 1; d <= daysInMonth; d++) {
      const dayEvents = events.filter((e) => { const s = new Date(e.startDate); return s.getFullYear() === month.y && s.getMonth() === month.m && s.getDate() === d })
      cells.push({ day: d, events: dayEvents })
    }
    return cells
  }, [month, events])

  return (
    <div>
      <div className="flex items-center justify-end gap-2 mb-6">
        {/* Visually redundant with the breadcrumb — kept for screen readers (BITV). */}
        <h1 className="sr-only">Kalender</h1>
        {author && (
          <button type="button" onClick={() => setCreating(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-cta font-semibold" style={{ background: 'var(--project-accent)', color: 'var(--project-white)' }}>
            <Plus className="w-4 h-4" /> Neuer Termin
          </button>
        )}
        <div className="flex items-center gap-1 rounded-lg border p-0.5" style={{ borderColor: 'color-mix(in srgb, var(--project-general) 25%, transparent)' }}>
          {(['list', 'grid'] as const).map((v) => (
            <button key={v} type="button" onClick={() => setView(v)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-small font-medium"
              style={{ background: view === v ? 'var(--project-dark)' : 'transparent', color: view === v ? 'var(--project-black)' : 'var(--project-accent)' }}>
              {v === 'list' ? <List className="w-4 h-4" /> : <CalendarDays className="w-4 h-4" />}{v === 'list' ? 'Liste' : 'Monat'}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-small mb-4 px-4 py-2.5 rounded-lg" style={{ color: 'var(--project-danger)', background: 'var(--project-danger-surface)' }}>{error}</p>}

      {creating && author && (
        <EventFormModal slug={slug} locale={locale} event={null} teamCatalog={author.teamCatalog} leadMode={!author.isPM} onClose={() => setCreating(false)} />
      )}

      {view === 'list' ? (
        events.length === 0 ? (
          <p className="text-text py-10 text-center" style={{ color: 'var(--project-ink)' }}>Keine Termine.</p>
        ) : (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-small font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--project-ink)' }}>Anstehend ({upcoming.length})</h2>
              {upcoming.length === 0 ? <p className="text-text" style={{ color: 'var(--project-ink)' }}>Keine anstehenden Termine.</p>
                : <div className="flex flex-col gap-2">{upcoming.map((e) => <Item key={e.id} e={e} />)}</div>}
            </div>
            {past.length > 0 && (
              <div>
                <h2 className="text-small font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--project-ink)' }}>Vergangen ({past.length})</h2>
                <div className="flex flex-col gap-2">{past.map((e) => <Item key={e.id} e={e} muted />)}</div>
              </div>
            )}
          </div>
        )
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={() => setMonth((s) => ({ y: s.m === 0 ? s.y - 1 : s.y, m: (s.m + 11) % 12 }))} className="p-2 rounded-lg" style={{ color: 'var(--project-accent)' }}><ChevronLeft className="w-4 h-4" /></button>
            <p className="text-display font-semibold" style={{ color: 'var(--project-accent)' }}>{MONTHS[month.m]} {month.y}</p>
            <button type="button" onClick={() => setMonth((s) => ({ y: s.m === 11 ? s.y + 1 : s.y, m: (s.m + 1) % 12 }))} className="p-2 rounded-lg" style={{ color: 'var(--project-accent)' }}><ChevronRight className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {WEEKDAYS.map((w) => <div key={w} className="text-small font-semibold text-center py-1" style={{ color: 'var(--project-ink)' }}>{w}</div>)}
            {grid.map((c, i) => (
              <div key={i} className="min-h-16 rounded-lg border p-1" style={{ ...cardStyle, opacity: c.day ? 1 : 0.3 }}>
                {c.day && <p className="text-small font-medium" style={{ color: 'var(--project-ink)' }}>{c.day}</p>}
                <div className="flex flex-col gap-0.5 mt-0.5">
                  {c.events.map((e) => (
                    // Team events get the dark chip color so the audience is
                    // readable in the grid too (matches the AudienceChip).
                    <span key={e.id} title={e.visibility === 'TEAM' ? `${e.title} · Team: ${(e.visibilityTeams ?? []).join(', ')}` : e.title} className="text-[0.7rem] truncate px-1 py-0.5 rounded" style={e.visibility === 'TEAM' ? { background: 'var(--project-dark)', color: 'var(--project-black)' } : { background: 'var(--project-light)', color: 'var(--project-accent)' }}>{e.title}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
