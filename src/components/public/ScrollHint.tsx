'use client'

import { ChevronDown } from 'lucide-react'

interface ScrollHintProps {
  color?: string
  size?: string
}

export function ScrollHint({
  color = 'var(--plattform)',
  size = 'w-14 h-14',
}: ScrollHintProps) {
  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const next = e.currentTarget.closest('section')?.nextElementSibling
    if (next) next.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <ChevronDown
      className={`absolute bottom-8 left-6 -translate-x-0 md:left-1/2 md:-translate-x-1/2 z-20 ${size} animate-bounce opacity-40 hover:opacity-100 transition-opacity cursor-pointer`}
      style={{ color }}
      onClick={handleClick}
      aria-label="Zum nächsten Abschnitt"
    />
  )
}
