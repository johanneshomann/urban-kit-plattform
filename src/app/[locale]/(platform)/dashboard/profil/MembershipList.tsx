'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { FolderKanban, LogOut } from 'lucide-react'
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

/**
 * The user's active project memberships as project-colored rows (activity-feed
 * style) with a leave action. PMs see their role instead of the leave button —
 * they cannot abandon their own project (see leaveProject action).
 */
export function MembershipList({ items }: { items: MembershipItem[] }) {
  const t = useTranslations('profile')
  const td = useTranslations('dashboard')
  const tc = useTranslations('common')
  const router = useRouter()
  const [confirmItem, setConfirmItem] = useState<MembershipItem | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  if (items.length === 0) return null

  const roleLabel = (role: string) => (role === 'PM' ? td('rolePM') : td('roleCitizen'))

  const confirmLeave = (item: MembershipItem) => {
    setError(null)
    startTransition(async () => {
      const res = await leaveProject(item.membershipId)
      if (res.error) {
        setError(res.error)
      } else {
        setConfirmItem(null)
        router.refresh()
      }
    })
  }

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-small font-semibold opacity-50">{t('memberships')}</h2>
        <div aria-hidden className="h-px mt-2" style={{ background: 'color-mix(in srgb, var(--app-ink) 12%, transparent)' }} />
        <p className="text-small opacity-50 mt-2">{t('membershipsHint')}</p>
      </div>

      <ul className="flex flex-col gap-2" role="list">
        {items.map((item) => (
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
                  {roleLabel(item.role)}
                </p>
              </div>

              {item.role !== 'PM' && (
                <IconTooltip label={t('leaveProject')}>
                  <button
                    type="button"
                    onClick={() => { setError(null); setConfirmItem(item) }}
                    className="inline-flex items-center justify-center h-10 w-10 shrink-0 rounded-lg cursor-pointer"
                    style={{
                      background: item.schemeGeneral,
                      color: item.schemeAccent,
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = item.schemeDark }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = item.schemeGeneral }}
                    aria-label={`${item.title} – ${t('leaveProject')}`}
                  >
                    <LogOut className="h-5 w-5" aria-hidden />
                  </button>
                </IconTooltip>
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* Confirmation — same pattern as the logout dialog */}
      {confirmItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[color-mix(in_srgb,var(--app-black)_45%,transparent)] backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget && !pending) setConfirmItem(null)
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="leave-confirm-title"
            className="popover-in w-full max-w-sm rounded-xl p-6 shadow-xl"
            style={{ background: 'var(--app-white)', color: 'var(--app-ink)' }}
          >
            <h2 id="leave-confirm-title" className="text-display font-bold mb-2" style={{ color: 'var(--app-ink-accent)' }}>
              {t('leaveConfirmTitle', { title: confirmItem.title })}
            </h2>
            <p className="text-small opacity-70 mb-5">{t('leaveConfirmBody')}</p>
            {error && <p className="text-small text-red-700 mb-4">{error}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmItem(null)}
                disabled={pending}
                className="px-4 h-10 rounded-lg text-small font-medium bg-[var(--app-light)] transition-colors hover:bg-[color-mix(in_srgb,var(--app-ink)_8%,var(--app-light))] disabled:opacity-50 cursor-pointer"
                style={{ color: 'var(--app-ink)' }}
              >
                {tc('cancel')}
              </button>
              <button
                type="button"
                onClick={() => confirmLeave(confirmItem)}
                disabled={pending}
                className="px-4 h-10 rounded-lg text-small font-semibold bg-[var(--app-accent)] text-[var(--app-white)] transition-colors hover:bg-[var(--app-ink-accent)] disabled:opacity-50 cursor-pointer"
              >
                {pending ? t('leaving') : t('leaveProject')}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
