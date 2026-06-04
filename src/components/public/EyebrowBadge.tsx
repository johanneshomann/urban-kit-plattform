import { Asterisk } from 'lucide-react'

interface EyebrowBadgeProps {
  label: string
  bg?: string
  color?: string
  opacity?: number
  className?: string
}

export function EyebrowBadge({
  label,
  bg = 'var(--plattform-ink)',
  color = 'var(--plattform-white)',
  opacity,
  className,
}: EyebrowBadgeProps) {
  return (
    <div
      className={`self-start inline-flex items-center gap-1 mb-4 px-3 py-1 rounded-md text-small font-normal tracking-widest leading-none${className ? ` ${className}` : ''}`}
      style={{ background: bg, color, ...(opacity !== undefined ? { opacity } : {}) }}
    >
      <Asterisk className="w-[1em] h-[1em] shrink-0" />
      {label}
    </div>
  )
}
