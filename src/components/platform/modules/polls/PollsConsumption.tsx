// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart2, Check, Send, Plus, Pencil, Play, Square, Trash2, Vote } from 'lucide-react'
import { submitPollVote, type PollAnswer } from '@/actions/poll-vote'
import { setPollStatus, deleteProjectPoll, getPollEditData, type CreatePollInput } from '@/actions/manage/polls'
import { PollFormModal } from '@/components/platform/manage/PollFormModal'
import { PollResultsView } from './PollResultsView'
import { AudienceChip } from '@/components/platform/AudienceChip'
import { FormModal } from '@/components/platform/FormModal'
import { ManageMenu, type ManageMenuItem } from '@/components/platform/ManageMenu'
import { SaveButton } from '@/components/platform/SaveButton'
import { ContentItemMenu } from '@/components/platform/ContentItemMenu'
import type { CitizenPoll } from '@/lib/citizen-polls'

const cardStyle = { background: 'var(--project-white)', borderColor: 'color-mix(in srgb, var(--project-general) 20%, transparent)', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }
const noticeStyle = { background: 'var(--project-light)', color: 'var(--project-ink)' }
const STATUS_META: Record<string, { label: string; bg: string; fg: string }> = {
  draft: { label: 'Entwurf', bg: 'var(--project-general)', fg: 'var(--project-black)' },
  active: { label: 'Aktiv', bg: 'var(--project-dark)', fg: 'var(--project-black)' },
  closed: { label: 'Geschlossen', bg: 'var(--project-light)', fg: 'var(--project-ink)' },
}

/** Authoring rights of the viewer on this polls page (PM or team lead). */
export interface PollsAuthor {
  isPM: boolean
  /** PM: full catalog; lead: their led teams. */
  teamCatalog: string[]
}

type PopupMode = 'vote' | 'results'

/** Compact grid card — voting and results each open their own popup. */
function PollSummary({ slug, locale, poll, isLoggedIn, agentEnabled, onOpen }: { slug: string; locale: string; poll: CitizenPoll; isLoggedIn: boolean; agentEnabled: boolean; onOpen: (mode: PopupMode) => void }) {
  const meta = STATUS_META[poll.status] ?? STATUS_META.active
  const isDraft = poll.status === 'draft'
  return (
    <div className="rounded-xl border p-5 flex flex-col" style={cardStyle}>
      <div className="flex items-start justify-between gap-3">
        <p className="flex flex-wrap items-center gap-2 text-display font-bold leading-snug" style={{ color: 'var(--project-accent)' }}>
          {poll.title}
          <AudienceChip visibility={poll.visibility} visibilityTeams={poll.visibilityTeams} />
        </p>
        <span className="flex items-center gap-1 shrink-0">
          <span className="text-small font-semibold px-2.5 py-0.5 rounded-full" style={{ background: meta.bg, color: meta.fg }}>{meta.label}</span>
          {isLoggedIn && <SaveButton slug={slug} module="polls" itemId={poll.id} />}
          {isLoggedIn && (
            <ContentItemMenu
              slug={slug}
              locale={locale}
              agentEnabled={agentEnabled}
              item={{ module: 'polls', itemId: poll.id, title: poll.title, href: '/m/polls' }}
            />
          )}
        </span>
      </div>
      {poll.description && <p className="text-text mt-1 line-clamp-2" style={{ color: 'var(--project-ink)' }}>{poll.description}</p>}
      <div className="flex flex-wrap items-center gap-2 mt-4 pt-1 mt-auto">
        <button
          type="button"
          onClick={() => onOpen('vote')}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-small font-semibold cursor-pointer transition-opacity hover:opacity-85"
          style={{ background: 'var(--project-accent)', color: 'var(--project-white)' }}
        >
          {poll.hasVoted ? <Check className="w-3.5 h-3.5" /> : <Vote className="w-3.5 h-3.5" />}
          {isDraft ? 'Vorschau' : poll.hasVoted ? 'Abgestimmt' : 'Abstimmen'}
        </button>
        {!isDraft && (
          <button
            type="button"
            onClick={() => onOpen('results')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-small font-medium border cursor-pointer transition-colors hover:bg-[var(--project-light)]"
            style={{ color: 'var(--project-accent)', borderColor: 'color-mix(in srgb, var(--project-general) 35%, transparent)' }}
          >
            <BarChart2 className="w-3.5 h-3.5" /> Ergebnisse
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Poll popup — 'vote' carries the vote form (or the voted/login/closed state)
 * plus the manage actions; 'results' carries the results (or the
 * "please vote first" / "after close" state).
 */
function PollPopup({ slug, locale, poll, mode, loginHref, author, onClose }: {
  slug: string
  locale: string
  poll: CitizenPoll
  mode: PopupMode
  loginHref?: string
  author?: PollsAuthor | null
  onClose: () => void
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, PollAnswer>>({})
  const [editData, setEditData] = useState<{ pollId: string; data: CreatePollInput } | null>(null)

  const meta = STATUS_META[poll.status] ?? STATUS_META.active
  const setAnswer = (qid: string, patch: Partial<PollAnswer>) => setAnswers((s) => ({ ...s, [qid]: { ...s[qid], ...patch, questionId: qid } }))

  const submit = () => {
    setError(null)
    startTransition(async () => {
      const res = await submitPollVote(slug, locale, poll.id, Object.values(answers))
      if (res.error) { setError(res.error); return }
      router.refresh()
    })
  }

  const run = (fn: () => Promise<{ error?: string; ok?: boolean }>) => {
    setError(null)
    startTransition(async () => {
      const res = await fn()
      if (res.error) { setError(res.error); return }
      router.refresh()
    })
  }

  const openEdit = () => {
    setError(null)
    startTransition(async () => {
      const res = await getPollEditData(slug, poll.id)
      if ('error' in res) { setError(res.error); return }
      setEditData({ pollId: poll.id, data: res.data })
    })
  }

  // Role-scoped manage actions behind the gear — callers only see what their
  // rights and the poll status allow (draft: edit+activate, active: close).
  const manageItems: ManageMenuItem[] = mode === 'vote' && poll.canManage && author
    ? [
        ...(poll.status === 'draft'
          ? [
              { key: 'edit', label: 'Bearbeiten', icon: Pencil, onSelect: openEdit },
              { key: 'activate', label: 'Aktivieren', icon: Play, onSelect: () => run(() => setPollStatus(slug, locale, poll.id, 'active')) },
            ]
          : []),
        ...(poll.status === 'active'
          ? [{ key: 'close', label: 'Schließen', icon: Square, onSelect: () => run(() => setPollStatus(slug, locale, poll.id, 'closed')) }]
          : []),
        { key: 'delete', label: 'Löschen', icon: Trash2, variant: 'danger' as const, confirmLabel: 'Wirklich löschen?', onSelect: () => run(() => deleteProjectPoll(slug, locale, poll.id)) },
      ]
    : []

  return (
    <FormModal title={mode === 'results' ? `Ergebnisse – ${poll.title}` : poll.title} size="xl" onClose={onClose}>
      <div className="flex flex-wrap items-center gap-2 mb-3 -mt-2">
        <span className="text-small font-semibold px-2.5 py-0.5 rounded-full" style={{ background: meta.bg, color: meta.fg }}>{meta.label}</span>
        <AudienceChip visibility={poll.visibility} visibilityTeams={poll.visibilityTeams} />
        <span className="ml-auto"><ManageMenu items={manageItems} disabled={pending} /></span>
      </div>
      {mode === 'vote' && poll.description && <p className="text-text mb-4" style={{ color: 'var(--project-ink)' }}>{poll.description}</p>}

      {editData && author && (
        <PollFormModal slug={slug} locale={locale} editing={editData} teamCatalog={author.teamCatalog} leadMode={!author.isPM} onClose={() => setEditData(null)} />
      )}

      {mode === 'results' ? (
        // ── Results popup ─────────────────────────────────────────────────
        poll.showResults && poll.results ? (
          <PollResultsView results={poll.results} />
        ) : poll.status === 'active' && !poll.hasVoted ? (
          <p className="text-small px-4 py-3 rounded-lg" style={noticeStyle}>
            Bitte stimmen Sie zuerst ab — danach sehen Sie hier die Ergebnisse.
          </p>
        ) : (
          <p className="text-small px-4 py-3 rounded-lg" style={noticeStyle}>
            Die Ergebnisse werden nach Abschluss der Umfrage angezeigt.
          </p>
        )
      ) : poll.status === 'draft' ? (
        // ── Vote popup ────────────────────────────────────────────────────
        <p className="text-small px-4 py-3 rounded-lg" style={noticeStyle}>
          Entwurf — für andere erst nach dem Aktivieren sichtbar.
        </p>
      ) : poll.hasVoted ? (
        <p className="flex items-center gap-2 text-small px-4 py-3 rounded-lg" style={noticeStyle}>
          <Check className="w-4 h-4" /> Sie haben bereits abgestimmt. Danke!
        </p>
      ) : poll.canVote ? (
        <div className="flex flex-col gap-5 mt-3">
          {poll.questions.map((q) => (
            <div key={q.id}>
              <p className="text-text font-medium mb-2" style={{ color: 'var(--project-accent)' }}>{q.text}</p>
              {q.type === 'single' && (
                <div className="flex flex-col gap-1.5">
                  {q.options.map((o) => (
                    <label key={o.id} className="flex items-center gap-2 text-text cursor-pointer" style={{ color: 'var(--project-accent)' }}>
                      <input type="radio" name={`q-${q.id}`} checked={answers[q.id]?.optionIds?.[0] === o.id} onChange={() => setAnswer(q.id, { optionIds: [o.id] })} /> {o.text}
                    </label>
                  ))}
                </div>
              )}
              {q.type === 'multiple' && (
                <div className="flex flex-col gap-1.5">
                  {q.options.map((o) => {
                    const sel = answers[q.id]?.optionIds ?? []
                    return (
                      <label key={o.id} className="flex items-center gap-2 text-text cursor-pointer" style={{ color: 'var(--project-accent)' }}>
                        <input type="checkbox" checked={sel.includes(o.id)} onChange={(e) => setAnswer(q.id, { optionIds: e.target.checked ? [...sel, o.id] : sel.filter((x) => x !== o.id) })} /> {o.text}
                      </label>
                    )
                  })}
                </div>
              )}
              {q.type === 'text' && (
                <textarea rows={3} value={answers[q.id]?.textAnswer ?? ''} onChange={(e) => setAnswer(q.id, { textAnswer: e.target.value })}
                  placeholder="Deine Antwort …" className="w-full px-3 py-2 rounded-lg border text-text outline-none"
                  style={{ borderColor: 'color-mix(in srgb, var(--project-general) 30%, transparent)', color: 'var(--project-accent)', background: 'var(--project-white)' }} />
              )}
              {q.type === 'scale' && (
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => {
                    const active = answers[q.id]?.scaleAnswer === n
                    return (
                      <button key={n} type="button" onClick={() => setAnswer(q.id, { scaleAnswer: n })}
                        className="w-10 h-10 rounded-lg border text-text font-semibold transition-colors"
                        style={{ background: active ? 'var(--project-dark)' : 'transparent', color: active ? 'var(--project-black)' : 'var(--project-accent)', borderColor: active ? 'var(--project-dark)' : 'color-mix(in srgb, var(--project-general) 35%, transparent)' }}>{n}</button>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
          <div className="flex items-center gap-3">
            <button type="button" onClick={submit} disabled={pending || Object.keys(answers).length === 0}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-cta font-semibold transition-opacity disabled:opacity-40" style={{ background: 'var(--project-accent)', color: 'var(--project-white)' }}>
              <Send className="w-4 h-4" /> Abstimmen
            </button>
            {error && <span className="text-small" style={{ color: 'var(--project-danger)' }}>{error}</span>}
          </div>
        </div>
      ) : poll.requiresLogin ? (
        <p className="text-small px-4 py-3 rounded-lg" style={noticeStyle}>
          {loginHref ? <>Bitte <a href={loginHref} className="underline font-medium">melde dich an</a>, um abzustimmen.</> : 'Bitte melde dich an, um abzustimmen.'}
        </p>
      ) : (
        <p className="text-small px-4 py-3 rounded-lg" style={noticeStyle}>
          Diese Umfrage ist geschlossen — Abstimmen ist nicht mehr möglich.
        </p>
      )}
      {!poll.canVote && error && <p className="text-small mt-3" style={{ color: 'var(--project-danger)' }}>{error}</p>}
    </FormModal>
  )
}

export function PollsConsumption({ slug, locale, polls, loginHref, isLoggedIn = false, agentEnabled = false, author = null }: { slug: string; locale: string; polls: CitizenPoll[]; loginHref?: string; isLoggedIn?: boolean; agentEnabled?: boolean; author?: PollsAuthor | null }) {
  const [creating, setCreating] = useState(false)
  const [open, setOpen] = useState<{ id: string; mode: PopupMode } | null>(null)
  // Derived from props so a router.refresh (vote, status change) updates the
  // open popup in place; a deleted poll simply closes it.
  const openPoll = open ? polls.find((p) => p.id === open.id) : undefined

  return (
    <div>
      {/* Visually redundant with the breadcrumb — kept for screen readers (BITV). */}
      <h1 className="sr-only">Umfragen</h1>
      {author && (
        <div className="flex items-center justify-end mb-4">
          <button type="button" onClick={() => setCreating(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-cta font-semibold" style={{ background: 'var(--project-accent)', color: 'var(--project-white)' }}>
            <Plus className="w-4 h-4" /> Neue Umfrage
          </button>
        </div>
      )}
      {creating && author && (
        <PollFormModal slug={slug} locale={locale} editing={null} teamCatalog={author.teamCatalog} leadMode={!author.isPM} onClose={() => setCreating(false)} />
      )}
      {polls.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border py-12" style={cardStyle}>
          <BarChart2 className="w-8 h-8" style={{ color: 'var(--project-ink)' }} />
          <p className="text-text" style={{ color: 'var(--project-ink)' }}>Derzeit keine Umfragen.</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {polls.map((p) => <PollSummary key={p.id} slug={slug} locale={locale} poll={p} isLoggedIn={isLoggedIn} agentEnabled={agentEnabled} onOpen={(mode) => setOpen({ id: p.id, mode })} />)}
        </div>
      )}
      {openPoll && open && (
        <PollPopup slug={slug} locale={locale} poll={openPoll} mode={open.mode} loginHref={loginHref} author={author} onClose={() => setOpen(null)} />
      )}
    </div>
  )
}
