import type { PollResults } from '@/lib/poll-results'

/** Presentational per-question results: bars (choice), distribution (scale), text list. */
export function PollResultsView({ results }: { results: PollResults }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-small font-semibold" style={{ color: 'var(--project-dark)' }}>
        {results.participantCount} {results.participantCount === 1 ? 'Teilnehmer:in' : 'Teilnehmer:innen'}
      </p>
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
  )
}
