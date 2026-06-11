import type { Metadata } from 'next'
import { PublicNavServer } from '@/components/public/PublicNavServer'
import { PublicFooter } from '@/components/public/PublicFooter'
import { EyebrowBadge } from '@/components/public/EyebrowBadge'
import { ScrollHint } from '@/components/public/ScrollHint'
import { getCitySettings } from '@/lib/instance'
import { Layout, Newspaper, BarChart2, CheckSquare, Calendar, MessageSquare, FolderOpen, Bot, MessageCircle, LayoutGrid } from 'lucide-react'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Module – Zusammenarbeit – Urban KIT',
    description: 'Alle Module des digitalen Projektraums: Neuigkeiten, Umfragen, Collab Board und mehr.',
  }
}

const MODULES = [
  {
    name: 'Neuigkeiten',
    icon: Newspaper,
    description: 'Projektupdates und Ankündigungen für alle Beteiligten. Öffentlich oder nur für das Team.',
  },
  {
    name: 'Umfrage',
    icon: BarChart2,
    description: 'Strukturierte Abstimmungen — anonym oder mit Konto. Ergebnisse transparent einsehbar.',
  },
  {
    name: 'Collab Board',
    icon: Layout,
    description: 'Gemeinsames Whiteboard für visuelle Zusammenarbeit in Echtzeit.',
  },
  {
    name: 'Aufgaben',
    icon: CheckSquare,
    description: 'Aufgabenlisten mit Zuweisung, Status und Fälligkeitsdatum für das gesamte Team.',
  },
  {
    name: 'Kalender',
    icon: Calendar,
    description: 'Termine, Workshops und Veranstaltungen auf einen Blick — für alle Beteiligten.',
  },
  {
    name: 'Forum',
    icon: MessageSquare,
    description: 'Diskussionsbereich für inhaltliche Fragen, Ideen und strukturiertes Feedback.',
  },
  {
    name: 'Dateien',
    icon: FolderOpen,
    description: 'Zentrale Ablage für Dokumente, Pläne und Materialien — versioniert und durchsuchbar.',
  },
  {
    name: 'Urban Collab Agent',
    icon: Bot,
    description: 'KI-gestützter Assistent mit Zugriff auf den Projektkontext. Fasst zusammen, beantwortet Fragen.',
  },
  {
    name: 'Chat',
    icon: MessageCircle,
    description: 'Direkte Kommunikation im Team und per Direktnachricht — integriert in den Projektraum.',
  },
]

export default async function ModulePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const { cityName, cityLogoUrl } = await getCitySettings()
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
          <EyebrowBadge label="Zusammenarbeit / Module" bg="var(--zusammenarbeit)" color="var(--plattform-ink)" />
          <h1 className="text-hero font-black leading-none tracking-tight mb-5">
            Module<span style={{ color: 'var(--zusammenarbeit-dark)' }}>.</span>
          </h1>
          <p className="text-text leading-relaxed max-w-2xl" style={{ color: 'var(--plattform-ink)' }}>
            Jeder Projektraum besteht aus Modulen. Welche aktiv sind, entscheidet das Team — so bleibt der Raum übersichtlich und auf das Wesentliche fokussiert.
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
          <EyebrowBadge label="Übersicht" bg="var(--zusammenarbeit)" color="var(--plattform-ink)" />
          <h2 className="text-title font-black tracking-tight mb-12">
            Alle Module<span style={{ color: 'var(--zusammenarbeit-dark)' }}>.</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MODULES.map((m) => {
              const Icon = m.icon
              return (
                <div
                  key={m.name}
                  className="flex flex-col gap-3 p-7 rounded-xl border transition-all hover:shadow-md bg-white"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-[1.1em] h-[1.1em] shrink-0 text-text" style={{ color: 'var(--zusammenarbeit-dark)' }} />
                    <h3 className="text-display font-black tracking-tight" style={{ color: 'var(--zusammenarbeit-dark)' }}>
                      {m.name}
                    </h3>
                  </div>
                  <p className="text-text leading-relaxed" style={{ color: 'var(--plattform-ink)' }}>
                    {m.description}
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
