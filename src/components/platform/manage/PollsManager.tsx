'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Play, Square, ChevronDown, ChevronUp, Pencil, BarChart2, Download, X } from 'lucide-react'
import {
  createProjectPoll, editPollDraft, setPollStatus, deleteProjectPoll,
  getPollEditData, getPollResults, exportPollCsv,
  type PollQuestionInput, type PollResults,
} from '@/actions/manage/polls'

export interface PollItem {
  id: string
  title: string
  status: string
  questionCount: number
  voteCount: number
  closesAt?: string | null
}

const STATUS_META: Record<string, { label: string; bg: string; fg: string }> = {
  draft: { label: 'Entwurf', bg: '#fef9c3', fg: '#854d0e' },
  active: { label: 'Aktiv', bg: '#dcfce7', fg: '#166534' },
  closed: { label: 'Geschlossen', bg: '#f3f4f6', fg: '#4b5563' },
}
const QUESTION_TYPES = [
  { value: 'single', label: 'Einfachauswahl' },
  { value: 'multiple', label: 'Mehrfachauswahl' },
  { value: 'text', label: 'Freitext' },
  { value: 'scale', label: 'Skala (1–5)' },
]

const card = 'rounded-xl border'
const cardStyle = { background: 'var(--project-white)', borderColor: 'color-mix(in srgb, var(--project-mid) 20%, transparent)' }
const inputCls = 'px-3 py-2 rounded-lg border text-text outline-none'
const inputStyle = { borderColor: 'color-mix(in srgb, var(--project-mid) 30%, transparent)', color: 'var(--project-dark)', background: 'var(--project-white)' }

interface DraftQuestion { text: string; type: string; optionsText: string }
const emptyQuestion = (): DraftQuestion => ({ text: '', type: 'single', optionsText: '' })

function isoToLocalInput(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso); if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function PollsManager({ slug, locale, polls }: { slug: string; locale: string; polls: PollItem[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null) // null = create
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [closesAt, setClosesAt] = useState('')
  const [visibility, setVisibility] = useState('INTERNAL')
  const [allowAnonymous, setAllowAnonymous] = useState(false)
  const [showLiveResults, setShowLiveResults] = useState(false)
  const [questions, setQuestions] = useState<DraftQuestion[]>([emptyQuestion()])

  // results
  const [resultsFor, setResultsFor] = useState<string | null>(null)
  const [results, setResults] = useState<PollResults | null>(null)

  const run = (fn: () => Promise<{ error?: string; ok?: boolean }>, after?: () => void) => {
    setError(null)
    startTransition(async () => {
      const res = await fn()
      if (res.error) { setError(res.error); return }
      after?.()
      router.refresh()
    })
  }

  const resetForm = () => {
    setTitle(''); setDescription(''); setClosesAt(''); setVisibility('INTERNAL')
    setAllowAnonymous(false); setShowLiveResults(false); setQuestions([emptyQuestion()])
  }
  const openCreate = () => { setEditingId(null); resetForm(); setShowForm(true) }
  const openEdit = (pollId: string) => {
    setError(null)
    startTransition(async () => {
      const res = await getPollEditData(slug, pollId)
      if ('error' in res) { setError(res.error); return }
      const d = res.data
      setTitle(d.title); setDescription(d.description ?? ''); setClosesAt(isoToLocalInput(d.closesAt))
      setVisibility(d.visibility ?? 'INTERNAL'); setAllowAnonymous(!!d.allowAnonymous); setShowLiveResults(!!d.showLiveResults)
      setQuestions(d.questions.length ? d.questions.map((q) => ({ text: q.text, type: q.type, optionsText: q.options.join('\n') })) : [emptyQuestion()])
      setEditingId(pollId); setShowForm(true)
    })
  }
  const setQ = (i: number, patch: Partial<DraftQuestion>) => setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)))

  const submit = () => {
    const qInput: PollQuestionInput[] = questions.map((q) => ({ text: q.text, type: q.type, options: q.optionsText.split('\n').map((o) => o.trim()).filter(Boolean) }))
    const input = { title, description, closesAt: closesAt || undefined, visibility, allowAnonymous, showLiveResults, questions: qInput }
    const done = () => { setShowForm(false); setEditingId(null); resetForm() }
    if (editingId) run(() => editPollDraft(slug, locale, editingId, input), done)
    else run(() => createProjectPoll(slug, locale, input), done)
  }

  const toggleResults = (pollId: string) => {
    if (resultsFor === pollId) { setResultsFor(null); setResults(null); return }
    setError(null); setResults(null); setResultsFor(pollId)
    startTransition(async () => {
      const res = await getPollResults(slug, pollId)
      if ('error' in res) { setError(res.error); setResultsFor(null); return }
      setResults(res.results)
    })
  }

  const downloadCsv = (pollId: string) => {
    startTransition(async () => {
      const res = await exportPollCsv(slug, pollId)
      if ('error' in res) { setError(res.error); return }
      const blob = new Blob([res.csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = res.filename; a.click()
      URL.revokeObjectURL(url)
    })
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-title font-bold leading-tight mb-1" style={{ color: 'var(--project-dark)' }}>Umfragen</h1>
      <p className="text-text mb-6" style={{ color: 'var(--project-dark)', opacity: 0.65 }}>Umfragen erstellen, aktivieren und auswerten. Neue Umfragen starten als Entwurf.</p>

      {error && <p className="text-small mb-4 px-4 py-2.5 rounded-lg" style={{ color: '#b91c1c', background: '#fef2f2' }}>{error}</p>}

      <button type="button" onClick={() => (showForm ? (setShowForm(false), setEditingId(null)) : openCreate())}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-cta font-semibold mb-4" style={{ background: 'var(--project-dark)', color: 'var(--project-white)' }}>
        {showForm ? <ChevronUp className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        {showForm ? 'Formular schließen' : 'Neue Umfrage'}
      </button>

      {showForm && (
        <div className={`${card} p-5 mb-6`} style={cardStyle}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-small font-bold uppercase tracking-widest" style={{ color: 'var(--project-dark)', opacity: 0.5 }}>{editingId ? 'Entwurf bearbeiten' : 'Neue Umfrage'}</h2>
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null) }} className="p-1 rounded" style={{ color: 'var(--project-dark)', opacity: 0.6 }}><X className="w-4 h-4" /></button>
          </div>
          <div className="flex flex-col gap-3">
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titel der Umfrage …" className={`${inputCls} w-full`} style={inputStyle} />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Beschreibung (optional)" className={`${inputCls} w-full`} style={inputStyle} />
            <div className="grid sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-small mb-1" style={{ color: 'var(--project-dark)', opacity: 0.6 }}>Endet am (optional)</label>
                <input type="datetime-local" value={closesAt} onChange={(e) => setClosesAt(e.target.value)} className={`${inputCls} w-full`} style={inputStyle} />
              </div>
              <div>
                <label className="block text-small mb-1" style={{ color: 'var(--project-dark)', opacity: 0.6 }}>Sichtbarkeit</label>
                <select value={visibility} onChange={(e) => setVisibility(e.target.value)} className={`${inputCls} w-full`} style={inputStyle}>
                  <option value="PUBLIC">Öffentlich</option><option value="INTERNAL">Intern</option><option value="TEAM">Team</option>
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-small cursor-pointer" style={{ color: 'var(--project-dark)' }}>
                <input type="checkbox" checked={allowAnonymous} onChange={(e) => setAllowAnonymous(e.target.checked)} /> Anonyme Abstimmung erlauben
              </label>
              <label className="flex items-center gap-2 text-small cursor-pointer" style={{ color: 'var(--project-dark)' }}>
                <input type="checkbox" checked={showLiveResults} onChange={(e) => setShowLiveResults(e.target.checked)} /> Live-Ergebnisse anzeigen
              </label>
            </div>

            <p className="text-small font-bold uppercase tracking-widest mt-2" style={{ color: 'var(--project-dark)', opacity: 0.45 }}>Fragen</p>
            {questions.map((q, i) => (
              <div key={i} className="rounded-lg border p-3 flex flex-col gap-2" style={cardStyle}>
                <div className="flex gap-2">
                  <input type="text" value={q.text} onChange={(e) => setQ(i, { text: e.target.value })} placeholder={`Frage ${i + 1} …`} className={`${inputCls} flex-1`} style={inputStyle} />
                  <select value={q.type} onChange={(e) => setQ(i, { type: e.target.value })} className={inputCls} style={inputStyle}>
                    {QUESTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <button type="button" onClick={() => setQuestions((qs) => qs.filter((_, idx) => idx !== i))} disabled={questions.length === 1} title="Frage entfernen" className="p-2 rounded-lg disabled:opacity-30" style={{ color: '#b91c1c' }}><Trash2 className="w-4 h-4" /></button>
                </div>
                {(q.type === 'single' || q.type === 'multiple') && (
                  <textarea value={q.optionsText} onChange={(e) => setQ(i, { optionsText: e.target.value })} rows={3} placeholder={'Eine Antwortoption pro Zeile'} className={`${inputCls} w-full`} style={inputStyle} />
                )}
              </div>
            ))}
            <button type="button" onClick={() => setQuestions((qs) => [...qs, emptyQuestion()])} className="flex items-center gap-1.5 text-small font-semibold self-start" style={{ color: 'var(--project-dark)' }}><Plus className="w-4 h-4" /> Frage hinzufügen</button>

            <div>
              <button type="button" onClick={submit} disabled={pending || !title.trim() || questions.every((q) => !q.text.trim())}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-cta font-semibold transition-opacity disabled:opacity-40" style={{ background: 'var(--project-dark)', color: 'var(--project-white)' }}>
                {editingId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {editingId ? 'Entwurf speichern' : 'Umfrage erstellen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="flex flex-col gap-2">
        {polls.length === 0 ? (
          <p className="text-text py-8 text-center" style={{ color: 'var(--project-dark)', opacity: 0.4 }}>Noch keine Umfragen.</p>
        ) : polls.map((p) => {
          const meta = STATUS_META[p.status] ?? STATUS_META.draft
          const open = resultsFor === p.id
          return (
            <div key={p.id} className={`${card} px-4 py-3`} style={cardStyle}>
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-text font-medium truncate" style={{ color: 'var(--project-dark)' }}>{p.title}</p>
                  <p className="text-small mt-0.5" style={{ color: 'var(--project-dark)', opacity: 0.55 }}>
                    {p.questionCount} {p.questionCount === 1 ? 'Frage' : 'Fragen'} · {p.voteCount} {p.voteCount === 1 ? 'Stimme' : 'Stimmen'}
                    {p.closesAt && ` · endet ${new Date(p.closesAt).toLocaleDateString('de-DE')}`}
                  </p>
                </div>
                <span className="text-small font-semibold px-2.5 py-0.5 rounded-full shrink-0" style={{ background: meta.bg, color: meta.fg }}>{meta.label}</span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 mt-3">
                {p.status === 'draft' && (
                  <>
                    <button type="button" onClick={() => openEdit(p.id)} disabled={pending} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-small font-medium border disabled:opacity-40" style={{ color: 'var(--project-dark)', borderColor: 'color-mix(in srgb, var(--project-mid) 30%, transparent)' }}><Pencil className="w-3.5 h-3.5" /> Bearbeiten</button>
                    <button type="button" onClick={() => run(() => setPollStatus(slug, locale, p.id, 'active'))} disabled={pending} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-small font-semibold disabled:opacity-40" style={{ background: 'var(--project-dark)', color: 'var(--project-white)' }}><Play className="w-3.5 h-3.5" /> Aktivieren</button>
                  </>
                )}
                {p.status === 'active' && (
                  <button type="button" onClick={() => run(() => setPollStatus(slug, locale, p.id, 'closed'))} disabled={pending} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-small font-medium border disabled:opacity-40" style={{ color: 'var(--project-dark)', borderColor: 'color-mix(in srgb, var(--project-mid) 35%, transparent)' }}><Square className="w-3.5 h-3.5" /> Schließen</button>
                )}
                {p.status !== 'draft' && (
                  <>
                    <button type="button" onClick={() => toggleResults(p.id)} disabled={pending} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-small font-medium border disabled:opacity-40" style={{ color: 'var(--project-dark)', borderColor: 'color-mix(in srgb, var(--project-mid) 30%, transparent)' }}>
                      <BarChart2 className="w-3.5 h-3.5" /> {open ? 'Ergebnisse ausblenden' : 'Ergebnisse'} {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    <button type="button" onClick={() => downloadCsv(p.id)} disabled={pending} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-small font-medium border disabled:opacity-40" style={{ color: 'var(--project-dark)', borderColor: 'color-mix(in srgb, var(--project-mid) 30%, transparent)' }}><Download className="w-3.5 h-3.5" /> CSV</button>
                  </>
                )}
                {confirmDelete === p.id ? (
                  <span className="flex items-center gap-1.5 ml-auto">
                    <button type="button" onClick={() => run(() => deleteProjectPoll(slug, locale, p.id), () => setConfirmDelete(null))} disabled={pending} className="px-3 py-1.5 rounded-lg text-small font-semibold disabled:opacity-40" style={{ background: '#b91c1c', color: 'white' }}>Löschen</button>
                    <button type="button" onClick={() => setConfirmDelete(null)} className="px-2 py-1.5 rounded-lg text-small" style={{ color: 'var(--project-dark)', opacity: 0.7 }}>Abbrechen</button>
                  </span>
                ) : (
                  <button type="button" onClick={() => setConfirmDelete(p.id)} disabled={pending} title="Löschen" className="p-2 rounded-lg disabled:opacity-40 ml-auto" style={{ color: '#b91c1c' }}><Trash2 className="w-4 h-4" /></button>
                )}
              </div>

              {open && results && (
                <div className="mt-3 pt-3 border-t flex flex-col gap-4" style={{ borderColor: 'color-mix(in srgb, var(--project-mid) 15%, transparent)' }}>
                  <p className="text-small font-semibold" style={{ color: 'var(--project-dark)' }}>{results.participantCount} {results.participantCount === 1 ? 'Teilnehmer:in' : 'Teilnehmer:innen'}</p>
                  {results.questions.map((q) => (
                    <div key={q.id}>
                      <p className="text-text font-medium mb-1.5" style={{ color: 'var(--project-dark)' }}>{q.text}</p>
                      {(q.type === 'single' || q.type === 'multiple') && (
                        <div className="flex flex-col gap-1.5">
                          {q.options.map((o) => {
                            const pct = q.answerCount > 0 ? Math.round((o.count / q.answerCount) * 100) : 0
                            return (
                              <div key={o.id}>
                                <div className="flex justify-between text-small" style={{ color: 'var(--project-dark)', opacity: 0.8 }}><span>{o.text}</span><span>{o.count} · {pct}%</span></div>
                                <div className="h-2 rounded-full overflow-hidden mt-0.5" style={{ background: 'var(--project-light)' }}>
                                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--project-dark)' }} />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                      {q.type === 'scale' && q.scale && (
                        <div>
                          <p className="text-small mb-1" style={{ color: 'var(--project-dark)', opacity: 0.7 }}>Durchschnitt: <strong>{q.scale.average.toFixed(2)}</strong> ({q.scale.count} Stimmen)</p>
                          <div className="flex items-end gap-2 h-20">
                            {[1, 2, 3, 4, 5].map((n) => {
                              const c = q.scale!.distribution[n] ?? 0
                              const max = Math.max(1, ...Object.values(q.scale!.distribution))
                              return (
                                <div key={n} className="flex-1 flex flex-col items-center gap-1">
                                  <div className="w-full rounded-t" style={{ height: `${(c / max) * 100}%`, background: 'var(--project-dark)', minHeight: c ? 4 : 0 }} />
                                  <span className="text-small" style={{ color: 'var(--project-dark)', opacity: 0.6 }}>{n}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                      {q.type === 'text' && (
                        q.textAnswers.length === 0
                          ? <p className="text-small" style={{ color: 'var(--project-dark)', opacity: 0.4 }}>Keine Antworten.</p>
                          : <ul className="flex flex-col gap-1">{q.textAnswers.map((a, i) => <li key={i} className="text-small px-3 py-1.5 rounded-lg" style={{ background: 'var(--project-light)', color: 'var(--project-dark)' }}>{a}</li>)}</ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
