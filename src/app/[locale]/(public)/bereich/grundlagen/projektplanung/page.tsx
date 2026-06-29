import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { PublicNavServer } from '@/components/public/PublicNavServer'
import { PublicFooter } from '@/components/public/PublicFooter'
import { EyebrowBadge } from '@/components/public/EyebrowBadge'
import { ScrollHint } from '@/components/public/ScrollHint'
import { ChevronLeft, ChevronRight, Route } from 'lucide-react'
import { ProjektplanungAccordion, type ProjektStep, type TodoItem, type MethodItem } from './ProjektplanungAccordion'
import { PROJEKTPHASEN } from '@/lib/options/projektphasen'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'projektplanung' })
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
}

export default async function GrundlagenProjektplanungPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const [t, tg, tax] = await Promise.all([
    getTranslations({ locale, namespace: 'projektplanung' }),
    getTranslations({ locale, namespace: 'grundlagen' }),
    getTranslations({ locale, namespace: 'taxonomy' }),
  ])
  const base = `/${locale}/bereich/grundlagen`

  const steps: ProjektStep[] = PROJEKTPHASEN.map((phase, i) => ({
    phase: tax(`phase.${phase.value}`),
    title: t(`s${i}Title`),
    ziel: t.rich(`s${i}Ziel`, richTags),
    intro: t.rich(`s${i}Intro`, richTags),
    todos: t.raw(`s${i}Todos`) as TodoItem[],
    wichtig: t.rich(`s${i}Wichtig`, richTags),
    methoden: t.raw(`s${i}Methoden`) as MethodItem[],
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
        <Route
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
        <ProjektplanungAccordion steps={steps} />
      </section>

      {/* Bottom nav */}
      <nav className="border-t px-6 md:px-16 lg:px-24 py-6 flex justify-between items-center" style={{ background: 'var(--grundlagen-light)' }}>
        <Link
          href={`${base}/partizipation`}
          className="inline-flex items-center gap-1 text-small transition-opacity opacity-60 hover:opacity-100"
          style={{ color: 'var(--grundlagen-dark)' }}
        >
          <ChevronLeft className="w-[1em] h-[1em] shrink-0" />
          {tg('cardPartTitle')}
        </Link>
        <Link
          href={`${base}/recht`}
          className="inline-flex items-center gap-1 text-small transition-opacity opacity-60 hover:opacity-100"
          style={{ color: 'var(--grundlagen-dark)' }}
        >
          {tg('cardLawTitle')}
          <ChevronRight className="w-[1em] h-[1em] shrink-0" />
        </Link>
      </nav>

      <PublicFooter locale={locale} />
    </div>
  )
}
