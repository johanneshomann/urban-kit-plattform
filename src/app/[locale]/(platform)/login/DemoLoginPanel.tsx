// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { FlaskConical, LogIn } from 'lucide-react'
import { demoLoginAction } from '@/actions/auth'
import type { DemoAccount } from '@/lib/prototype-notice'

/**
 * Prototype test accounts above the login form: title, one-line intro and a
 * one-click login button per account — nothing else, the panel must stay
 * short. Rendered only while the prototype notice is on and validated demo
 * users exist.
 */
export function DemoLoginPanel({ accounts }: { accounts: DemoAccount[] }) {
  const [state, action, pending] = useActionState(demoLoginAction, null)
  const t = useTranslations('auth')
  const openedRef = useRef(false)

  // Same portal behaviour as the regular login: the workspace opens in a new tab.
  useEffect(() => {
    if (!state?.appUrl || openedRef.current) return
    openedRef.current = true
    const win = window.open(state.appUrl, '_blank')
    if (!win) window.location.assign(state.appUrl)
  }, [state])

  return (
    <section
      aria-labelledby="demo-login-title"
      className="rounded-xl p-4 flex flex-col gap-3"
      style={{ background: 'var(--app-light)', color: 'var(--app-ink)' }}
    >
      <div className="flex items-start gap-2">
        <FlaskConical className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--app-accent)' }} aria-hidden />
        <div>
          <h2 id="demo-login-title" className="text-small font-bold" style={{ color: 'var(--app-ink-accent)' }}>
            {t('demoTitle')}
          </h2>
          <p className="text-small mt-0.5">{t('demoIntro')}</p>
        </div>
      </div>

      {state?.error && (
        <p className="text-small px-3 py-2 rounded-lg" style={{ color: 'var(--project-danger)', background: 'var(--project-danger-surface)' }}>
          {state.error}
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {accounts.map((a) => (
          <li key={a.email}>
            {/* Just the button — the account description rides along as tooltip,
                credentials stay out of the panel (one-click covers the login). */}
            <form action={action}>
              <input type="hidden" name="email" value={a.email} />
              <button
                type="submit"
                disabled={pending}
                title={a.description ?? undefined}
                className="w-full flex items-center justify-between px-3 h-10 rounded-lg text-small font-semibold transition-colors disabled:opacity-50 cursor-pointer bg-[var(--app-accent)] text-[var(--app-white)] hover:bg-[var(--app-ink-accent)]"
              >
                {pending ? t('demoPending') : t('demoLoginAs', { label: a.label })}
                <LogIn className="w-[1em] h-[1em] shrink-0" aria-hidden />
              </button>
            </form>
          </li>
        ))}
      </ul>
    </section>
  )
}
