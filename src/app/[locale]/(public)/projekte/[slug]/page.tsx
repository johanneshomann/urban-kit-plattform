import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'
import { PublicNavServer } from '@/components/public/PublicNavServer'
import { PublicFooter } from '@/components/public/PublicFooter'
import { EyebrowBadge } from '@/components/public/EyebrowBadge'
import { CtaButton } from '@/components/public/CtaButton'
import { ScrollHint } from '@/components/public/ScrollHint'
import { resolveColorScheme } from '@/lib/colorScheme'
import { projectDefaults } from '@/lib/defaults/project'
import { PROJEKTPHASEN } from '@/lib/options/projektphasen'
import {
  THEMA_OPTIONS,
  STADTBEREICH_OPTIONS,
  ALTERSGRUPPE_OPTIONS,
  GENDER_OPTIONS,
} from '@/lib/options/project-fields'
import {
  Flag,
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
} from 'lucide-react'

const STATUS_LABELS: Record<string, string> = {
  active: 'Laufend',
  planning: 'In Planung',
  completed: 'Abgeschlossen',
  archived: 'Archiviert',
}

const labelMap = (opts: { label: string; value: string }[]) =>
  Object.fromEntries(opts.map((o) => [o.value, o.label]))

const THEMA_LABELS = labelMap(THEMA_OPTIONS)
const STADTBEREICH_LABELS = labelMap(STADTBEREICH_OPTIONS)
const ALTERSGRUPPE_LABELS = labelMap(ALTERSGRUPPE_OPTIONS)
const GENDER_LABELS = labelMap(GENDER_OPTIONS)

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
  const project = await getPublicProject(slug)
  if (!project) return { title: 'Projekt – UrbanKIT' }

  const base = process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://urbankit.de'
  const description = project.shortDescription ?? `Informiere dich über das Projekt ${project.title} und gestalte aktiv mit.`
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

const formatDate = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })
    : null

export default async function PublicProjectPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const project = await getPublicProject(slug)
  if (!project) notFound()

  const payload = await getPayload({ config })
  const scheme = resolveColorScheme(project.colorScheme)
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
              { publishedAt: { exists: true } },
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
  const calEvents = eventsResult.docs as unknown as CalEvent[]
  const hasAktuelles = newsPosts.length > 0 || calEvents.length > 0

  // richText → HTML
  const beschreibungHtml = project.projektbeschreibung
    ? convertLexicalToHTML({ data: project.projektbeschreibung as Parameters<typeof convertLexicalToHTML>[0]['data'] })
    : null
  const beteiligungsvorhabenHtml = project.beteiligungsvorhaben
    ? convertLexicalToHTML({ data: project.beteiligungsvorhaben as Parameters<typeof convertLexicalToHTML>[0]['data'] })
    : null

  // Steckbrief rows — only filled fields
  const steckbrief = [
    project.status ? { label: 'Status', value: STATUS_LABELS[project.status] ?? project.status } : null,
    phase ? { label: 'Projektphase', value: `${phase.step + 1}/7 · ${phase.label}` } : null,
    project.startYear ? { label: 'Startjahr', value: String(project.startYear) } : null,
    (project.thema ?? []).length > 0
      ? { label: 'Thema', value: (project.thema ?? []).map((v) => THEMA_LABELS[v] ?? v).join(', ') }
      : null,
    (project.stadtbereich ?? []).length > 0
      ? { label: 'Stadtbereich', value: (project.stadtbereich ?? []).map((v) => STADTBEREICH_LABELS[v] ?? v).join(', ') }
      : null,
    (project.altersgruppe ?? []).length > 0
      ? { label: 'Altersgruppe', value: (project.altersgruppe ?? []).map((v) => ALTERSGRUPPE_LABELS[v] ?? v).join(', ') }
      : null,
    (project.gender ?? []).length > 0
      ? { label: 'Zielgruppe', value: (project.gender ?? []).map((v) => GENDER_LABELS[v] ?? v).join(', ') }
      : null,
  ].filter((d): d is { label: string; value: string } => d !== null)

  const galleryImages = (project.gallery ?? [])
    .filter((g) => !!g.image?.url)
    .map((g) => ({ url: g.image!.url!, alt: g.image?.alt ?? null, caption: g.caption ?? null }))

  const ansprechperson = project.ansprechperson
    ? [project.ansprechperson.firstName, project.ansprechperson.lastName].filter(Boolean).join(' ') ||
      project.ansprechperson.email ||
      null
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
        {/* Project colour bar — the page's "badge" */}
        <div className="absolute top-0 left-0 right-0 h-1.5 z-10" style={{ background: scheme.mid }} />
        <ScrollHint />

        <div className="relative z-10 flex-1 flex flex-col justify-start px-6 pt-20 md:pt-28 md:px-16 lg:px-24">
          <div className="flex flex-wrap items-center gap-2">
            <EyebrowBadge label="Projekt" bg={scheme.light} color={scheme.dark} />
            {project.status && (
              <span
                className="inline-flex items-center mb-4 px-3 py-1 rounded-md text-small font-semibold leading-none"
                style={{ background: scheme.mid, color: 'white' }}
              >
                {STATUS_LABELS[project.status] ?? project.status}
              </span>
            )}
          </div>

          <h1 className="text-hero font-black leading-none tracking-tight mb-5">
            {project.title}<span style={{ color: 'var(--plattform)' }}>.</span>
          </h1>

          {project.shortDescription && (
            <p className="text-text leading-relaxed max-w-2xl" style={{ color: 'var(--plattform-ink)' }}>
              {project.shortDescription}
            </p>
          )}
        </div>

        {/* CTAs — bottom right, stacked */}
        <div className="relative z-10 flex flex-col items-end gap-3 px-6 pb-8 md:pb-14 md:px-16 lg:px-24 self-end">
          <CtaButton href={`/${locale}/starten`} label="Jetzt mitmachen" icon={<Flag />} wide />
          <CtaButton href={`/${locale}/bereich/projekte-archiv/alle-projekte`} label="Alle Projekte" icon={<FolderOpen />} variant="white" wide />
        </div>
      </section>

      {/* Über das Projekt */}
      <section className="px-6 md:px-16 lg:px-24 py-12 md:py-24 border-b" style={{ background: 'var(--plattform-light)' }}>
        <div className="w-full">
          <EyebrowBadge label="Über das Projekt" opacity={0.6} />
          <h2 className="text-title font-black tracking-tight mb-10">
            Worum geht es<span style={{ color: 'var(--plattform)' }}>?</span>
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
            {beschreibungHtml ? (
              <div
                className="lg:col-span-2 prose max-w-none text-text leading-relaxed"
                style={{ color: 'var(--plattform-ink)' }}
                dangerouslySetInnerHTML={{ __html: beschreibungHtml }}
              />
            ) : (
              <p className="lg:col-span-2 text-text leading-relaxed" style={{ color: 'var(--plattform-ink)' }}>
                Für dieses Projekt liegt noch keine ausführliche Beschreibung vor.
              </p>
            )}

            {/* Steckbrief */}
            {steckbrief.length > 0 && (
              <aside className="bg-white rounded-xl border p-8">
                <h3 className="text-display font-black tracking-tight mb-4">Steckbrief</h3>
                <dl>
                  {steckbrief.map((row) => (
                    <div key={row.label} className="flex items-baseline justify-between gap-4 py-3 border-b last:border-0">
                      <dt className="text-small shrink-0" style={{ color: 'var(--plattform-ink)', opacity: 0.5 }}>
                        {row.label}
                      </dt>
                      <dd className="text-small font-semibold text-right" style={{ color: 'var(--plattform-ink)' }}>
                        {row.value}
                      </dd>
                    </div>
                  ))}
                </dl>
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
          <EyebrowBadge label="Beteiligung" opacity={0.6} />
          <h2 className="text-title font-black tracking-tight mb-2">
            So läuft die Beteiligung<span style={{ color: 'var(--plattform)' }}>.</span>
          </h2>
          <p className="text-text mb-12 max-w-2xl" style={{ color: 'var(--plattform-ink)' }}>
            Jedes Projekt durchläuft sieben Phasen – von der ersten Idee bis zum Abschluss. Hier siehst du, wo das Projekt gerade steht und wie du dich einbringen kannst.
          </p>

          {/* Phasen-Stepper — current phase carries the project colour */}
          <ol className="flex flex-wrap gap-2 mb-12">
            {PROJEKTPHASEN.map((ph) => {
              const isCurrent = phase ? ph.step === phase.step : false
              const isDone = phase ? ph.step < phase.step : false
              return (
                <li key={ph.value}>
                  <span
                    className="inline-flex items-center gap-1.5 text-small px-3 py-1.5 rounded-full border leading-none"
                    style={
                      isCurrent
                        ? { background: scheme.mid, borderColor: scheme.mid, color: 'white', fontWeight: 600 }
                        : isDone
                          ? { background: 'var(--plattform-light)', borderColor: 'transparent', color: 'var(--plattform-ink)', opacity: 0.7 }
                          : { borderColor: 'currentColor', color: 'var(--plattform-ink)', opacity: 0.4 }
                    }
                  >
                    {ph.step + 1}. {ph.label}
                  </span>
                </li>
              )
            })}
          </ol>

          {beteiligungsvorhabenHtml && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-12">
              <div
                className="lg:col-span-2 prose max-w-none text-text leading-relaxed"
                style={{ color: 'var(--plattform-ink)' }}
                dangerouslySetInnerHTML={{ __html: beteiligungsvorhabenHtml }}
              />
            </div>
          )}

          <CtaButton href={`/${locale}/starten`} label="Jetzt mitmachen" icon={<Flag />} />
        </div>
      </section>

      {/* Aktuelles — public news & upcoming events */}
      {hasAktuelles && (
        <section className="px-6 md:px-16 lg:px-24 py-12 md:py-24 border-b" style={{ background: 'var(--plattform-light)' }}>
          <div className="w-full">
            <EyebrowBadge label="Aktuelles" opacity={0.6} />
            <h2 className="text-title font-black tracking-tight mb-12">
              Neues aus dem Projekt<span style={{ color: 'var(--plattform)' }}>:</span>
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              {/* News */}
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Newspaper className="w-[1.2em] h-[1.2em] shrink-0" style={{ color: 'var(--plattform)' }} />
                  <h3 className="text-display font-black tracking-tight">News</h3>
                  <a
                    href={`/api/rss?project=${project.slug}`}
                    className="ml-auto inline-flex items-center gap-1.5 text-small hover:underline"
                    style={{ color: 'var(--plattform-ink)', opacity: 0.5 }}
                  >
                    <Rss className="w-[1em] h-[1em] shrink-0" />
                    RSS
                  </a>
                </div>
                {newsPosts.length === 0 ? (
                  <p className="text-text" style={{ color: 'var(--plattform-ink)', opacity: 0.5 }}>
                    Noch keine öffentlichen Beiträge.
                  </p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {newsPosts.map((n) => (
                      <Link
                        key={n.id}
                        href={`/${locale}/projekte/${project.slug}/news/${n.slug}`}
                        className="group block bg-white rounded-xl p-6 border hover:shadow-md transition-all"
                      >
                        {n.publishedAt && (
                          <p className="text-small mb-1.5" style={{ color: 'var(--plattform-ink)', opacity: 0.5 }}>
                            {formatDate(n.publishedAt)}
                          </p>
                        )}
                        <p className="text-text font-bold group-hover:underline" style={{ color: 'var(--plattform-ink-accent)' }}>
                          {n.title}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Termine */}
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <CalendarDays className="w-[1.2em] h-[1.2em] shrink-0" style={{ color: 'var(--plattform)' }} />
                  <h3 className="text-display font-black tracking-tight">Termine</h3>
                </div>
                {calEvents.length === 0 ? (
                  <p className="text-text" style={{ color: 'var(--plattform-ink)', opacity: 0.5 }}>
                    Keine anstehenden öffentlichen Termine.
                  </p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {calEvents.map((ev) => {
                      const d = new Date(ev.startDate)
                      return (
                        <div key={ev.id} className="flex items-center gap-5 bg-white rounded-xl p-6 border">
                          <div
                            className="shrink-0 w-16 rounded-lg py-2 text-center"
                            style={{ background: 'var(--plattform-light)' }}
                          >
                            <p className="text-display font-black leading-none" style={{ color: 'var(--plattform-ink-accent)' }}>
                              {d.toLocaleDateString('de-DE', { day: '2-digit' })}
                            </p>
                            <p className="text-small uppercase tracking-widest" style={{ color: 'var(--plattform-ink)', opacity: 0.6 }}>
                              {d.toLocaleDateString('de-DE', { month: 'short' }).replace('.', '')}
                            </p>
                          </div>
                          <div className="min-w-0">
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
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Galerie */}
      {galleryImages.length > 0 && (
        <section className="px-6 md:px-16 lg:px-24 py-12 md:py-24 border-b" style={{ background: 'white' }}>
          <div className="w-full">
            <EyebrowBadge label="Galerie" opacity={0.6} />
            <h2 className="text-title font-black tracking-tight mb-12">
              Einblicke<span style={{ color: 'var(--plattform)' }}>.</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {galleryImages.map((img, i) => (
                <figure key={i} className="rounded-xl border overflow-hidden" style={{ background: 'var(--plattform-light)' }}>
                  <img
                    src={img.url}
                    alt={img.alt ?? img.caption ?? `${project.title} – Bild ${i + 1}`}
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
          <EyebrowBadge label="Jetzt mitmachen" opacity={0.6} />
          <h2 className="text-title font-black tracking-tight mb-5">
            Gestalte das Projekt mit<span style={{ color: 'var(--plattform)' }}>.</span>
          </h2>
          <p className="text-text mb-12 max-w-2xl" style={{ color: 'var(--plattform-ink)' }}>
            Du hast Fragen oder möchtest dich aktiv einbringen? Melde dich bei den Ansprechpersonen oder werde direkt Teil des Projekts – kostenlos und offen für alle.
          </p>

          {hasKontakt && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 max-w-5xl">
              {ansprechperson && (
                <div className="bg-white rounded-xl border p-6">
                  <UserRound className="w-5 h-5 mb-3" style={{ color: 'var(--plattform)' }} />
                  <p className="text-small mb-1" style={{ color: 'var(--plattform-ink)', opacity: 0.5 }}>Ansprechperson</p>
                  <p className="text-text font-bold break-words" style={{ color: 'var(--plattform-ink-accent)' }}>{ansprechperson}</p>
                </div>
              )}
              {kontakt.email && (
                <a href={`mailto:${kontakt.email}`} className="group bg-white rounded-xl border p-6 hover:shadow-md transition-all">
                  <Mail className="w-5 h-5 mb-3" style={{ color: 'var(--plattform)' }} />
                  <p className="text-small mb-1" style={{ color: 'var(--plattform-ink)', opacity: 0.5 }}>E-Mail</p>
                  <p className="text-text font-bold break-words group-hover:underline" style={{ color: 'var(--plattform-ink-accent)' }}>{kontakt.email}</p>
                </a>
              )}
              {kontakt.telefon && (
                <a href={`tel:${kontakt.telefon}`} className="group bg-white rounded-xl border p-6 hover:shadow-md transition-all">
                  <Phone className="w-5 h-5 mb-3" style={{ color: 'var(--plattform)' }} />
                  <p className="text-small mb-1" style={{ color: 'var(--plattform-ink)', opacity: 0.5 }}>Telefon</p>
                  <p className="text-text font-bold break-words group-hover:underline" style={{ color: 'var(--plattform-ink-accent)' }}>{kontakt.telefon}</p>
                </a>
              )}
              {websiteHref && (
                <a href={websiteHref} target="_blank" rel="noopener noreferrer" className="group bg-white rounded-xl border p-6 hover:shadow-md transition-all">
                  <Globe className="w-5 h-5 mb-3" style={{ color: 'var(--plattform)' }} />
                  <p className="text-small mb-1" style={{ color: 'var(--plattform-ink)', opacity: 0.5 }}>Website</p>
                  <p className="text-text font-bold break-words group-hover:underline" style={{ color: 'var(--plattform-ink-accent)' }}>{kontakt.website}</p>
                </a>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <CtaButton href={`/${locale}/starten`} label="Jetzt starten" icon={<Flag />} />
            <CtaButton href={`/${locale}/bereich/projekte-archiv/alle-projekte`} label="Alle Projekte" icon={<FolderOpen />} variant="white" />
          </div>
        </div>
      </section>

      <PublicFooter locale={locale} />
    </div>
  )
}
