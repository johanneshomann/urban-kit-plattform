// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import { getPayload } from 'payload'
import config from '@payload-config'
import { getCitySettings } from '@/lib/instance'
import { getAppVars } from '@/lib/app-theme'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { CheckCircle2, XCircle, LogIn } from 'lucide-react'

/**
 * Landing page for the activation mail: verifies the token server-side and
 * shows the result in the app-entry dress (same panel style as login).
 */
export default async function VerifyEmailPage({ params }: { params: Promise<{ locale: string; token: string }> }) {
  const { locale, token } = await params
  const [{ cityName }, t, appVars, payload] = await Promise.all([
    getCitySettings(),
    getTranslations({ locale, namespace: 'auth' }),
    getAppVars(),
    getPayload({ config }),
  ])

  // Invalid/expired/reused tokens throw — that's the failure state.
  const ok = await payload
    .verifyEmail({ collection: 'users', token })
    .then(() => true)
    .catch(() => false)

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--app-light)', color: 'var(--app-ink)', ...appVars }}
    >
      {/* App-style top bar — same metrics as the login page */}
      <div
        className="sticky top-0 z-30 h-14 flex items-center px-6 md:px-10 border-b shadow-md"
        style={{ background: 'var(--app-white)', borderColor: 'var(--app-accent)', color: 'var(--app-black)' }}
      >
        <Link href={`/${locale}`} className="font-bold text-text">
          <span className="font-normal">Urban</span><span className="opacity-60">KIT</span>
          <span className="font-normal opacity-50"> – {cityName}</span>
        </Link>
      </div>

      {/* Centered dialog-style panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div
          className="w-full max-w-sm rounded-xl p-6 md:p-8 shadow-xl flex flex-col gap-5"
          style={{ background: 'var(--app-white)' }}
        >
          {ok ? (
            <>
              <CheckCircle2 className="w-10 h-10" style={{ color: 'var(--app-accent)' }} aria-hidden />
              <div>
                <h1 className="text-display font-bold" style={{ color: 'var(--app-ink-accent)' }}>{t('verifiedTitle')}</h1>
                <p className="text-small mt-1.5 opacity-70" style={{ color: 'var(--app-ink)' }}>{t('verifiedBody')}</p>
              </div>
              <Link
                href={`/${locale}/login`}
                className="w-full flex items-center justify-between px-4 h-11 rounded-lg text-small font-semibold transition-colors cursor-pointer bg-[var(--app-accent)] text-[var(--app-white)] hover:bg-[var(--app-ink-accent)]"
              >
                {t('verifiedLogin')}
                <LogIn className="w-[1em] h-[1em] shrink-0" aria-hidden />
              </Link>
            </>
          ) : (
            <>
              <XCircle className="w-10 h-10 text-red-600" aria-hidden />
              <div>
                <h1 className="text-display font-bold" style={{ color: 'var(--app-ink-accent)' }}>{t('verifyFailedTitle')}</h1>
                <p className="text-small mt-1.5 opacity-70" style={{ color: 'var(--app-ink)' }}>{t('verifyFailedBody')}</p>
              </div>
              <Link
                href={`/${locale}/login`}
                className="text-small transition-colors hover:underline"
                style={{ color: 'var(--app-accent)' }}
              >
                {t('login')}
              </Link>
            </>
          )}
        </div>
      </div>

      <p className="h-12 flex items-center justify-center text-small opacity-40">
        © {new Date().getFullYear()} UrbanKIT – {cityName}
      </p>
    </main>
  )
}
