'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Trash2, UserCircle, Users } from 'lucide-react'
import { updateMemberRole, removeMember, setMemberTeams } from '@/actions/manage/members'

export interface MemberItem {
  membershipId: string
  name: string
  email: string
  role: string
  teams: string[]
  isSelf: boolean
}

const ROLE_OPTIONS = [
  { value: 'PM', labelKey: 'members.rolePm' },
  { value: 'Citizen', labelKey: 'members.roleCitizen' },
  { value: 'Follower', labelKey: 'members.roleFollower' },
] as const

export function MembersManager({ slug, locale, members }: { slug: string; locale: string; members: MemberItem[] }) {
  const t = useTranslations('manage')
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
      <h1 className="text-title font-bold leading-tight mb-1" style={{ color: 'var(--project-dark)' }}>{t('members.title')}</h1>
      <p className="text-text mb-6" style={{ color: 'var(--project-dark)', opacity: 0.65 }}>
        {t('members.count', { count: members.length })}
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
                {m.isSelf && <span className="text-small font-normal ml-2" style={{ opacity: 0.5 }}>{t('members.you')}</span>}
              </p>
              <p className="text-small truncate" style={{ color: 'var(--project-dark)', opacity: 0.55 }}>{m.email}</p>
            </div>

            {(() => {
              const teamTags = m.teams ?? []
              const isPM = m.role === 'PM'
              return (
                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  {teamTags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-small font-medium"
                      style={{ background: 'var(--project-dark)', color: 'var(--project-white)' }}
                    >
                      <Users className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                  {teamTags.length === 0 && !isPM && (
                    <span
                      className="px-2 py-0.5 rounded-full text-small opacity-50"
                      style={{ color: 'var(--project-dark)', border: '1px solid color-mix(in srgb, var(--project-mid) 35%, transparent)' }}
                    >
                      {t('members.teamLabel')}
                    </span>
                  )}
                  {isPM && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-small font-medium" style={{ background: 'var(--project-dark)', color: 'var(--project-white)', opacity: 0.8 }}>
                      <Users className="w-3 h-3" />
                      PM
                    </span>
                  )}
                </div>
              )
            })()}

            <select
              value={m.role}
              disabled={pending}
              onChange={(e) => run(() => updateMemberRole(slug, locale, m.membershipId, e.target.value))}
              className="px-3 py-1.5 rounded-lg border text-small outline-none shrink-0"
              style={{ borderColor: 'color-mix(in srgb, var(--project-mid) 30%, transparent)', color: 'var(--project-dark)', background: 'var(--project-white)' }}
            >
              {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{t(r.labelKey)}</option>)}
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
                  {t('members.confirmRemove')}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmRemove(null)}
                  disabled={pending}
                  className="px-3 py-1.5 rounded-lg text-small"
                  style={{ color: 'var(--project-dark)', opacity: 0.7 }}
                >
                  {t('members.cancel')}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmRemove(m.membershipId)}
                disabled={pending}
                title={t('members.removeTitle')}
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
