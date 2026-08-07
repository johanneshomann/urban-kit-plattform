'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import { User, Globe, LogOut } from 'lucide-react'
import { logoutAction } from '@/actions/auth'
import { AccessibilityMenu } from '@/components/accessibility/AccessibilityMenu'
import { useDashboardExit, isPlainLeftClick } from '@/components/platform/DashboardTransition'

const barLink = 'inline-flex items-center justify-center h-10 w-10 rounded-lg transition-colors hover:bg-[color-mix(in_srgb,var(--app-black)_8%,transparent)] cursor-pointer'
const BLACK = 'var(--app-black)'

/**
 * Compact top bar for the dashboard — user greeting left, user tools right:
 * Globe (public portal, new tab) · DE/EN · accessibility dropdown · divider ·
 * profile · logout (with confirmation). The dashboard has NO sidebar — this
 * bar is the only persistent chrome; inside the platform area it also hosts
 * the accessibility settings (the floating FAB is hidden here).
 */
export function DashboardTopBar({ userName }: { userName?: string | null }) {
  const t = useTranslations('platform')
  const tc = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const exitNavigate = useDashboardExit()
  const nextLocale = locale === 'de' ? 'en' : 'de'
  const langLabel = locale === 'de' ? 'Switch to English' : 'Zu Deutsch wechseln'

  const [confirmOpen, setConfirmOpen] = useState(false)
  const confirmRef = useRef<HTMLButtonElement>(null)

  // Logout dialog: focus the confirm button on open, close on Escape.
  useEffect(() => {
    if (!confirmOpen) return
    confirmRef.current?.focus()
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setConfirmOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [confirmOpen])

  const profileHref = `/${locale}/dashboard/profil`

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
      <nav aria-label={t('personalTools')} className="flex items-center gap-1">
        {/* Public portal — new tab */}
        <a
          href={`/${locale}`}
          target="_blank"
          rel="noopener noreferrer"
          className={barLink}
          title={t('navBack')}
        >
          <Globe aria-hidden="true" className="h-4 w-4" />
          <span className="sr-only">{t('navBack')}</span>
        </a>

        {/* Language switch — shows the target locale, like the public pages */}
        <button
          type="button"
          onClick={() => router.replace(pathname, { locale: nextLocale })}
          className="inline-flex items-center justify-center h-10 px-2.5 rounded-lg text-small font-semibold transition-colors hover:bg-[color-mix(in_srgb,var(--app-black)_8%,transparent)] cursor-pointer"
          title={langLabel}
        >
          {nextLocale.toUpperCase()}
          <span className="sr-only">{langLabel}</span>
        </button>

        {/* Accessibility settings dropdown */}
        <AccessibilityMenu triggerClassName={barLink} />

        {/* Separator */}
        <span
          aria-hidden="true"
          className="mx-1 h-5 w-px shrink-0"
          style={{ background: 'color-mix(in srgb, var(--app-black) 16%, transparent)' }}
        />

        {/* Profile — slides the dashboard out like entering a project */}
        <Link
          href={profileHref}
          onClick={(e) => {
            if (!exitNavigate || !isPlainLeftClick(e)) return
            e.preventDefault()
            exitNavigate(profileHref)
          }}
          className={barLink}
          title={t('navMyProfile')}
        >
          <User aria-hidden="true" className="h-4 w-4" />
          <span className="sr-only">{t('navMyProfile')}</span>
        </Link>

        {/* Logout — asks for confirmation first */}
        <button type="button" onClick={() => setConfirmOpen(true)} className={barLink} title={t('logout')}>
          <LogOut aria-hidden="true" className="h-4 w-4" />
          <span className="sr-only">{t('logout')}</span>
        </button>
      </nav>

      {/* Logout confirmation — centered dialog over a blurred, darkened page */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[color-mix(in_srgb,var(--app-black)_45%,transparent)] backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmOpen(false)
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="logout-confirm-title"
            className="popover-in w-full max-w-sm rounded-xl p-6 shadow-xl"
            style={{ background: 'var(--app-white)', color: 'var(--app-ink)' }}
          >
            <h2 id="logout-confirm-title" className="text-display font-bold mb-2" style={{ color: 'var(--app-ink-accent)' }}>
              {t('logoutConfirmTitle')}
            </h2>
            <p className="text-small opacity-70 mb-5">{t('logoutConfirmBody')}</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="px-4 h-10 rounded-lg text-small font-medium bg-[var(--app-light)] transition-colors hover:bg-[color-mix(in_srgb,var(--app-ink)_8%,var(--app-light))] cursor-pointer"
                style={{ color: 'var(--app-ink)' }}
              >
                {tc('cancel')}
              </button>
              <form action={logoutAction} className="contents">
                <button
                  ref={confirmRef}
                  type="submit"
                  className="px-4 h-10 rounded-lg text-small font-semibold bg-[var(--app-accent)] text-[var(--app-white)] transition-colors hover:bg-[var(--app-ink-accent)] cursor-pointer"
                >
                  {t('logout')}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
