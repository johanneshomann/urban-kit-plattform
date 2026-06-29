import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { PublicNavServer } from '@/components/public/PublicNavServer'
import { PublicFooter } from '@/components/public/PublicFooter'
import { EyebrowBadge } from '@/components/public/EyebrowBadge'
import { CtaButton } from '@/components/public/CtaButton'
import { ScrollHint } from '@/components/public/ScrollHint'
import { getCitySettings } from '@/lib/instance'
import { Flag, Landmark, Circle, Info } from 'lucide-react'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'about' })
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  }
}

// Rich-text tag renderers for decorative headings / emphasis.
const accent = (chunks: ReactNode) => <span style={{ color: 'var(--plattform)' }}>{chunks}</span>
const kit = (chunks: ReactNode) => <span style={{ color: 'var(--plattform)' }}>{chunks}</span>
const strong = (chunks: ReactNode) => <strong>{chunks}</strong>

export default async function UeberUrbanKITPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const [{ cityName }, t] = await Promise.all([
    getCitySettings(),
    getTranslations({ locale, namespace: 'about' }),
  ])

  return (
    <div className="min-h-svh flex flex-col">
      <PublicNavServer locale={locale} />

      {/* Hero */}
      <section className="relative min-h-[calc(100svh-3.5rem)] flex flex-col justify-start px-6 md:px-16 lg:px-24 pt-20 pb-10 md:pt-28 md:pb-20 border-b overflow-hidden" style={{ background: 'var(--plattform-light)' }}>
        <Info
          className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 h-[45%] w-auto opacity-10 pointer-events-none"
          strokeWidth={1}
          aria-hidden="true"
          style={{ color: 'var(--plattform)' }}
        />
        <ScrollHint />
        <div className="relative z-10 max-w-2xl">
          <EyebrowBadge label={t('heroEyebrow')} opacity={0.6} />
          <h1 className="text-hero font-black leading-none tracking-tight mb-5">
            {t.rich('heroTitle', { kit, accent })}
          </h1>
          <p className="text-text leading-relaxed max-w-2xl">
            {t('heroBody', { city: cityName })}
          </p>
        </div>
      </section>

      {/* Stadt & Entwicklung */}
      <section className="relative overflow-hidden min-h-svh flex flex-col justify-center px-6 md:px-16 lg:px-24 py-12 md:py-24 border-b" style={{ background: 'var(--plattform-light)' }}>
        {/* Ghost illustration */}
        <Landmark
          className="absolute right-16 top-1/2 -translate-y-1/2 h-[45%] w-auto opacity-10 pointer-events-none"
          strokeWidth={1}
          aria-hidden="true"
          style={{ color: 'var(--plattform)' }}
        />

        <div className="relative z-10 w-full">
          <EyebrowBadge label={t('bgEyebrow')} opacity={0.6} />
          <h2 className="text-title font-black tracking-tight mb-10 max-w-5xl">
            {t.rich('bgTitle', { accent })}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-4">
            <p className="text-text leading-relaxed" style={{ color: 'var(--plattform-ink)' }}>
              {t.rich('bgP1', { city: cityName, strong })}
            </p>
            <p className="text-text leading-relaxed" style={{ color: 'var(--plattform-ink)' }}>
              {t('bgP2')}
            </p>
            <p className="text-text leading-relaxed md:col-span-1" style={{ color: 'var(--plattform-ink)' }}>
              {t('bgP3')}
            </p>
          </div>
        </div>
      </section>

      {/* Drei Bereiche */}
      <section className="min-h-svh flex flex-col justify-center px-6 md:px-16 lg:px-24 py-12 md:py-24 border-b" style={{ background: 'var(--plattform-light)' }}>
        <div className="w-full">
          <EyebrowBadge label={t('platformEyebrow')} opacity={0.6} />
          <h2 className="text-title font-black tracking-tight mb-2">
            {t.rich('sectionsTitle', { accent })}
          </h2>
          <p className="text-text mb-12 max-w-2xl" style={{ color: 'var(--plattform-ink)' }}>
            {t('sectionsBody')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href={`/${locale}/bereich/projekte-archiv`} className="group block bg-white rounded-xl p-8 border hover:shadow-md hover:bg-[var(--projekte-light)] transition-all min-h-48">
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

            <Link href={`/${locale}/bereich/zusammenarbeit`} className="group block bg-white rounded-xl p-8 border hover:shadow-md hover:bg-[var(--zusammenarbeit-light)] transition-all min-h-48">
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

            <Link href={`/${locale}/bereich/grundlagen`} className="group block bg-white rounded-xl p-8 border hover:shadow-md hover:bg-[var(--grundlagen-light)] transition-all min-h-48">
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

      {/* CTA */}
      <section className="min-h-svh flex flex-col justify-center px-6 md:px-16 lg:px-24 py-12 md:py-24" style={{ background: 'var(--plattform-light)' }}>
        <EyebrowBadge label={t('ctaEyebrow')} opacity={0.6} />
        <h2 className="text-hero font-black leading-none tracking-tight mb-5">
          {t.rich('ctaTitle', { accent })}
        </h2>
        <p className="text-text leading-relaxed mb-10 max-w-sm">
          {t('ctaBody')}
        </p>
        <div className="flex">
          <CtaButton href={`/${locale}/starten`} label={t('ctaButton')} icon={<Flag />} />
        </div>
      </section>

      <PublicFooter locale={locale} />
    </div>
  )
}
