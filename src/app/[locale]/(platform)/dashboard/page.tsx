import { getPayload } from 'payload'
import config from '@payload-config'
import { getUser } from '@/lib/auth/getUser'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { FolderKanban, Search, ChevronRight } from 'lucide-react'

import { projectDefaults } from '@/lib/defaults/project'
import { resolveColorScheme } from '@/lib/colorScheme'
import { CtaButton } from '@/components/platform/CtaButton'
import { DashboardGrid, type DashboardCardData } from '@/components/platform/DashboardGrid'

type Project = {
  id: string
  title: string
  slug: string
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
    Follower: t('roleFollower'),
  }
  const relativeDate = (dateStr: string): string => {
    const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (days === 0) return tp('dateToday')
    if (days === 1) return tp('dateTomorrow')
    if (days <= 7) return tp('dateInDays', { days })
    return new Date(dateStr).toLocaleDateString(locale === 'en' ? 'en-GB' : 'de-DE', { day: 'numeric', month: 'short' })
  }

  const payload = await getPayload({ config })

  const memberships = await payload.find({
    collection: 'project-memberships',
    where: { and: [{ user: { equals: user.id } }, { status: { equals: 'active' } }] },
    depth: 2,
    limit: 50,
    overrideAccess: true,
  })

  const projects = memberships.docs.map((m) => m.project).filter(Boolean) as Project[]

  const roleByProjectId = Object.fromEntries(
    memberships.docs
      .filter((m) => m.project)
      .map((m) => [(m.project as Project).id, m.role as string])
  )

  const projectIds = projects.map((p) => p.id)

  const now = new Date().toISOString()
  const in14days = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
  const last7days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [pollsResult, eventsResult, newsResult] = projectIds.length > 0
    ? await Promise.all([
        payload.find({
          collection: 'polls',
          where: { and: [{ project: { in: projectIds } }, { status: { equals: 'active' } }] },
          limit: 50, depth: 1, overrideAccess: true,
        }),
        payload.find({
          collection: 'calendar-events',
          where: { and: [{ project: { in: projectIds } }, { startDate: { greater_than_equal: now } }, { startDate: { less_than_equal: in14days } }] },
          sort: 'startDate', limit: 50, depth: 1, overrideAccess: true,
        }),
        payload.find({
          collection: 'news-posts',
          where: { and: [{ project: { in: projectIds } }, { publishedAt: { greater_than_equal: last7days } }] },
          sort: '-publishedAt', limit: 50, depth: 1, overrideAccess: true,
        }),
      ])
    : [{ docs: [] }, { docs: [] }, { docs: [] }]

  const pollsByProject = Object.fromEntries(projectIds.map((id) => [id, 0]))
  const eventsByProject = Object.fromEntries(projectIds.map((id) => [id, null as string | null]))
  const newsByProject = Object.fromEntries(projectIds.map((id) => [id, 0]))

  for (const poll of pollsResult.docs) {
    const id = (poll.project as { id: string })?.id ?? String(poll.project)
    if (id in pollsByProject) pollsByProject[id]++
  }
  for (const event of eventsResult.docs) {
    const id = (event.project as { id: string })?.id ?? String(event.project)
    if (id in eventsByProject && !eventsByProject[id]) eventsByProject[id] = event.startDate
  }
  for (const post of newsResult.docs) {
    const id = (post.project as { id: string })?.id ?? String(post.project)
    if (id in newsByProject) newsByProject[id]++
  }

  const cards: DashboardCardData[] = projects.map((p) => {
    const polls = pollsByProject[p.id] ?? 0
    const nextEvent = eventsByProject[p.id]
    const news = newsByProject[p.id] ?? 0

    const pulse: string[] = []
    if (polls > 0) pulse.push(t('pulsePolls', { count: polls }))
    if (nextEvent) pulse.push(t('pulseEvent', { when: relativeDate(nextEvent) }))
    if (news > 0) pulse.push(t('pulseNews', { count: news }))

    const role = roleByProjectId[p.id]
    const scheme = resolveColorScheme(p.colorScheme)

    const galleryImages = (p.gallery ?? [])
      .map((g) => g.image?.url)
      .filter((url): url is string => Boolean(url))

    const finalGalleryImages = galleryImages.length > 0
      ? galleryImages
      : projectDefaults.gallery.map((g) => g.image).filter(Boolean)

    return {
      id: p.id,
      slug: p.slug,
      title: p.title,
      coverSrc: p.coverImage?.url ?? projectDefaults.coverImage,
      galleryImages: finalGalleryImages,
      roleLabel: roleLabels[role] ?? role,
      pulse,
      canManage: role === 'PM',
      scheme,
    }
  })

  // ── Sections by role ────────────────────────────────────────────────────────
  const sections = [
    { title: t('sectionMine'), cards: cards.filter((c) => roleByProjectId[c.id] === 'PM') },
    { title: t('sectionMember'), cards: cards.filter((c) => roleByProjectId[c.id] === 'Citizen') },
    { title: t('sectionFollow'), cards: cards.filter((c) => roleByProjectId[c.id] === 'Follower') },
  ].filter((s) => s.cards.length > 0)

  const firstName = ((user as unknown as { firstName?: string | null }).firstName) || null

  return (
    <div className="p-8 flex flex-col gap-10" style={{ color: 'var(--plattform-ink)' }}>

      {/* ── Greeting ─────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-5">
        <h1 className="text-title font-bold leading-tight">
          {firstName ? tp('greeting', { name: firstName }) : tp('greetingFallback')}
        </h1>
      </section>

      {projects.length === 0 ? (
        <section>
          <div
            className="rounded-xl border border-dashed p-10 text-center"
            style={{ borderColor: 'color-mix(in srgb, var(--plattform-ink) 20%, transparent)' }}
          >
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
        sections.map((section) => (
          <section key={section.title} className="flex flex-col gap-3">
            <h2 className="text-small font-semibold uppercase tracking-wide opacity-50">{section.title}</h2>
            <DashboardGrid locale={locale} cards={section.cards} />
          </section>
        ))
      )}

      <section className="text-center">
        <p className="text-small opacity-40">{t('moreProjectsQuestion')}</p>
        <Link
          href={`/${locale}/bereich/projekte-archiv/alle-projekte`}
          className="inline-flex items-center gap-1 text-small font-medium mt-1 transition-colors text-[var(--plattform)] hover:text-[var(--plattform-accent)]"
        >
          {t('discoverAll')} <ChevronRight className="w-[0.9em] h-[0.9em] shrink-0" />
        </Link>
      </section>
    </div>
  )
}
