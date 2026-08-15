// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { FolderKanban, LogOut, X } from 'lucide-react'
import { leaveProject } from '@/actions/leave-project'
import { IconTooltip } from '@/components/platform/IconTooltip'

export type MembershipItem = {
  membershipId: string
  title: string
  role: string
  schemeLight: string
  schemeGeneral: string
  schemeAccent: string
  schemeDark: string
}

function SectionHeader({ label, hint }: { label: string; hint?: string }) {
  return (
    <div>
      <h2 className="text-small font-semibold opacity-50">{label}</h2>
      <div aria-hidden className="h-px mt-2" style={{ background: 'color-mix(in srgb, var(--app-ink) 12%, transparent)' }} />
      {hint && <p className="text-small opacity-50 mt-2">{hint}</p>}
    </div>
  )
}

/**
 * The user's active project memberships plus their pending join requests as
 * project-colored rows (activity-feed style). Members can leave a project,
 * requesters can withdraw a request — both via the same confirm dialog and
 * the same leaveProject action (a request is just a `requested` membership).
 * PMs see their role instead of the leave button — they cannot abandon their
 * own project.
 */
export function MembershipList({ items, requests }: { items: MembershipItem[]; requests: MembershipItem[] }) {
  const t = useTranslations('profile')
  const td = useTranslations('dashboard')
  const tc = useTranslations('common')
  const router = useRouter()
  const [confirm, setConfirm] = useState<{ item: MembershipItem; kind: 'leave' | 'withdraw' } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  if (items.length === 0 && requests.length === 0) return null

  const roleLabel = (role: string) => (role === 'PM' ? td('rolePM') : td('roleCitizen'))

  const runConfirm = (item: MembershipItem) => {
    setError(null)
    startTransition(async () => {
      const res = await leaveProject(item.membershipId)
      if (res.error) {
        setError(res.error)
      } else {
        setConfirm(null)
        router.refresh()
      }
    })
  }

  const row = (item: MembershipItem, subline: string, action: React.ReactNode) => (
    <li key={item.membershipId}>
      <div
        className="flex items-center justify-between rounded-lg shadow-sm px-3 py-2 gap-3"
        style={{ background: item.schemeLight }}
      >
        <div className="min-w-0">
          <p className="text-text font-medium leading-snug flex items-center gap-2" style={{ color: 'var(--app-ink-accent)' }}>
            <FolderKanban aria-hidden className="h-4 w-4 shrink-0" style={{ color: item.schemeAccent }} />
            <span className="min-w-0">{item.title}</span>
          </p>
          <p className="text-small mt-0.5" style={{ color: 'var(--app-ink)', opacity: 0.6 }}>
            {subline}
          </p>
        </div>
        {action}
      </div>
    </li>
  )

  const actionButton = (item: MembershipItem, label: string, kind: 'leave' | 'withdraw', icon: React.ReactNode) => (
    <IconTooltip label={label}>
      <button
        type="button"
        onClick={() => { setError(null); setConfirm({ item, kind }) }}
        className="inline-flex items-center justify-center h-10 w-10 shrink-0 rounded-lg cursor-pointer"
        style={{
          background: item.schemeGeneral,
          color: item.schemeAccent,
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = item.schemeDark }}
        onMouseLeave={(e) => { e.currentTarget.style.background = item.schemeGeneral }}
        aria-label={`${item.title} – ${label}`}
      >
        {icon}
      </button>
    </IconTooltip>
  )

  return (
    <div className="flex flex-col gap-8">
      {items.length > 0 && (
        <section className="flex flex-col gap-4">
          <SectionHeader label={t('memberships')} hint={t('membershipsHint')} />
          <ul className="flex flex-col gap-2" role="list">
            {items.map((item) =>
              row(
                item,
                roleLabel(item.role),
                item.role !== 'PM'
                  ? actionButton(item, t('leaveProject'), 'leave', <LogOut className="h-5 w-5" aria-hidden />)
                  : null,
              ),
            )}
          </ul>
        </section>
      )}

      {requests.length > 0 && (
        <section className="flex flex-col gap-4">
          <SectionHeader label={t('requestsTitle')} hint={t('requestsHint')} />
          <ul className="flex flex-col gap-2" role="list">
            {requests.map((item) =>
              row(
                item,
                t('requestPending'),
                actionButton(item, t('withdrawRequest'), 'withdraw', <X className="h-5 w-5" aria-hidden />),
              ),
            )}
          </ul>
        </section>
      )}

      {/* Confirmation — portalled to <body> so the transition wrapper's
          retained transform can't hijack the fixed positioning. */}
      {confirm &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[color-mix(in_srgb,var(--app-black)_45%,transparent)] backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget && !pending) setConfirm(null)
            }}
          >
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="membership-confirm-title"
              className="popover-in w-full max-w-sm rounded-xl p-6 shadow-xl"
              style={{ background: 'var(--app-white)', color: 'var(--app-ink)' }}
            >
              <h2 id="membership-confirm-title" className="text-display font-bold mb-2" style={{ color: 'var(--app-ink-accent)' }}>
                {confirm.kind === 'leave'
                  ? t('leaveConfirmTitle', { title: confirm.item.title })
                  : t('withdrawConfirmTitle', { title: confirm.item.title })}
              </h2>
              <p className="text-small opacity-70 mb-5">
                {confirm.kind === 'leave' ? t('leaveConfirmBody') : t('withdrawConfirmBody')}
              </p>
              {error && <p className="text-small text-red-700 mb-4">{error}</p>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirm(null)}
                  disabled={pending}
                  className="px-4 h-10 rounded-lg text-small font-medium bg-[var(--app-light)] transition-colors hover:bg-[color-mix(in_srgb,var(--app-ink)_8%,var(--app-light))] disabled:opacity-50 cursor-pointer"
                  style={{ color: 'var(--app-ink)' }}
                >
                  {tc('cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => runConfirm(confirm.item)}
                  disabled={pending}
                  className="px-4 h-10 rounded-lg text-small font-semibold bg-[var(--app-accent)] text-[var(--app-white)] transition-colors hover:bg-[var(--app-ink-accent)] disabled:opacity-50 cursor-pointer"
                >
                  {pending
                    ? t('leaving')
                    : confirm.kind === 'leave'
                      ? t('leaveProject')
                      : t('withdrawRequest')}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
