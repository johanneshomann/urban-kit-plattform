import type { LucideIcon } from 'lucide-react'

interface SectionHeaderProps {
  label: string
  icon: LucideIcon
  action?: React.ReactNode
}

export function SectionHeader({ label, icon: Icon, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2 text-text" style={{ color: 'var(--plattform-ink-accent)' }}>
        <Icon className="w-[1em] h-[1em] shrink-0" />
        <h2 className="font-normal">{label}</h2>
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
