'use client'

import { useLocale } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'

// Toggles between the two UI locales while preserving the current path.
// next-intl's usePathname() returns the path WITHOUT the locale prefix, so
// router.replace swaps only the locale segment.
export function LanguageSwitcher({
  className,
  ...rest
}: { className?: string } & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'aria-label'>) {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const next = locale === 'de' ? 'en' : 'de'

  return (
    <button
      {...rest}
      onClick={() => router.replace(pathname, { locale: next })}
      className={`flex items-center text-text cursor-pointer transition-colors text-[var(--plattform-ink)] hover:text-[var(--plattform-accent)] ${className ?? ''}`}
      aria-label={locale === 'de' ? 'Switch to English' : 'Zu Deutsch wechseln'}
    >
      {next.toUpperCase()}
    </button>
  )
}
