'use client'

import { useId, useState } from 'react'
import { useTranslations } from 'next-intl'

export function InvitationForm() {
  const [code, setCode] = useState('')
  const t = useTranslations('starten')
  const inputId = useId()

  return (
    <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
      {/* Visible context lives in the surrounding copy — the field still needs
          its own programmatic label (placeholder ≠ label, WCAG 3.3.2). */}
      <label htmlFor={inputId} className="sr-only">
        {t('codePlaceholder')}
      </label>
      <input
        id={inputId}
        type="text"
        name="invitationCode"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder={t('codePlaceholder')}
        className="flex-1 px-4 py-3 rounded-lg border text-text font-normal bg-[var(--plattform-white)] focus:outline-none focus:ring-2 focus:ring-[var(--plattform)]"
        style={{ color: 'var(--plattform-ink)' }}
      />
      <button
        type="submit"
        className="px-5 py-3 rounded-lg text-cta font-normal text-[var(--plattform-white)] transition-colors bg-[var(--plattform)] hover:bg-[var(--plattform-accent)] shrink-0"
      >
        {t('redeem')}
      </button>
    </form>
  )
}
