import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getTranslations } from 'next-intl/server'
import { PublicNavServer } from '@/components/public/PublicNavServer'
import { PublicFooter } from '@/components/public/PublicFooter'
import { EyebrowBadge } from '@/components/public/EyebrowBadge'
import { getCitySettings } from '@/lib/instance'
import { FolderOpen } from 'lucide-react'
import { ScrollHint } from '@/components/public/ScrollHint'
import { CardSlider } from '@/components/public/CardSlider'
import { SectionDotsNav } from '@/components/public/SectionDotsNav'
import { BereichThemeScope } from '@/components/public/BereichThemeScope'
import { AlleProjekteClient } from './alle-projekte/AlleProjekteClient'
import type { Project } from './alle-projekte/ProjectLibrary'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'projekteArchiv' })
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  }
}

// Rich-text tag renderers for decorative headings.
// Text accent on light backgrounds — `--projekte-accent` is the dark orange
// (the `-dark` token is tuned lighter for chip/hero backgrounds).
const accentP = (chunks: ReactNode) => <span style={{ color: 'var(--projekte-accent)' }}>{chunks}</span>
const br = () => <br />

async function getProjects(): Promise<Project[]> {
  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'projects',
      where: { isPublic: { equals: true } },
      sort: '-createdAt',
      limit: 200,
      depth: 1,
      overrideAccess: true,
    })
    return result.docs as unknown as Project[]
  } catch {
    return []
  }
}

export default async function BereichProjektePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const [{ cityName }, projects, t, tax, nav] = await Promise.all([
    getCitySettings(),
    getProjects(),
    getTranslations({ locale, namespace: 'projekteArchiv' }),
    getTranslations({ locale, namespace: 'taxonomy' }),
    getTranslations({ locale, namespace: 'publicNav' }),
  ])

  const active = projects.filter((p) => p.status === 'active')

  return (
    <div className="min-h-svh flex flex-col">
      <PublicNavServer locale={locale} />
      <BereichThemeScope accent="var(--projekte-dark)" onBrand="var(--projekte-on-brand)" />
      <SectionDotsNav
        label={nav('areaProjects')}
        dotColor="var(--projekte-accent)"
        activeColor="var(--projekte-dark)"
        switchIconColor="var(--projekte-on-brand)"
        labelColor="var(--projekte-on-brand)"
        items={[
          { id: 'hero', label: nav('overview'), icon: 'Home' },
          { id: 'alle-projekte', label: t('ctaAll'), icon: 'Folders' },
        ]}
        switchPages={[
          { href: `/${locale}/bereich/zusammenarbeit`, label: nav('areaCollab'), icon: 'Users', color: 'var(--zusammenarbeit-dark)', iconColor: 'var(--zusammenarbeit-on-brand)' },
          { href: `/${locale}/bereich/grundlagen`, label: nav('areaBasics'), icon: 'BookOpen', color: 'var(--grundlagen-dark)', iconColor: 'var(--grundlagen-on-brand)' },
        ]}
      />

      {/* Hero — Bereich scheme: main-tinted hero, light content sections */}
      <section id="hero" className="relative flex-1 min-h-[calc(100svh-3.5rem)] flex flex-col overflow-hidden" style={{ background: 'var(--projekte)' }}>
        <ScrollHint color="var(--projekte-dark)" label={nav('scrollMore')} />
        <FolderOpen
          className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 h-[45%] w-auto opacity-10 pointer-events-none"
          strokeWidth={1}
          aria-hidden="true"
          style={{ color: 'var(--projekte-dark)' }}
        />

        {/* Main content — left-aligned, upper area */}
        <div className="relative z-10 flex-1 flex flex-col justify-start px-6 pt-20 md:pt-28 md:px-16 lg:px-24">
          <EyebrowBadge label={t('heroEyebrow')} bg="var(--projekte-dark)" color="var(--projekte-on-brand)" />
          <h1 className="text-hero font-black leading-none tracking-tight mb-5">
            {t.rich('heroTitle', { accentP, br })}
          </h1>
          <p className="text-text leading-relaxed max-w-2xl" style={{ color: 'var(--plattform-ink)' }}>
            {t('heroBody')}
          </p>
        </div>
      </section>

      {/* About this Bereich — hero's counterpart in the starting area; the current
          project showcase is part of this block; fades into Alle Projekte */}
      <section id="intro" className="relative overflow-hidden min-h-svh flex flex-col justify-center px-6 md:px-16 lg:px-24 pt-16 pb-32 md:pt-24 md:pb-48" style={{ background: 'linear-gradient(to bottom, var(--projekte) calc(100% - var(--section-fade-height)), var(--projekte-light))' }}>
        <div className="relative z-10 w-full">
          <div className="max-w-4xl">
            <EyebrowBadge label={nav('aboutBereich')} bg="var(--projekte-dark)" color="var(--projekte-on-brand)" />
            <h2 className="text-title font-black tracking-tight mb-10">
              {t.rich('introTitle', { accentP })}
            </h2>
            <div className="flex flex-col gap-4">
              <p className="text-text leading-relaxed" style={{ color: 'var(--plattform-ink)' }}>
                {t('introP1', { city: cityName })}
              </p>
              <p className="text-text leading-relaxed" style={{ color: 'var(--plattform-ink)' }}>
                {t('introP2')}
              </p>
            </div>
          </div>

          {/* Aktuelle Projekte — showcase inside the about block */}
          <div id="laufend" className="mt-16 md:mt-24">
            {active.length === 0 ? (
              <p className="text-text" style={{ color: 'var(--plattform-ink)' }}>{t('empty')}</p>
            ) : (
              <CardSlider locale={locale}>

              {active.slice(0, 5).map((p, i) => {
                const cover = p.coverImage && typeof p.coverImage === 'object' ? p.coverImage.url : null
                const projYear = p.startYear ?? new Date(p.createdAt).getFullYear()
                return (
                  <div key={p.id} className="card-in snap-start shrink-0 basis-full md:basis-[calc(50%-0.75rem)] lg:basis-[calc(33.333%-1rem)]" style={{ animationDelay: `${Math.min(i * 40, 320)}ms` }}>
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
                            <span className="text-small font-semibold px-3 py-1 rounded-full bg-white shadow-sm" style={{ color: 'var(--plattform-ink)' }}>
                              {tax(`status.${p.status}`)}
                            </span>
                          ) : <span />}
                          <span className="text-small font-semibold px-2.5 py-1 rounded-full bg-white shadow-sm" style={{ color: 'var(--plattform-ink)' }}>{projYear}</span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex flex-col gap-4 p-7 flex-1">
                        <h3 className="text-display font-black leading-tight tracking-tight" style={{ color: 'var(--plattform-ink-accent)' }}>
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
            </CardSlider>
            )}
          </div>
        </div>
      </section>

      {/* Alle Projekte — merged chapter: content hero + filterable library */}
      <AlleProjekteClient projects={projects} locale={locale} />

      <PublicFooter locale={locale} />
    </div>
  )
}
