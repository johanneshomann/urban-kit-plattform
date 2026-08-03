import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import type { Where } from 'payload'
import { EyebrowBadge } from '@/components/public/EyebrowBadge'
import { ProjectBackButton } from '@/components/public/ProjectBackButton'
import { CalendarDays, MapPin, Download } from 'lucide-react'

type Project = { id: string; title: string; slug: string; isPublic?: boolean | null }
type CalEvent = { id: string; title: string; startDate: string; location?: string | null }

async function getPublicEvents(slug: string): Promise<{ project: Project; upcoming: CalEvent[]; past: CalEvent[] } | null> {
  try {
    const payload = await getPayload({ config })
    const projectResult = await payload.find({
      collection: 'projects',
      where: { slug: { equals: slug } },
      depth: 0,
      limit: 1,
      overrideAccess: true,
    })
    const project = projectResult.docs[0] as unknown as Project | undefined
    if (!project || project.isPublic === false) return null

    const now = new Date().toISOString()
    const base: Where['and'] = [
      { project: { equals: project.id } },
      { visibility: { equals: 'PUBLIC' } },
    ]
    const [upcomingRes, pastRes] = await Promise.all([
      payload.find({
        collection: 'calendar-events',
        where: { and: [...(base ?? []), { startDate: { greater_than_equal: now } }] },
        sort: 'startDate',
        limit: 200,
        depth: 0,
        overrideAccess: true,
      }),
      payload.find({
        collection: 'calendar-events',
        where: { and: [...(base ?? []), { startDate: { less_than: now } }] },
        sort: '-startDate',
        limit: 200,
        depth: 0,
        overrideAccess: true,
      }),
    ])
    return {
      project,
      upcoming: upcomingRes.docs as unknown as CalEvent[],
      past: pastRes.docs as unknown as CalEvent[],
    }
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
  const data = await getPublicEvents(slug)
  if (!data) return { title: t('metaFallbackTitle') }
  return { title: `${t('termineAllTitle')} – ${data.project.title}` }
}

export default async function ProjectTermineIndexPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const t = await getTranslations({ locale, namespace: 'projectDetail' })
  const data = await getPublicEvents(slug)
  if (!data) notFound()
  const { project, upcoming, past } = data
  const dateLocale = locale === 'en' ? 'en-GB' : 'de-DE'

  const renderEvent = (ev: CalEvent) => {
    const d = new Date(ev.startDate)
    return (
      <li key={ev.id} className="flex items-center gap-5 bg-white rounded-xl p-6 border shadow-sm">
        <div className="shrink-0 w-16 rounded-lg py-2 text-center" style={{ background: 'var(--plattform-light)' }}>
          <p className="text-display font-black leading-none" style={{ color: 'var(--plattform-ink-accent)' }}>
            {d.toLocaleDateString(dateLocale, { day: '2-digit' })}
          </p>
          <p className="text-small uppercase tracking-widest" style={{ color: 'var(--plattform-ink)', opacity: 0.6 }}>
            {d.toLocaleDateString(dateLocale, { month: 'short' }).replace('.', '')}
          </p>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-text font-bold" style={{ color: 'var(--plattform-ink-accent)' }}>{ev.title}</p>
          <p className="text-small" style={{ color: 'var(--plattform-ink)', opacity: 0.6 }}>
            {d.toLocaleDateString(dateLocale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          {ev.location && (
            <p className="flex items-center gap-1.5 text-small mt-1" style={{ color: 'var(--plattform-ink)', opacity: 0.6 }}>
              <MapPin className="w-[1em] h-[1em] shrink-0" /> {ev.location}
            </p>
          )}
        </div>
        <a
          href={`/api/ics/event/${ev.id}`}
          title={t('addToCalendar')}
          className="shrink-0 p-2 rounded-lg transition-opacity opacity-60 hover:opacity-100"
          style={{ color: 'var(--plattform-ink)' }}
        >
          <Download className="w-[1.1em] h-[1.1em] shrink-0" />
        </a>
      </li>
    )
  }

  return (
    <div className="flex flex-col">
      {/* Hero — chip row, min-vh, no border into content */}
      <section className="relative min-h-[500px] overflow-hidden flex flex-col justify-center px-6 md:px-16 lg:px-24 py-16 md:py-24" style={{ background: 'var(--plattform-light)' }}>
        <CalendarDays
          className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 h-[40%] w-auto opacity-[0.06] pointer-events-none"
          strokeWidth={1}
          aria-hidden="true"
          style={{ color: 'var(--plattform)' }}
        />
        <div className="relative z-10 w-full" style={{ maxWidth: 'var(--plattform-content-width)' }}>
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <ProjectBackButton locale={locale} fallback={`/${locale}/projekte/${project.slug}`} />
            <EyebrowBadge label={t('termineBreadcrumbLabel')} style={{ alignSelf: 'center', marginBottom: 0 }} />
          </div>
          <h1 className="text-hero font-black leading-none tracking-tight mb-5">
            {t('termineAllTitle')}<span style={{ color: 'var(--plattform)' }}>.</span>
          </h1>
          <p className="text-text max-w-2xl" style={{ color: 'var(--plattform-ink)' }}>
            {t('termineSubtitle', { project: project.title })}
          </p>
        </div>
      </section>

      {/* Content — shared plattform content width, no border above */}
      <main className="mx-auto w-full max-w-[var(--plattform-content-width)] flex-1 px-6 md:px-16 py-12 md:py-20" style={{ background: 'var(--plattform-white)' }}>
        <div>
          <div className="flex items-center gap-2 mb-8">
            <CalendarDays className="w-[1.2em] h-[1.2em] shrink-0" style={{ color: 'var(--plattform)' }} />
            <h2 className="text-display font-black tracking-tight">{t('termineHeading')}</h2>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-text" style={{ color: 'var(--plattform-ink)', opacity: 0.5 }}>{t('noUpcoming')}</p>
          ) : (
            <ol className="flex flex-col gap-4">
              {upcoming.map(renderEvent)}
            </ol>
          )}

          {past.length > 0 && (
            <>
              <div className="flex items-center gap-2 mb-8 mt-16">
                <CalendarDays className="w-[1.2em] h-[1.2em] shrink-0" style={{ color: 'var(--plattform)', opacity: 0.5 }} />
                <h2 className="text-display font-black tracking-tight" style={{ opacity: 0.6 }}>{t('termineVergangen')}</h2>
              </div>
              <ol className="flex flex-col gap-4">
                {past.map(renderEvent)}
              </ol>
            </>
          )}
        </div>
      </main>

    </div>
  )
}
