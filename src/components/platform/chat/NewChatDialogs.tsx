'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'
import { X, Search, UserCircle, Check } from 'lucide-react'
import { createGroup } from '@/modules/chat/actions'
import type { MyProject } from './types'

/** Picker result — /api/chat/users (findPeople policy) incl. shared projects. */
type PickerUser = {
  id: string
  name: string | null
  avatarUrl: string | null
  sharedProjects?: { id: string; title: string; light: string; accent: string }[]
}

function useUserSearch() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<PickerUser[]>([])
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

/** Centered dialog in the app's standard idiom (dark blurred backdrop, popover-in). */
function Shell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const t = useTranslations('chat')
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[color-mix(in_srgb,var(--app-black)_45%,transparent)] backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="popover-in w-full max-w-md rounded-xl p-6 shadow-xl max-h-[85vh] overflow-y-auto"
        style={{ background: 'var(--app-white)', color: 'var(--app-ink)' }}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <h2 className="text-display font-bold" style={{ color: 'var(--app-ink-accent)' }}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-[color-mix(in_srgb,var(--app-ink)_8%,var(--app-white))] cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}

function SearchBox({ q, setQ }: { q: string; setQ: (v: string) => void }) {
  const t = useTranslations('chat')
  return (
    <div
      className="flex items-center gap-2 px-4 h-10 rounded-lg text-small mb-3 shadow-sm transition-all duration-200 focus-within:shadow-md focus-within:ring-2 bg-[var(--app-light)]"
      style={{ '--tw-ring-color': 'var(--app-accent)' } as React.CSSProperties}
    >
      <Search className="w-[1em] h-[1em] shrink-0 opacity-40" aria-hidden />
      <input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t('searchPeople')}
        aria-label={t('searchPeople')}
        className="flex-1 outline-none bg-transparent placeholder:opacity-60"
        style={{ color: 'var(--app-ink)' }}
      />
    </div>
  )
}

/** Person row: avatar, name, shared-project pills — the "who is this" cue. */
function PersonRow({ user, onClick, selected, disabled }: { user: PickerUser; onClick: () => void; selected?: boolean; disabled?: boolean }) {
  const t = useTranslations('chat')
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left cursor-pointer transition-colors hover:bg-[color-mix(in_srgb,var(--app-ink)_6%,transparent)] disabled:opacity-50"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full overflow-hidden" style={{ background: 'var(--app-light)' }}>
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatarUrl} alt="" aria-hidden className="h-full w-full object-cover" />
        ) : (
          <UserCircle className="h-5 w-5 opacity-50" aria-hidden />
        )}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-small font-medium truncate" style={{ color: 'var(--app-ink-accent)' }}>
          {user.name ?? t('unknownUser')}
        </span>
        {(user.sharedProjects?.length ?? 0) > 0 && (
          <span className="flex flex-wrap gap-1 mt-0.5">
            {user.sharedProjects!.slice(0, 3).map((p) => (
              <span key={p.id} className="text-[0.7rem] px-1.5 py-px rounded-full truncate max-w-32" style={{ background: p.light, color: 'var(--app-ink-accent)' }}>
                {p.title}
              </span>
            ))}
          </span>
        )}
      </span>
      {selected && <Check className="h-4 w-4 shrink-0" style={{ color: 'var(--app-accent)' }} aria-hidden />}
    </button>
  )
}

export function NewDMDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (roomId: string) => void }) {
  const t = useTranslations('chat')
  const { q, setQ, results } = useUserSearch()
  const [busy, setBusy] = useState(false)

  const start = async (userId: string) => {
    setBusy(true)
    const res = await fetch('/api/chat/dm', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId }) }).then((r) => r.json()).catch(() => null)
    setBusy(false)
    if (res?.roomId) onCreated(res.roomId)
  }

  return (
    <Shell title={t('newDm')} onClose={onClose}>
      <SearchBox q={q} setQ={setQ} />
      <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
        {results.map((u) => (
          <PersonRow key={u.id} user={u} disabled={busy} onClick={() => start(u.id)} />
        ))}
        {q.trim().length >= 2 && results.length === 0 && <p className="text-small opacity-50 px-2 py-2">{t('noResults')}</p>}
      </div>
    </Shell>
  )
}

export function NewGroupDialog({
  assignableProjects = [],
  onClose,
  onCreated,
}: {
  /** Projects the creator may attach the new group to (setting-gated / PM). */
  assignableProjects?: MyProject[]
  onClose: () => void
  onCreated: (roomId: string) => void
}) {
  const t = useTranslations('chat')
  const { q, setQ, results } = useUserSearch()
  const [name, setName] = useState('')
  const [projectId, setProjectId] = useState('')
  const [selected, setSelected] = useState<PickerUser[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggle = (u: PickerUser) =>
    setSelected((prev) => prev.some((p) => p.id === u.id) ? prev.filter((p) => p.id !== u.id) : [...prev, u])

  const create = async () => {
    setError(null); setBusy(true)
    const res = await createGroup(name, selected.map((u) => u.id), projectId || undefined)
    setBusy(false)
    if (res.error) { setError(res.error); return }
    if (res.roomId) onCreated(res.roomId)
  }

  return (
    <Shell title={t('newGroup')} onClose={onClose}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t('groupName')}
        aria-label={t('groupName')}
        className="w-full px-4 h-10 rounded-lg text-small outline-none shadow-sm mb-3 transition-all duration-200 focus:shadow-md focus:ring-2 bg-[var(--app-light)]"
        style={{ color: 'var(--app-ink)', '--tw-ring-color': 'var(--app-accent)' } as React.CSSProperties}
      />
      {assignableProjects.length > 0 && (
        <div className="mb-3">
          <label className="block text-small font-medium mb-1.5" htmlFor="group-project">{t('groupProjectLabel')}</label>
          <select
            id="group-project"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full px-4 h-10 rounded-lg text-small outline-none shadow-sm cursor-pointer transition-all duration-200 focus:shadow-md focus:ring-2 bg-[var(--app-light)]"
            style={{ color: 'var(--app-ink)', '--tw-ring-color': 'var(--app-accent)' } as React.CSSProperties}
          >
            <option value="">{t('groupProjectNone')}</option>
            {assignableProjects.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>
      )}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {selected.map((u) => (
            <span key={u.id} className="flex items-center gap-1 text-small px-2 py-0.5 rounded-full" style={{ background: 'var(--app-light)', color: 'var(--app-ink)' }}>
              {u.name ?? t('unknownUser')}
              <button type="button" onClick={() => toggle(u)} aria-label={t('close')} className="cursor-pointer">
                <X className="w-3 h-3" aria-hidden />
              </button>
            </span>
          ))}
        </div>
      )}
      <SearchBox q={q} setQ={setQ} />
      <div className="flex flex-col gap-1 max-h-48 overflow-y-auto mb-3">
        {results.map((u) => (
          <PersonRow key={u.id} user={u} selected={selected.some((p) => p.id === u.id)} onClick={() => toggle(u)} />
        ))}
        {q.trim().length >= 2 && results.length === 0 && <p className="text-small opacity-50 px-2 py-2">{t('noResults')}</p>}
      </div>
      {error && <p className="text-small text-red-700 mb-2">{error}</p>}
      <button
        type="button"
        onClick={create}
        disabled={busy || !name.trim()}
        className="w-full h-11 rounded-lg text-small font-semibold disabled:opacity-40 cursor-pointer transition-colors bg-[var(--app-accent)] text-[var(--app-white)] hover:bg-[var(--app-ink-accent)]"
      >
        {t('createGroup')}
      </button>
    </Shell>
  )
}
