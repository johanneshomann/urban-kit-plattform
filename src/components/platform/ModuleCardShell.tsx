import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type CardBadge = { label: string; tone?: 'accent' | 'neutral' }

/**
 * Shared visual shell for the project-workspace module cards: icon + title +
 * optional badge, a body slot, and a bottom CTA link. Themed via `--project-*`.
 * The outer border / drag handle come from the SortableCard wrapper.
 */
export function ModuleCardShell({
  icon: Icon, title, badge, href, ctaLabel, children,
}: {
  icon: LucideIcon
  title: string
  badge?: CardBadge | null
  href: string
  ctaLabel: string
  children?: React.ReactNode
}) {
  return (
    <div className="h-full flex flex-col p-5" style={{ background: 'var(--project-white)' }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="rounded-lg flex items-center justify-center shrink-0 p-2" style={{ background: 'var(--project-light)' }}>
          <Icon className="w-5 h-5" style={{ color: 'var(--project-dark)' }} />
        </div>
        <span className="text-display font-semibold" style={{ color: 'var(--project-dark)' }}>{title}</span>
        {badge && (
          <span
            className="ml-auto text-small font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
            style={
              badge.tone === 'neutral'
                ? { background: 'var(--project-light)', color: 'var(--project-dark)' }
                : { background: 'color-mix(in srgb, var(--project-accent) 15%, transparent)', color: 'var(--project-accent)' }
            }
          >
            {badge.label}
          </span>
        )}
      </div>

      <div className="flex-1 min-h-0">{children}</div>

      <Link
        href={href}
        className="mt-4 inline-flex items-center gap-1 text-small font-semibold transition-opacity hover:opacity-70"
        style={{ color: 'var(--project-accent)' }}
      >
        {ctaLabel} <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  )
}
