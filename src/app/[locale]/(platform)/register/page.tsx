// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import { RegisterForm } from './RegisterForm'
import { DemoLoginPanel } from '../login/DemoLoginPanel'
import { getDemoAccounts, isRegistrationEnabled } from '@/lib/prototype-notice'
import { LogIn } from 'lucide-react'
import { getCitySettings } from '@/lib/instance'
import { getAppVars } from '@/lib/app-theme'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Mail } from 'lucide-react'

/**
 * Registration in the same app-entry dress as the login page: app tokens,
 * the dashboard's h-14 top bar with solid accent border, and the form in a
 * centered dialog-style white panel on the grey app background (bar slides
 * down, panel fades up).
 */
export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const [{ cityName, cityLogoUrl }, t, appVars, registrationOpen] = await Promise.all([
    getCitySettings(),
    getTranslations({ locale, namespace: 'auth' }),
    getAppVars(),
    isRegistrationEnabled(),
  ])
  // Registration off (prototype phase): no form — point at the login page and
  // offer the one-click demo logins right here. registerAction refuses too.
  const demoAccounts = registrationOpen ? [] : await getDemoAccounts(locale)

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--app-light)', color: 'var(--app-ink)', ...appVars }}
    >
      {/* App-style top bar — same metrics as the dashboard header */}
      <div
        className="login-intro-bar sticky top-0 z-30 h-14 flex items-center justify-between px-6 md:px-10 border-b shadow-md"
        style={{ background: 'var(--app-white)', borderColor: 'var(--app-accent)', color: 'var(--app-black)' }}
      >
        <Link href={`/${locale}`} className="font-bold text-text">
          <span className="font-normal">Urban</span><span className="opacity-60">KIT</span>
          <span className="font-normal opacity-50"> – {cityName}</span>
        </Link>
        <Link
          href={`/${locale}/kontakt`}
          className="flex items-center gap-1.5 text-text transition-colors text-[var(--app-ink)] hover:text-[var(--app-accent)]"
        >
          <Mail className="w-[1em] h-[1em] shrink-0" aria-hidden />
          {t('contact')}
        </Link>
      </div>

      {/* Centered dialog-style panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div
          className="login-intro-form w-full max-w-sm rounded-xl p-6 md:p-8 shadow-xl flex flex-col gap-8"
          style={{ background: 'var(--app-white)' }}
        >
          {cityLogoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cityLogoUrl} alt={cityName} className="h-12 w-auto self-start object-contain" />
          )}
          {registrationOpen ? (
            <RegisterForm loginHref={`/${locale}/login`} />
          ) : (
            <>
              <div>
                <h1 className="text-title font-bold mb-2" style={{ color: 'var(--app-ink-accent)' }}>{t('registrationClosedTitle')}</h1>
                <p className="text-text" style={{ color: 'var(--app-ink)' }}>
                  {demoAccounts.length > 0 ? t('registrationClosedBodyDemo') : t('registrationClosedBody')}
                </p>
              </div>
              {demoAccounts.length > 0 && <DemoLoginPanel accounts={demoAccounts} />}
              <Link
                href={`/${locale}/login`}
                className="w-full flex items-center justify-between px-4 h-11 rounded-lg text-small font-semibold transition-colors bg-[var(--app-accent)] text-[var(--app-white)] hover:bg-[var(--app-ink-accent)]"
              >
                {t('registrationClosedCta')}
                <LogIn className="w-[1em] h-[1em] shrink-0" aria-hidden />
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Slim footer line */}
      <p className="h-12 flex items-center justify-center text-small opacity-40">
        © {new Date().getFullYear()} UrbanKIT – {cityName}
      </p>
    </main>
  )
}
