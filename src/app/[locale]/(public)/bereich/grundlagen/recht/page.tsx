import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { PublicNavServer } from '@/components/public/PublicNavServer'
import { PublicFooter } from '@/components/public/PublicFooter'
import { EyebrowBadge } from '@/components/public/EyebrowBadge'
import { ScrollHint } from '@/components/public/ScrollHint'
import { ChevronLeft, Scale } from 'lucide-react'
import { PartizipationAccordion } from '../partizipation/PartizipationAccordion'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'recht' })
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  }
}

const accentG = (chunks: ReactNode) => <span style={{ color: 'var(--grundlagen-dark)' }}>{chunks}</span>

// Tag renderers for the rich article bodies stored in the catalogs.
const richTags = {
  p: (chunks: ReactNode) => <p>{chunks}</p>,
  strong: (chunks: ReactNode) => <strong>{chunks}</strong>,
  ul: (chunks: ReactNode) => <ul className="flex flex-col gap-1 pl-2">{chunks}</ul>,
  li: (chunks: ReactNode) => <li>{chunks}</li>,
  bq: (chunks: ReactNode) => (
    <blockquote className="border-l-4 pl-5 py-1 italic" style={{ borderColor: 'var(--grundlagen)', color: 'var(--plattform-ink)' }}>
      {chunks}
    </blockquote>
  ),
}

const SECTION_KEYS = ['s1', 's2', 's3', 's4', 's5', 's6', 's7']

export default async function GrundlagenRechtPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const [t, tg] = await Promise.all([
    getTranslations({ locale, namespace: 'recht' }),
    getTranslations({ locale, namespace: 'grundlagen' }),
  ])
  const base = `/${locale}/bereich/grundlagen`

  const sections = SECTION_KEYS.map((k) => ({
    title: t(`${k}Title`),
    content: t.rich(`${k}Body`, richTags),
  }))

  return (
    <div className="min-h-svh flex flex-col">
      <PublicNavServer locale={locale} />

      {/* Hero */}
      <section
        className="relative flex-1 min-h-[calc(100svh-3.5rem)] flex flex-col overflow-hidden border-b"
        style={{ background: 'var(--grundlagen-light)' }}
      >
        <ScrollHint color="var(--grundlagen-dark)" />
        <Scale
          className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 h-[45%] w-auto opacity-10 pointer-events-none"
          strokeWidth={1}
          aria-hidden="true"
          style={{ color: 'var(--grundlagen-dark)' }}
        />

        <div className="relative z-10 flex-1 flex flex-col justify-start px-6 pt-20 md:pt-28 md:px-16 lg:px-24">
          <EyebrowBadge label={t('heroEyebrow')} bg="var(--grundlagen)" color="var(--plattform-ink)" />
          <h1 className="text-hero font-black leading-none tracking-tight mb-5">
            {t.rich('heroTitle', { accentG })}
          </h1>
          <p className="text-text leading-relaxed max-w-2xl" style={{ color: 'var(--plattform-ink)' }}>
            {t('heroBody')}
          </p>
        </div>
      </section>

      {/* Accordion */}
      <section className="flex-1 px-6 md:px-16 lg:px-24 py-12 md:py-16" style={{ background: 'var(--grundlagen-light)' }}>
        <PartizipationAccordion sections={sections} />
      </section>

      {/* Bottom nav */}
      <nav className="border-t px-6 md:px-16 lg:px-24 py-6 flex justify-between items-center" style={{ background: 'var(--grundlagen-light)' }}>
        <Link
          href={`${base}/projektplanung`}
          className="inline-flex items-center gap-1 text-small transition-opacity opacity-60 hover:opacity-100"
          style={{ color: 'var(--grundlagen-dark)' }}
        >
          <ChevronLeft className="w-[1em] h-[1em] shrink-0" />
          {tg('cardPlanTitle')}
        </Link>
        <Link
          href={base}
          className="inline-flex items-center gap-1 text-small transition-opacity opacity-60 hover:opacity-100"
          style={{ color: 'var(--grundlagen-dark)' }}
        >
          {tg('navAll')}
        </Link>
      </nav>

      <PublicFooter locale={locale} />
    </div>
  )
}
