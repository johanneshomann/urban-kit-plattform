import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { getTranslations } from 'next-intl/server'
import { PublicNavServer } from '@/components/public/PublicNavServer'
import { PublicFooter } from '@/components/public/PublicFooter'
import { EyebrowBadge } from '@/components/public/EyebrowBadge'
import { CtaButton } from '@/components/public/CtaButton'
import { InvitationForm } from './InvitationForm'
import { FeatureAccordion } from './FeatureAccordion'
import { getCitySettings } from '@/lib/instance'
import { Flag, Folders, Info } from 'lucide-react'
import { ScrollHint } from '@/components/public/ScrollHint'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'starten' })
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  }
}

// Rich-text tag renderers for decorative headings.
const accent = (chunks: ReactNode) => <span style={{ color: 'var(--plattform)' }}>{chunks}</span>
const br = () => <br />

// `titleKey`/`descKey`/`ctaKey` reference the `starten` namespace.
const STEPS = [
  {
    number: '1',
    titleKey: 'step1Title',
    descKey: 'step1Desc',
    cta: { ctaKey: 'step1Cta', href: 'register', icon: Flag },
  },
  {
    number: '2',
    titleKey: 'step2Title',
    descKey: 'step2Desc',
    cta: { ctaKey: 'step2Cta', href: 'bereich/projekte-archiv/alle-projekte', icon: Folders },
  },
  {
    number: '3',
    titleKey: 'step3Title',
    descKey: 'step3Desc',
    cta: null,
  },
]

export default async function StartenPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const [{ cityName, cityLogoUrl }, t] = await Promise.all([
    getCitySettings(),
    getTranslations({ locale, namespace: 'starten' }),
  ])

  return (
    <div className="min-h-svh flex flex-col">
      <PublicNavServer locale={locale} />

      {/* Hero */}
      <section className="relative min-h-[calc(100svh-3.5rem)] flex flex-col justify-start px-6 md:px-16 lg:px-24 pt-20 pb-10 md:pt-28 md:pb-20 border-b overflow-hidden" style={{ background: 'var(--plattform-light)' }}>
        <Flag
          className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 h-[45%] w-auto opacity-10 pointer-events-none"
          strokeWidth={1}
          aria-hidden="true"
          style={{ color: 'var(--plattform)' }}
        />
        <ScrollHint />
        <EyebrowBadge label={t('heroEyebrow')} opacity={0.6} />
        <h1 className="text-hero font-black leading-none tracking-tight mb-5">
          {t.rich('heroTitle', { accent, br })}
        </h1>
        <p className="text-text leading-relaxed max-w-2xl">
          {t('heroBody', { city: cityName })}
        </p>
      </section>

      {/* Steps */}
      {STEPS.map((step) => (
        <section
          key={step.number}
          className="relative overflow-hidden min-h-svh flex flex-col justify-center px-6 md:px-16 lg:px-24 py-12 md:py-24 border-b"
          style={{ background: 'var(--plattform-light)' }}
        >
          {/* Ghost number */}
          <span
            className="absolute right-0 top-1/2 -translate-y-1/2 font-black leading-none select-none pointer-events-none"
            style={{ fontSize: '32rem', color: 'var(--plattform-ink)', opacity: 0.04, lineHeight: 1 }}
            aria-hidden="true"
          >
            {step.number}
          </span>

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            {/* Left */}
            <div>
              <EyebrowBadge label={t('stepLabel', { number: step.number })} opacity={0.6} />
              <h2 className="text-title font-black tracking-tight mb-5">
                <span style={{ color: 'var(--plattform)' }}>{step.number}. </span>{t(step.titleKey)}
              </h2>
              <p className="text-text leading-relaxed mb-10">{t(step.descKey)}</p>
              {step.cta && (
                <CtaButton href={`/${locale}/${step.cta.href}`} label={t(step.cta.ctaKey)} icon={<step.cta.icon />} />
              )}
            </div>

            {/* Right — feature accordion */}
            <FeatureAccordion stepIndex={parseInt(step.number) - 1} />
          </div>
        </section>
      ))}

      {/* Invitation */}
      <section className="relative min-h-svh flex flex-col justify-center px-6 md:px-16 lg:px-24 py-12 md:py-24 border-b" style={{ background: 'var(--plattform-light)' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          {/* Left */}
          <div>
            <EyebrowBadge label={t('invEyebrow')} opacity={0.6} />
            <h2 className="text-title font-black tracking-tight mb-5">
              {t.rich('invTitle', { accent, br })}
            </h2>
            <p className="text-text leading-relaxed opacity-70">
              {t('invBody', { city: cityName })}
            </p>
          </div>

          {/* Right */}
          <div className="flex flex-col gap-4">
            {/* Code form card */}
            <div className="bg-white rounded-xl border p-6 flex flex-col gap-3 hover:shadow-md transition-all">
              <p className="text-small font-normal tracking-widest uppercase" style={{ color: 'var(--plattform-ink)' }}>{t('invCodeLabel')}</p>
              <InvitationForm />
              <p className="text-small" style={{ color: 'var(--plattform-ink)' }}>{t('invHint')}</p>
            </div>
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
        <div className="flex flex-wrap gap-3">
          <CtaButton href={`/${locale}/register`} label={t('ctaRegister')} icon={<Flag />} />
          <CtaButton href={`/${locale}/ueber-urbankit`} label={t('ctaMore')} icon={<Info />} />
        </div>
      </section>

      <PublicFooter locale={locale} />
    </div>
  )
}
