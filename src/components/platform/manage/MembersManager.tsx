'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, UserCircle } from 'lucide-react'
import { updateMemberRole, removeMember } from '@/actions/manage/members'

export interface MemberItem {
  membershipId: string
  name: string
  email: string
  role: string
  isSelf: boolean
}

const ROLE_OPTIONS = [
  { value: 'PM', label: 'Projektmanager:in' },
  { value: 'Citizen', label: 'Bürger:in' },
  { value: 'Follower', label: 'Follower' },
]

export function MembersManager({ slug, locale, members }: { slug: string; locale: string; members: MemberItem[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)

  const run = (fn: () => Promise<{ error?: string; ok?: boolean }>) => {
    setError(null)
    startTransition(async () => {
      const res = await fn()
      if (res.error) { setError(res.error); return }
      setConfirmRemove(null)
      router.refresh()
    })
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-title font-bold leading-tight mb-1" style={{ color: 'var(--project-dark)' }}>Mitglieder</h1>
      <p className="text-text mb-6" style={{ color: 'var(--project-dark)', opacity: 0.65 }}>
        {members.length} {members.length === 1 ? 'aktives Mitglied' : 'aktive Mitglieder'} in diesem Projekt.
      </p>

      {error && (
        <p className="text-small mb-4 px-4 py-2.5 rounded-lg" style={{ color: '#b91c1c', background: '#fef2f2' }}>{error}</p>
      )}

      <div className="flex flex-col gap-2">
        {members.map((m) => (
          <div
            key={m.membershipId}
            className="flex items-center gap-3 rounded-xl border px-4 py-3"
            style={{ background: 'var(--project-white)', borderColor: 'color-mix(in srgb, var(--project-mid) 20%, transparent)' }}
          >
            <UserCircle className="w-8 h-8 shrink-0" style={{ color: 'var(--project-mid)' }} />
            <div className="flex-1 min-w-0">
              <p className="text-text font-medium truncate" style={{ color: 'var(--project-dark)' }}>
                {m.name}
                {m.isSelf && <span className="text-small font-normal ml-2" style={{ opacity: 0.5 }}>(Du)</span>}
              </p>
              <p className="text-small truncate" style={{ color: 'var(--project-dark)', opacity: 0.55 }}>{m.email}</p>
            </div>

            <select
              value={m.role}
              disabled={pending}
              onChange={(e) => run(() => updateMemberRole(slug, locale, m.membershipId, e.target.value))}
              className="px-3 py-1.5 rounded-lg border text-small outline-none shrink-0"
              style={{ borderColor: 'color-mix(in srgb, var(--project-mid) 30%, transparent)', color: 'var(--project-dark)', background: 'var(--project-white)' }}
            >
              {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>

            {confirmRemove === m.membershipId ? (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => run(() => removeMember(slug, locale, m.membershipId))}
                  disabled={pending}
                  className="px-3 py-1.5 rounded-lg text-small font-semibold disabled:opacity-40"
                  style={{ background: '#b91c1c', color: 'white' }}
                >
                  Entfernen
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmRemove(null)}
                  disabled={pending}
                  className="px-3 py-1.5 rounded-lg text-small"
                  style={{ color: 'var(--project-dark)', opacity: 0.7 }}
                >
                  Abbrechen
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmRemove(m.membershipId)}
                disabled={pending}
                title="Mitglied entfernen"
                className="p-2 rounded-lg shrink-0 transition-colors disabled:opacity-40"
                style={{ color: '#b91c1c' }}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
