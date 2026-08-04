import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { getTranslations } from 'next-intl/server'
import { PublicNavServer } from '@/components/public/PublicNavServer'
import { PublicFooter } from '@/components/public/PublicFooter'
import { ScrollHint } from '@/components/public/ScrollHint'
import { EyebrowBadge } from '@/components/public/EyebrowBadge'
import { SectionDotsNav } from '@/components/public/SectionDotsNav'
import { BereichThemeScope } from '@/components/public/BereichThemeScope'
import { Circle, Layers, Users, Layout, Newspaper, BarChart2, CheckSquare, Calendar, MessageSquare, FolderOpen, Bot, MessageCircle, LayoutGrid } from 'lucide-react'

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

// Text accent on light backgrounds — `-accent` is the darkest tone (the `-dark`
// token is the mid chip/ball background, mirroring the projekte scheme).
const accentZ = (chunks: ReactNode) => <span style={{ color: 'var(--zusammenarbeit-accent)' }}>{chunks}</span>

// `nameKey`/`descKey` reference the `module` namespace.
const MODULES = [
  { nameKey: 'modNewsName', descKey: 'modNewsDesc', icon: Newspaper },
  { nameKey: 'modPollName', descKey: 'modPollDesc', icon: BarChart2 },
  { nameKey: 'modBoardName', descKey: 'modBoardDesc', icon: Layout },
  { nameKey: 'modTasksName', descKey: 'modTasksDesc', icon: CheckSquare },
  { nameKey: 'modCalendarName', descKey: 'modCalendarDesc', icon: Calendar },
  { nameKey: 'modForumName', descKey: 'modForumDesc', icon: MessageSquare },
  { nameKey: 'modFilesName', descKey: 'modFilesDesc', icon: FolderOpen },
  { nameKey: 'modAgentName', descKey: 'modAgentDesc', icon: Bot },
  { nameKey: 'modChatName', descKey: 'modChatDesc', icon: MessageCircle },
]

export default async function BereichZusammenarbeitPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const [t, tm, nav] = await Promise.all([
    getTranslations({ locale, namespace: 'zusammenarbeit' }),
    getTranslations({ locale, namespace: 'module' }),
    getTranslations({ locale, namespace: 'publicNav' }),
  ])

  return (
    <div className="min-h-svh flex flex-col">
      <PublicNavServer locale={locale} />
      <BereichThemeScope accent="var(--zusammenarbeit-dark)" onBrand="var(--zusammenarbeit-on-brand)" />
      <SectionDotsNav
        label={nav('areaCollab')}
        dotColor="var(--zusammenarbeit-dark)"
        activeColor="var(--zusammenarbeit-accent)"
        switchColor="var(--zusammenarbeit-dark)"
        bubbleColor="var(--zusammenarbeit-dark)"
        switchIconColor="var(--zusammenarbeit-on-brand)"
        labelColor="var(--zusammenarbeit-on-brand)"
        items={[
          { id: 'hero', label: nav('overview'), icon: 'Home' },
          { id: 'raum', label: t('roomEyebrow'), icon: 'Layers' },
          { id: 'module', label: nav('modules'), icon: 'Layout' },
        ]}
        switchPages={[
          { href: `/${locale}/bereich/projekte-archiv`, label: nav('areaProjects'), icon: 'FolderOpen', color: 'var(--projekte-dark)', iconColor: 'var(--projekte-on-brand)' },
          { href: `/${locale}/bereich/grundlagen`, label: nav('areaBasics'), icon: 'BookOpen', color: 'var(--grundlagen-dark)', iconColor: 'var(--grundlagen-on-brand)' },
        ]}
      />

      {/* Hero — Bereich scheme: main-tinted hero fading into the light content */}
        <section
          id="hero"
          className="relative min-h-[calc(100svh-3.5rem)] flex flex-col overflow-hidden"
          style={{ background: 'linear-gradient(to bottom, var(--zusammenarbeit) calc(100% - var(--section-fade-height)), var(--zusammenarbeit-light))' }}
        >
          <ScrollHint color="var(--zusammenarbeit-dark)" label={nav('scrollMore')} />

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
            <EyebrowBadge label={t('heroEyebrow')} bg="var(--zusammenarbeit-dark)" color="var(--zusammenarbeit-on-brand)" />

            <h1 className="text-hero font-black leading-none tracking-tight mb-8">
              {t.rich('heroTitle', { accentZ })}
            </h1>

            <p className="text-text leading-relaxed max-w-2xl" style={{ color: 'var(--plattform-ink)' }}>
              {t('heroBody')}
            </p>
          </div>
        </section>

        {/* Projektraum — light, fades into the Module chapter */}
        <section
          id="raum"
          className="relative overflow-hidden min-h-svh flex flex-col justify-center px-6 md:px-16 lg:px-24 pt-16 pb-32 md:pt-24 md:pb-48"
          style={{ background: 'linear-gradient(to bottom, var(--zusammenarbeit-light) calc(100% - var(--section-fade-height)), var(--zusammenarbeit))' }}
        >
          <Layers
            className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 h-[45%] w-auto opacity-10 pointer-events-none"
            strokeWidth={1}
            aria-hidden="true"
            style={{ color: 'var(--zusammenarbeit-dark)' }}
          />
          <div className="relative z-10 w-full">
            <EyebrowBadge label={t('roomEyebrow')} bg="var(--zusammenarbeit-dark)" color="var(--zusammenarbeit-on-brand)" />
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

        {/* Module — merged chapter: one continuous main-colored block (hero + grid) */}
        <section
          id="module"
          className="relative flex-1 min-h-[calc(100svh-3.5rem)] flex flex-col overflow-hidden"
          style={{ background: 'var(--zusammenarbeit)' }}
        >
          <Layout
            className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 h-[45%] w-auto opacity-10 pointer-events-none"
            strokeWidth={1}
            aria-hidden="true"
            style={{ color: 'var(--zusammenarbeit-dark)' }}
          />
          <div className="relative z-10 flex-1 flex flex-col justify-center px-6 md:px-16 lg:px-24">
            <EyebrowBadge label={tm('heroEyebrow')} bg="var(--zusammenarbeit-dark)" color="var(--zusammenarbeit-on-brand)" />
            <h2 className="text-hero font-black leading-none tracking-tight mb-5">
              {tm.rich('heroTitle', { accentZ })}
            </h2>
            <p className="text-text leading-relaxed max-w-2xl" style={{ color: 'var(--plattform-ink)' }}>
              {tm('heroBody')}
            </p>
          </div>
        </section>

        {/* Module grid — last section stays flat: hard cut to the footer */}
        <section
          className="relative overflow-hidden min-h-svh flex flex-col justify-center px-6 md:px-16 lg:px-24 pt-16 pb-32 md:pt-24 md:pb-48"
          style={{ background: 'var(--zusammenarbeit)' }}
        >
          <LayoutGrid
            className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 h-[45%] w-auto opacity-10 pointer-events-none"
            strokeWidth={1}
            aria-hidden="true"
            style={{ color: 'var(--zusammenarbeit-dark)' }}
          />
          <div className="relative z-10 w-full">
            <EyebrowBadge label={tm('overviewEyebrow')} bg="var(--zusammenarbeit-dark)" color="var(--zusammenarbeit-on-brand)" />
            <h2 className="text-title font-black tracking-tight mb-12">
              {tm.rich('overviewTitle', { accentZ })}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {MODULES.map((m) => {
                const Icon = m.icon
                return (
                  <div
                    key={m.nameKey}
                    className="flex flex-col gap-3 p-7 rounded-xl transition-all shadow-xs hover:shadow-md bg-white"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-[1.1em] h-[1.1em] shrink-0 text-text" style={{ color: 'var(--zusammenarbeit-accent)' }} />
                      <h3 className="text-display font-black tracking-tight" style={{ color: 'var(--plattform-ink-accent)' }}>
                        {tm(m.nameKey)}
                      </h3>
                    </div>
                    <p className="text-text leading-relaxed" style={{ color: 'var(--plattform-ink)' }}>
                      {tm(m.descKey)}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

      <PublicFooter locale={locale} />
    </div>
  )
}
