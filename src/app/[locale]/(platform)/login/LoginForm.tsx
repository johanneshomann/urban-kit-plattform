'use client'

import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { loginAction } from '@/actions/auth'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { LogIn } from 'lucide-react'

export function LoginForm({ registerHref }: { registerHref: string }) {
  const [state, action, pending] = useActionState(loginAction, null)
  const t = useTranslations('auth')

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
