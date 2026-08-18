// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { registerAction } from '@/actions/auth'
import Link from 'next/link'
import { UserPlus, MailCheck } from 'lucide-react'

// Dashboard control rules: borderless grey inputs inside the white panel,
// definition via shadow + accent focus ring (same as the login form).
const inputBase =
  'w-full px-4 h-10 rounded-lg text-small outline-none shadow-sm transition-all duration-200 focus:shadow-md focus:ring-2 bg-[var(--app-light)]'

export function RegisterForm({ loginHref }: { loginHref: string }) {
  const [state, action, pending] = useActionState(registerAction, null)
  const t = useTranslations('auth')

  const ringStyle = { '--tw-ring-color': 'var(--app-accent)', color: 'var(--app-ink)' } as React.CSSProperties
  const labelClass = 'block text-small font-medium mb-1.5'

  // Activation mail sent — replace the form with the "check your inbox" state.
  if (state?.verifySent) {
    return (
      <div className="w-full flex flex-col gap-4">
        <MailCheck className="w-10 h-10" style={{ color: 'var(--app-accent)' }} aria-hidden />
        <div>
          <h1 className="text-display font-bold" style={{ color: 'var(--app-ink-accent)' }}>{t('verifySentTitle')}</h1>
          <p className="text-small mt-1.5 opacity-70" style={{ color: 'var(--app-ink)' }}>{t('verifySentBody')}</p>
        </div>
        <Link href={loginHref} className="text-small transition-colors hover:underline" style={{ color: 'var(--app-accent)' }}>
          {t('login')}
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-display font-bold" style={{ color: 'var(--app-ink-accent)' }}>
          {t('register')}
        </h1>
        <p className="text-small mt-1.5 opacity-70" style={{ color: 'var(--app-ink)' }}>
          {t('registerSubtitle')}
        </p>
      </div>

      <form action={action} className="flex flex-col gap-4">
        {state?.error && (
          <p className="text-small px-4 py-3 rounded-lg text-red-700 bg-red-50">
            {state.error}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="firstName" className={labelClass}>
              {t('firstName')}
            </label>
            <input id="firstName" name="firstName" type="text" required autoComplete="given-name" className={inputBase} style={ringStyle} />
          </div>
          <div>
            <label htmlFor="lastName" className={labelClass}>
              {t('lastName')}
            </label>
            <input id="lastName" name="lastName" type="text" required autoComplete="family-name" className={inputBase} style={ringStyle} />
          </div>
        </div>

        <div>
          <label htmlFor="email" className={labelClass}>
            {t('email')}
          </label>
          <input id="email" name="email" type="email" required autoComplete="email" className={inputBase} style={ringStyle} />
        </div>

        <div>
          <label htmlFor="password" className={labelClass}>
            {t('password')}
          </label>
          <input id="password" name="password" type="password" required autoComplete="new-password" className={inputBase} style={ringStyle} />
        </div>

        <div>
          <label htmlFor="passwordConfirm" className={labelClass}>
            {t('passwordConfirm')}
          </label>
          <input id="passwordConfirm" name="passwordConfirm" type="password" required autoComplete="new-password" className={inputBase} style={ringStyle} />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="mt-2 w-full flex items-center justify-between px-4 h-11 rounded-lg text-small font-semibold transition-colors disabled:opacity-50 cursor-pointer bg-[var(--app-accent)] text-[var(--app-white)] hover:bg-[var(--app-ink-accent)]"
        >
          {pending ? t('registerPending') : t('registerButton')}
          <UserPlus className="w-[1em] h-[1em] shrink-0" aria-hidden />
        </button>
      </form>

      <p className="text-small text-center mt-6" style={{ color: 'var(--app-ink)' }}>
        {t('hasAccount')}{' '}
        <Link
          href={loginHref}
          className="transition-colors hover:underline"
          style={{ color: 'var(--app-accent)' }}
        >
          {t('login')}
        </Link>
      </p>
    </div>
  )
}
