'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { UserPlus, Clock, Check } from 'lucide-react'
import { requestToJoinProject } from '@/actions/join-request'

/**
 * Public project page join CTA. Logged out → register page. Logged in →
 * confirm dialog, then the join-request server action. `membershipStatus`
 * is the visitor's membership state, resolved server-side (null = none).
 */
export function JoinRequestButton({
  slug,
  locale,
  isLoggedIn,
  membershipStatus,
}: {
  slug: string
  locale: string
  isLoggedIn: boolean
  membershipStatus: 'requested' | 'active' | 'rejected' | null
}) {
  const router = useRouter()
  const t = useTranslations('projectDetail')
  const [open, setOpen] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  // Already a member — nothing to request.
  if (membershipStatus === 'active') return null

  if (membershipStatus === 'requested' || sent) {
    return (
      <span className="inline-flex items-center gap-2 px-6 py-3 text-cta font-normal rounded-lg text-white bg-[var(--plattform)]">
        {sent ? <Check className="w-[1em] h-[1em] shrink-0" /> : <Clock className="w-[1em] h-[1em] shrink-0" />}
        {t('joinPending')}
      </span>
    )
  }

  const confirm = () => {
    setError(null)
    startTransition(async () => {
      const res = await requestToJoinProject(slug, locale)
      if (res.error) { setError(res.error); return }
      setSent(true)
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => (isLoggedIn ? setOpen(true) : router.push(`/${locale}/register`))}
        className="inline-flex items-center gap-2 px-6 py-3 text-cta font-normal rounded-lg transition-colors cursor-pointer text-white bg-[var(--plattform)] hover:bg-[var(--plattform-accent)]"
      >
        {t('ctaJoinRequest')}
        <UserPlus className="w-[1em] h-[1em] shrink-0" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40"
          onClick={() => { if (!pending) setOpen(false) }}
          role="dialog"
          aria-modal="true"
          aria-label={t('joinConfirmTitle')}
        >
          <div
            className="popover-in bg-white rounded-xl shadow-lg p-8 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-display font-black tracking-tight mb-3" style={{ color: 'var(--plattform-ink-accent)' }}>
              {t('joinConfirmTitle')}
            </h3>
            <p className="text-text leading-relaxed mb-6" style={{ color: 'var(--plattform-ink)' }}>
              {t('joinConfirmBody')}
            </p>
            {error && (
              <p className="text-small mb-4" style={{ color: '#b91c1c' }}>{error}</p>
            )}
            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="px-5 py-2.5 text-cta font-normal rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                style={{ background: 'var(--plattform-light)', color: 'var(--plattform-ink)' }}
              >
                {t('joinConfirmCancel')}
              </button>
              <button
                type="button"
                onClick={confirm}
                disabled={pending}
                className="px-5 py-2.5 text-cta font-normal rounded-lg transition-colors cursor-pointer text-white bg-[var(--plattform)] hover:bg-[var(--plattform-accent)] disabled:opacity-40"
              >
                {pending ? t('joinConfirmSending') : t('joinConfirmSubmit')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
