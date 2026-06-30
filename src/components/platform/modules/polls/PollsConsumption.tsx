'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart2, Check, Send } from 'lucide-react'
import { submitPollVote, type PollAnswer } from '@/actions/poll-vote'
import { PollResultsView } from './PollResultsView'
import type { CitizenPoll } from '@/lib/citizen-polls'

const cardStyle = { background: 'var(--project-white)', borderColor: 'color-mix(in srgb, var(--project-mid) 20%, transparent)' }
const STATUS_META: Record<string, { label: string; bg: string; fg: string }> = {
  active: { label: 'Aktiv', bg: '#dcfce7', fg: '#166534' },
  closed: { label: 'Geschlossen', bg: '#f3f4f6', fg: '#4b5563' },
}

function PollCard({ slug, locale, poll, loginHref }: { slug: string; locale: string; poll: CitizenPoll; loginHref?: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, PollAnswer>>({})

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

  return (
    <div className="rounded-xl border p-5" style={cardStyle}>
      <div className="flex items-start justify-between gap-3 mb-1">
        <h2 className="text-display font-bold leading-snug" style={{ color: 'var(--project-dark)' }}>{poll.title}</h2>
        <span className="text-small font-semibold px-2.5 py-0.5 rounded-full shrink-0" style={{ background: meta.bg, color: meta.fg }}>{meta.label}</span>
      </div>
      {poll.description && <p className="text-text mb-4" style={{ color: 'var(--project-dark)', opacity: 0.7 }}>{poll.description}</p>}

      {poll.showResults && poll.results ? (
        <PollResultsView results={poll.results} />
      ) : poll.canVote ? (
        <div className="flex flex-col gap-5 mt-3">
          {poll.questions.map((q) => (
            <div key={q.id}>
              <p className="text-text font-medium mb-2" style={{ color: 'var(--project-dark)' }}>{q.text}</p>
              {q.type === 'single' && (
                <div className="flex flex-col gap-1.5">
                  {q.options.map((o) => (
                    <label key={o.id} className="flex items-center gap-2 text-text cursor-pointer" style={{ color: 'var(--project-dark)' }}>
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
                      <label key={o.id} className="flex items-center gap-2 text-text cursor-pointer" style={{ color: 'var(--project-dark)' }}>
                        <input type="checkbox" checked={sel.includes(o.id)} onChange={(e) => setAnswer(q.id, { optionIds: e.target.checked ? [...sel, o.id] : sel.filter((x) => x !== o.id) })} /> {o.text}
                      </label>
                    )
                  })}
                </div>
              )}
              {q.type === 'text' && (
                <textarea rows={3} value={answers[q.id]?.textAnswer ?? ''} onChange={(e) => setAnswer(q.id, { textAnswer: e.target.value })}
                  placeholder="Deine Antwort …" className="w-full px-3 py-2 rounded-lg border text-text outline-none"
                  style={{ borderColor: 'color-mix(in srgb, var(--project-mid) 30%, transparent)', color: 'var(--project-dark)', background: 'var(--project-white)' }} />
              )}
              {q.type === 'scale' && (
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => {
                    const active = answers[q.id]?.scaleAnswer === n
                    return (
                      <button key={n} type="button" onClick={() => setAnswer(q.id, { scaleAnswer: n })}
                        className="w-10 h-10 rounded-lg border text-text font-semibold transition-colors"
                        style={{ background: active ? 'var(--project-dark)' : 'transparent', color: active ? 'var(--project-white)' : 'var(--project-dark)', borderColor: active ? 'var(--project-dark)' : 'color-mix(in srgb, var(--project-mid) 35%, transparent)' }}>{n}</button>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
          <div className="flex items-center gap-3">
            <button type="button" onClick={submit} disabled={pending || Object.keys(answers).length === 0}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-cta font-semibold transition-opacity disabled:opacity-40" style={{ background: 'var(--project-dark)', color: 'var(--project-white)' }}>
              <Send className="w-4 h-4" /> Abstimmen
            </button>
            {error && <span className="text-small" style={{ color: '#b91c1c' }}>{error}</span>}
          </div>
        </div>
      ) : poll.requiresLogin ? (
        <p className="text-small px-4 py-3 rounded-lg" style={{ background: 'var(--project-light)', color: 'var(--project-dark)', opacity: 0.85 }}>
          {loginHref ? <>Bitte <a href={loginHref} className="underline font-medium">melde dich an</a>, um abzustimmen.</> : 'Bitte melde dich an, um abzustimmen.'}
        </p>
      ) : (
        <p className="flex items-center gap-2 text-small px-4 py-3 rounded-lg" style={{ background: 'var(--project-light)', color: 'var(--project-dark)', opacity: 0.85 }}>
          <Check className="w-4 h-4" /> Danke fürs Abstimmen! Die Ergebnisse werden nach Abschluss angezeigt.
        </p>
      )}
    </div>
  )
}

export function PollsConsumption({ slug, locale, polls, loginHref }: { slug: string; locale: string; polls: CitizenPoll[]; loginHref?: string }) {
  return (
    <div>
      <h1 className="text-title font-bold leading-tight mb-6" style={{ color: 'var(--project-dark)' }}>Umfragen</h1>
      {polls.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border py-12" style={cardStyle}>
          <BarChart2 className="w-8 h-8" style={{ color: 'var(--project-mid)', opacity: 0.5 }} />
          <p className="text-text" style={{ color: 'var(--project-dark)', opacity: 0.5 }}>Derzeit keine Umfragen.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {polls.map((p) => <PollCard key={p.id} slug={slug} locale={locale} poll={p} loginHref={loginHref} />)}
        </div>
      )}
    </div>
  )
}
