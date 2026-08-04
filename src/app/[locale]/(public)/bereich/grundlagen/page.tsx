import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { getTranslations } from 'next-intl/server'
import { PublicNavServer } from '@/components/public/PublicNavServer'
import { PublicFooter } from '@/components/public/PublicFooter'
import { EyebrowBadge } from '@/components/public/EyebrowBadge'
import { ScrollHint } from '@/components/public/ScrollHint'
import { CtaButton } from '@/components/public/CtaButton'
import { SectionDotsNav } from '@/components/public/SectionDotsNav'
import { BereichThemeScope } from '@/components/public/BereichThemeScope'
import { BookOpen, ExternalLink, Handshake, Route, Scale } from 'lucide-react'
import { PartizipationAccordion } from './partizipation/PartizipationAccordion'
import { ProjektplanungAccordion, type ProjektStep, type TodoItem, type MethodItem } from './projektplanung/ProjektplanungAccordion'
import { PROJEKTPHASEN } from '@/lib/options/projektphasen'
import { getMethodTeasers, getPhaseMethodTeasers, methodImageUrl, METHODEN_URL } from '@/lib/methodensammlung'
import { CardSlider } from '@/components/public/CardSlider'

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

// Text accent on light backgrounds — `-accent` is the darkest tone (the `-dark`
// token is the mid chip/ball background, mirroring the projekte scheme).
const accentG = (chunks: ReactNode) => <span style={{ color: 'var(--grundlagen-accent)' }}>{chunks}</span>
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
  const apiLocale = locale === 'en' ? 'en' as const : 'de' as const
  const [methodTeasers, phaseMethods] = await Promise.all([
    getMethodTeasers(apiLocale, 6),
    getPhaseMethodTeasers(apiLocale, 3),
  ])
  const projektSteps: ProjektStep[] = PROJEKTPHASEN.map((phase, i) => ({
    phase: tax(`phase.${phase.value}`),
    title: tpp(`s${i}Title`),
    ziel: tpp.rich(`s${i}Ziel`, richTags),
    intro: tpp.rich(`s${i}Intro`, richTags),
    todos: tpp.raw(`s${i}Todos`) as TodoItem[],
    wichtig: tpp.rich(`s${i}Wichtig`, richTags),
    methoden: tpp.raw(`s${i}Methoden`) as MethodItem[],
    methodLinks: (phaseMethods[phase.value] ?? []).map((m) => ({
      title: m.title,
      href: `${METHODEN_URL}/${locale}/methods/${m.slug ?? ''}`,
    })),
  }))

  return (
    <div className="min-h-svh flex flex-col">
      <PublicNavServer locale={locale} />
      <BereichThemeScope accent="var(--grundlagen-dark)" onBrand="var(--grundlagen-on-brand)" />
      <SectionDotsNav
        label={nav('areaBasics')}
        dotColor="var(--grundlagen-accent)"
        activeColor="var(--grundlagen-dark)"
        switchIconColor="var(--grundlagen-on-brand)"
        labelColor="var(--grundlagen-on-brand)"
        items={[
          { id: 'hero', label: nav('overview'), icon: 'Home' },
          { id: 'methoden', label: t('methodsTitle'), icon: 'Lightbulb' },
          { id: 'projektplanung', label: nav('projectPlanning'), icon: 'Route' },
          { id: 'partizipation', label: nav('participation'), icon: 'Handshake' },
          { id: 'recht', label: nav('legalFramework'), icon: 'Scale' },
        ]}
        switchPages={[
          { href: `/${locale}/bereich/projekte-archiv`, label: nav('areaProjects'), icon: 'FolderOpen', color: 'var(--projekte-dark)', iconColor: 'var(--projekte-on-brand)' },
          { href: `/${locale}/bereich/zusammenarbeit`, label: nav('areaCollab'), icon: 'Users', color: 'var(--zusammenarbeit-dark)', iconColor: 'var(--zusammenarbeit-on-brand)' },
        ]}
      />

      {/* ── Starting area: hero + about this Bereich, one main-colored block ── */}
      <section
        id="hero"
        className="relative flex-1 min-h-[calc(100svh-3.5rem)] flex flex-col overflow-hidden"
        style={{ background: 'var(--grundlagen)' }}
      >
        <ScrollHint color="var(--grundlagen-dark)" label={nav('scrollMore')} />
        <BookOpen
          className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 h-[45%] w-auto opacity-10 pointer-events-none"
          strokeWidth={1}
          aria-hidden="true"
          style={{ color: 'var(--grundlagen-dark)' }}
        />

        {/* Main content — left-aligned, upper area */}
        <div className="relative z-10 flex-1 flex flex-col justify-start px-6 pt-20 md:pt-28 md:px-16 lg:px-24">
          <EyebrowBadge label={t('heroEyebrow')} bg="var(--grundlagen-dark)" color="var(--grundlagen-on-brand)" />
          <h1 className="text-hero font-black leading-none tracking-tight mb-5">
            {t.rich('heroTitle', { accentG, br })}
          </h1>
          <p className="text-text leading-relaxed max-w-2xl" style={{ color: 'var(--plattform-ink)' }}>
            {t('heroBody')}
          </p>
        </div>
      </section>

      {/* About this Bereich — still part of the starting area, fades into Methoden */}
      <section
        id="grundlagen"
        className="relative overflow-hidden flex flex-col justify-center px-6 md:px-16 lg:px-24 pt-16 pb-32 md:pt-24 md:pb-48"
        style={{ background: 'linear-gradient(to bottom, var(--grundlagen) calc(100% - var(--section-fade-height)), var(--grundlagen-light))' }}
      >
        <div className="relative z-10 w-full">
          <EyebrowBadge label={nav('aboutBereich')} bg="var(--grundlagen-dark)" color="var(--grundlagen-on-brand)" />
          <h2 className="text-title font-black tracking-tight mb-6">
            {t('basicsTitle')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-4 max-w-5xl">
            <p className="text-text leading-relaxed" style={{ color: 'var(--plattform-ink)' }}>
              {t('basicsBody')}
            </p>
            <p className="text-text leading-relaxed" style={{ color: 'var(--plattform-ink)' }}>
              {t('basicsP2')}
            </p>
            <p className="text-text leading-relaxed" style={{ color: 'var(--plattform-ink)' }}>
              {t('basicsP3')}
            </p>
          </div>
        </div>
      </section>

      {/* ── Methoden: text, example methods, link to the Methodensammlung ── */}
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
          <EyebrowBadge label={t('methodsEyebrow')} bg="var(--grundlagen-dark)" color="var(--grundlagen-on-brand)" />
          <h2 className="text-hero font-black leading-none tracking-tight mb-6">
            {t('methodsTitle')}
          </h2>
          <p className="text-text leading-relaxed max-w-2xl mb-12" style={{ color: 'var(--plattform-ink)' }}>
            {t('methodsBody')}
          </p>
          {methodTeasers.length > 0 && (
            <div className="mb-12">
              <CardSlider locale={locale}>
                {methodTeasers.map((m) => (
                  <div key={m.id} className="snap-start shrink-0 basis-full md:basis-[calc(50%-0.75rem)] lg:basis-[calc(33.333%-1rem)]">
                    {/* Card anatomy mirrors the Methodensammlung's MethodCard */}
                    <a
                      href={`${METHODEN_URL}/${locale}/methods/${m.slug ?? ''}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={m.title}
                      className="group relative flex flex-col h-full rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all"
                    >
                      {/* Image strip */}
                      <div className="relative h-44 sm:h-56 w-full overflow-hidden shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={methodImageUrl(m)}
                          alt=""
                          aria-hidden
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>

                      {/* Content */}
                      <div className="flex flex-col gap-4 p-8 flex-1">
                        <p className="text-display font-bold leading-tight transition-colors text-[var(--plattform-ink)] group-hover:text-[var(--plattform-ink-accent)]">
                          {m.title}
                        </p>
                        {m.auszug && (
                          <p className="text-small line-clamp-3" style={{ color: 'var(--plattform-ink)' }}>{m.auszug}</p>
                        )}
                        {(m.characteristics ?? []).length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-auto">
                            {(m.characteristics ?? []).map((c) => (
                              c.name && (
                                <span key={c.id} className="text-small px-3 py-0.5 rounded-full" style={{ background: 'var(--grundlagen-light)', color: 'var(--plattform-ink)' }}>
                                  {c.name}
                                </span>
                              )
                            ))}
                          </div>
                        )}
                      </div>
                    </a>
                  </div>
                ))}
              </CardSlider>
            </div>
          )}
          <CtaButton
            href="https://methoden.urbankit.de"
            label={t('methodsCta')}
            icon={<ExternalLink />}
            variant="grundlagen"
          />
        </div>
      </section>

      {/* ── Projektplanung: text + tabs ── */}
      <section
        id="projektplanung"
        className="relative overflow-hidden min-h-svh flex flex-col justify-center px-6 md:px-16 lg:px-24 pt-16 pb-32 md:pt-24 md:pb-48"
        style={{ background: 'linear-gradient(to bottom, var(--grundlagen) calc(100% - var(--section-fade-height)), var(--grundlagen-light))' }}
      >
        <Route
          className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 h-[40%] w-auto opacity-[0.07] pointer-events-none"
          strokeWidth={1}
          aria-hidden="true"
          style={{ color: 'var(--grundlagen-dark)' }}
        />
        <div className="relative z-10 w-full">
          <EyebrowBadge label={tpp('heroEyebrow')} bg="var(--grundlagen-dark)" color="var(--grundlagen-on-brand)" />
          <h2 className="text-hero font-black leading-none tracking-tight mb-6">
            {tpp.rich('heroTitle', { accentG })}
          </h2>
          <p className="text-text leading-relaxed max-w-2xl mb-12" style={{ color: 'var(--plattform-ink)' }}>
            {tpp('heroBody')}
          </p>
          <ProjektplanungAccordion steps={projektSteps} />
        </div>
      </section>

      {/* ── Partizipation: text + tabs ── */}
      <section
        id="partizipation"
        className="relative overflow-hidden min-h-svh flex flex-col justify-center px-6 md:px-16 lg:px-24 pt-16 pb-32 md:pt-24 md:pb-48"
        style={{ background: 'linear-gradient(to bottom, var(--grundlagen-light) calc(100% - var(--section-fade-height)), var(--grundlagen))' }}
      >
        <Handshake
          className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 h-[40%] w-auto opacity-[0.07] pointer-events-none"
          strokeWidth={1}
          aria-hidden="true"
          style={{ color: 'var(--grundlagen-dark)' }}
        />
        <div className="relative z-10 w-full">
          <EyebrowBadge label={tp('heroEyebrow')} bg="var(--grundlagen-dark)" color="var(--grundlagen-on-brand)" />
          <h2 className="text-hero font-black leading-none tracking-tight mb-6">
            {tp.rich('heroTitle', { accentG })}
          </h2>
          <p className="text-text leading-relaxed max-w-2xl mb-12" style={{ color: 'var(--plattform-ink)' }}>
            {tp('heroBody')}
          </p>
          <PartizipationAccordion sections={partizipationSections} />
        </div>
      </section>

      {/* ── Rechtlicher Rahmen: text + tabs — last section stays flat: hard cut to the footer ── */}
      <section
        id="recht"
        className="relative overflow-hidden min-h-svh flex flex-col justify-center px-6 md:px-16 lg:px-24 pt-16 pb-32 md:pt-24 md:pb-48"
        style={{ background: 'var(--grundlagen)' }}
      >
        <Scale
          className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 h-[40%] w-auto opacity-[0.07] pointer-events-none"
          strokeWidth={1}
          aria-hidden="true"
          style={{ color: 'var(--grundlagen-dark)' }}
        />
        <div className="relative z-10 w-full">
          <EyebrowBadge label={tr('heroEyebrow')} bg="var(--grundlagen-dark)" color="var(--grundlagen-on-brand)" />
          <h2 className="text-hero font-black leading-none tracking-tight mb-6">
            {tr.rich('heroTitle', { accentG })}
          </h2>
          <p className="text-text leading-relaxed max-w-2xl mb-12" style={{ color: 'var(--plattform-ink)' }}>
            {tr('heroBody')}
          </p>
          <PartizipationAccordion sections={rechtSections} />
        </div>
      </section>

      <PublicFooter locale={locale} />
    </div>
  )
}
