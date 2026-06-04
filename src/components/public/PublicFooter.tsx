import Link from 'next/link'
import { Circle, Flag, ExternalLink, Home, FolderOpen, Mail, FileText, ShieldCheck } from 'lucide-react'
import { getCitySettings } from '@/lib/instance'

interface PublicFooterProps {
  locale: string
}

export async function PublicFooter({ locale }: PublicFooterProps) {
  const l = `/${locale}`
  const { cityName } = await getCitySettings()

  return (
    <footer className="border-t bg-white">
      {/* Main grid */}
      <div className="px-6 md:px-16 lg:px-24 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* Allgemeines column */}
          <div className="flex flex-col gap-4">
            <p className="text-text" style={{ color: 'var(--plattform-ink-accent)' }}>
              Allgemeines
            </p>
            <nav className="flex flex-col gap-2">
              <Link href={l} className="flex items-center gap-2 text-small transition-colors group" style={{ color: 'var(--plattform-ink)' }}>
                <Home className="w-[1em] h-[1em] shrink-0 opacity-40" />
                <span className="group-hover:underline">Startseite</span>
              </Link>
              <Link href={`${l}/bereich/projekte-archiv/alle-projekte`} className="flex items-center gap-2 text-small transition-colors group" style={{ color: 'var(--plattform-ink)' }}>
                <FolderOpen className="w-[1em] h-[1em] shrink-0 opacity-40" />
                <span className="group-hover:underline">Alle Projekte</span>
              </Link>
              <Link href={`${l}/starten`} className="flex items-center gap-2 text-small transition-colors group" style={{ color: 'var(--plattform-ink)' }}>
                <Flag className="w-[1em] h-[1em] shrink-0 opacity-40" />
                <span className="group-hover:underline">Jetzt starten</span>
              </Link>
            </nav>
          </div>

          {/* Bereiche column */}
          <div className="flex flex-col gap-4">
            <p className="text-text" style={{ color: 'var(--plattform-ink-accent)' }}>
              Bereiche
            </p>
            <nav className="flex flex-col gap-2">
              <Link href={`${l}/bereich/projekte-archiv`} className="flex items-center gap-2 text-small transition-colors group" style={{ color: 'var(--plattform-ink)' }}>
                <Circle className="w-[0.6em] h-[0.6em] shrink-0" fill="currentColor" strokeWidth={0} style={{ color: 'var(--projekte-dark)' }} />
                <span className="group-hover:underline">Projekte &amp; Archiv</span>
              </Link>
              <Link href={`${l}/bereich/zusammenarbeit`} className="flex items-center gap-2 text-small transition-colors group" style={{ color: 'var(--plattform-ink)' }}>
                <Circle className="w-[0.6em] h-[0.6em] shrink-0" fill="currentColor" strokeWidth={0} style={{ color: 'var(--zusammenarbeit-dark)' }} />
                <span className="group-hover:underline">Zusammenarbeit</span>
              </Link>
              <Link href={`${l}/bereich/grundlagen`} className="flex items-center gap-2 text-small transition-colors group" style={{ color: 'var(--plattform-ink)' }}>
                <Circle className="w-[0.6em] h-[0.6em] shrink-0" fill="currentColor" strokeWidth={0} style={{ color: 'var(--grundlagen-dark)' }} />
                <span className="group-hover:underline">Grundlagen</span>
              </Link>
              <Link href="https://methoden.urbankit.de" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-small transition-colors group" style={{ color: 'var(--plattform-ink)' }}>
                <ExternalLink className="w-[1em] h-[1em] shrink-0 opacity-40" />
                <span className="group-hover:underline">Methodensammlung</span>
              </Link>
            </nav>
          </div>

          {/* Rechtliches column */}
          <div className="flex flex-col gap-4">
            <p className="text-text" style={{ color: 'var(--plattform-ink-accent)' }}>
              Rechtliches
            </p>
            <nav className="flex flex-col gap-2">
              <Link href={`${l}/kontakt`} className="flex items-center gap-2 text-small transition-colors group" style={{ color: 'var(--plattform-ink)' }}>
                <Mail className="w-[1em] h-[1em] shrink-0 opacity-40" />
                <span className="group-hover:underline">Kontakt</span>
              </Link>
              <Link href={`${l}/impressum`} className="flex items-center gap-2 text-small transition-colors group" style={{ color: 'var(--plattform-ink)' }}>
                <FileText className="w-[1em] h-[1em] shrink-0 opacity-40" />
                <span className="group-hover:underline">Impressum</span>
              </Link>
              <Link href={`${l}/datenschutz`} className="flex items-center gap-2 text-small transition-colors group" style={{ color: 'var(--plattform-ink)' }}>
                <ShieldCheck className="w-[1em] h-[1em] shrink-0 opacity-40" />
                <span className="group-hover:underline">Datenschutz</span>
              </Link>
            </nav>
          </div>

          {/* Brand column */}
          <div className="flex flex-col gap-5">
            <Link href={l} className="font-bold text-text inline-block">
              <span style={{ color: 'var(--plattform-ink-accent)' }}>Urban</span><span style={{ color: 'var(--plattform)' }}>KIT</span>
              <span className="font-normal" style={{ color: 'var(--plattform-ink)' }}> – {cityName}</span>
            </Link>
            <p className="text-small leading-relaxed" style={{ color: 'var(--plattform-ink)' }}>
              Die digitale Plattform für Bürgerbeteiligung. Gestalte deine Stadt aktiv mit.
            </p>
            <Link
              href={`${l}/starten`}
              className="self-start inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-small font-normal text-white transition-colors bg-[var(--plattform)] hover:bg-[var(--plattform-accent)]"
            >
              <Flag className="w-[1em] h-[1em] shrink-0" />
              Jetzt starten
            </Link>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t px-6 md:px-16 lg:px-24 py-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <p className="text-small" style={{ color: 'var(--plattform-ink)', opacity: 0.5 }}>
            © {new Date().getFullYear()} UrbanKIT – {cityName}
          </p>
          <div className="flex items-center gap-6">
            <Link href={`${l}/impressum`} className="text-small transition-colors hover:underline" style={{ color: 'var(--plattform-ink)', opacity: 0.5 }}>
              Impressum
            </Link>
            <Link href={`${l}/datenschutz`} className="text-small transition-colors hover:underline" style={{ color: 'var(--plattform-ink)', opacity: 0.5 }}>
              Datenschutz
            </Link>
            <Link href="/admin" className="text-small transition-colors hover:underline" style={{ color: 'var(--plattform-ink)', opacity: 0.25 }}>
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
