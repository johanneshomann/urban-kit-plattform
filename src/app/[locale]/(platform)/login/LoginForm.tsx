'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { loginAction } from '@/actions/auth'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { LogIn, ExternalLink } from 'lucide-react'

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

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8">
        <h1 className="text-display font-bold" style={{ color: 'var(--plattform-ink-accent)' }}>
          {t('login')}
        </h1>
        <p className="text-small mt-1.5" style={{ color: 'var(--plattform-ink)' }}>
          {t('loginSubtitle')}
        </p>
      </div>

      <form action={action} className="flex flex-col gap-5">
        {state?.appUrl && (
          <p
            className="text-small px-4 py-3 rounded-lg"
            style={{ color: 'var(--plattform-ink-accent)', background: 'var(--plattform-light)' }}
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
          <p
            className="text-small px-4 py-3 rounded-lg"
            style={{ color: 'var(--plattform-ink-accent)', background: 'var(--plattform-light)' }}
          >
            {state.error}
          </p>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-small" style={{ color: 'var(--plattform-ink-accent)' }}>
            {t('email')}
          </label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-small" style={{ color: 'var(--plattform-ink-accent)' }}>
            {t('password')}
          </label>
          <Input id="password" name="password" type="password" required autoComplete="current-password" />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="mt-1 w-full flex items-center justify-between px-5 py-3 rounded-lg text-cta font-normal text-white transition-colors disabled:opacity-50 bg-[var(--plattform)] hover:bg-[var(--plattform-accent)]"
        >
          {pending ? t('loginPending') : t('loginButton')}
          <LogIn className="w-[1em] h-[1em] shrink-0" />
        </button>
      </form>

      <p className="text-small text-center mt-8" style={{ color: 'var(--plattform-ink)' }}>
        {t('noAccount')}{' '}
        <Link
          href={registerHref}
          className="transition-colors hover:underline"
          style={{ color: 'var(--plattform)' }}
        >
          {t('register')}
        </Link>
      </p>
    </div>
  )
}
