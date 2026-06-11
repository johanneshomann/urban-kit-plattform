'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, UserCircle, Inbox } from 'lucide-react'
import { respondToJoinRequest } from '@/actions/manage/members'

export interface RequestItem {
  membershipId: string
  name: string
  email: string
  requestedAt: string | null
}

export function RequestsManager({ slug, locale, requests }: { slug: string; locale: string; requests: RequestItem[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const respond = (membershipId: string, decision: 'approve' | 'reject') => {
    setError(null)
    startTransition(async () => {
      const res = await respondToJoinRequest(slug, locale, membershipId, decision)
      if (res.error) { setError(res.error); return }
      router.refresh()
    })
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-title font-bold leading-tight mb-1" style={{ color: 'var(--project-dark)' }}>Anfragen</h1>
      <p className="text-text mb-6" style={{ color: 'var(--project-dark)', opacity: 0.65 }}>
        Offene Beitrittsanfragen für dieses Projekt.
      </p>

      {error && (
        <p className="text-small mb-4 px-4 py-2.5 rounded-lg" style={{ color: '#b91c1c', background: '#fef2f2' }}>{error}</p>
      )}

      {requests.length === 0 ? (
        <div
          className="flex flex-col items-center gap-3 rounded-xl border py-12"
          style={{ background: 'var(--project-white)', borderColor: 'color-mix(in srgb, var(--project-mid) 20%, transparent)' }}
        >
          <Inbox className="w-8 h-8" style={{ color: 'var(--project-mid)', opacity: 0.6 }} />
          <p className="text-text" style={{ color: 'var(--project-dark)', opacity: 0.5 }}>Keine offenen Anfragen.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {requests.map((r) => (
            <div
              key={r.membershipId}
              className="flex items-center gap-3 rounded-xl border px-4 py-3"
              style={{ background: 'var(--project-white)', borderColor: 'color-mix(in srgb, var(--project-mid) 20%, transparent)' }}
            >
              <UserCircle className="w-8 h-8 shrink-0" style={{ color: 'var(--project-mid)' }} />
              <div className="flex-1 min-w-0">
                <p className="text-text font-medium truncate" style={{ color: 'var(--project-dark)' }}>{r.name}</p>
                <p className="text-small truncate" style={{ color: 'var(--project-dark)', opacity: 0.55 }}>
                  {r.email}
                  {r.requestedAt && ` · ${new Date(r.requestedAt).toLocaleDateString('de-DE')}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => respond(r.membershipId, 'approve')}
                disabled={pending}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-small font-semibold transition-opacity disabled:opacity-40"
                style={{ background: 'var(--project-dark)', color: 'var(--project-white)' }}
              >
                <Check className="w-4 h-4" /> Annehmen
              </button>
              <button
                type="button"
                onClick={() => respond(r.membershipId, 'reject')}
                disabled={pending}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-small font-semibold transition-opacity disabled:opacity-40"
                style={{ color: '#b91c1c' }}
              >
                <X className="w-4 h-4" /> Ablehnen
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
