'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { UserPlus, Check } from 'lucide-react'
import { requestToJoinProject } from '@/actions/join-request'

/** Compact "Beitritt anfragen" button for dashboard non-member project entries. */
export function ProjectJoinButton({ slug, locale }: { slug: string; locale: string }) {
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

  return (
    <div className="flex flex-col gap-1 items-start">
      <button
        type="button"
        onClick={join}
        disabled={pending || sent}
        className="inline-flex items-center gap-2 px-5 py-2.5 text-cta font-normal rounded-lg transition-colors cursor-pointer disabled:opacity-60 text-[var(--plattform-white)] bg-[var(--plattform)] hover:bg-[var(--plattform-accent)]"
      >
        {sent ? <Check className="w-[1em] h-[1em] shrink-0" /> : <UserPlus className="w-[1em] h-[1em] shrink-0" />}
        {sent ? t('joinPending') : t('ctaJoinRequest')}
      </button>
      {error && <span className="text-small" style={{ color: 'var(--color-destructive)' }}>{error}</span>}
    </div>
  )
}