'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { House, Settings2 } from 'lucide-react'
import { JoinProjectButton } from '@/components/platform/JoinProjectButton'

const P = {
  white:  'var(--project-white)',
  light:  'var(--project-light)',
  mid:    'var(--project-mid)',
  dark:   'var(--project-dark)',
  accent: 'var(--project-accent)',
} as const

const pill: React.CSSProperties = {
  color: P.accent,
  background: 'color-mix(in srgb, var(--project-accent) 12%, transparent)',
  border: '1.5px solid color-mix(in srgb, var(--project-accent) 30%, transparent)',
  padding: '0.3em 0.75em',
  borderRadius: '999px',
}

export interface ProjectHeroProps {
  locale: string
  slug: string
  title: string
  shortDescription: string | null
  coverSrc: string
  phaseLabel: string | null
  canManage: boolean
  canRequestJoin: boolean
  joinStatus: 'requested' | 'rejected' | null
  /** Hex white of the project scheme — used for the cover gradient. */
  schemeWhite: string
  /** Server-rendered RecentActivityCard, passed through as a slot. */
  activitySlot: React.ReactNode
}

/**
 * Persistent workspace hero. Lives in the (workspace) layout, so it stays
 * mounted across navigation; on module subpages it CSS-transitions to a
 * compact variant (no tagline/pills/activity, reduced height).
 */
export function ProjectHero({
  locale, slug, title, shortDescription, coverSrc, phaseLabel,
  canManage, canRequestJoin, joinStatus, schemeWhite, activitySlot,
}: ProjectHeroProps) {
  const t = useTranslations('projectWorkspace')
  const pathname = usePathname()
  const root = `/${locale}/dashboard/projekte/${slug}`
  const compact = pathname !== root

  // Collapsible block: animates open/closed via max-height + opacity.
  const collapse = (open: boolean): string =>
    `transition-all duration-500 overflow-hidden ${open ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`

  return (
    <div className="grid lg:grid-cols-2" style={{ background: P.white }}>
      {/* Left — text */}
      <div className={`px-6 md:px-10 pt-6 flex flex-col transition-all duration-500 ${compact ? 'pb-5' : 'pb-8'}`}>
        <Link href={`/${locale}/dashboard`} className={`transition-all duration-500 opacity-40 hover:opacity-90 ${compact ? 'mb-3' : 'mb-6'}`} style={{ color: P.dark }}>
          <House className="w-[1em] h-[1em]" />
        </Link>

        {phaseLabel && (
          <span className={`self-start text-small font-medium ${compact ? 'mb-2' : 'mb-4'} transition-all duration-500`} style={pill}>
            {phaseLabel}
          </span>
        )}

        <h1 className={`font-bold leading-tight transition-all duration-500 ${compact ? 'text-display' : 'text-title'}`} style={{ color: P.dark }}>
          {title}
        </h1>

        <div className={collapse(!compact)}>
          <p className="text-small mt-3 max-w-md" style={{ color: P.dark, opacity: 0.6 }}>
            {shortDescription || t('heroTagline')}
          </p>
        </div>

        {(canManage || canRequestJoin) && (
          <div className={collapse(!compact)}>
            <div className="flex items-center gap-2 mt-5">
              {canManage && (
                <Link
                  href={`${root}/manage`}
                  className="flex items-center gap-1.5 text-small font-medium transition-colors hover:bg-[var(--project-accent)] hover:text-[var(--project-dark)] hover:border-[var(--project-accent)]"
                  style={pill}
                >
                  <Settings2 className="w-[0.9em] h-[0.9em] shrink-0" />
                  {t('manage')}
                </Link>
              )}
              {canRequestJoin && (
                <JoinProjectButton slug={slug} locale={locale} status={joinStatus} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right — cover image with floating activity card */}
      <div className={`relative transition-all duration-500 ${compact ? 'min-h-[6rem]' : 'min-h-[16rem]'} lg:min-h-0`}>
        <img src={coverSrc} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(to right, ${schemeWhite}cc 0%, ${schemeWhite}00 30%)` }}
        />
        <div className={`absolute top-4 right-4 md:top-6 md:right-6 transition-opacity duration-500 ${compact ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          {activitySlot}
        </div>
      </div>
    </div>
  )
}
