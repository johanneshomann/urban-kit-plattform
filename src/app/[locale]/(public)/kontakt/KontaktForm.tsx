'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Send } from 'lucide-react'

export function KontaktForm() {
  const [sent, setSent] = useState(false)
  const t = useTranslations('kontakt')
  const baseId = useId()
  const sentRef = useRef<HTMLDivElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSent(true)
  }

  // The form is replaced by the confirmation — move focus there so screen
  // readers announce the outcome instead of losing focus silently.
  useEffect(() => {
    if (sent) sentRef.current?.focus()
  }, [sent])

  if (sent) {
    return (
      <div ref={sentRef} tabIndex={-1} role="status" className="rounded-xl p-7 flex flex-col gap-3 shadow-xs hover:shadow-md transition-all" style={{ background: 'var(--plattform-light)' }}>
        <p className="text-display font-black tracking-tight" style={{ color: 'var(--plattform)' }}>
          {t.rich('sentTitle', { accent: (chunks) => <span style={{ color: 'var(--plattform)' }}>{chunks}</span> })}
        </p>
        <p className="text-text" style={{ color: 'var(--plattform-ink)' }}>
          {t('sentBody')}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl p-7 flex flex-col gap-4 shadow-xs hover:shadow-md transition-all" style={{ background: 'var(--plattform-light)' }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${baseId}-name`} className="text-small uppercase tracking-widest font-black" style={{ color: 'var(--plattform-ink)' }}>
            {t('formName')}
          </label>
          <input
            id={`${baseId}-name`}
            name="name"
            autoComplete="name"
            type="text"
            placeholder={t('formNamePlaceholder')}
            required
            className="rounded-lg border px-3 py-2 text-text outline-none focus:ring-2 transition-all"
            style={{ color: 'var(--plattform-ink-accent)', '--tw-ring-color': 'var(--plattform)' } as React.CSSProperties}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${baseId}-email`} className="text-small uppercase tracking-widest font-black" style={{ color: 'var(--plattform-ink)' }}>
            {t('formEmail')}
          </label>
          <input
            id={`${baseId}-email`}
            name="email"
            autoComplete="email"
            type="email"
            placeholder={t('formEmailPlaceholder')}
            required
            className="rounded-lg border px-3 py-2 text-text outline-none focus:ring-2 transition-all"
            style={{ color: 'var(--plattform-ink-accent)', '--tw-ring-color': 'var(--plattform)' } as React.CSSProperties}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${baseId}-subject`} className="text-small uppercase tracking-widest font-black" style={{ color: 'var(--plattform-ink)' }}>
          {t('formSubject')}
        </label>
        <input
          id={`${baseId}-subject`}
          name="subject"
          type="text"
          placeholder={t('formSubjectPlaceholder')}
          required
          className="rounded-lg border px-3 py-2 text-text outline-none focus:ring-2 transition-all"
          style={{ color: 'var(--plattform-ink-accent)', '--tw-ring-color': 'var(--plattform)' } as React.CSSProperties}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${baseId}-message`} className="text-small uppercase tracking-widest font-black" style={{ color: 'var(--plattform-ink)' }}>
          {t('formMessage')}
        </label>
        <textarea
          id={`${baseId}-message`}
          name="message"
          rows={5}
          placeholder={t('formMessagePlaceholder')}
          required
          className="rounded-lg border px-3 py-2 text-text outline-none focus:ring-2 transition-all resize-none"
          style={{ color: 'var(--plattform-ink-accent)', '--tw-ring-color': 'var(--plattform)' } as React.CSSProperties}
        />
      </div>

      <div className="flex">
        <button
          type="submit"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-lg text-cta font-black transition-all"
          style={{ background: 'var(--plattform)', color: 'var(--plattform-white)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--plattform-accent)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--plattform)')}
        >
          <Send className="w-[1em] h-[1em] shrink-0" />
          {t('formSubmit')}
        </button>
      </div>
    </form>
  )
}
