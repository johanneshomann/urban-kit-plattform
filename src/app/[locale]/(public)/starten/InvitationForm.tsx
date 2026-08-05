'use client'

import { useId, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Check } from 'lucide-react'
import { redeemInvite } from '@/actions/invite'

export function InvitationForm({ locale }: { locale: string }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const t = useTranslations('starten')
  const inputId = useId()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return
    setError(null)
    startTransition(async () => {
      const res = await redeemInvite(code, locale)
      if (res.error) { setError(res.error); return }
      setDone(true)
      setCode('')
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <form className="flex gap-2" onSubmit={submit}>
        <label htmlFor={inputId} className="sr-only">
          {t('codePlaceholder')}
        </label>
        <input
          id={inputId}
          type="text"
          name="invitationCode"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          disabled={pending || done}
          placeholder={t('codePlaceholder')}
          className="flex-1 px-4 py-3 rounded-lg border text-text font-normal bg-[var(--plattform-white)] focus:outline-none focus:ring-2 focus:ring-[var(--plattform)] disabled:opacity-60"
          style={{ color: 'var(--plattform-ink)' }}
        />
        <button
          type="submit"
          disabled={pending || done || !code.trim()}
          className="px-5 py-3 rounded-lg text-cta font-normal text-[var(--plattform-white)] transition-colors bg-[var(--plattform)] hover:bg-[var(--plattform-accent)] shrink-0 disabled:opacity-50"
        >
          {t('redeem')}
        </button>
      </form>

      {error && (
        <p className="text-small font-semibold" style={{ color: 'var(--color-destructive)' }}>{error}</p>
      )}
      {done && (
        <p className="flex items-center gap-1.5 text-small font-semibold" style={{ color: 'var(--plattform)' }}>
          <Check className="w-4 h-4" /> {t('invRedeemed')}
        </p>
      )}
    </div>
  )
}