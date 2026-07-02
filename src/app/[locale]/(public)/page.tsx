import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { PublicNavServer } from '@/components/public/PublicNavServer'
import { PublicFooter } from '@/components/public/PublicFooter'
import { HeroSlideshow, type HeroImage } from '@/components/public/HeroSlideshow'
import { EyebrowBadge } from '@/components/public/EyebrowBadge'
import { CtaButton } from '@/components/public/CtaButton'
import { getCitySettings } from '@/lib/instance'
import { MessageCircleQuestion, Flag, FolderOpen, Info, HandHeart, Circle } from 'lucide-react'
import { ScrollHint } from '@/components/public/ScrollHint'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const base = process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://urbankit.de'
  const { cityName } = await getCitySettings()
  const t = await getTranslations({ locale, namespace: 'home' })
  const title = t('metaTitle', { city: cityName })
  const description = t('metaDescription', { city: cityName })
  return {
    title,
    description,
    alternates: { canonical: `${base}/${locale}` },
    openGraph: {
      title,
      description,
      url: `${base}/${locale}`,
      type: 'website',
    },
  }
}

// Rich-text tag renderers for decorative headings (colored accent marks, the
// "KIT" brand highlight, and line breaks). Keeps word order localizable.
const accent = (chunks: ReactNode) => <span style={{ color: 'var(--plattform)' }}>{chunks}</span>
const pcolon = (chunks: ReactNode) => <span style={{ color: 'var(--projekte)' }}>{chunks}</span>
const kit = (chunks: ReactNode) => <span style={{ color: 'var(--plattform)' }}>{chunks}</span>
const br = () => <br />

async function getHeroImages(): Promise<HeroImage[]> {
  try {
    const payload = await getPayload({ config })
    const settings = await payload.findGlobal({ slug: 'platform-settings', depth: 1, overrideAccess: true })
    const raw = (settings as unknown as { heroImages?: { image: { url?: string; alt?: string }; caption?: string }[] }).heroImages ?? []
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? ''
    return raw
      .filter((item) => item.image?.url)
      .map((item) => ({
        url: item.image.url!.startsWith('http') ? item.image.url! : `${serverUrl}${item.image.url}`,
        alt: item.image.alt,
        caption: item.caption,
      }))
  } catch {
    return []
  }
}

interface ActiveProject {
  id: string
  title: string
  slug: string
  shortDescription?: string
  status?: string
  thema?: string[]
  startYear?: number
  createdAt: string
  coverImage?: { url?: string | null } | string | null
}

async function getActiveProjects(): Promise<ActiveProject[]> {
  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'projects',
      where: { and: [{ status: { equals: 'active' } }, { isPublic: { equals: true } }] },
      limit: 4,
      depth: 1,
      overrideAccess: true,
    })
    return result.docs as unknown as ActiveProject[]
  } catch {
    return []
  }
}

export default async function PublicHomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const [{ cityName, cityLogoUrl }, projects, heroImages, t, tax] = await Promise.all([
    getCitySettings(),
    getActiveProjects(),
    getHeroImages(),
    getTranslations({ locale, namespace: 'home' }),
    getTranslations({ locale, namespace: 'taxonomy' }),
  ])

  return (
    <div className="min-h-svh flex flex-col">
      <PublicNavServer locale={locale} />

      {/* Hero */}
      <section className="relative flex-1 min-h-[calc(100svh-3.5rem)] flex flex-col overflow-hidden border-b bg-[var(--plattform-light)]">
        <ScrollHint />
        <HeroSlideshow images={heroImages} overlayClass="bg-white/78" />

        {/* Logo — top right */}
        {cityLogoUrl && (
          <div className="absolute top-0 right-0 z-10 px-6 pt-20 md:pt-28 md:px-16 lg:px-24">
            <img src={cityLogoUrl} alt={cityName} className="h-16 w-auto object-contain" />
          </div>
        )}

        {/* Main content — left-aligned, upper area */}
        <div className="relative z-10 flex-1 flex flex-col justify-start px-6 pt-20 md:pt-28 md:px-16 lg:px-24">
          {/* Eyebrow */}
          <EyebrowBadge label={t('heroEyebrow', { city: cityName })} opacity={0.6} />

          {/* Headline */}
          <h1 className="text-hero font-black leading-none tracking-tight mb-5">
            {t.rich('heroTitle', { city: cityName, accent, br })}
          </h1>

          {/* Body */}
          <p className="text-text leading-relaxed max-w-2xl">
            {t('heroBody', { city: cityName })}
          </p>
        </div>

        {/* CTAs — bottom right, stacked */}
        <div className="relative z-10 flex flex-col items-end gap-3 px-6 pb-8 md:pb-14 md:px-16 lg:px-24 self-end">
          <CtaButton href={`/${locale}/starten`} label={t('ctaStart')} icon={<Flag />} wide />
          <CtaButton href={`/${locale}#aktuelle-projekte`} label={t('ctaCurrentProjects')} icon={<FolderOpen />} wide />
        </div>
      </section>

      {/* Was ist UrbanKIT */}
      <section className="relative overflow-hidden min-h-svh flex flex-col justify-center px-6 md:px-16 lg:px-24 pt-8 pb-14 md:pt-12 md:pb-28 border-b" style={{ background: 'var(--plattform-light)' }}>
        {/* Decorative map pin */}
        <MessageCircleQuestion
          className="absolute right-16 top-1/2 -translate-y-1/2 h-[45%] w-auto opacity-10 pointer-events-none"
          strokeWidth={1}
          aria-hidden="true"
          style={{ color: 'var(--plattform)' }}
        />

        <div className="relative z-10 max-w-2xl">
          {/* Eyebrow */}
          <EyebrowBadge label={t('aboutEyebrow')} opacity={0.6} />

          {/* Headline */}
          <h2 className="text-title font-black tracking-tight mb-5">
            {t.rich('aboutTitle', { kit })}
          </h2>

          {/* Body */}
          <p className="text-text leading-relaxed mb-12">
            {t('aboutBody', { city: cityName })}
          </p>

          {/* CTA */}
          <CtaButton href={`/${locale}/ueber-urbankit`} label={t('aboutCta')} icon={<Info />} />
        </div>
      </section>

      {/* Drei Bereiche */}
      <section className="min-h-svh flex flex-col justify-center pt-8 pb-14 md:pt-12 md:pb-28 px-6 md:px-16 lg:px-24 border-b" style={{ background: 'var(--plattform-light)' }}>
        <div className="w-full">
          <EyebrowBadge label={t('sectionsEyebrow')} opacity={0.6} />
          <h2 className="text-title font-black tracking-tight mb-2">
            {t.rich('sectionsTitle', { accent })}
          </h2>
          <p className="text-text mb-12 max-w-2xl">
            {t('sectionsBody')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href={`/${locale}/bereich/projekte-archiv`} className="group block bg-white rounded-xl p-8 border hover:shadow-md hover:bg-[var(--projekte-light)] transition-all">
              <div className="flex items-center gap-3 mb-5">
                <Circle className="text-display w-[0.8em] h-[0.8em] shrink-0" fill="currentColor" strokeWidth={0} style={{ color: 'var(--projekte-dark)' }} />
                <h3 className="text-display font-black tracking-tight transition-colors" style={{ color: 'var(--projekte-dark)' }}>
                  {t('areaProjectsTitle')}
                </h3>
              </div>
              <p className="text-text" style={{ color: 'var(--plattform-ink)' }}>
                {t('areaProjectsBody')}
              </p>
            </Link>
            <Link href={`/${locale}/bereich/zusammenarbeit`} className="group block bg-white rounded-xl p-8 border hover:shadow-md hover:bg-[var(--zusammenarbeit-light)] transition-all">
              <div className="flex items-center gap-3 mb-5">
                <Circle className="text-display w-[0.8em] h-[0.8em] shrink-0" fill="currentColor" strokeWidth={0} style={{ color: 'var(--zusammenarbeit-dark)' }} />
                <h3 className="text-display font-black tracking-tight transition-colors" style={{ color: 'var(--zusammenarbeit-dark)' }}>
                  {t('areaCollabTitle')}
                </h3>
              </div>
              <p className="text-text" style={{ color: 'var(--plattform-ink)' }}>
                {t('areaCollabBody')}
              </p>
            </Link>
            <Link href={`/${locale}/bereich/grundlagen`} className="group block bg-white rounded-xl p-8 border hover:shadow-md hover:bg-[var(--grundlagen-light)] transition-all">
              <div className="flex items-center gap-3 mb-5">
                <Circle className="text-display w-[0.8em] h-[0.8em] shrink-0" fill="currentColor" strokeWidth={0} style={{ color: 'var(--grundlagen-dark)' }} />
                <h3 className="text-display font-black tracking-tight transition-colors" style={{ color: 'var(--grundlagen-dark)' }}>
                  {t('areaBasicsTitle')}
                </h3>
              </div>
              <p className="text-text" style={{ color: 'var(--plattform-ink)' }}>
                {t('areaBasicsBody')}
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* Aktuelle Projekte */}
      <section id="aktuelle-projekte" className="min-h-svh flex flex-col justify-center pt-8 pb-14 md:pt-12 md:pb-28 px-6 md:px-16 lg:px-24 border-b" style={{ background: 'var(--projekte-light)' }}>
        <div className="w-full">
          <EyebrowBadge label={t('projectsEyebrow')} bg="var(--projekte)" color="var(--plattform-ink)" />
          <h2 className="text-title font-black tracking-tight mb-2">
            {t.rich('projectsTitle', { pcolon })}
          </h2>
          <p className="text-text mb-12 max-w-2xl">
            {t('projectsBody')}
          </p>
          {projects.length === 0 ? (
            <p className="text-text" style={{ color: 'var(--plattform-ink)' }}>{t('projectsEmpty')}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {projects.map((p, i) => {
                const cover = p.coverImage && typeof p.coverImage === 'object' ? p.coverImage.url : null
                const projYear = p.startYear ?? new Date(p.createdAt).getFullYear()
                return (
                  <div key={p.id} className="card-in" style={{ animationDelay: `${Math.min(i * 40, 320)}ms` }}>
                    <Link
                      href={`/${locale}/projekte/${p.slug}`}
                      className="group relative flex flex-col h-full rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all"
                    >
                      {/* Cover image strip */}
                      <div className="relative h-44 sm:h-56 w-full overflow-hidden shrink-0" style={{ background: 'var(--projekte-light)' }}>
                        {cover ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={cover} alt="" aria-hidden className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FolderOpen className="w-1/3 h-1/3 opacity-20" strokeWidth={1} aria-hidden style={{ color: 'var(--projekte-dark)' }} />
                          </div>
                        )}
                        <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 p-3">
                          {p.status ? (
                            <span className="text-small font-semibold px-3 py-1 rounded-full bg-white shadow-sm" style={{ color: 'var(--projekte-dark)' }}>
                              {tax(`status.${p.status}`)}
                            </span>
                          ) : <span />}
                          <span className="text-small font-semibold px-2.5 py-1 rounded-full bg-white shadow-sm" style={{ color: 'var(--plattform-ink)' }}>{projYear}</span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex flex-col gap-4 p-7 flex-1">
                        <h3 className="text-display font-black leading-tight tracking-tight" style={{ color: 'var(--projekte-dark)' }}>
                          {p.title}
                        </h3>
                        {p.shortDescription && (
                          <p className="text-small line-clamp-3" style={{ color: 'var(--plattform-ink)', opacity: 0.7 }}>{p.shortDescription}</p>
                        )}
                        {(p.thema ?? []).length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-auto">
                            {(p.thema ?? []).map((th) => (
                              <span key={th} className="text-small px-3 py-0.5 rounded-full" style={{ background: 'var(--projekte-light)', color: 'var(--plattform-ink)' }}>
                                {tax(`thema.${th}`)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
          <CtaButton href={`/${locale}/bereich/projekte-archiv/alle-projekte`} label={t('projectsAllCta')} icon={<FolderOpen />} variant="projekte" />
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden min-h-svh flex flex-col justify-center pt-8 pb-14 md:pt-12 md:pb-28 px-6 md:px-16 lg:px-24 border-b" style={{ background: 'var(--plattform-light)' }}>
        <HandHeart
          className="absolute right-16 top-1/2 -translate-y-1/2 h-[45%] w-auto opacity-10 pointer-events-none"
          strokeWidth={1}
          aria-hidden="true"
          style={{ color: 'var(--plattform)' }}
        />
        <div className="relative z-10 max-w-4xl">
          <EyebrowBadge label={t('joinEyebrow')} opacity={0.6} />
          <h2 className="text-hero font-black leading-none tracking-tight mb-5">
            {t.rich('joinTitle', { city: cityName, accent })}
          </h2>
          <p className="text-text mb-12">
            {t('joinBody', { city: cityName })}
          </p>
          <CtaButton href={`/${locale}/starten`} label={t('joinCta')} icon={<Flag />} />
        </div>
      </section>

      <PublicFooter locale={locale} />
    </div>
  )
}
