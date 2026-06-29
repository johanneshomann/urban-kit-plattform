import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { getTranslations } from 'next-intl/server'
import { PublicNavServer } from '@/components/public/PublicNavServer'
import { PublicFooter } from '@/components/public/PublicFooter'
import { ScrollHint } from '@/components/public/ScrollHint'
import { CtaButton } from '@/components/public/CtaButton'
import { EyebrowBadge } from '@/components/public/EyebrowBadge'
import { Circle, ArrowRight, Layers, Users, Layout } from 'lucide-react'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'zusammenarbeit' })
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  }
}

const accentZ = (chunks: ReactNode) => <span style={{ color: 'var(--zusammenarbeit-dark)' }}>{chunks}</span>
const br = () => <br />

export default async function BereichZusammenarbeitPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'zusammenarbeit' })

  return (
    <div className="min-h-svh flex flex-col">
      <PublicNavServer locale={locale} />

      {/* Hero */}
        <section
          className="relative min-h-[calc(100svh-3.5rem)] flex flex-col overflow-hidden border-b"
          style={{ background: 'var(--zusammenarbeit-light)' }}
        >
          <ScrollHint color="var(--zusammenarbeit-dark)" />

          <Users
            className="absolute right-16 top-1/2 -translate-y-1/2 h-[45%] w-auto opacity-10 pointer-events-none"
            strokeWidth={1}
            aria-hidden="true"
            style={{ color: 'var(--zusammenarbeit-dark)' }}
          />

          {/* Decorative floating dot — echoes the title period */}
          <Circle
            className="absolute pointer-events-none"
            fill="currentColor"
            strokeWidth={0}
            aria-hidden="true"
            style={{
              color: 'var(--plattform-ink-accent)',
              opacity: 0.12,
              width: '1.1rem',
              height: '1.1rem',
              top: '28%',
              left: '42%',
            }}
          />

          <div className="relative z-10 flex-1 flex flex-col justify-start px-6 pt-20 md:pt-28 md:px-16 lg:px-24">
            <EyebrowBadge label={t('heroEyebrow')} bg="var(--zusammenarbeit)" color="var(--plattform-ink)" />

            <h1 className="text-hero font-black leading-none tracking-tight mb-8">
              {t.rich('heroTitle', { accentZ })}
            </h1>

            <p className="text-text leading-relaxed max-w-2xl" style={{ color: 'var(--plattform-ink)' }}>
              {t('heroBody')}
            </p>
          </div>

          {/* CTA — bottom right, matching landing page */}
          <div className="relative z-10 flex flex-col items-end gap-3 px-6 pb-8 md:pb-14 md:px-16 lg:px-24 self-end">
            <CtaButton href={`/${locale}/starten`} label={t('ctaStart')} icon={<ArrowRight />} variant="zusammenarbeit" wide />
          </div>
        </section>

        <section
          className="snap-start relative overflow-hidden min-h-svh flex flex-col justify-center px-6 md:px-16 lg:px-24 py-12 md:py-24 border-b"
          style={{ background: 'var(--zusammenarbeit-light)' }}
        >
          <Layers
            className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 h-[45%] w-auto opacity-10 pointer-events-none"
            strokeWidth={1}
            aria-hidden="true"
            style={{ color: 'var(--zusammenarbeit-dark)' }}
          />
          <div className="relative z-10 w-full">
            <EyebrowBadge label={t('roomEyebrow')} bg="var(--zusammenarbeit)" color="var(--plattform-ink)" />
            <h2 className="text-title font-black tracking-tight mb-5">
              {t.rich('roomTitle', { accentZ })}
            </h2>
            <p className="text-text leading-relaxed max-w-2xl mb-5" style={{ color: 'var(--plattform-ink)' }}>
              {t('roomP1')}
            </p>
            <p className="text-text leading-relaxed max-w-2xl" style={{ color: 'var(--plattform-ink)' }}>
              {t('roomP2')}
            </p>
          </div>
        </section>

        <section
          className="snap-start relative overflow-hidden min-h-svh flex flex-col justify-center px-6 md:px-16 lg:px-24 py-12 md:py-24"
          style={{ background: 'var(--zusammenarbeit-light)' }}
        >
          <Layout
            className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 h-[45%] w-auto opacity-10 pointer-events-none"
            strokeWidth={1}
            aria-hidden="true"
            style={{ color: 'var(--zusammenarbeit-dark)' }}
          />
          <div className="relative z-10">
            <EyebrowBadge label={t('modulesEyebrow')} bg="var(--zusammenarbeit)" color="var(--plattform-ink)" />
            <h2 className="text-title font-black tracking-tight mb-5">
              {t.rich('modulesTitle', { accentZ, br })}
            </h2>
            <p className="text-text leading-relaxed max-w-2xl mb-10" style={{ color: 'var(--plattform-ink)' }}>
              {t('modulesBody')}
            </p>
            <div className="flex">
              <CtaButton href={`/${locale}/bereich/zusammenarbeit/module`} label={t('modulesCta')} icon={<Layout />} variant="zusammenarbeit" />
            </div>
          </div>
        </section>

      <PublicFooter locale={locale} />
    </div>
  )
}
