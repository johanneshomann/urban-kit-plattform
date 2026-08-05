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
import { SectionDotsNav } from '@/components/public/SectionDotsNav'

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
    dotIcon: 'UserPlus',
    cta: { ctaKey: 'step1Cta', href: 'register', icon: Flag },
  },
  {
    number: '2',
    titleKey: 'step2Title',
    descKey: 'step2Desc',
    dotIcon: 'Folders',
    cta: { ctaKey: 'step2Cta', href: 'bereich/projekte-archiv/alle-projekte', icon: Folders },
  },
  {
    number: '3',
    titleKey: 'step3Title',
    descKey: 'step3Desc',
    dotIcon: 'HandHeart',
    cta: null,
  },
]

export default async function StartenPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const [{ cityName, cityLogoUrl }, t] = await Promise.all([
    getCitySettings(),
    getTranslations({ locale, namespace: 'starten' }),
  ])

  // Section rail — matches the DOM order below. The hero is deliberately not an
  // item: the rail only appears once the hero is scrolled out of frame.
  const navSections = [
    ...STEPS.map((step) => ({ id: `schritt-${step.number}`, label: `${t('stepLabel', { number: step.number })}: ${t(step.titleKey)}`, icon: step.dotIcon })),
    { id: 'einladung', label: t('invEyebrow'), icon: 'Ticket' },
    { id: 'cta', label: t('ctaEyebrow'), icon: 'Flag' },
  ]

  return (
    <div className="min-h-svh flex flex-col">
      <PublicNavServer locale={locale} />
      <SectionDotsNav items={navSections} label={t('heroEyebrow')} appearAfterId="hero" />
      <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col">

      {/* Hero — fades into the white first step; sections alternate light/white below */}
      <section id="hero" className="relative min-h-[calc(100svh-3.5rem)] flex flex-col justify-start px-6 md:px-16 lg:px-24 pt-20 pb-10 md:pt-28 md:pb-20 overflow-hidden" style={{ background: 'linear-gradient(to bottom, var(--plattform-light) calc(100% - var(--section-fade-height)), var(--plattform-white))' }}>
        <Flag
          className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 h-[45%] w-auto opacity-10 pointer-events-none"
          strokeWidth={1}
          aria-hidden="true"
          style={{ color: 'var(--plattform)' }}
        />
        <EyebrowBadge label={t('heroEyebrow')} />
        <h1 className="text-hero font-black leading-none tracking-tight mb-5">
          {t.rich('heroTitle', { accent, br })}
        </h1>
        <p className="text-text leading-relaxed max-w-2xl">
          {t('heroBody', { city: cityName })}
        </p>
        {/* Scroll hint last in the hero DOM: absolute-positioned, so visuals are unchanged, but Tab reaches it after the hero content instead of first. */}
        <ScrollHint />
      </section>

      {/* Steps — alternate white/light, each fading into the next section's color */}
      {STEPS.map((step, i) => {
        const isWhite = i % 2 === 0
        const bg = isWhite ? 'var(--plattform-white)' : 'var(--plattform-light)'
        const next = isWhite ? 'var(--plattform-light)' : 'var(--plattform-white)'
        return (
        <section
          key={step.number}
          id={`schritt-${step.number}`}
          className="relative overflow-hidden min-h-svh flex flex-col justify-center px-6 md:px-16 lg:px-24 pt-16 pb-32 md:pt-24 md:pb-48"
          style={{ background: `linear-gradient(to bottom, ${bg} calc(100% - var(--section-fade-height)), ${next})` }}
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
              <EyebrowBadge label={t('stepLabel', { number: step.number })} />
              <h2 className="text-title font-black tracking-tight mb-5">
                <span style={{ color: 'var(--plattform)' }}>{step.number}. </span>{t(step.titleKey)}
              </h2>
              <p className="text-text leading-relaxed mb-10">{t(step.descKey)}</p>
              {step.cta && (
                <CtaButton href={`/${locale}/${step.cta.href}`} label={t(step.cta.ctaKey)} icon={<step.cta.icon />} />
              )}
            </div>

            {/* Right — feature accordion (light cards on white sections, white cards on light) */}
            <FeatureAccordion stepIndex={parseInt(step.number) - 1} cardBg={isWhite ? 'var(--plattform-light)' : undefined} />
          </div>
        </section>
        )
      })}

      {/* Invitation — light, fades into the white CTA */}
      <section id="einladung" className="relative min-h-svh flex flex-col justify-center px-6 md:px-16 lg:px-24 pt-16 pb-32 md:pt-24 md:pb-48" style={{ background: 'linear-gradient(to bottom, var(--plattform-light) calc(100% - var(--section-fade-height)), var(--plattform-white))' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          {/* Left */}
          <div>
            <EyebrowBadge label={t('invEyebrow')} />
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
            <div className="bg-[var(--plattform-white)] rounded-xl p-6 flex flex-col gap-3 shadow-xs hover:shadow-md transition-all">
              <p className="text-small font-normal tracking-widest uppercase" style={{ color: 'var(--plattform-ink)' }}>{t('invCodeLabel')}</p>
              <InvitationForm locale={locale} />
              <p className="text-small" style={{ color: 'var(--plattform-ink)' }}>{t('invHint')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA — white, seamless into the white footer */}
      <section id="cta" className="min-h-svh flex flex-col justify-center px-6 md:px-16 lg:px-24 py-12 md:py-24" style={{ background: 'var(--plattform-white)' }}>
        <EyebrowBadge label={t('ctaEyebrow')} />
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

      </main>
      <PublicFooter locale={locale} />
    </div>
  )
}
