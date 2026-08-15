// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import { getTranslations } from 'next-intl/server'
import { getCitySettings } from '@/lib/instance'
import { getMethodenBaseUrl } from '@/lib/methodensammlung'

/**
 * Slim dashboard footer — a one-bar cut of the public footer: brand +
 * copyright on the left, the links a logged-in user actually needs on the
 * right (contact, method collection, legal). Public pages open in a new tab
 * so the workspace stays open.
 */
export async function DashboardFooter({ locale }: { locale: string }) {
  const l = `/${locale}`
  const [{ cityName }, t, methodenUrl] = await Promise.all([
    getCitySettings(),
    getTranslations({ locale, namespace: 'footer' }),
    getMethodenBaseUrl(),
  ])

  const link = 'text-small transition-colors hover:underline'
  const linkStyle = { color: 'var(--app-ink)', opacity: 0.85 } as const

  const items: { href: string; label: string }[] = [
    { href: `${l}/kontakt`, label: t('contact') },
    { href: methodenUrl, label: t('methods') },
    { href: `${l}/impressum`, label: t('imprintShort') },
    { href: `${l}/datenschutz`, label: t('privacyShort') },
    { href: `${l}/cookies`, label: t('cookiesShort') },
    { href: `${l}/barrierefreiheit`, label: t('accessibilityShort') },
  ]

  return (
    <footer
      className="px-6 md:px-10 py-8 mt-auto"
      style={{ background: 'var(--app-white)', color: 'var(--app-ink)' }}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-text font-bold">
            <span style={{ color: 'var(--app-ink-accent)' }}>Urban</span>
            <span style={{ color: 'var(--app-accent)' }}>KIT</span>
            <span className="font-normal" style={{ color: 'var(--app-ink)' }}> – {cityName}</span>
          </span>
          <span className="text-small" style={{ opacity: 0.6 }}>
            © {new Date().getFullYear()}
          </span>
        </div>

        <nav aria-label={t('colLegal')} className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {items.map(({ href, label }) => (
            <a key={href} href={href} target="_blank" rel="noopener noreferrer" className={link} style={linkStyle}>
              {label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  )
}
