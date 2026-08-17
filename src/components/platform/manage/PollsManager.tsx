// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Plus, Trash2, Play, Square, ChevronDown, ChevronUp, Pencil, BarChart2, Download } from 'lucide-react'
import {
  setPollStatus, deleteProjectPoll,
  getPollEditData, getPollResults, exportPollCsv,
  type CreatePollInput,
} from '@/actions/manage/polls'
import { PollFormModal } from './PollFormModal'
import type { PollResults } from '@/lib/poll-results'

export interface PollItem {
  id: string
  title: string
  status: string
  questionCount: number
  voteCount: number
  closesAt?: string | null
  /** May the viewer edit/activate/delete this poll? (leads: only their OWN) */
  canManage?: boolean
}

const STATUS_META: Record<string, { labelKey: string; bg: string; fg: string }> = {
  draft: { labelKey: 'polls.statusDraft', bg: 'var(--project-general)', fg: 'var(--project-black)' },
  active: { labelKey: 'polls.statusActive', bg: 'var(--project-dark)', fg: 'var(--project-black)' },
  closed: { labelKey: 'polls.statusClosed', bg: 'var(--project-light)', fg: 'var(--project-ink)' },
}
const card = 'rounded-xl border'
const cardStyle = { background: 'var(--project-white)', borderColor: 'color-mix(in srgb, var(--project-general) 20%, transparent)' }

/**
 * `leadMode` mounts the manager for a team lead (team page): the visibility
 * select disappears (the server forces TEAM ∩ leadOf anyway), new polls
 * default to TEAM, CSV export stays PM-only, and rows the lead doesn't own
 * (`canManage: false`) are read-only.
 */
export function PollsManager({ slug, locale, polls, teamCatalog, leadMode = false }: { slug: string; locale: string; polls: PollItem[]; teamCatalog: string[]; leadMode?: boolean }) {
  const t = useTranslations('manage')
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  // null = closed; 'create' = new poll; object = draft edit (prefilled)
  const [modal, setModal] = useState<'create' | { pollId: string; data: CreatePollInput } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

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

  const openEdit = (pollId: string) => {
    setError(null)
    startTransition(async () => {
      const res = await getPollEditData(slug, pollId)
      if ('error' in res) { setError(res.error); return }
      setModal({ pollId, data: res.data })
    })
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
    <div>
      <h1 className="sr-only">{t('polls.title')}</h1>

      {error && <p className="text-small mb-4 px-4 py-2.5 rounded-lg" style={{ color: 'var(--project-danger)', background: 'var(--project-danger-surface)' }}>{error}</p>}

      <button type="button" onClick={() => setModal('create')}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-cta font-semibold mb-4" style={{ background: 'var(--project-accent)', color: 'var(--project-white)' }}>
        <Plus className="w-4 h-4" />
        {t('polls.newPoll')}
      </button>

      {modal && (
        <PollFormModal
          slug={slug}
          locale={locale}
          editing={modal === 'create' ? null : modal}
          teamCatalog={teamCatalog}
          leadMode={leadMode}
          onClose={() => setModal(null)}
        />
      )}


      {/* List */}
      <div className="flex flex-col gap-2">
        {polls.length === 0 ? (
          <p className="text-text py-8 text-center" style={{ color: 'var(--project-ink)' }}>{t('polls.emptyState')}</p>
        ) : polls.map((p) => {
          const meta = STATUS_META[p.status] ?? STATUS_META.draft
          const open = resultsFor === p.id
          return (
            <div key={p.id} className={`${card} px-4 py-3`} style={cardStyle}>
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-text font-medium truncate" style={{ color: 'var(--project-accent)' }}>{p.title}</p>
                  <p className="text-small mt-0.5" style={{ color: 'var(--project-ink)' }}>
                    {t('polls.questionCount', { count: p.questionCount })} · {t('polls.voteCount', { count: p.voteCount })}
                    {p.closesAt && ` · ${t('polls.closesOn', { date: new Date(p.closesAt).toLocaleDateString('de-DE') })}`}
                  </p>
                </div>
                <span className="text-small font-semibold px-2.5 py-0.5 rounded-full shrink-0" style={{ background: meta.bg, color: meta.fg }}>{t(meta.labelKey)}</span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 mt-3">
                {p.status === 'draft' && p.canManage !== false && (
                  <>
                    <button type="button" onClick={() => openEdit(p.id)} disabled={pending} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-small font-medium border disabled:opacity-40" style={{ color: 'var(--project-accent)', borderColor: 'color-mix(in srgb, var(--project-general) 30%, transparent)' }}><Pencil className="w-3.5 h-3.5" /> {t('polls.edit')}</button>
                    <button type="button" onClick={() => run(() => setPollStatus(slug, locale, p.id, 'active'))} disabled={pending} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-small font-semibold disabled:opacity-40" style={{ background: 'var(--project-accent)', color: 'var(--project-white)' }}><Play className="w-3.5 h-3.5" /> {t('polls.activate')}</button>
                  </>
                )}
                {p.status === 'active' && p.canManage !== false && (
                  <button type="button" onClick={() => run(() => setPollStatus(slug, locale, p.id, 'closed'))} disabled={pending} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-small font-medium border disabled:opacity-40" style={{ color: 'var(--project-accent)', borderColor: 'color-mix(in srgb, var(--project-general) 35%, transparent)' }}><Square className="w-3.5 h-3.5" /> {t('polls.close')}</button>
                )}
                {p.status !== 'draft' && (
                  <>
                    <button type="button" onClick={() => toggleResults(p.id)} disabled={pending} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-small font-medium border disabled:opacity-40" style={{ color: 'var(--project-accent)', borderColor: 'color-mix(in srgb, var(--project-general) 30%, transparent)' }}>
                      <BarChart2 className="w-3.5 h-3.5" /> {open ? t('polls.hideResults') : t('polls.results')} {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    {!leadMode && (
                      <button type="button" onClick={() => downloadCsv(p.id)} disabled={pending} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-small font-medium border disabled:opacity-40" style={{ color: 'var(--project-accent)', borderColor: 'color-mix(in srgb, var(--project-general) 30%, transparent)' }}><Download className="w-3.5 h-3.5" /> {t('polls.exportCsv')}</button>
                    )}
                  </>
                )}
                {p.canManage !== false && (confirmDelete === p.id ? (
                  <span className="flex items-center gap-1.5 ml-auto">
                    <button type="button" onClick={() => run(() => deleteProjectPoll(slug, locale, p.id), () => setConfirmDelete(null))} disabled={pending} className="px-3 py-1.5 rounded-lg text-small font-semibold disabled:opacity-40" style={{ background: 'var(--project-danger)', color: 'var(--project-danger-on)' }}>{t('polls.delete')}</button>
                    <button type="button" onClick={() => setConfirmDelete(null)} className="px-2 py-1.5 rounded-lg text-small" style={{ color: 'var(--project-ink)' }}>{t('polls.cancel')}</button>
                  </span>
                ) : (
                  <button type="button" onClick={() => setConfirmDelete(p.id)} disabled={pending} title={t('polls.delete')} className="p-2 rounded-lg disabled:opacity-40 ml-auto" style={{ color: 'var(--project-danger)' }}><Trash2 className="w-4 h-4" /></button>
                ))}
              </div>

              {open && results && (
                <div className="mt-3 pt-3 border-t flex flex-col gap-4" style={{ borderColor: 'color-mix(in srgb, var(--project-general) 15%, transparent)' }}>
                  <p className="text-small font-semibold" style={{ color: 'var(--project-accent)' }}>{t('polls.participantCount', { count: results.participantCount })}</p>
                  {results.questions.map((q) => (
                    <div key={q.id}>
                      <p className="text-text font-medium mb-1.5" style={{ color: 'var(--project-accent)' }}>{q.text}</p>
                      {(q.type === 'single' || q.type === 'multiple') && (
                        <div className="flex flex-col gap-1.5">
                          {q.options.map((o) => {
                            const pct = q.answerCount > 0 ? Math.round((o.count / q.answerCount) * 100) : 0
                            return (
                              <div key={o.id}>
                                <div className="flex justify-between text-small" style={{ color: 'var(--project-ink)' }}><span>{o.text}</span><span>{o.count} · {pct}%</span></div>
                                <div className="h-2 rounded-full overflow-hidden mt-0.5" style={{ background: 'var(--project-light)' }}>
                                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--project-accent)' }} />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                      {q.type === 'scale' && q.scale && (
                        <div>
                          <p className="text-small mb-1" style={{ color: 'var(--project-ink)' }}>{t('polls.averageLabel')} <strong>{q.scale.average.toFixed(2)}</strong> {t('polls.scaleVoteCount', { count: q.scale.count })}</p>
                          <div className="flex items-end gap-2 h-20">
                            {[1, 2, 3, 4, 5].map((n) => {
                              const c = q.scale!.distribution[n] ?? 0
                              const max = Math.max(1, ...Object.values(q.scale!.distribution))
                              return (
                                <div key={n} className="flex-1 flex flex-col items-center gap-1">
                                  <div className="w-full rounded-t" style={{ height: `${(c / max) * 100}%`, background: 'var(--project-accent)', minHeight: c ? 4 : 0 }} />
                                  <span className="text-small" style={{ color: 'var(--project-ink)' }}>{n}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                      {q.type === 'text' && (
                        q.textAnswers.length === 0
                          ? <p className="text-small" style={{ color: 'var(--project-ink)' }}>{t('polls.noAnswers')}</p>
                          : <ul className="flex flex-col gap-1">{q.textAnswers.map((a, i) => <li key={i} className="text-small px-3 py-1.5 rounded-lg" style={{ background: 'var(--project-light)', color: 'var(--project-accent)' }}>{a}</li>)}</ul>
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
