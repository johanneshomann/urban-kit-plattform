'use client'

import { useEffect, useState } from 'react'
import { X, Search } from 'lucide-react'
import { createGroup } from '@/modules/chat/actions'
import type { UserRef } from './types'

function useUserSearch() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<UserRef[]>([])
  useEffect(() => {
    if (q.trim().length < 2) { setResults([]); return }
    let active = true
    const t = setTimeout(async () => {
      const res = await fetch(`/api/chat/users?q=${encodeURIComponent(q.trim())}`).then((r) => r.json()).catch(() => null)
      if (active && res) setResults(res.users ?? [])
    }, 250)
    return () => { active = false; clearTimeout(t) }
  }, [q])
  return { q, setQ, results }
}

function Shell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-text" style={{ color: 'var(--plattform-ink)' }}>{title}</h3>
          <button type="button" onClick={onClose}><X className="w-4 h-4" /></button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

function SearchBox({ q, setQ }: { q: string; setQ: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border mb-3" style={{ borderColor: '#e5e7eb' }}>
      <Search className="w-4 h-4 text-gray-400" />
      <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name oder E-Mail …"
        className="flex-1 outline-none text-text" style={{ color: 'var(--plattform-ink)' }} />
    </div>
  )
}

export function NewDMDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (roomId: string) => void }) {
  const { q, setQ, results } = useUserSearch()
  const [busy, setBusy] = useState(false)

  const start = async (userId: string) => {
    setBusy(true)
    const res = await fetch('/api/chat/dm', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId }) }).then((r) => r.json()).catch(() => null)
    setBusy(false)
    if (res?.roomId) onCreated(res.roomId)
  }

  return (
    <Shell title="Neue Direktnachricht" onClose={onClose}>
      <SearchBox q={q} setQ={setQ} />
      <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
        {results.map((u) => (
          <button key={u.id} type="button" disabled={busy} onClick={() => start(u.id)}
            className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-50 text-left disabled:opacity-50">
            <span className="text-text" style={{ color: 'var(--plattform-ink)' }}>{u.name}</span>
          </button>
        ))}
        {q.trim().length >= 2 && results.length === 0 && <p className="text-small text-gray-400 px-2 py-2">Keine Treffer.</p>}
      </div>
    </Shell>
  )
}

export function NewGroupDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (roomId: string) => void }) {
  const { q, setQ, results } = useUserSearch()
  const [name, setName] = useState('')
  const [selected, setSelected] = useState<UserRef[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggle = (u: UserRef) =>
    setSelected((prev) => prev.some((p) => p.id === u.id) ? prev.filter((p) => p.id !== u.id) : [...prev, u])

  const create = async () => {
    setError(null); setBusy(true)
    const res = await createGroup(name, selected.map((u) => u.id))
    setBusy(false)
    if (res.error) { setError(res.error); return }
    if (res.roomId) onCreated(res.roomId)
  }

  return (
    <Shell title="Neue Gruppe" onClose={onClose}>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Gruppenname"
        className="w-full px-3 py-2 rounded-lg border mb-3 outline-none text-text" style={{ borderColor: '#e5e7eb', color: 'var(--plattform-ink)' }} />
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {selected.map((u) => (
            <span key={u.id} className="flex items-center gap-1 text-small px-2 py-0.5 rounded-full" style={{ background: 'var(--plattform-light)' }}>
              {u.name}<button type="button" onClick={() => toggle(u)}><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      )}
      <SearchBox q={q} setQ={setQ} />
      <div className="flex flex-col gap-1 max-h-48 overflow-y-auto mb-3">
        {results.map((u) => {
          const on = selected.some((p) => p.id === u.id)
          return (
            <button key={u.id} type="button" onClick={() => toggle(u)}
              className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-gray-50 text-left">
              <span className="text-text" style={{ color: 'var(--plattform-ink)' }}>{u.name}</span>
              {on && <span className="text-small" style={{ color: 'var(--plattform)' }}>✓</span>}
            </button>
          )
        })}
      </div>
      {error && <p className="text-small mb-2" style={{ color: '#b91c1c' }}>{error}</p>}
      <button type="button" onClick={create} disabled={busy || !name.trim()}
        className="w-full py-2 rounded-lg text-white text-cta font-semibold disabled:opacity-40" style={{ background: 'var(--plattform)' }}>
        Gruppe erstellen
      </button>
    </Shell>
  )
}
