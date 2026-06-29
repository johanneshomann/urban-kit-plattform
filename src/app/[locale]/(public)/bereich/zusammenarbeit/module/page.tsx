import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { getTranslations } from 'next-intl/server'
import { PublicNavServer } from '@/components/public/PublicNavServer'
import { PublicFooter } from '@/components/public/PublicFooter'
import { EyebrowBadge } from '@/components/public/EyebrowBadge'
import { ScrollHint } from '@/components/public/ScrollHint'
import { Layout, Newspaper, BarChart2, CheckSquare, Calendar, MessageSquare, FolderOpen, Bot, MessageCircle, LayoutGrid } from 'lucide-react'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'module' })
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  }
}

const accentZ = (chunks: ReactNode) => <span style={{ color: 'var(--zusammenarbeit-dark)' }}>{chunks}</span>

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

export default async function ModulePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'module' })
  return (
    <div className="min-h-svh flex flex-col">
      <PublicNavServer locale={locale} />

      {/* Hero */}
      <section
        className="snap-start relative flex-1 min-h-[calc(100svh-3.5rem)] flex flex-col overflow-hidden border-b"
        style={{ background: 'var(--zusammenarbeit-light)' }}
      >
        <ScrollHint color="var(--zusammenarbeit-dark)" />
        <Layout
          className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 h-[45%] w-auto opacity-10 pointer-events-none"
          strokeWidth={1}
          aria-hidden="true"
          style={{ color: 'var(--zusammenarbeit-dark)' }}
        />

        <div className="relative z-10 flex-1 flex flex-col justify-start px-6 pt-20 md:pt-28 md:px-16 lg:px-24">
          <EyebrowBadge label={t('heroEyebrow')} bg="var(--zusammenarbeit)" color="var(--plattform-ink)" />
          <h1 className="text-hero font-black leading-none tracking-tight mb-5">
            {t.rich('heroTitle', { accentZ })}
          </h1>
          <p className="text-text leading-relaxed max-w-2xl" style={{ color: 'var(--plattform-ink)' }}>
            {t('heroBody')}
          </p>
        </div>
      </section>

      {/* Module grid */}
      <section
        className="snap-start relative overflow-hidden min-h-svh flex flex-col justify-center px-6 md:px-16 lg:px-24 py-12 md:py-24"
        style={{ background: 'var(--zusammenarbeit-light)' }}
      >
        <LayoutGrid
          className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 h-[45%] w-auto opacity-10 pointer-events-none"
          strokeWidth={1}
          aria-hidden="true"
          style={{ color: 'var(--zusammenarbeit-dark)' }}
        />
        <div className="relative z-10 w-full">
          <EyebrowBadge label={t('overviewEyebrow')} bg="var(--zusammenarbeit)" color="var(--plattform-ink)" />
          <h2 className="text-title font-black tracking-tight mb-12">
            {t.rich('overviewTitle', { accentZ })}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MODULES.map((m) => {
              const Icon = m.icon
              return (
                <div
                  key={m.nameKey}
                  className="flex flex-col gap-3 p-7 rounded-xl border transition-all hover:shadow-md bg-white"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-[1.1em] h-[1.1em] shrink-0 text-text" style={{ color: 'var(--zusammenarbeit-dark)' }} />
                    <h3 className="text-display font-black tracking-tight" style={{ color: 'var(--zusammenarbeit-dark)' }}>
                      {t(m.nameKey)}
                    </h3>
                  </div>
                  <p className="text-text leading-relaxed" style={{ color: 'var(--plattform-ink)' }}>
                    {t(m.descKey)}
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
