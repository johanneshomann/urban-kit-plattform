import { getPayload } from 'payload'
import config from '@payload-config'
import { getUser } from '@/lib/auth/getUser'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { FolderKanban, Search, ChevronRight, ExternalLink } from 'lucide-react'

import { CtaButton } from '@/components/platform/CtaButton'
import { ProjectJoinButton } from '@/components/platform/ProjectJoinButton'

type Project = {
  id: string
  title: string
  slug: string
  shortDescription?: string | null
  modules?: string[]
  coverImage?: { url?: string } | null
  gallery?: { image?: { url?: string } | null }[] | null
  colorScheme?: string | null
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const user = await getUser()
  if (!user) return null

  const [t, tp] = await Promise.all([
    getTranslations({ locale, namespace: 'dashboard' }),
    getTranslations({ locale, namespace: 'platform' }),
  ])
  const roleLabels: Record<string, string> = {
    PM: t('rolePM'),
    Citizen: t('roleCitizen'),
  }
  const relativeDate = (dateStr: string): string => {
    const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (days === 0) return tp('dateToday')
    if (days === 1) return tp('dateTomorrow')
    if (days <= 7) return tp('dateInDays', { days })
    return new Date(dateStr).toLocaleDateString(locale === 'en' ? 'en-GB' : 'de-DE', { day: 'numeric', month: 'short' })
  }

  const payload = await getPayload({ config })

  const [memberships, starredOnly] = await Promise.all([
    payload.find({
      collection: 'project-memberships',
      where: { and: [{ user: { equals: user.id } }, { status: { equals: 'active' } }] },
      depth: 2,
      limit: 50,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'project-memberships',
      where: { and: [{ user: { equals: user.id } }, { starred: { equals: true } }, { status: { not_equals: 'active' } }] },
      depth: 2,
      limit: 50,
      overrideAccess: true,
    }),
  ])
  
  /** Projects the user is an active member of (PM or Citizen) — the full-width list. */
  const memberProjects = memberships.docs
    .map((m) => ({ project: m.project as Project, role: (m.role ?? 'Citizen') as string }))
    .filter((x) => !!x.project)
  const memberIds = new Set(memberProjects.map((x) => x.project.id))

  // All public projects (for the grayscale "Weitere Projekte" list below).
  const allProjectsRes = await payload.find({
    collection: 'projects',
    where: { isPublic: { equals: true } },
    sort: '-createdAt',
    limit: 200,
    depth: 1,
    overrideAccess: true,
  })
  const allProjects = allProjectsRes.docs as unknown as Project[]
  const otherProjects = allProjects.filter((p) => !memberIds.has(p.id))
  // Starred-only memberships (non-active) also count as "other"/suggested — merge & de-dupe.
  const starredOther = starredOnly.docs.map((m) => m.project).filter(Boolean) as Project[]
  for (const sp of starredOther) {
    if (!memberIds.has(sp.id) && !otherProjects.some((o) => o.id === sp.id)) otherProjects.push(sp)
  }

  const firstName = ((user as unknown as { firstName?: string | null }).firstName) || null

  // Full-width height: one project ≈ 40vh; more projects shrink each proportionally.
  const memberRowHeight = memberProjects.length === 1
    ? '40vh'
    : `calc(40vh / ${memberProjects.length})`

  return (
    <div className="flex flex-col" style={{ color: 'var(--plattform-ink)' }}>

      {/* ── Greeting ─────────────────────────────────────────────────────── */}
      <div className="px-6 md:px-10 py-8 border-b" style={{ borderColor: 'color-mix(in srgb, var(--plattform-ink) 10%, transparent)' }}>
        <h1 className="text-title font-bold leading-tight">
          {firstName ? tp('greeting', { name: firstName }) : tp('greetingFallback')}
        </h1>
        <p className="text-small mt-1 opacity-50">{t('moreProjectsQuestion')}</p>
      </div>

      {/* ── Meine Projekte (full-width, image background, title overlay) ─── */}
      {memberProjects.length === 0 ? (
        <section className="p-10">
          <div className="rounded-xl border border-dashed p-10 text-center" style={{ borderColor: 'color-mix(in srgb, var(--plattform-ink) 20%, transparent)' }}>
            <FolderKanban className="w-8 h-8 mx-auto mb-3 opacity-20" />
            <p className="text-small font-medium opacity-50">{t('emptyTitle')}</p>
            <p className="text-small mt-1 opacity-30">{t('emptyBody')}</p>
            <div className="mt-4">
              <CtaButton
                href={`/${locale}/bereich/projekte-archiv/alle-projekte`}
                label={t('discoverProjects')}
                icon={<Search />}
                newTab
              />
            </div>
          </div>
        </section>
      ) : (
        <div className="flex flex-col" style={{ minHeight: '40vh' }}>
          {memberProjects.map(({ project }) => (
            <Link
              key={project.id}
              href={`/${locale}/projekte/${project.slug}`}
              className="group relative flex flex-col justify-end overflow-hidden"
              style={{ height: memberRowHeight, background: 'var(--plattform-light)' }}
            >
              {/* Cover as full-bleed background */}
              {project.coverImage?.url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={project.coverImage.url}
                  alt=""
                  aria-hidden
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
              {/* Legibility scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              {/* Title + role */}
              <div className="relative z-10 p-6 md:p-10">
                <span
                  className="inline-block text-small font-semibold px-3 py-1 rounded-full mb-2"
                  style={{ background: 'var(--plattform-white)', color: 'var(--plattform-ink)' }}
                >
                  {roleLabels[memberProjects.find((x) => x.project.id === project.id)?.role ?? ''] ?? project.title}
                </span>
                <h2 className="text-title font-black leading-tight tracking-tight text-[var(--plattform-white)]">{project.title}</h2>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ── Weitere Projekte (grayscale; hover reveals info + join) ──────── */}
      {otherProjects.length > 0 && (
        <section className="px-6 md:px-10 py-10">
          <h2 className="text-small font-semibold uppercase tracking-wide opacity-50 mb-4">{t('sectionOtherProjects')}</h2>
          <div className="flex flex-col divide-y" style={{ borderColor: 'color-mix(in srgb, var(--plattform-ink) 12%, transparent)' }}>
            {otherProjects.map((p) => (
              <div
                key={p.id}
                className="group relative flex items-center gap-5 py-4"
              >
                {/* Grayscale cover thumb */}
                <div className="relative w-40 h-24 rounded-lg overflow-hidden shrink-0 grayscale group-hover:grayscale-0 transition-all" style={{ background: 'var(--plattform-light)' }}>
                  {p.coverImage?.url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.coverImage.url} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" />
                  )}
                </div>

                {/* Info — hidden on grayscale, revealed on hover */}
                <div className="flex-1 min-w-0 opacity-70 group-hover:opacity-100 transition-opacity">
                  <h3 className="text-text font-bold truncate" style={{ color: 'var(--plattform-ink-accent)' }}>{p.title}</h3>
                  {p.shortDescription && (
                    <p className="text-small line-clamp-2 mt-0.5" style={{ color: 'var(--plattform-ink)', opacity: 0.65 }}>{p.shortDescription}</p>
                  )}
                </div>

                {/* Actions — appear on hover */}
                <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link
                    href={`/${locale}/projekte/${p.slug}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-small font-medium border"
                    style={{ color: 'var(--plattform-ink)', borderColor: 'color-mix(in srgb, var(--plattform) 35%, transparent)' }}
                  >
                    <ExternalLink className="w-4 h-4" /> {t('openProject')}
                  </Link>
                  <ProjectJoinButton slug={p.slug} locale={locale} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Footer CTA ───────────────────────────────────────────────────── */}
      <section className="px-6 md:px-10 py-10 text-center">
        <Link
          href={`/${locale}/bereich/projekte-archiv/alle-projekte`}
          className="inline-flex items-center gap-1 text-small font-medium transition-colors text-[var(--plattform)] hover:text-[var(--plattform-accent)]"
        >
          {t('discoverAll')} <ChevronRight className="w-[0.9em] h-[0.9em] shrink-0" />
        </Link>
      </section>
    </div>
  )
}
