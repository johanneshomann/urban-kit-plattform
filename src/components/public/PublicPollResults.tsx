// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { useState } from 'react'
import { BarChart2, ChevronRight } from 'lucide-react'
import { PollResultsView } from '@/components/platform/modules/polls/PollResultsView'
import { PublicModal } from '@/components/public/PublicModal'
import type { CitizenPoll } from '@/lib/citizen-polls'

// PollResultsView renders with --project-* vars; map them to the plattform
// tokens INSIDE the portalled modal (the page-level scope doesn't reach it).
const resultThemeVars = {
  '--project-light': 'var(--plattform-light)',
  '--project-general': 'var(--plattform)',
  '--project-accent': 'var(--plattform-ink-accent)',
  '--project-ink': 'var(--plattform-ink)',
  '--project-white': 'var(--plattform-white)',
} as React.CSSProperties

/**
 * Public project page: CLOSED public polls as compact cards (styled like the
 * Aktuelles news/event cards) — clicking opens the full results in a popup.
 */
export function PublicPollResults({ polls }: { polls: CitizenPoll[] }) {
  const [openId, setOpenId] = useState<string | null>(null)
  const open = openId ? polls.find((p) => p.id === openId) : undefined

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2 items-start">
        {polls.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setOpenId(p.id)}
            className="group text-left bg-[var(--plattform-white)] rounded-xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-5"
          >
            {/* Leading tile like the file cards */}
            <span className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 self-start" style={{ background: 'var(--plattform-light)' }}>
              <BarChart2 aria-hidden className="w-5 h-5" style={{ color: 'var(--plattform)' }} />
            </span>
            <span className="min-w-0 flex-1 flex flex-col gap-2">
              <span className="flex items-start justify-between gap-3">
                <span className="text-text font-bold group-hover:underline" style={{ color: 'var(--plattform-ink-accent)' }}>{p.title}</span>
                <span
                  className="inline-flex items-center text-small font-semibold px-2.5 py-0.5 rounded-full shrink-0"
                  style={{ background: 'var(--plattform-light)', color: 'var(--plattform-ink)' }}
                >
                  Abgeschlossen
                </span>
              </span>
              {p.description && <span className="text-small line-clamp-2" style={{ color: 'var(--plattform-ink)' }}>{p.description}</span>}
              <span className="inline-flex items-center gap-1 text-small font-semibold mt-1" style={{ color: 'var(--plattform)' }}>
                Ergebnisse ansehen
                {p.results && <> · {p.results.participantCount} {p.results.participantCount === 1 ? 'Stimme' : 'Stimmen'}</>}
                <ChevronRight aria-hidden className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </span>
          </button>
        ))}
      </div>

      {open && (
        <PublicModal title={open.title} onClose={() => setOpenId(null)}>
          {open.description && <p className="text-text mb-4" style={{ color: 'var(--plattform-ink)' }}>{open.description}</p>}
          <div style={resultThemeVars}>
            {open.results && <PollResultsView results={open.results} />}
          </div>
        </PublicModal>
      )}
    </>
  )
}
