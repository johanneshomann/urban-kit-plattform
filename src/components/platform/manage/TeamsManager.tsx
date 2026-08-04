'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { X, Plus, Check, Users } from 'lucide-react'
import { updateProjectTeams } from '@/actions/manage/settings'

export function TeamsManager({ slug, locale, teams: initial }: { slug: string; locale: string; teams: string[] }) {
  const t = useTranslations('manage')
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [teams, setTeams] = useState<string[]>(initial)
  const [newName, setNewName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const add = () => {
    const name = newName.trim()
    if (!name) return
    if (teams.includes(name)) { setError('Team-Name existiert bereits.'); return }
    setTeams((t) => [...t, name])
    setNewName('')
    setError(null)
    setSaved(false)
  }

  const remove = (name: string) => {
    setTeams((t) => t.filter((n) => n !== name))
    setSaved(false)
  }

  const save = () => {
    setError(null)
    startTransition(async () => {
      const res = await updateProjectTeams(slug, locale, teams)
      if (res.error) { setError(res.error); return }
      setSaved(true)
      router.refresh()
    })
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-title font-bold leading-tight mb-1" style={{ color: 'var(--project-dark)' }}>
        Teams
      </h1>
      <p className="text-text mb-6" style={{ color: 'var(--project-dark)', opacity: 0.65 }}>
        Team-Katalog verwalten — diese Namen können Mitgliedern und Inhalten zugewiesen werden.
      </p>

      {/* Add new team */}
      <div className="flex items-center gap-2 mb-6">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') add() }}
          placeholder="Team-Name …"
          className="w-64 px-3 py-2 rounded-lg border text-text outline-none"
          style={{
            borderColor: 'color-mix(in srgb, var(--project-mid) 30%, transparent)',
            color: 'var(--project-dark)',
            background: 'var(--project-white)',
          }}
        />
        <button
          type="button"
          onClick={add}
          disabled={!newName.trim()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-small font-semibold disabled:opacity-40"
          style={{ background: 'var(--project-dark)', color: 'var(--project-white)' }}
        >
          <Plus className="w-4 h-4" />
          Hinzufügen
        </button>
      </div>

      {/* Team list */}
      {teams.length === 0 ? (
        <p className="text-text py-8 text-center rounded-xl border" style={{ color: 'var(--project-dark)', opacity: 0.4, borderColor: 'color-mix(in srgb, var(--project-mid) 20%, transparent)' }}>
          Noch keine Teams definiert.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2 mb-8">
          {teams.map((team) => (
            <span
              key={team}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-small font-medium"
              style={{ background: 'var(--project-dark)', color: 'var(--project-white)' }}
            >
              <Users className="w-3.5 h-3.5" />
              {team}
              <button
                type="button"
                onClick={() => remove(team)}
                className="ml-1 p-0.5 rounded-full hover:bg-[var(--project-white)] hover:text-[var(--project-dark)] transition-colors"
                title="Entfernen"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-cta font-semibold transition-opacity disabled:opacity-40"
          style={{ background: 'var(--project-dark)', color: 'var(--project-white)' }}
        >
          {saved ? <Check className="w-4 h-4" /> : null}
          {pending ? 'Speichern …' : saved ? 'Gespeichert' : 'Speichern'}
        </button>
        {error && <p className="text-small" style={{ color: '#b91c1c' }}>{error}</p>}
      </div>
    </div>
  )
}