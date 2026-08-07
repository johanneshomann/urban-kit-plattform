'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { UserPlus, Check, Ban } from 'lucide-react'
import { requestToJoinProject } from '@/actions/join-request'

/**
 * Compact "Beitritt anfragen" button for dashboard non-member project entries.
 * `requestPending` is the server truth (an open `requested` membership exists),
 * so the pending state survives reloads; `joinEnabled` mirrors the project's
 * joinRequestsEnabled flag and swaps the button for a muted note when off.
 */
export function ProjectJoinButton({
  slug,
  locale,
  requestPending = false,
  joinEnabled = true,
}: {
  slug: string
  locale: string
  requestPending?: boolean
  joinEnabled?: boolean
}) {
  const t = useTranslations('projectDetail')
  const router = useRouter()
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const join = () => {
    setError(null)
    startTransition(async () => {
      const res = await requestToJoinProject(slug, locale)
      if (res.error) { setError(res.error); return }
      setSent(true)
      router.refresh()
    })
  }

  if (!joinEnabled && !requestPending) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-3 h-11 rounded-lg text-small"
        style={{ color: 'var(--app-ink)', opacity: 0.5 }}
      >
        <Ban aria-hidden className="w-[1em] h-[1em] shrink-0" />
        {t('joinDisabled')}
      </span>
    )
  }

  if (requestPending || sent) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-3 h-11 rounded-lg text-small font-medium bg-[color-mix(in_srgb,var(--app-accent)_12%,transparent)]"
        style={{ color: 'var(--app-ink-accent)' }}
      >
        <Check aria-hidden className="w-[1em] h-[1em] shrink-0" style={{ color: 'var(--app-accent)' }} />
        {t('joinPending')}
      </span>
    )
  }

  return (
    <div className="flex flex-col gap-1 items-start">
      <button
        type="button"
        onClick={join}
        disabled={pending}
        className="inline-flex items-center gap-2 px-4 h-11 text-small font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-60 text-[var(--app-white)] bg-[var(--app-accent)] hover:bg-[var(--app-ink-accent)]"
      >
        <UserPlus className="w-[1em] h-[1em] shrink-0" />
        {t('ctaJoinRequest')}
      </button>
      {error && <span className="text-small" style={{ color: 'var(--color-destructive)' }}>{error}</span>}
    </div>
  )
}
