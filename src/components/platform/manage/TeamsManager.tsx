// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { X, Plus, Check, Users, Pencil } from 'lucide-react'
import { updateProjectTeams } from '@/actions/manage/settings'

/** A catalog entry: `original` is the saved name (null = newly added). */
interface TeamDraft { original: string | null; name: string }

export function TeamsManager({ slug, locale, teams: initial }: { slug: string; locale: string; teams: string[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [items, setItems] = useState<TeamDraft[]>(initial.map((name) => ({ original: name, name })))
  const [newName, setNewName] = useState('')
  const [editing, setEditing] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const names = items.map((i) => i.name)
  const removedOriginals = initial.filter((t) => !items.some((i) => i.original === t))
  const renames = items.filter((i) => i.original && i.original !== i.name) as { original: string; name: string }[]

  const add = () => {
    const name = newName.trim()
    if (!name) return
    if (names.includes(name)) { setError('Team-Name existiert bereits.'); return }
    setItems((s) => [...s, { original: null, name }])
    setNewName('')
    setError(null)
    setSaved(false)
  }

  const remove = (idx: number) => {
    setItems((s) => s.filter((_, i) => i !== idx))
    setSaved(false)
    setConfirming(false)
  }

  const startRename = (idx: number) => { setEditing(idx); setEditName(items[idx].name); setError(null) }
  const commitRename = () => {
    if (editing === null) return
    const name = editName.trim()
    if (!name) { setEditing(null); return }
    if (names.some((n, i) => i !== editing && n === name)) { setError('Team-Name existiert bereits.'); return }
    setItems((s) => s.map((it, i) => (i === editing ? { ...it, name } : it)))
    setEditing(null)
    setSaved(false)
    setConfirming(false)
  }

  const save = () => {
    // Deleting a team cascades (membership tags, leadership, content scoping) —
    // that deserves an explicit second click.
    if (removedOriginals.length > 0 && !confirming) { setConfirming(true); return }
    setError(null)
    setConfirming(false)
    startTransition(async () => {
      const res = await updateProjectTeams(slug, locale, names, renames.map((r) => ({ from: r.original, to: r.name })))
      if (res.error) { setError(res.error); return }
      setItems((s) => s.map((i) => ({ original: i.name, name: i.name })))
      setSaved(true)
      router.refresh()
    })
  }

  return (
    <div>
      <h1 className="sr-only">Teams</h1>

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
            borderColor: 'color-mix(in srgb, var(--project-general) 30%, transparent)',
            color: 'var(--project-accent)',
            background: 'var(--project-white)',
          }}
        />
        <button
          type="button"
          onClick={add}
          disabled={!newName.trim()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-small font-semibold disabled:opacity-40"
          style={{ background: 'var(--project-accent)', color: 'var(--project-white)' }}
        >
          <Plus className="w-4 h-4" />
          Hinzufügen
        </button>
      </div>

      {/* Team list */}
      {items.length === 0 ? (
        <p className="text-text py-8 text-center rounded-xl border" style={{ color: 'var(--project-ink)', borderColor: 'color-mix(in srgb, var(--project-general) 20%, transparent)' }}>
          Noch keine Teams definiert.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2 mb-4">
          {items.map((team, idx) => (
            <span
              key={`${team.original ?? '+'}-${idx}`}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-small font-medium"
              style={{ background: 'var(--project-accent)', color: 'var(--project-white)' }}
            >
              <Users className="w-3.5 h-3.5" />
              {editing === idx ? (
                <input
                  type="text"
                  value={editName}
                  autoFocus
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setEditing(null) }}
                  onBlur={commitRename}
                  className="w-32 px-1.5 py-0.5 rounded text-small outline-none"
                  style={{ color: 'var(--project-accent)', background: 'var(--project-white)' }}
                />
              ) : (
                <>
                  {team.name}
                  {team.original && team.original !== team.name && <span className="opacity-70">(vorher: {team.original})</span>}
                </>
              )}
              <button
                type="button"
                onClick={() => startRename(idx)}
                className="p-0.5 rounded-full hover:bg-[var(--project-white)] hover:text-[var(--project-accent)] transition-colors"
                title="Umbenennen"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => remove(idx)}
                className="p-0.5 rounded-full hover:bg-[var(--project-white)] hover:text-[var(--project-accent)] transition-colors"
                title="Entfernen"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {renames.length > 0 && (
        <p className="text-small mb-2" style={{ color: 'var(--project-ink)' }}>
          Umbenennungen werden überall übernommen: bei Mitgliedern, Teamleitungen und team-sichtbaren Inhalten.
        </p>
      )}
      {confirming && removedOriginals.length > 0 && (
        <p className="text-small mb-2 px-4 py-2.5 rounded-lg" style={{ color: 'var(--project-danger)', background: 'var(--project-danger-surface)' }}>
          {removedOriginals.length === 1 ? `Team „${removedOriginals[0]}" wird gelöscht` : `Teams ${removedOriginals.map((t) => `„${t}"`).join(', ')} werden gelöscht`} —
          Mitglieder verlieren die Zuordnung (und ggf. die Teamleitung), team-sichtbare Inhalte verlieren den Tag. Zum Bestätigen erneut speichern.
        </p>
      )}

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-cta font-semibold transition-opacity disabled:opacity-40"
          style={confirming ? { background: 'var(--project-danger)', color: 'var(--project-danger-on)' } : { background: 'var(--project-accent)', color: 'var(--project-white)' }}
        >
          {saved ? <Check className="w-4 h-4" /> : null}
          {pending ? 'Speichern …' : confirming ? 'Löschen bestätigen' : saved ? 'Gespeichert' : 'Speichern'}
        </button>
        {error && <p className="text-small" style={{ color: 'var(--project-danger)' }}>{error}</p>}
      </div>
    </div>
  )
}
