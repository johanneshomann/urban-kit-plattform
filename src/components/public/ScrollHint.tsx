'use client'

import { useTranslations } from 'next-intl'
import { ChevronDown } from 'lucide-react'

interface ScrollHintProps {
  color?: string
  size?: string
  /** Optional text above the chevron (e.g. "Mehr"), mirroring the Methodensammlung's hint. */
  label?: string
}

export function ScrollHint({
  color = 'var(--plattform)',
  size = 'w-14 h-14',
  label,
}: ScrollHintProps) {
  const t = useTranslations('common')
  const handleClick = (e: React.MouseEvent<Element>) => {
    const next = e.currentTarget.closest('section')?.nextElementSibling
    if (next) next.scrollIntoView({ behavior: 'smooth' })
  }

  // Always a real <button> — a click-handled SVG is neither focusable nor
  // operable by keyboard/AT (WCAG 2.1.1, 4.1.2).
  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={t('scrollToNext')}
      className="absolute bottom-8 left-6 -translate-x-0 md:left-1/2 md:-translate-x-1/2 z-20 flex flex-col items-center gap-1 opacity-60 hover:opacity-100 focus-visible:opacity-100 transition-opacity cursor-pointer"
    >
      {label && <span className="text-text" style={{ color }}>{label}</span>}
      <ChevronDown className={`${size} animate-bounce`} style={{ color }} aria-hidden />
    </button>
  )
}
