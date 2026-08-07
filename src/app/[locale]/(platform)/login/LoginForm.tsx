'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { loginAction } from '@/actions/auth'
import Link from 'next/link'
import { LogIn, ExternalLink } from 'lucide-react'

// Dashboard control rules: borderless grey inputs inside the white panel,
// definition via shadow + accent focus ring (same as the app dialogs).
const inputBase =
  'w-full px-4 h-10 rounded-lg text-small outline-none shadow-sm transition-all duration-200 focus:shadow-md focus:ring-2 bg-[var(--app-light)]'

export function LoginForm({ registerHref }: { registerHref: string }) {
  const [state, action, pending] = useActionState(loginAction, null)
  const t = useTranslations('auth')
  const openedRef = useRef(false)

  // Login on the public portal: the workspace lives on the app domain — open it
  // in a new tab. If the popup is blocked, navigate this tab instead.
  useEffect(() => {
    if (!state?.appUrl || openedRef.current) return
    openedRef.current = true
    const win = window.open(state.appUrl, '_blank')
    if (!win) window.location.assign(state.appUrl)
  }, [state])

  const ringStyle = { '--tw-ring-color': 'var(--app-accent)', color: 'var(--app-ink)' } as React.CSSProperties
  const labelClass = 'block text-small font-medium mb-1.5'

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-display font-bold" style={{ color: 'var(--app-ink-accent)' }}>
          {t('login')}
        </h1>
        <p className="text-small mt-1.5 opacity-70" style={{ color: 'var(--app-ink)' }}>
          {t('loginSubtitle')}
        </p>
      </div>

      <form action={action} className="flex flex-col gap-4">
        {state?.appUrl && (
          <p
            className="text-small px-4 py-3 rounded-lg"
            style={{ color: 'var(--app-ink-accent)', background: 'var(--app-light)' }}
          >
            {t('workspaceOpened')}{' '}
            <a
              href={state.appUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 underline"
            >
              {t('workspaceOpenLink')}
              <ExternalLink className="w-[0.9em] h-[0.9em] shrink-0" />
            </a>
          </p>
        )}

        {state?.error && (
          <p className="text-small px-4 py-3 rounded-lg text-red-700 bg-red-50">
            {state.error}
          </p>
        )}

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
          <input id="password" name="password" type="password" required autoComplete="current-password" className={inputBase} style={ringStyle} />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="mt-2 w-full flex items-center justify-between px-4 h-11 rounded-lg text-small font-semibold transition-colors disabled:opacity-50 cursor-pointer bg-[var(--app-accent)] text-[var(--app-white)] hover:bg-[var(--app-ink-accent)]"
        >
          {pending ? t('loginPending') : t('loginButton')}
          <LogIn className="w-[1em] h-[1em] shrink-0" aria-hidden />
        </button>
      </form>

      <p className="text-small text-center mt-6" style={{ color: 'var(--app-ink)' }}>
        {t('noAccount')}{' '}
        <Link
          href={registerHref}
          className="transition-colors hover:underline"
          style={{ color: 'var(--app-accent)' }}
        >
          {t('register')}
        </Link>
      </p>
    </div>
  )
}
