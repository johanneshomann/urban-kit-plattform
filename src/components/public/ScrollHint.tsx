'use client'

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
  const handleClick = (e: React.MouseEvent<Element>) => {
    const next = e.currentTarget.closest('section')?.nextElementSibling
    if (next) next.scrollIntoView({ behavior: 'smooth' })
  }

  if (!label) {
    return (
      <ChevronDown
        className={`absolute bottom-8 left-6 -translate-x-0 md:left-1/2 md:-translate-x-1/2 z-20 ${size} animate-bounce opacity-40 hover:opacity-100 transition-opacity cursor-pointer`}
        style={{ color }}
        onClick={handleClick}
        aria-label="Zum nächsten Abschnitt"
      />
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Zum nächsten Abschnitt"
      className="absolute bottom-8 left-6 -translate-x-0 md:left-1/2 md:-translate-x-1/2 z-20 flex flex-col items-center gap-1 opacity-40 hover:opacity-100 transition-opacity cursor-pointer"
    >
      <span className="text-text" style={{ color }}>{label}</span>
      <ChevronDown className={`${size} animate-bounce`} style={{ color }} />
    </button>
  )
}
