// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

/**
 * One shared audience marker for every module list/card:
 * PUBLIC → "Öffentlich" (light/ink), PROJECT → nothing (default audience keeps
 * lists calm), TEAM → "Team: X, Y" (dark chip, same style the task board used).
 * Pure — usable from server and client components alike.
 */
export function AudienceChip({ visibility, visibilityTeams }: {
  visibility?: string | null
  visibilityTeams?: string[] | null
}) {
  if (visibility === 'PUBLIC') {
    return (
      <span title="Öffentlich sichtbar" className="text-[0.7rem] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: 'var(--project-light)', color: 'var(--project-ink)' }}>
        Öffentlich
      </span>
    )
  }
  if (visibility !== 'TEAM') return null
  const teams = (visibilityTeams ?? []).filter(Boolean)
  return (
    <span title="Nur für das genannte Team sichtbar" className="text-[0.7rem] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap max-w-[16rem] truncate" style={{ background: 'var(--project-dark)', color: 'var(--project-black)' }}>
      {teams.length ? `Team: ${teams.join(', ')}` : 'Team'}
    </span>
  )
}
