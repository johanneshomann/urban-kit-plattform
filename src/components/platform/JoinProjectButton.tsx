'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { UserPlus, Clock, X } from 'lucide-react'
import { requestToJoinProject, cancelJoinRequest } from '@/actions/join-request'

const pill = 'flex items-center gap-1.5 text-small font-medium'
const pillStyle: React.CSSProperties = {
  color: 'var(--project-accent)',
  background: 'color-mix(in srgb, var(--project-accent) 12%, transparent)',
  border: '1.5px solid color-mix(in srgb, var(--project-accent) 30%, transparent)',
  padding: '0.3em 0.75em',
  borderRadius: '999px',
}

/**
 * Title-row pill for non-members: request to join, see the pending state,
 * withdraw. `status` is the user's membership status (null = none).
 */
export function JoinProjectButton({ slug, locale, status }: { slug: string; locale: string; status: 'requested' | 'rejected' | null }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const t = useTranslations('projectWorkspace')

  const run = (fn: () => Promise<{ error?: string; ok?: boolean }>) => {
    setError(null)
    startTransition(async () => {
      const res = await fn()
      if (res.error) { setError(res.error); return }
      router.refresh()
    })
  }

  if (status === 'requested') {
    return (
      <>
        <span className={pill} style={pillStyle}>
          <Clock className="w-[0.9em] h-[0.9em] shrink-0" />
          {t('joinPending')}
        </span>
        <button
          type="button"
          onClick={() => run(() => cancelJoinRequest(slug, locale))}
          disabled={pending}
          title={t('joinWithdrawTitle')}
          className={`${pill} cursor-pointer transition-colors hover:bg-[var(--project-accent)] hover:text-[var(--project-white)] disabled:opacity-40`}
          style={pillStyle}
        >
          <X className="w-[0.9em] h-[0.9em] shrink-0" />
          {t('joinWithdraw')}
        </button>
        {error && <span className="text-small" style={{ color: '#b91c1c' }}>{error}</span>}
      </>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => run(() => requestToJoinProject(slug, locale))}
        disabled={pending}
        className={`${pill} cursor-pointer transition-colors hover:bg-[var(--project-accent)] hover:text-[var(--project-white)] disabled:opacity-40`}
        style={pillStyle}
      >
        <UserPlus className="w-[0.9em] h-[0.9em] shrink-0" />
        {pending ? t('joinSending') : t('join')}
      </button>
      {error && <span className="text-small" style={{ color: '#b91c1c' }}>{error}</span>}
    </>
  )
}
