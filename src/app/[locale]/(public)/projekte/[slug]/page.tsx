import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'
import { PublicNavServer } from '@/components/public/PublicNavServer'
import { PublicFooter } from '@/components/public/PublicFooter'
import { EyebrowBadge } from '@/components/public/EyebrowBadge'
import { ScrollHint } from '@/components/public/ScrollHint'
import { resolveColorScheme } from '@/lib/colorScheme'
import { getUser } from '@/lib/auth/getUser'
import { JoinRequestButton } from '@/components/public/JoinRequestButton'
import { projectDefaults } from '@/lib/defaults/project'
import { PROJEKTPHASEN } from '@/lib/options/projektphasen'
import { loadCitizenPolls } from '@/lib/citizen-polls'
import { PollsConsumption } from '@/components/platform/modules/polls/PollsConsumption'
import { FilesBrowse } from '@/components/platform/modules/files/FilesBrowse'
import {
  FolderOpen,
  Newspaper,
  CalendarDays,
  MapPin,
  Mail,
  Phone,
  Globe,
  UserRound,
  HandHeart,
  Megaphone,
  Rss,
  Download,
  BarChart3,
} from 'lucide-react'

const accent = (chunks: ReactNode) => <span style={{ color: 'var(--plattform)' }}>{chunks}</span>

type Project = {
  id: string
  title: string
  slug: string
  shortDescription?: string | null
  coverImage?: { url?: string } | null
  colorScheme?: string | null
  modules?: string[]
  projektphase?: string | null
  status?: string | null
  thema?: string[]
  gallery?: Array<{
    image?: { url?: string; alt?: string | null } | null
    caption?: string | null
    id?: string | null
  }> | null
  projektbeschreibung?: unknown
  beteiligungsvorhaben?: unknown
  startYear?: number | null
  altersgruppe?: string[] | null
  gender?: string[] | null
  stadtbereich?: string[] | null
  isPublic?: boolean | null
  joinRequestsEnabled?: boolean | null
  kontakt?: {
    email?: string | null
    telefon?: string | null
    website?: string | null
  } | null
  ansprechperson?: { firstName?: string | null; lastName?: string | null; email?: string | null } | null
}

type NewsPost = { id: string; title: string; slug: string; publishedAt?: string | null }
type CalEvent = { id: string; title: string; startDate: string; location?: string | null }

async function getPublicProject(slug: string): Promise<Project | null> {
  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'projects',
      where: { slug: { equals: slug } },
      depth: 1,
      limit: 1,
      overrideAccess: true,
    })
    const project = result.docs[0] as unknown as Project | undefined
    if (!project || project.isPublic === false) return null
    return project
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const t = await getTranslations({ locale, namespace: 'projectDetail' })
  const project = await getPublicProject(slug)
  if (!project) return { title: t('metaFallbackTitle') }

  const base = process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://urbankit.de'
  const description = project.shortDescription ?? t('metaFallbackDesc', { title: project.title })
  const coverUrl = project.coverImage?.url
  return {
    title: `${project.title} – UrbanKIT`,
    description,
    alternates: { canonical: `${base}/${locale}/projekte/${project.slug}` },
    openGraph: {
      title: `${project.title} – UrbanKIT`,
      description,
      url: `${base}/${locale}/projekte/${project.slug}`,
      type: 'website',
      ...(coverUrl
        ? { images: [{ url: coverUrl.startsWith('http') ? coverUrl : `${base}${coverUrl}` }] }
        : {}),
    },
  }
}

const formatDate = (iso: string | null | undefined, dateLocale: string) =>
  iso
    ? new Date(iso).toLocaleDateString(dateLocale, { day: '2-digit', month: 'long', year: 'numeric' })
    : null

export default async function PublicProjectPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const [t, tax] = await Promise.all([
    getTranslations({ locale, namespace: 'projectDetail' }),
    getTranslations({ locale, namespace: 'taxonomy' }),
  ])
  const dateLocale = locale === 'en' ? 'en-GB' : 'de-DE'
  const project = await getPublicProject(slug)
  if (!project) notFound()

  const payload = await getPayload({ config })
  const scheme = resolveColorScheme(project.colorScheme)

  // Visitor's login + membership state for the join CTA
  const viewer = await getUser()
  let membershipStatus: 'requested' | 'active' | 'rejected' | null = null
  if (viewer) {
    const membershipRes = await payload.find({
      collection: 'project-memberships',
      where: { and: [{ user: { equals: viewer.id } }, { project: { equals: project.id } }] },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    }).catch(() => ({ docs: [] }))
    const status = (membershipRes.docs[0] as { status?: string } | undefined)?.status
    membershipStatus = status === 'requested' || status === 'active' || status === 'rejected' ? status : null
  }
  const phase = PROJEKTPHASEN.find((p) => p.value === project.projektphase)
  const coverSrc = project.coverImage?.url ?? projectDefaults.coverImage
  const modules: string[] = project.modules ?? ['news', 'calendar']
  const now = new Date().toISOString()

  // Public news & upcoming public events — only for enabled modules
  const [newsResult, eventsResult] = await Promise.all([
    modules.includes('news')
      ? payload.find({
          collection: 'news-posts',
          where: {
            and: [
              { project: { equals: project.id } },
              { visibility: { equals: 'PUBLIC' } },
              { publishedAt: { less_than_equal: now } },
            ],
          },
          sort: '-publishedAt',
          limit: 4,
          depth: 0,
          overrideAccess: true,
        }).catch(() => ({ docs: [] }))
      : Promise.resolve({ docs: [] }),
    modules.includes('calendar')
      ? payload.find({
          collection: 'calendar-events',
          where: {
            and: [
              { project: { equals: project.id } },
              { visibility: { equals: 'PUBLIC' } },
              { startDate: { greater_than_equal: now } },
            ],
          },
          sort: 'startDate',
          limit: 4,
          depth: 0,
          overrideAccess: true,
        }).catch(() => ({ docs: [] }))
      : Promise.resolve({ docs: [] }),
  ])
  const newsPosts = newsResult.docs as unknown as NewsPost[]
  const upcomingEvents = eventsResult.docs as unknown as CalEvent[]

  // No upcoming events → fall back to the most recent past ones, so finished
  // projects show their event history instead of a permanent empty state.
  const pastEvents: CalEvent[] =
    modules.includes('calendar') && upcomingEvents.length === 0
      ? ((await payload.find({
          collection: 'calendar-events',
          where: {
            and: [
              { project: { equals: project.id } },
              { visibility: { equals: 'PUBLIC' } },
              { startDate: { less_than: now } },
            ],
          },
          sort: '-startDate',
          limit: 4,
          depth: 0,
          overrideAccess: true,
        }).catch(() => ({ docs: [] }))).docs as unknown as CalEvent[])
      : []
  const calEvents = upcomingEvents.length > 0 ? upcomingEvents : pastEvents
  const eventsArePast = upcomingEvents.length === 0 && pastEvents.length > 0

  // Public polls — active/closed polls visible to the public tier (anonymous voting where allowed)
  const publicPolls = modules.includes('polls')
    ? await loadCitizenPolls(payload, project.id, 'public', null)
    : []

  // Active member count — aggregate only, no names
  const memberCount = (
    await payload.count({
      collection: 'project-memberships',
      where: { and: [{ project: { equals: project.id } }, { status: { equals: 'active' } }] },
      overrideAccess: true,
    }).catch(() => ({ totalDocs: 0 }))
  ).totalDocs

  const publicFilesCount = modules.includes('files')
    ? (await payload.count({ collection: 'file-uploads', where: { and: [{ project: { equals: project.id } }, { visibility: { equals: 'PUBLIC' } }] }, overrideAccess: true }).catch(() => ({ totalDocs: 0 }))).totalDocs
    : 0

  const hasAktuelles = newsPosts.length > 0 || calEvents.length > 0 || publicPolls.length > 0 || publicFilesCount > 0

  // richText → HTML
  const beschreibungHtml = project.projektbeschreibung
    ? convertLexicalToHTML({ data: project.projektbeschreibung as Parameters<typeof convertLexicalToHTML>[0]['data'] })
    : null
  const beteiligungsvorhabenHtml = project.beteiligungsvorhaben
    ? convertLexicalToHTML({ data: project.beteiligungsvorhaben as Parameters<typeof convertLexicalToHTML>[0]['data'] })
    : null

  // Steckbrief rows — only filled fields. Status is omitted (derived from the
  // phase, already a hero badge); "Zielgruppe: Alle" is a non-statement → skip.
  const zielgruppen = (project.gender ?? []).filter((v) => v !== 'alle')
  const steckbrief = [
    project.startYear ? { label: t('rowYear'), value: String(project.startYear) } : null,
    memberCount > 0 ? { label: t('rowMitglieder'), value: String(memberCount) } : null,
    (project.altersgruppe ?? []).length > 0
      ? { label: t('rowAltersgruppe'), value: (project.altersgruppe ?? []).map((v) => tax(`altersgruppe.${v}`)).join(', ') }
      : null,
    zielgruppen.length > 0
      ? { label: t('rowZielgruppe'), value: zielgruppen.map((v) => tax(`gender.${v}`)).join(', ') }
      : null,
  ].filter((d): d is { label: string; value: string } => d !== null)

  // Thema/Stadtbereich as chip rows — the taxonomies the archive filters by
  const steckbriefChips = [
    (project.thema ?? []).length > 0
      ? { label: t('rowThema'), values: (project.thema ?? []).map((v) => tax(`thema.${v}`)) }
      : null,
    (project.stadtbereich ?? []).length > 0
      ? { label: t('rowStadtbereich'), values: (project.stadtbereich ?? []).map((v) => tax(`stadtbereich.${v}`)) }
      : null,
  ].filter((d): d is { label: string; values: string[] } => d !== null)

  const joinEnabled = project.joinRequestsEnabled !== false

  // PollsConsumption/FilesBrowse style via --project-* vars; on the public page
  // they get neutral plattform colours — the scheme only appears as Steckbrief swatches.
  const moduleThemeVars = {
    '--project-light': 'var(--plattform-light)',
    '--project-mid': 'var(--plattform)',
    '--project-dark': 'var(--plattform-accent)',
  } as React.CSSProperties

  const galleryImages = (project.gallery ?? [])
    .filter((g) => !!g.image?.url)
    .map((g) => ({ url: g.image!.url!, alt: g.image?.alt ?? null, caption: g.caption ?? null }))

  // Name only — never fall back to the linked user's account email, that
  // would publish it even when the project left kontakt.email empty on purpose.
  const ansprechperson = project.ansprechperson
    ? [project.ansprechperson.firstName, project.ansprechperson.lastName].filter(Boolean).join(' ') || null
    : null
  const kontakt = project.kontakt ?? {}
  const hasKontakt = Boolean(ansprechperson || kontakt.email || kontakt.telefon || kontakt.website)
  const websiteHref = kontakt.website
    ? kontakt.website.startsWith('http') ? kontakt.website : `https://${kontakt.website}`
    : null

  return (
    <div className="min-h-svh flex flex-col">
      <PublicNavServer locale={locale} />

      {/* Hero — cover image behind a calm white wash, project colour only as badge */}
      <section className="relative flex-1 min-h-[calc(100svh-3.5rem)] flex flex-col overflow-hidden border-b" style={{ background: 'var(--plattform-light)' }}>
        <div className="absolute inset-0" aria-hidden="true">
          <img src={coverSrc} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-white/85" />
        </div>
        <ScrollHint />

        <div className="relative z-10 flex-1 flex flex-col justify-start px-6 pt-20 md:pt-28 md:px-16 lg:px-24">
          <div className="flex flex-wrap items-center gap-2">
            <EyebrowBadge label={t('heroEyebrow')} />
            {project.status && (
              <span
                className="inline-flex items-center mb-4 px-3 py-1 rounded-full text-small font-semibold leading-none"
                style={{ background: 'var(--plattform)', color: 'white' }}
              >
                {tax(`status.${project.status}`)}
              </span>
            )}
          </div>

          {/* Long titles drop one size step so the hero keeps room for description + CTA */}
          <h1 className={`${project.title.length > 28 ? 'text-title leading-[1.05]' : 'text-hero leading-none'} font-black tracking-tight mb-5 max-w-5xl text-balance`}>
            {project.title}<span style={{ color: 'var(--plattform)' }}>.</span>
          </h1>

          {project.shortDescription && (
            <p className="text-text leading-relaxed max-w-2xl" style={{ color: 'var(--plattform-ink)' }}>
              {project.shortDescription}
            </p>
          )}

          {joinEnabled && (
            <div className="mt-10">
              <JoinRequestButton slug={project.slug} locale={locale} isLoggedIn={!!viewer} membershipStatus={membershipStatus} />
            </div>
          )}
        </div>
      </section>

      {/* Über das Projekt */}
      <section className="px-6 md:px-16 lg:px-24 py-12 md:py-24 border-b" style={{ background: 'var(--plattform-light)' }}>
        <div className="w-full">
          <EyebrowBadge label={t('aboutEyebrow')} opacity={0.6} />
          <h2 className="text-title font-black tracking-tight mb-10">
            {t.rich('aboutTitle', { accent })}
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
            {beschreibungHtml ? (
              <div
                className="lg:col-span-2 max-w-3xl prose text-text leading-relaxed"
                style={{ color: 'var(--plattform-ink)' }}
                dangerouslySetInnerHTML={{ __html: beschreibungHtml }}
              />
            ) : (
              <p className="lg:col-span-2 max-w-3xl text-text leading-relaxed" style={{ color: 'var(--plattform-ink)' }}>
                {t('aboutEmpty')}
              </p>
            )}

            {/* Steckbrief — sticks while the description scrolls */}
            {(phase || steckbrief.length > 0) && (
              <aside className="bg-white rounded-xl shadow-sm p-8 lg:sticky lg:top-20">
                <h3 className="text-display font-black tracking-tight mb-4">{t('steckbrief')}</h3>

                {phase && (
                  <div className="py-3 border-b">
                    <div className="flex items-baseline justify-between gap-4 mb-2.5">
                      <span className="text-small" style={{ color: 'var(--plattform-ink)', opacity: 0.5 }}>
                        {t('rowPhase')}
                      </span>
                      <span className="text-small font-semibold text-right" style={{ color: 'var(--plattform-ink)' }}>
                        {t('phaseOf', { current: phase.step + 1, total: PROJEKTPHASEN.length })} · {tax(`phase.${phase.value}`)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--plattform-light)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{ background: 'var(--plattform)', width: `${((phase.step + 1) / PROJEKTPHASEN.length) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                <dl>
                  {steckbrief.map((row) => (
                    <div key={row.label} className="flex items-baseline justify-between gap-4 py-3 border-b">
                      <dt className="text-small shrink-0" style={{ color: 'var(--plattform-ink)', opacity: 0.5 }}>
                        {row.label}
                      </dt>
                      <dd className="text-small font-semibold text-right" style={{ color: 'var(--plattform-ink)' }}>
                        {row.value}
                      </dd>
                    </div>
                  ))}
                  {steckbriefChips.map((row) => (
                    <div key={row.label} className="flex items-baseline justify-between gap-4 py-3 border-b">
                      <dt className="text-small shrink-0" style={{ color: 'var(--plattform-ink)', opacity: 0.5 }}>
                        {row.label}
                      </dt>
                      <dd className="flex flex-wrap justify-end gap-1.5">
                        {row.values.map((v) => (
                          <span
                            key={v}
                            className="px-2.5 py-0.5 rounded-full text-small"
                            style={{ background: 'var(--plattform-light)', color: 'var(--plattform-ink)' }}
                          >
                            {v}
                          </span>
                        ))}
                      </dd>
                    </div>
                  ))}
                </dl>

                {/* The project's colour scheme, shown as swatches instead of theming the page */}
                <div className="flex items-center justify-between gap-4 pt-3">
                  <span className="text-small shrink-0" style={{ color: 'var(--plattform-ink)', opacity: 0.5 }}>
                    {t('rowFarbschema')}
                  </span>
                  <span className="flex gap-1.5" aria-hidden>
                    {[scheme.light, scheme.mid, scheme.dark].map((c) => (
                      <span key={c} className="w-4 h-4 rounded-full border" style={{ background: c }} />
                    ))}
                  </span>
                </div>
              </aside>
            )}
          </div>
        </div>
      </section>

      {/* Beteiligung */}
      <section className="relative overflow-hidden px-6 md:px-16 lg:px-24 py-12 md:py-24 border-b" style={{ background: 'white' }}>
        <Megaphone
          className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 h-[40%] w-auto opacity-[0.06] pointer-events-none"
          strokeWidth={1}
          aria-hidden="true"
          style={{ color: 'var(--plattform)' }}
        />
        <div className="relative z-10 w-full">
          <EyebrowBadge label={t('participationEyebrow')} opacity={0.6} />
          <h2 className="text-title font-black tracking-tight mb-2">
            {t.rich('participationTitle', { accent })}
          </h2>
          <p className="text-text mb-12 max-w-2xl" style={{ color: 'var(--plattform-ink)' }}>
            {t('participationBody')}
          </p>

          {/* Phasen-Stepper — dots on a connecting line, current phase in project colour */}
          <ol className="hidden md:flex mb-12" aria-label={t('rowPhase')}>
            {PROJEKTPHASEN.map((ph, i) => {
              const isCurrent = phase ? ph.step === phase.step : false
              const isDone = phase ? ph.step < phase.step : false
              const isLast = i === PROJEKTPHASEN.length - 1
              return (
                <li key={ph.value} className={isLast ? 'shrink-0' : 'flex-1'} aria-current={isCurrent ? 'step' : undefined}>
                  <div className="flex items-center">
                    <span
                      className="shrink-0 rounded-full"
                      style={{
                        width: isCurrent ? '1rem' : '0.75rem',
                        height: isCurrent ? '1rem' : '0.75rem',
                        background: isCurrent || isDone ? 'var(--plattform)' : 'var(--plattform-light)',
                        boxShadow: isCurrent ? '0 0 0 4px var(--plattform-light)' : undefined,
                      }}
                      aria-hidden
                    />
                    {!isLast && (
                      <span
                        className="flex-1 h-0.5 mx-2"
                        style={{ background: isDone ? 'var(--plattform)' : 'var(--plattform-light)' }}
                        aria-hidden
                      />
                    )}
                  </div>
                  <p
                    className={`text-small mt-3 pr-4 ${isCurrent ? 'font-semibold' : ''}`}
                    style={{
                      color: isCurrent ? 'var(--plattform-ink-accent)' : 'var(--plattform-ink)',
                      opacity: isCurrent ? 1 : isDone ? 0.7 : 0.4,
                    }}
                  >
                    {ph.step + 1}. {tax(`phase.${ph.value}`)}
                  </p>
                </li>
              )
            })}
          </ol>

          {/* Mobile: compact progress summary */}
          {phase && (
            <div className="md:hidden mb-12">
              <p className="text-small font-semibold mb-2.5" style={{ color: 'var(--plattform-ink)' }}>
                {t('phaseOf', { current: phase.step + 1, total: PROJEKTPHASEN.length })} · {tax(`phase.${phase.value}`)}
              </p>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--plattform-light)' }}>
                <div
                  className="h-full rounded-full"
                  style={{ background: 'var(--plattform)', width: `${((phase.step + 1) / PROJEKTPHASEN.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {beteiligungsvorhabenHtml && (
            <div
              className="max-w-3xl prose text-text leading-relaxed mb-12"
              style={{ color: 'var(--plattform-ink)' }}
              dangerouslySetInnerHTML={{ __html: beteiligungsvorhabenHtml }}
            />
          )}

          {joinEnabled && (
            <JoinRequestButton slug={project.slug} locale={locale} isLoggedIn={!!viewer} membershipStatus={membershipStatus} />
          )}
        </div>
      </section>

      {/* Aktuelles — public news & events. Blocks without content don't render:
          empty states are for members who can act on them, not for visitors. */}
      {hasAktuelles && (
        <section className="px-6 md:px-16 lg:px-24 py-12 md:py-24 border-b" style={{ background: 'var(--plattform-light)' }}>
          <div className="w-full">
            <EyebrowBadge label={t('aktuellesEyebrow')} opacity={0.6} />
            <h2 className="text-title font-black tracking-tight mb-12">
              {t.rich('aktuellesTitle', { accent })}
            </h2>

            <div className={`grid grid-cols-1 gap-12 items-start ${newsPosts.length > 0 && calEvents.length > 0 ? 'lg:grid-cols-2' : ''}`}>
              {/* News */}
              {newsPosts.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <Newspaper className="w-[1.2em] h-[1.2em] shrink-0" style={{ color: 'var(--plattform)' }} />
                    <h3 className="text-display font-black tracking-tight">{t('newsHeading')}</h3>
                    <a
                      href={`/api/rss?project=${project.slug}`}
                      className="ml-auto inline-flex items-center gap-1.5 text-small hover:underline"
                      style={{ color: 'var(--plattform-ink)', opacity: 0.5 }}
                    >
                      <Rss className="w-[1em] h-[1em] shrink-0" />
                      RSS
                    </a>
                  </div>
                  <div className="flex flex-col gap-4">
                    {newsPosts.map((n, i) => (
                      <div key={n.id} className="card-in" style={{ animationDelay: `${i * 60}ms` }}>
                        <Link
                          href={`/${locale}/projekte/${project.slug}/news/${n.slug}`}
                          className="group block bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all"
                        >
                          {n.publishedAt && (
                            <p className="text-small mb-1.5" style={{ color: 'var(--plattform-ink)', opacity: 0.5 }}>
                              {formatDate(n.publishedAt, dateLocale)}
                            </p>
                          )}
                          <p className="text-text font-bold group-hover:underline" style={{ color: 'var(--plattform-ink-accent)' }}>
                            {n.title}
                          </p>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Termine — upcoming, or the most recent past ones as history */}
              {calEvents.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <CalendarDays className="w-[1.2em] h-[1.2em] shrink-0" style={{ color: 'var(--plattform)' }} />
                    <h3 className="text-display font-black tracking-tight">
                      {eventsArePast ? t('termineVergangen') : t('termineHeading')}
                    </h3>
                  </div>
                  <div className="flex flex-col gap-4">
                    {calEvents.map((ev, i) => {
                      const d = new Date(ev.startDate)
                      return (
                        <div key={ev.id} className="card-in flex items-center gap-5 bg-white rounded-xl p-6 shadow-sm" style={{ animationDelay: `${i * 60}ms` }}>
                          <div
                            className="shrink-0 w-16 rounded-lg py-2 text-center"
                            style={{ background: 'var(--plattform-light)', opacity: eventsArePast ? 0.7 : 1 }}
                          >
                            <p className="text-display font-black leading-none" style={{ color: 'var(--plattform-ink-accent)' }}>
                              {d.toLocaleDateString(dateLocale, { day: '2-digit' })}
                            </p>
                            <p className="text-small uppercase tracking-widest" style={{ color: 'var(--plattform-ink)', opacity: 0.6 }}>
                              {d.toLocaleDateString(dateLocale, { month: 'short' }).replace('.', '')}
                            </p>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-text font-bold" style={{ color: 'var(--plattform-ink-accent)' }}>
                              {ev.title}
                            </p>
                            {ev.location && (
                              <p className="flex items-center gap-1.5 text-small mt-1" style={{ color: 'var(--plattform-ink)', opacity: 0.6 }}>
                                <MapPin className="w-[1em] h-[1em] shrink-0" />
                                {ev.location}
                              </p>
                            )}
                          </div>
                          {!eventsArePast && (
                            <a
                              href={`/api/ics/event/${ev.id}`}
                              title={t('addToCalendar')}
                              className="shrink-0 p-2 rounded-lg transition-opacity opacity-60 hover:opacity-100"
                              style={{ color: 'var(--plattform-ink)' }}
                            >
                              <Download className="w-[1.1em] h-[1.1em] shrink-0" />
                            </a>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Umfragen — public polls (themed for --project-* vars) */}
            {publicPolls.length > 0 && (
              <div className="mt-16" style={moduleThemeVars}>
                <div className="flex items-center gap-2 mb-6">
                  <BarChart3 className="w-[1.2em] h-[1.2em] shrink-0" style={{ color: 'var(--plattform)' }} />
                  <h3 className="text-display font-black tracking-tight">{t('pollsHeading')}</h3>
                </div>
                <PollsConsumption slug={project.slug} locale={locale} polls={publicPolls} loginHref={`/${locale}/login`} />
              </div>
            )}

            {/* Dateien — public files */}
            {publicFilesCount > 0 && (
              <div className="mt-16" style={moduleThemeVars}>
                <div className="flex items-center gap-2 mb-6">
                  <FolderOpen className="w-[1.2em] h-[1.2em] shrink-0" style={{ color: 'var(--plattform)' }} />
                  <h3 className="text-display font-black tracking-tight">{t('filesHeading')}</h3>
                </div>
                <FilesBrowse projectId={project.id} tier="public" hideTitle />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Galerie — grid for a few images, horizontal snap strip for many */}
      {galleryImages.length > 0 && (
        <section className="px-6 md:px-16 lg:px-24 py-12 md:py-24 border-b" style={{ background: 'white' }}>
          <div className="w-full">
            <EyebrowBadge label={t('galerieEyebrow')} opacity={0.6} />
            <h2 className="text-title font-black tracking-tight mb-12">
              {t.rich('galerieTitle', { accent })}
            </h2>
            <div
              className={
                galleryImages.length > 3
                  ? 'flex gap-6 overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-6 px-6 md:-mx-16 md:px-16 lg:-mx-24 lg:px-24'
                  : 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
              }
            >
              {galleryImages.map((img, i) => (
                <figure
                  key={i}
                  className={`rounded-xl shadow-sm overflow-hidden ${
                    galleryImages.length > 3 ? 'snap-start shrink-0 w-[85%] sm:w-[55%] lg:w-[38%]' : ''
                  }`}
                  style={{ background: 'var(--plattform-light)' }}
                >
                  <img
                    src={img.url}
                    alt={img.alt ?? img.caption ?? t('imageAlt', { title: project.title, n: i + 1 })}
                    className="w-full aspect-video object-cover"
                    loading="lazy"
                  />
                  {img.caption && (
                    <figcaption className="p-4 text-small" style={{ color: 'var(--plattform-ink)', opacity: 0.6 }}>
                      {img.caption}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Kontakt & Mitmachen */}
      <section className="relative overflow-hidden px-6 md:px-16 lg:px-24 py-12 md:py-24 border-b" style={{ background: 'var(--plattform-light)' }}>
        <HandHeart
          className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 h-[40%] w-auto opacity-10 pointer-events-none"
          strokeWidth={1}
          aria-hidden="true"
          style={{ color: 'var(--plattform)' }}
        />
        <div className="relative z-10 w-full">
          <EyebrowBadge label={t('joinEyebrow')} opacity={0.6} />
          <h2 className="text-title font-black tracking-tight mb-5">
            {t.rich('joinTitle', { accent })}
          </h2>
          <p className="text-text mb-12 max-w-2xl" style={{ color: 'var(--plattform-ink)' }}>
            {t('joinBody')}
          </p>

          {/* One consolidated contact card instead of four separate ones */}
          {hasKontakt && (
            <div className="bg-white rounded-xl shadow-sm p-8 mb-12 max-w-xl">
              {ansprechperson && (
                <div className="flex items-center gap-4 py-3 border-b last:border-0 first:pt-0 last:pb-0">
                  <UserRound className="w-5 h-5 shrink-0" style={{ color: 'var(--plattform)' }} />
                  <div className="min-w-0">
                    <p className="text-small" style={{ color: 'var(--plattform-ink)', opacity: 0.5 }}>{t('labelContact')}</p>
                    <p className="text-text font-bold break-words" style={{ color: 'var(--plattform-ink-accent)' }}>{ansprechperson}</p>
                  </div>
                </div>
              )}
              {kontakt.email && (
                <a href={`mailto:${kontakt.email}`} className="group flex items-center gap-4 py-3 border-b last:border-0 first:pt-0 last:pb-0">
                  <Mail className="w-5 h-5 shrink-0" style={{ color: 'var(--plattform)' }} />
                  <div className="min-w-0">
                    <p className="text-small" style={{ color: 'var(--plattform-ink)', opacity: 0.5 }}>{t('labelEmail')}</p>
                    <p className="text-text font-bold break-words group-hover:underline" style={{ color: 'var(--plattform-ink-accent)' }}>{kontakt.email}</p>
                  </div>
                </a>
              )}
              {kontakt.telefon && (
                <a href={`tel:${kontakt.telefon}`} className="group flex items-center gap-4 py-3 border-b last:border-0 first:pt-0 last:pb-0">
                  <Phone className="w-5 h-5 shrink-0" style={{ color: 'var(--plattform)' }} />
                  <div className="min-w-0">
                    <p className="text-small" style={{ color: 'var(--plattform-ink)', opacity: 0.5 }}>{t('labelPhone')}</p>
                    <p className="text-text font-bold break-words group-hover:underline" style={{ color: 'var(--plattform-ink-accent)' }}>{kontakt.telefon}</p>
                  </div>
                </a>
              )}
              {websiteHref && (
                <a href={websiteHref} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 py-3 border-b last:border-0 first:pt-0 last:pb-0">
                  <Globe className="w-5 h-5 shrink-0" style={{ color: 'var(--plattform)' }} />
                  <div className="min-w-0">
                    <p className="text-small" style={{ color: 'var(--plattform-ink)', opacity: 0.5 }}>{t('labelWebsite')}</p>
                    <p className="text-text font-bold break-words group-hover:underline" style={{ color: 'var(--plattform-ink-accent)' }}>{kontakt.website}</p>
                  </div>
                </a>
              )}
            </div>
          )}

          {joinEnabled && (
            <JoinRequestButton slug={project.slug} locale={locale} isLoggedIn={!!viewer} membershipStatus={membershipStatus} />
          )}
        </div>
      </section>

      <PublicFooter locale={locale} />
    </div>
  )
}
