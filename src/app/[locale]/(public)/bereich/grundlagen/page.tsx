import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { PublicNavServer } from '@/components/public/PublicNavServer'
import { PublicFooter } from '@/components/public/PublicFooter'
import { EyebrowBadge } from '@/components/public/EyebrowBadge'
import { ScrollHint } from '@/components/public/ScrollHint'
import { CtaButton } from '@/components/public/CtaButton'
import { BookOpen, ExternalLink, Handshake, Route, Scale, type LucideIcon } from 'lucide-react'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'grundlagen' })
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  }
}

const accentG = (chunks: ReactNode) => <span style={{ color: 'var(--grundlagen-dark)' }}>{chunks}</span>
const br = () => <br />

// `titleKey`/`textKey` reference the `grundlagen` namespace.
const GRUNDLAGEN: { href: string; titleKey: string; icon: LucideIcon; textKey: string }[] = [
  { href: '/grundlagen/partizipation', titleKey: 'cardPartTitle', icon: Handshake, textKey: 'cardPartText' },
  { href: '/grundlagen/projektplanung', titleKey: 'cardPlanTitle', icon: Route, textKey: 'cardPlanText' },
  { href: '/grundlagen/recht', titleKey: 'cardLawTitle', icon: Scale, textKey: 'cardLawText' },
]

export default async function BereichGrundlagenPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'grundlagen' })

  return (
    <div className="min-h-svh flex flex-col">
      <PublicNavServer locale={locale} />

      {/* Hero */}
      <section
        className="relative flex-1 min-h-[calc(100svh-3.5rem)] flex flex-col overflow-hidden border-b"
        style={{ background: 'var(--grundlagen-light)' }}
      >
        <ScrollHint color="var(--grundlagen-dark)" />
        <BookOpen
          className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 h-[45%] w-auto opacity-10 pointer-events-none"
          strokeWidth={1}
          aria-hidden="true"
          style={{ color: 'var(--grundlagen-dark)' }}
        />

        {/* Main content — left-aligned, upper area */}
        <div className="relative z-10 flex-1 flex flex-col justify-start px-6 pt-20 md:pt-28 md:px-16 lg:px-24">
          <EyebrowBadge label={t('heroEyebrow')} bg="var(--grundlagen)" color="var(--plattform-ink)" />
          <h1 className="text-hero font-black leading-none tracking-tight mb-5">
            {t.rich('heroTitle', { accentG, br })}
          </h1>
          <p className="text-text leading-relaxed max-w-2xl" style={{ color: 'var(--plattform-ink)' }}>
            {t('heroBody')}
          </p>
        </div>

        {/* CTA — bottom right */}
        <div className="relative z-10 flex flex-col items-end gap-3 px-6 pb-8 md:pb-14 md:px-16 lg:px-24 self-end">
          <CtaButton
            href="https://methoden.urbankit.de"
            label={t('ctaMethods')}
            icon={<ExternalLink />}
            variant="grundlagen"
          />
        </div>
      </section>

      {/* Grundlagen */}
      <section
        id="grundlagen"
        className="relative overflow-hidden min-h-svh flex flex-col justify-center px-6 md:px-16 lg:px-24 py-12 md:py-24 border-b"
        style={{ background: 'var(--grundlagen-light)' }}
      >
        <div className="relative z-10 w-full">
        <EyebrowBadge label={t('basicsEyebrow')} bg="var(--grundlagen)" color="var(--plattform-ink)" />

        <h2 className="text-title font-black tracking-tight mb-6">
          {t('basicsTitle')}
        </h2>

        <p className="text-text leading-relaxed max-w-2xl mb-12" style={{ color: 'var(--plattform-ink)' }}>
          {t('basicsBody')}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {GRUNDLAGEN.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={`/${locale}${item.href}`}
                className="group flex flex-col gap-3 p-7 rounded-xl border transition-all hover:shadow-md bg-white hover:bg-[var(--grundlagen-light)]"
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-[1.1em] h-[1.1em] shrink-0 text-text" style={{ color: 'var(--grundlagen-dark)' }} />
                  <h3 className="text-display font-black tracking-tight" style={{ color: 'var(--grundlagen-dark)' }}>{t(item.titleKey)}</h3>
                </div>
                <p className="text-text flex-1" style={{ color: 'var(--plattform-ink)' }}>{t(item.textKey)}</p>
                <span className="text-small opacity-60 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--grundlagen-dark)' }}>
                  {t('readMore')}
                </span>
              </Link>
            )
          })}
        </div>

        {/* Methoden — two cards */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <Link
            href="#methoden"
            className="group flex flex-col gap-3 p-7 rounded-xl border transition-all hover:shadow-md bg-white hover:bg-[var(--grundlagen-light)]"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-[1.1em] h-[1.1em] shrink-0 text-text" style={{ color: 'var(--grundlagen-dark)' }} />
              <h3 className="text-display font-black tracking-tight" style={{ color: 'var(--grundlagen-dark)' }}>{t('whatMethodsTitle')}</h3>
            </div>
          </Link>
          <a
            href="https://methoden.urbankit.de"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col gap-3 p-7 rounded-xl border transition-all hover:shadow-md bg-white hover:bg-[var(--grundlagen-light)]"
          >
            <div className="flex items-center gap-2">
              <ExternalLink className="w-[1.1em] h-[1.1em] shrink-0 text-text" style={{ color: 'var(--grundlagen-dark)' }} />
              <h3 className="text-display font-black tracking-tight" style={{ color: 'var(--grundlagen-dark)' }}>{t('methodsCollection')}</h3>
            </div>
          </a>
        </div>
        </div>
      </section>

      {/* Methoden */}
      <section
        id="methoden"
        className="relative overflow-hidden min-h-svh flex flex-col justify-center px-6 md:px-16 lg:px-24 py-12 md:py-24"
        style={{ background: 'var(--grundlagen-light)' }}
      >
        <BookOpen
          className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 h-[40%] w-auto opacity-[0.07] pointer-events-none"
          strokeWidth={1}
          aria-hidden="true"
          style={{ color: 'var(--grundlagen-dark)' }}
        />
        <div className="relative z-10 w-full">
          <EyebrowBadge label={t('methodsEyebrow')} bg="var(--grundlagen)" color="var(--plattform-ink)" />
          <h2 className="text-title font-black tracking-tight mb-6">
            {t('methodsTitle')}
          </h2>
          <p className="text-text leading-relaxed max-w-2xl mb-10" style={{ color: 'var(--plattform-ink)' }}>
            {t('methodsBody')}
          </p>
          <CtaButton
            href="https://methoden.urbankit.de"
            label={t('methodsCta')}
            icon={<ExternalLink />}
            variant="grundlagen"
          />
        </div>
      </section>

      <PublicFooter locale={locale} />
    </div>
  )
}
