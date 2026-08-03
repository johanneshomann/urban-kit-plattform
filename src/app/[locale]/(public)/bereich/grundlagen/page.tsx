import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { PublicNavServer } from '@/components/public/PublicNavServer'
import { PublicFooter } from '@/components/public/PublicFooter'
import { EyebrowBadge } from '@/components/public/EyebrowBadge'
import { ScrollHint } from '@/components/public/ScrollHint'
import { CtaButton } from '@/components/public/CtaButton'
import { SectionDotsNav } from '@/components/public/SectionDotsNav'
import { BookOpen, ExternalLink, Handshake, Route, Scale, type LucideIcon } from 'lucide-react'
import { PartizipationAccordion } from './partizipation/PartizipationAccordion'
import { ProjektplanungAccordion, type ProjektStep, type TodoItem, type MethodItem } from './projektplanung/ProjektplanungAccordion'
import { PROJEKTPHASEN } from '@/lib/options/projektphasen'

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

const PARTIZIPATION_KEYS = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 's11']
const RECHT_KEYS = ['s1', 's2', 's3', 's4', 's5', 's6', 's7']

// `titleKey`/`textKey` reference the `grundlagen` namespace; hrefs anchor the
// on-page chapters below.
const GRUNDLAGEN: { href: string; titleKey: string; icon: LucideIcon; textKey: string }[] = [
  { href: '#partizipation', titleKey: 'cardPartTitle', icon: Handshake, textKey: 'cardPartText' },
  { href: '#projektplanung', titleKey: 'cardPlanTitle', icon: Route, textKey: 'cardPlanText' },
  { href: '#recht', titleKey: 'cardLawTitle', icon: Scale, textKey: 'cardLawText' },
]

export default async function BereichGrundlagenPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const [t, tp, tpp, tr, tax, nav] = await Promise.all([
    getTranslations({ locale, namespace: 'grundlagen' }),
    getTranslations({ locale, namespace: 'partizipation' }),
    getTranslations({ locale, namespace: 'projektplanung' }),
    getTranslations({ locale, namespace: 'recht' }),
    getTranslations({ locale, namespace: 'taxonomy' }),
    getTranslations({ locale, namespace: 'publicNav' }),
  ])

  const partizipationSections = PARTIZIPATION_KEYS.map((k) => ({
    title: tp(`${k}Title`),
    content: tp.rich(`${k}Body`, richTags),
  }))
  const rechtSections = RECHT_KEYS.map((k) => ({
    title: tr(`${k}Title`),
    content: tr.rich(`${k}Body`, richTags),
  }))
  const projektSteps: ProjektStep[] = PROJEKTPHASEN.map((phase, i) => ({
    phase: tax(`phase.${phase.value}`),
    title: tpp(`s${i}Title`),
    ziel: tpp.rich(`s${i}Ziel`, richTags),
    intro: tpp.rich(`s${i}Intro`, richTags),
    todos: tpp.raw(`s${i}Todos`) as TodoItem[],
    wichtig: tpp.rich(`s${i}Wichtig`, richTags),
    methoden: tpp.raw(`s${i}Methoden`) as MethodItem[],
  }))

  return (
    <div className="min-h-svh flex flex-col">
      <PublicNavServer locale={locale} />
      <SectionDotsNav
        label={nav('areaBasics')}
        dotColor="var(--grundlagen-accent)"
        activeColor="var(--grundlagen-dark)"
        items={[
          { id: 'grundlagen', label: t('basicsEyebrow'), icon: 'BookOpen' },
          { id: 'methoden', label: t('methodsEyebrow'), icon: 'Lightbulb' },
          { id: 'partizipation', label: nav('participation'), icon: 'Handshake' },
          { id: 'projektplanung', label: nav('projectPlanning'), icon: 'Route' },
          { id: 'recht', label: nav('legalFramework'), icon: 'Scale' },
        ]}
        switchPages={[
          { href: `/${locale}/bereich/projekte-archiv`, label: nav('areaProjects'), icon: 'FolderOpen', color: 'var(--projekte-dark)' },
          { href: `/${locale}/bereich/zusammenarbeit`, label: nav('areaCollab'), icon: 'Users', color: 'var(--zusammenarbeit-dark)' },
        ]}
      />

      {/* Hero */}
      <section
        id="hero"
        className="relative flex-1 min-h-[calc(100svh-3.5rem)] flex flex-col overflow-hidden"
        style={{ background: 'linear-gradient(to bottom, var(--grundlagen) calc(100% - var(--section-fade-height)), var(--grundlagen-light))' }}
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
          <EyebrowBadge label={t('heroEyebrow')} bg="var(--grundlagen-dark)" color="var(--plattform-white)" />
          <h1 className="text-hero font-black leading-none tracking-tight mb-5">
            {t.rich('heroTitle', { accentG, br })}
          </h1>
          <p className="text-text leading-relaxed max-w-2xl" style={{ color: 'var(--plattform-ink)' }}>
            {t('heroBody')}
          </p>
        </div>

      </section>

      {/* Grundlagen */}
      <section
        id="grundlagen"
        className="relative overflow-hidden min-h-svh flex flex-col justify-center px-6 md:px-16 lg:px-24 pt-16 pb-32 md:pt-24 md:pb-48"
        style={{ background: 'var(--grundlagen-light)' }}
      >
        <div className="relative z-10 w-full">
        <EyebrowBadge label={t('basicsEyebrow')} bg="var(--grundlagen-dark)" color="var(--plattform-white)" />

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
                href={item.href}
                className="group flex flex-col gap-3 p-7 rounded-xl transition-all shadow-xs hover:shadow-md bg-white hover:bg-[var(--grundlagen-light)]"
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-[1.1em] h-[1.1em] shrink-0 text-text" style={{ color: 'var(--grundlagen-dark)' }} />
                  <h3 className="text-display font-black tracking-tight" style={{ color: 'var(--plattform-ink-accent)' }}>{t(item.titleKey)}</h3>
                </div>
                <p className="text-text flex-1" style={{ color: 'var(--plattform-ink)' }}>{t(item.textKey)}</p>
                <span className="text-small opacity-60 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--plattform-ink)' }}>
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
            className="group flex flex-col gap-3 p-7 rounded-xl transition-all shadow-xs hover:shadow-md bg-white hover:bg-[var(--grundlagen-light)]"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-[1.1em] h-[1.1em] shrink-0 text-text" style={{ color: 'var(--grundlagen-dark)' }} />
              <h3 className="text-display font-black tracking-tight" style={{ color: 'var(--plattform-ink-accent)' }}>{t('whatMethodsTitle')}</h3>
            </div>
          </Link>
          <a
            href="https://methoden.urbankit.de"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col gap-3 p-7 rounded-xl transition-all shadow-xs hover:shadow-md bg-white hover:bg-[var(--grundlagen-light)]"
          >
            <div className="flex items-center gap-2">
              <ExternalLink className="w-[1.1em] h-[1.1em] shrink-0 text-text" style={{ color: 'var(--grundlagen-dark)' }} />
              <h3 className="text-display font-black tracking-tight" style={{ color: 'var(--plattform-ink-accent)' }}>{t('methodsCollection')}</h3>
            </div>
          </a>
        </div>
        </div>
      </section>

      {/* Methoden */}
      <section
        id="methoden"
        className="relative overflow-hidden min-h-svh flex flex-col justify-center px-6 md:px-16 lg:px-24 pt-16 pb-32 md:pt-24 md:pb-48"
        style={{ background: 'linear-gradient(to bottom, var(--grundlagen-light) calc(100% - var(--section-fade-height)), var(--grundlagen))' }}
      >
        <BookOpen
          className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 h-[40%] w-auto opacity-[0.07] pointer-events-none"
          strokeWidth={1}
          aria-hidden="true"
          style={{ color: 'var(--grundlagen-dark)' }}
        />
        <div className="relative z-10 w-full">
          <EyebrowBadge label={t('methodsEyebrow')} bg="var(--grundlagen-dark)" color="var(--plattform-white)" />
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

      {/* Partizipation — merged chapter: content hero (main → light) + accordion */}
      <section
        id="partizipation"
        className="relative flex-1 min-h-[calc(100svh-3.5rem)] flex flex-col overflow-hidden"
        style={{ background: 'var(--grundlagen)' }}
      >
        <Handshake
          className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 h-[45%] w-auto opacity-10 pointer-events-none"
          strokeWidth={1}
          aria-hidden="true"
          style={{ color: 'var(--grundlagen-dark)' }}
        />
        <div className="relative z-10 flex-1 flex flex-col justify-center px-6 md:px-16 lg:px-24">
          <EyebrowBadge label={tp('heroEyebrow')} bg="var(--grundlagen-dark)" color="var(--plattform-white)" />
          <h2 className="text-hero font-black leading-none tracking-tight mb-5">
            {tp.rich('heroTitle', { accentG })}
          </h2>
          <p className="text-text leading-relaxed max-w-2xl" style={{ color: 'var(--plattform-ink)' }}>
            {tp('heroBody')}
          </p>
        </div>
      </section>
      <section className="px-6 md:px-16 lg:px-24 py-12 md:py-16" style={{ background: 'var(--grundlagen)' }}>
        <PartizipationAccordion sections={partizipationSections} />
      </section>

      {/* Projektplanung — merged chapter */}
      <section
        id="projektplanung"
        className="relative flex-1 min-h-[calc(100svh-3.5rem)] flex flex-col overflow-hidden"
        style={{ background: 'var(--grundlagen)' }}
      >
        <Route
          className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 h-[45%] w-auto opacity-10 pointer-events-none"
          strokeWidth={1}
          aria-hidden="true"
          style={{ color: 'var(--grundlagen-dark)' }}
        />
        <div className="relative z-10 flex-1 flex flex-col justify-center px-6 md:px-16 lg:px-24">
          <EyebrowBadge label={tpp('heroEyebrow')} bg="var(--grundlagen-dark)" color="var(--plattform-white)" />
          <h2 className="text-hero font-black leading-none tracking-tight mb-5">
            {tpp.rich('heroTitle', { accentG })}
          </h2>
          <p className="text-text leading-relaxed max-w-2xl" style={{ color: 'var(--plattform-ink)' }}>
            {tpp('heroBody')}
          </p>
        </div>
      </section>
      <section className="px-6 md:px-16 lg:px-24 py-12 md:py-16" style={{ background: 'var(--grundlagen)' }}>
        <ProjektplanungAccordion steps={projektSteps} />
      </section>

      {/* Recht — merged chapter; the accordion below stays flat: hard cut to the footer */}
      <section
        id="recht"
        className="relative flex-1 min-h-[calc(100svh-3.5rem)] flex flex-col overflow-hidden"
        style={{ background: 'var(--grundlagen)' }}
      >
        <Scale
          className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 h-[45%] w-auto opacity-10 pointer-events-none"
          strokeWidth={1}
          aria-hidden="true"
          style={{ color: 'var(--grundlagen-dark)' }}
        />
        <div className="relative z-10 flex-1 flex flex-col justify-center px-6 md:px-16 lg:px-24">
          <EyebrowBadge label={tr('heroEyebrow')} bg="var(--grundlagen-dark)" color="var(--plattform-white)" />
          <h2 className="text-hero font-black leading-none tracking-tight mb-5">
            {tr.rich('heroTitle', { accentG })}
          </h2>
          <p className="text-text leading-relaxed max-w-2xl" style={{ color: 'var(--plattform-ink)' }}>
            {tr('heroBody')}
          </p>
        </div>
      </section>
      <section className="px-6 md:px-16 lg:px-24 py-12 md:py-16" style={{ background: 'var(--grundlagen)' }}>
        <PartizipationAccordion sections={rechtSections} />
      </section>

      <PublicFooter locale={locale} />
    </div>
  )
}
