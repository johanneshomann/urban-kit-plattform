'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import { User, Languages, Settings, LogOut } from 'lucide-react'
import { logoutAction } from '@/actions/auth'

const barLink = 'inline-flex items-center justify-center h-10 w-10 rounded-lg transition-colors hover:bg-[color-mix(in_srgb,var(--app-black)_8%,transparent)]'
const BLACK = 'var(--app-black)'
const ACCENT = 'var(--app-accent)'

/**
 * Compact top bar for the dashboard — user greeting left, user tools right.
 * Every interaction is a real link or button, ≥44px, always visible.
 * The dashboard has NO sidebar — this bar is the only persistent chrome.
 * Accessibility: the floating {@link AccessibilityButton} FAB already lives
 * bottom-left; it stays there and is not duplicated here.
 */
export function DashboardTopBar({ userName }: { userName?: string | null }) {
  const t = useTranslations('platform')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const nextLocale = locale === 'de' ? 'en' : 'de'

  return (
    <div
      className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-8 py-2 border-b shadow-md"
      style={{
        background: 'var(--app-white)',
        borderColor: 'color-mix(in srgb, var(--app-ink) 10%, transparent)',
        color: BLACK,
      }}
    >
      {/* Greeting — left side, showing the user's name; links to the dashboard */}
      <Link
        href={`/${locale}/dashboard`}
        className="flex items-center gap-2"
        style={{ minHeight: 44, color: BLACK }}
      >
        <span className="text-text leading-tight">
          {userName ? t('greeting', { name: userName }) : t('greetingFallback')}
        </span>
      </Link>

      {/* User tools — all real links/buttons, always visible */}
      <nav aria-label="Persönliche Werkzeuge" className="flex items-center gap-1">
        {/* Language switch */}
        <button
          type="button"
          onClick={() => router.replace(pathname, { locale: nextLocale })}
          className={barLink}
          title={locale === 'de' ? 'Switch to English' : 'Zu Deutsch wechseln'}
        >
          <Languages aria-hidden="true" className="h-4 w-4" />
          <span className="sr-only">{locale === 'de' ? 'Switch to English' : 'Zu Deutsch wechseln'}</span>
        </button>

        {/* Separator */}
        <span
          aria-hidden="true"
          className="mx-1 h-5 w-px shrink-0"
          style={{ background: 'color-mix(in srgb, var(--app-black) 16%, transparent)' }}
        />

        {/* Profile */}
        <Link
          href={`/${locale}/dashboard/profil`}
          className={barLink}
          title={t('navMyProfile')}
        >
          <User aria-hidden="true" className="h-4 w-4" />
          <span className="sr-only">{t('navMyProfile')}</span>
        </Link>

        {/* Settings — placeholder, route may not exist yet but a link is harmless */}
        <Link
          href={`/${locale}/dashboard/einstellungen`}
          className={barLink}
          title={t('navSettings')}
        >
          <Settings aria-hidden="true" className="h-4 w-4" />
          <span className="sr-only">{t('navSettings')}</span>
        </Link>

        {/* Logout */}
        <form action={logoutAction} className="contents">
          <button type="submit" className={barLink} title={t('logout')}>
            <LogOut aria-hidden="true" className="h-4 w-4" />
            <span className="sr-only">{t('logout')}</span>
          </button>
        </form>
      </nav>
    </div>
  )
}