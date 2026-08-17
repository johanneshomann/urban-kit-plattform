// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { TEAM_FILTER_ALL } from '@/lib/team-scope'

/**
 * Pill row filtering a module list by audience via the `?team=` search param
 * (server components read the param and filter — the URL stays shareable):
 * [Alle] [Für alle] [Team A] [Team B]…
 * Render only when the viewer has teams (PMs get the full catalog).
 */
export function TeamFilterBar({ teams, active }: { teams: string[]; active: string | null }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const setFilter = (value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set('team', value)
    else params.delete('team')
    const qs = params.toString()
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }))
  }

  const pills: { value: string | null; label: string }[] = [
    { value: null, label: 'Alle' },
    { value: TEAM_FILTER_ALL, label: 'Für alle' },
    ...teams.map((t) => ({ value: t, label: t })),
  ]

  return (
    <div className="flex flex-wrap items-center gap-1.5 mb-4" role="group" aria-label="Nach Team filtern">
      {pills.map((p) => {
        const on = active === p.value || (!active && p.value === null)
        return (
          <button
            key={p.value ?? '~all~'}
            type="button"
            onClick={() => setFilter(p.value)}
            aria-pressed={on}
            className="text-small px-3 py-1.5 rounded-full border transition-colors"
            style={{
              background: on ? 'var(--project-dark)' : 'transparent',
              color: on ? 'var(--project-black)' : 'var(--project-accent)',
              borderColor: on ? 'var(--project-dark)' : 'color-mix(in srgb, var(--project-general) 35%, transparent)',
            }}
          >
            {p.label}
          </button>
        )
      })}
    </div>
  )
}
