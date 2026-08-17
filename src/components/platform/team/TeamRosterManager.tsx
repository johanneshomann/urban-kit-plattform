// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Crown, UserPlus, X } from 'lucide-react'
import { addMemberToTeam, removeMemberFromTeam } from '@/actions/team-lead'

export interface RosterMember { membershipId: string; name: string; isLead: boolean }
export interface TeamRoster {
  team: string
  roster: RosterMember[]
  candidates: { membershipId: string; name: string }[]
}

const cardStyle = { background: 'var(--project-white)', borderColor: 'color-mix(in srgb, var(--project-general) 20%, transparent)' }

/** Roster management for the teams the viewer leads — add/remove members per team. */
export function TeamRosterManager({ slug, locale, teams, viewerIsPM }: {
  slug: string
  locale: string
  teams: TeamRoster[]
  viewerIsPM: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState<string | null>(null)

  const run = (fn: () => Promise<{ error?: string; ok?: boolean }>) => {
    setError(null)
    startTransition(async () => {
      const res = await fn()
      if (res.error) { setError(res.error); return }
      setAdding(null)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="text-small px-4 py-2.5 rounded-lg" style={{ color: 'var(--project-danger)', background: 'var(--project-danger-surface)' }}>{error}</p>}

      {teams.map(({ team, roster, candidates }) => (
        <section key={team} className="rounded-xl border p-5" style={cardStyle}>
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-display font-semibold flex items-center gap-2" style={{ color: 'var(--project-accent)' }}>
              <Crown className="w-4 h-4" aria-hidden /> {team}
            </h2>
            {candidates.length > 0 && (
              <button
                type="button"
                onClick={() => setAdding(adding === team ? null : team)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-cta font-semibold cursor-pointer"
                style={{ background: 'var(--project-accent)', color: 'var(--project-white)' }}
              >
                {adding === team ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                {adding === team ? 'Abbrechen' : 'Mitglied aufnehmen'}
              </button>
            )}
          </div>

          {adding === team && (
            <div className="mb-4 rounded-lg p-3" style={{ background: 'var(--project-light)' }}>
              <p className="text-small font-medium mb-2" style={{ color: 'var(--project-accent)' }}>Projektmitglied auswählen:</p>
              <div className="flex flex-wrap gap-2">
                {candidates.map((c) => (
                  <button
                    key={c.membershipId}
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => addMemberToTeam(slug, locale, team, c.membershipId))}
                    className="text-small px-3 py-1.5 rounded-full border cursor-pointer transition-colors hover:bg-[var(--project-white)] disabled:opacity-40"
                    style={{ color: 'var(--project-accent)', borderColor: 'color-mix(in srgb, var(--project-general) 35%, transparent)', background: 'var(--project-white)' }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {roster.length === 0 ? (
            <p className="text-text" style={{ color: 'var(--project-ink)' }}>Noch keine Mitglieder in diesem Team.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {roster.map((m) => (
                <li key={m.membershipId} className="flex items-center gap-3 rounded-lg border px-3 py-2" style={cardStyle}>
                  <span className="min-w-0 flex-1 text-text font-medium truncate flex items-center gap-2" style={{ color: 'var(--project-accent)' }}>
                    {m.name}
                    {m.isLead && (
                      <span className="inline-flex items-center gap-1 text-[0.7rem] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'var(--project-dark)', color: 'var(--project-black)' }}>
                        <Crown className="w-3 h-3" aria-hidden /> Teamleitung
                      </span>
                    )}
                  </span>
                  {(!m.isLead || viewerIsPM) && (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => run(() => removeMemberFromTeam(slug, locale, team, m.membershipId))}
                      title="Aus dem Team entfernen"
                      className="p-1.5 rounded-lg cursor-pointer transition-colors hover:bg-[var(--project-light)] disabled:opacity-40"
                      style={{ color: 'var(--project-danger)' }}
                    >
                      <X className="w-4 h-4" aria-hidden />
                      <span className="sr-only">{m.name} aus {team} entfernen</span>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  )
}
