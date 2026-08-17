// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Trash2, UserCircle, Users, X, UserPlus, Copy, Check, Crown } from 'lucide-react'
import { updateMemberRole, removeMember, setMemberTeams, generateInvite } from '@/actions/manage/members'

export interface MemberItem {
  membershipId: string
  name: string
  email: string
  role: string
  teams: string[]
  /** Teams this member LEADS (subset of the catalog). */
  leadOf: string[]
  isSelf: boolean
}

const ROLE_OPTIONS = [
  { value: 'PM', labelKey: 'members.rolePm' },
  { value: 'Citizen', labelKey: 'members.roleCitizen' },
] as const

function TeamPopover({
  member,
  teamCatalog,
  onToggleTeam,
  onToggleLead,
  disabled,
}: {
  member: MemberItem
  teamCatalog: string[]
  onToggleTeam: (tag: string) => void
  onToggleLead: (tag: string) => void
  disabled: boolean
}) {
  const t = useTranslations('manage')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const active = member.teams ?? []
  const isPM = member.role === 'PM'

  // Outside-click close
  useEffect(() => {
    if (!open) return
    function click(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', click)
    return () => document.removeEventListener('mousedown', click)
  }, [open])

  // Quick display of current tags + trigger
  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        className="flex flex-wrap items-center gap-1.5 cursor-pointer disabled:cursor-default"
        title={t('members.teamHint')}
      >
        {active.length > 0 ? (
          active.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-small font-medium"
              style={{ background: 'var(--project-accent)', color: 'var(--project-white)' }}
            >
              {(member.leadOf ?? []).includes(tag) ? <Crown className="w-3 h-3" /> : <Users className="w-3 h-3" />}
              {tag}
            </span>
          ))
        ) : (
          <span
            className="px-2 py-0.5 rounded-full text-small opacity-50"
            style={{ color: 'var(--project-accent)', border: '1px solid color-mix(in srgb, var(--project-general) 35%, transparent)' }}
          >
            {t('members.teamLabel')}
          </span>
        )}
        {isPM && (
          <span
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-small font-medium"
            style={{ background: 'var(--project-accent)', color: 'var(--project-white)' }}
          >
            <Users className="w-3 h-3" />
            PM
          </span>
        )}
      </button>

      {open && (
        <div
          className="popover-in absolute left-0 top-full mt-2 rounded-xl p-3 z-50 min-w-[12rem]"
          style={{
            background: 'var(--project-white)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            border: '1px solid color-mix(in srgb, var(--project-general) 20%, transparent)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-small font-semibold" style={{ color: 'var(--project-accent)' }}>
              {t('members.teamLabel')}
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-0.5 rounded"
              style={{ color: 'var(--project-ink)' }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {teamCatalog.length === 0 ? (
            <p className="text-small opacity-50" style={{ color: 'var(--project-accent)' }}>
              {t('sidebar.noModules')}
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {teamCatalog.map((tag) => {
                const isActive = active.includes(tag)
                const isLead = (member.leadOf ?? []).includes(tag)
                return (
                  <div key={tag} className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onToggleTeam(tag)}
                      className={`flex-1 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-small text-left transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[var(--project-accent)] text-[var(--project-white)]'
                          : 'text-[var(--project-accent)] hover:bg-[var(--project-light)]'
                      }`}
                    >
                      <Users className="w-3 h-3 shrink-0" />
                      {tag}
                    </button>
                    {/* Lead toggle — activating it also joins the team */}
                    <button
                      type="button"
                      onClick={() => onToggleLead(tag)}
                      title={isLead ? t('members.leadOff') : t('members.leadOn')}
                      className="p-1.5 rounded-lg transition-colors cursor-pointer hover:bg-[var(--project-light)]"
                      style={{ color: isLead ? 'var(--project-black)' : 'var(--project-ink)', background: isLead ? 'var(--project-dark)' : 'transparent' }}
                    >
                      <Crown className="w-3.5 h-3.5" aria-hidden />
                      <span className="sr-only">{isLead ? t('members.leadOff') : t('members.leadOn')} — {tag}</span>
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function MembersManager({ slug, locale, members, teamCatalog }: { slug: string; locale: string; members: MemberItem[]; teamCatalog: string[] }) {
  const t = useTranslations('manage')
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

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
    <div>
      <h1 className="sr-only">{t('members.title')}</h1>

      {error && (
        <p className="text-small mb-4 px-4 py-2.5 rounded-lg" style={{ color: 'var(--project-danger)', background: 'var(--project-danger-surface)' }}>{error}</p>
      )}

      {/* Invite — generate and copy a redeemable code */}
      <div className="rounded-xl border px-4 py-3 mb-6" style={{ background: 'var(--project-white)', borderColor: 'color-mix(in srgb, var(--project-general) 20%, transparent)' }}>
        <p className="text-small font-semibold mb-1" style={{ color: 'var(--project-accent)' }}>Einladen</p>
        <p className="text-small mb-3" style={{ color: 'var(--project-ink)' }}>
          Erzeuge einen Einladungscode. Der Code kann auf der Startseite eingelöst werden und schaltet die Person frei.
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setError(null)
              startTransition(async () => {
                const res = await generateInvite(slug, locale)
                if (res.error) { setError(res.error); return }
                setInviteCode(res.code ?? null)
                setCopied(false)
              })
            }}
            disabled={pending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-small font-semibold disabled:opacity-40"
            style={{ background: 'var(--project-accent)', color: 'var(--project-white)' }}
          >
            <UserPlus className="w-4 h-4" /> Code erzeugen
          </button>
          {inviteCode && (
            <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-small font-mono" style={{ background: 'var(--project-light)', color: 'var(--project-accent)' }}>
              {inviteCode}
              <button
                type="button"
                onClick={() => { navigator.clipboard?.writeText(inviteCode); setCopied(true) }}
                title="Kopieren"
                className="p-0.5 rounded hover:opacity-70"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {members.map((m) => {
          // Derived from state to trigger re-render after server refresh
          const tagged = [...new Set(m.teams ?? [])]
          return (
            <div
              key={m.membershipId}
              className="flex items-center gap-3 rounded-xl border px-4 py-3"
              style={{ background: 'var(--project-white)', borderColor: 'color-mix(in srgb, var(--project-general) 20%, transparent)' }}
            >
              <UserCircle className="w-8 h-8 shrink-0" style={{ color: 'var(--project-ink)' }} />
              <div className="flex-1 min-w-0">
                <p className="text-text font-medium truncate" style={{ color: 'var(--project-accent)' }}>
                  {m.name}
                  {m.isSelf && <span className="text-small font-normal ml-2" style={{ color: 'var(--project-ink)' }}>{t('members.you')}</span>}
                </p>
                <p className="text-small truncate" style={{ color: 'var(--project-ink)' }}>{m.email}</p>
              </div>

              <TeamPopover
                member={m}
                teamCatalog={teamCatalog}
                onToggleTeam={(tag: string) => {
                  const wasTagged = tagged.includes(tag)
                  const next = wasTagged ? tagged.filter((t) => t !== tag) : [...tagged, tag]
                  // Leaving the team also drops its leadership.
                  const nextLead = wasTagged ? (m.leadOf ?? []).filter((t) => t !== tag) : (m.leadOf ?? [])
                  run(() => setMemberTeams(slug, locale, m.membershipId, next, nextLead))
                }}
                onToggleLead={(tag: string) => {
                  const wasLead = (m.leadOf ?? []).includes(tag)
                  const nextLead = wasLead ? (m.leadOf ?? []).filter((t) => t !== tag) : [...(m.leadOf ?? []), tag]
                  // Leading implies belonging.
                  const next = tagged.includes(tag) ? tagged : [...tagged, tag]
                  run(() => setMemberTeams(slug, locale, m.membershipId, next, nextLead))
                }}
                disabled={pending}
              />

              <select
                value={m.role}
                disabled={pending}
                onChange={(e) => run(() => updateMemberRole(slug, locale, m.membershipId, e.target.value))}
                className="px-3 py-1.5 rounded-lg border text-small outline-none shrink-0"
                style={{ borderColor: 'color-mix(in srgb, var(--project-general) 30%, transparent)', color: 'var(--project-accent)', background: 'var(--project-white)' }}
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
                    style={{ background: 'var(--project-danger)', color: 'var(--project-danger-on)' }}
                  >
                    {t('members.confirmRemove')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmRemove(null)}
                    disabled={pending}
                    className="px-3 py-1.5 rounded-lg text-small"
                    style={{ color: 'var(--project-ink)' }}
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
                  style={{ color: 'var(--project-danger)' }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}