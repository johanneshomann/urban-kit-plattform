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
import { FolderOpen, Archive, Circle } from 'lucide-react'
import { ScrollHint } from '@/components/public/ScrollHint'
import { ProjekteFeatureAccordion } from './ProjekteFeatureAccordion'
import { CtaButton } from '@/components/public/CtaButton'

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
const accent = (chunks: ReactNode) => <span style={{ color: 'var(--plattform)' }}>{chunks}</span>
const accentP = (chunks: ReactNode) => <span style={{ color: 'var(--projekte-dark)' }}>{chunks}</span>
const pcolon = (chunks: ReactNode) => <span style={{ color: 'var(--projekte)' }}>{chunks}</span>
const br = () => <br />

async function getProjects() {
  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'projects',
      where: { isPublic: { equals: true } },
      sort: '-createdAt',
      overrideAccess: true,
    })
    return result.docs as unknown as { id: string; title: string; slug: string; shortDescription?: string; status?: string }[]
  } catch {
    return []
  }
}

export default async function BereichProjektePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const [{ cityName }, projects, t] = await Promise.all([
    getCitySettings(),
    getProjects(),
    getTranslations({ locale, namespace: 'projekteArchiv' }),
  ])

  const active = projects.filter((p) => p.status === 'active')
  const archived = projects.filter((p) => p.status !== 'active')

  return (
    <div className="min-h-svh flex flex-col">
      <PublicNavServer locale={locale} />

      {/* Hero */}
      <section className="relative flex-1 min-h-[calc(100svh-3.5rem)] flex flex-col overflow-hidden border-b" style={{ background: 'var(--projekte-light)' }}>
        <ScrollHint color="var(--projekte-dark)" />
        <FolderOpen
          className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 h-[45%] w-auto opacity-10 pointer-events-none"
          strokeWidth={1}
          aria-hidden="true"
          style={{ color: 'var(--projekte-dark)' }}
        />

        {/* Main content — left-aligned, upper area */}
        <div className="relative z-10 flex-1 flex flex-col justify-start px-6 pt-20 md:pt-28 md:px-16 lg:px-24">
          <EyebrowBadge label={t('heroEyebrow')} bg="var(--projekte)" color="var(--plattform-ink)" />
          <h1 className="text-hero font-black leading-none tracking-tight mb-5">
            {t.rich('heroTitle', { accentP, br })}
          </h1>
          <p className="text-text leading-relaxed max-w-2xl" style={{ color: 'var(--plattform-ink)' }}>
            {t('heroBody')}
          </p>
        </div>

        {/* CTAs — bottom right */}
        <div className="relative z-10 flex flex-col items-end gap-3 px-6 pb-8 md:pb-14 md:px-16 lg:px-24 self-end">
          <CtaButton href="#laufend" label={t('ctaActive')} icon={<FolderOpen />} variant="projekte" wide />
          <CtaButton href={`/${locale}/bereich/projekte-archiv/alle-projekte`} label={t('ctaAll')} icon={<Archive />} variant="projekte" wide />
        </div>
      </section>

      {/* Intro — Wieso, Weshalb & Warum */}
      <section className="relative overflow-hidden min-h-svh flex flex-col justify-center px-6 md:px-16 lg:px-24 py-12 md:py-24 border-b" style={{ background: 'var(--projekte-light)' }}>
        <FolderOpen
          className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 h-[40%] w-auto opacity-[0.07] pointer-events-none"
          strokeWidth={1}
          aria-hidden="true"
          style={{ color: 'var(--projekte-dark)' }}
        />
        <div className="relative z-10 w-full">
          <EyebrowBadge label={t('introEyebrow')} bg="var(--projekte)" color="var(--plattform-ink)" />
          <h2 className="text-title font-black tracking-tight mb-10 max-w-2xl">
            {t.rich('introTitle', { accentP })}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
            {/* Left */}
            <div className="flex flex-col gap-4">
              <p className="text-text leading-relaxed" style={{ color: 'var(--plattform-ink)' }}>
                {t('introP1', { city: cityName })}
              </p>
              <p className="text-text leading-relaxed" style={{ color: 'var(--plattform-ink)' }}>
                {t('introP2')}
              </p>
            </div>
            {/* Right */}
            <ProjekteFeatureAccordion />
          </div>
        </div>
      </section>

      {/* Aktuelle Projekte */}
      <section id="laufend" className="min-h-svh flex flex-col justify-center pt-8 pb-14 md:pt-12 md:pb-28 px-6 md:px-16 lg:px-24 border-b" style={{ background: 'var(--projekte-light)' }}>
        <div className="w-full">
          <EyebrowBadge label={t('activeEyebrow')} bg="var(--projekte)" color="var(--plattform-ink)" />
          <h2 className="text-title font-black tracking-tight mb-2">
            {t.rich('activeTitle', { pcolon })}
          </h2>
          <p className="text-text mb-12 max-w-2xl" style={{ color: 'var(--plattform-ink)' }}>
            {t('activeBody')}
          </p>
          {active.length === 0 ? (
            <p className="text-text mb-12" style={{ color: 'var(--plattform-ink)' }}>{t('empty')}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {active.map((p) => (
                <Link
                  key={p.id}
                  href={`/${locale}/projekte/${p.slug}`}
                  className="group block bg-white rounded-xl p-8 border hover:shadow-md hover:bg-[var(--projekte-light)] transition-all min-h-48"
                >
                  <h3 className="text-display font-black tracking-tight mb-5 transition-colors" style={{ color: 'var(--projekte-dark)' }}>
                    {p.title}
                  </h3>
                  {p.shortDescription && <p className="text-text line-clamp-2" style={{ color: 'var(--plattform-ink)' }}>{p.shortDescription}</p>}
                </Link>
              ))}
            </div>
          )}
          <CtaButton href={`/${locale}/bereich/projekte-archiv/alle-projekte`} label={t('allCta')} icon={<FolderOpen />} variant="projekte" />
        </div>
      </section>

      {/* Archiv */}
      {archived.length > 0 && (
        <section id="archiv" className="relative overflow-hidden min-h-svh flex flex-col justify-center pt-8 pb-14 md:pt-12 md:pb-28 px-6 md:px-16 lg:px-24 border-b" style={{ background: 'white' }}>
          <Archive
            className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 h-[40%] w-auto opacity-[0.06] pointer-events-none"
            strokeWidth={1}
            aria-hidden="true"
            style={{ color: 'var(--plattform-ink)' }}
          />
          <div className="relative z-10 w-full">
            <EyebrowBadge label={t('archiveEyebrow')} opacity={0.5} />
            <h2 className="text-title font-black tracking-tight mb-2">
              {t.rich('archiveTitle', { accent })}
            </h2>
            <p className="text-text mb-12 max-w-2xl" style={{ color: 'var(--plattform-ink)' }}>
              {t('archiveBody')}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {archived.map((p) => (
                <Link
                  key={p.id}
                  href={`/${locale}/projekte/${p.slug}`}
                  className="group block bg-[var(--plattform-light)] rounded-xl p-8 border hover:shadow-md transition-all min-h-48"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Circle className="w-[0.55em] h-[0.55em] shrink-0 opacity-40" fill="currentColor" strokeWidth={0} style={{ color: 'var(--plattform-ink)' }} />
                    <h3 className="text-display font-black tracking-tight" style={{ color: 'var(--plattform-ink-accent)' }}>
                      {p.title}
                    </h3>
                  </div>
                  {p.shortDescription && <p className="text-text line-clamp-2" style={{ color: 'var(--plattform-ink)' }}>{p.shortDescription}</p>}
                  <span className="inline-block mt-4 text-small opacity-50" style={{ color: 'var(--plattform-ink)' }}>{t('archivedBadge')}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}


<PublicFooter locale={locale} />
    </div>
  )
}
