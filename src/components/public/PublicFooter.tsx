// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import Link from 'next/link'
import { Flag, ExternalLink, Home, FolderOpen, Mail, FileText, ShieldCheck, Cookie, Users, BookOpen, Accessibility } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { getCitySettings } from '@/lib/instance'
import { getMethodenBaseUrl } from '@/lib/methodensammlung'
import { getSponsors } from '@/lib/sponsors'
import { SponsorStrip } from '@/components/public/SponsorStrip'

interface PublicFooterProps {
  locale: string
  /** Über-UrbanKIT shows its own partner section — suppress the footer band there to avoid doubled logos. */
  showSponsors?: boolean
}

export async function PublicFooter({ locale, showSponsors = true }: PublicFooterProps) {
  const l = `/${locale}`
  const [{ cityName }, t, methodenUrl, sponsors] = await Promise.all([
    getCitySettings(),
    getTranslations({ locale, namespace: 'footer' }),
    getMethodenBaseUrl(),
    showSponsors ? getSponsors() : Promise.resolve([]),
  ])

  return (
    <footer className="border-t bg-[var(--plattform-white)]">
      {/* Main grid */}
      <div className="px-6 md:px-16 lg:px-24 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* Allgemeines column */}
          <div className="flex flex-col gap-4">
            <p className="text-text" style={{ color: 'var(--plattform-ink-accent)' }}>
              {t('colGeneral')}
            </p>
            <nav aria-label={t('colGeneral')} className="flex flex-col gap-2">
              <Link href={l} className="flex items-center gap-2 text-small transition-colors group" style={{ color: 'var(--plattform-ink)' }}>
                <Home aria-hidden className="w-[1em] h-[1em] shrink-0 opacity-40" />
                <span className="group-hover:underline">{t('home')}</span>
              </Link>
              <Link href={`${l}/bereich/projekte-archiv/alle-projekte`} className="flex items-center gap-2 text-small transition-colors group" style={{ color: 'var(--plattform-ink)' }}>
                <FolderOpen aria-hidden className="w-[1em] h-[1em] shrink-0 opacity-40" />
                <span className="group-hover:underline">{t('allProjects')}</span>
              </Link>
              <Link href={`${l}/starten`} className="flex items-center gap-2 text-small transition-colors group" style={{ color: 'var(--plattform-ink)' }}>
                <Flag aria-hidden className="w-[1em] h-[1em] shrink-0 opacity-40" />
                <span className="group-hover:underline">{t('start')}</span>
              </Link>
            </nav>
          </div>

          {/* Bereiche column */}
          <div className="flex flex-col gap-4">
            <p className="text-text" style={{ color: 'var(--plattform-ink-accent)' }}>
              {t('colAreas')}
            </p>
            <nav aria-label={t('colAreas')} className="flex flex-col gap-2">
              <Link href={`${l}/bereich/projekte-archiv`} className="flex items-center gap-2 text-small transition-colors group" style={{ color: 'var(--plattform-ink)' }}>
                <FolderOpen aria-hidden className="w-[1em] h-[1em] shrink-0" style={{ color: 'var(--projekte-accent)' }} />
                <span className="group-hover:underline">{t('areaProjects')}</span>
              </Link>
              <Link href={`${l}/bereich/zusammenarbeit`} className="flex items-center gap-2 text-small transition-colors group" style={{ color: 'var(--plattform-ink)' }}>
                <Users aria-hidden className="w-[1em] h-[1em] shrink-0" style={{ color: 'var(--zusammenarbeit-accent)' }} />
                <span className="group-hover:underline">{t('areaCollab')}</span>
              </Link>
              <Link href={`${l}/bereich/grundlagen`} className="flex items-center gap-2 text-small transition-colors group" style={{ color: 'var(--plattform-ink)' }}>
                <BookOpen aria-hidden className="w-[1em] h-[1em] shrink-0" style={{ color: 'var(--grundlagen-accent)' }} />
                <span className="group-hover:underline">{t('areaBasics')}</span>
              </Link>
              <Link href={methodenUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-small transition-colors group" style={{ color: 'var(--plattform-ink)' }}>
                <ExternalLink aria-hidden className="w-[1em] h-[1em] shrink-0 opacity-40" />
                <span className="group-hover:underline">{t('methods')}</span>
              </Link>
            </nav>
          </div>

          {/* Rechtliches column */}
          <div className="flex flex-col gap-4">
            <p className="text-text" style={{ color: 'var(--plattform-ink-accent)' }}>
              {t('colLegal')}
            </p>
            <nav aria-label={t('colLegal')} className="flex flex-col gap-2">
              <Link href={`${l}/kontakt`} className="flex items-center gap-2 text-small transition-colors group" style={{ color: 'var(--plattform-ink)' }}>
                <Mail aria-hidden className="w-[1em] h-[1em] shrink-0 opacity-40" />
                <span className="group-hover:underline">{t('contact')}</span>
              </Link>
              <Link href={`${l}/impressum`} className="flex items-center gap-2 text-small transition-colors group" style={{ color: 'var(--plattform-ink)' }}>
                <FileText aria-hidden className="w-[1em] h-[1em] shrink-0 opacity-40" />
                <span className="group-hover:underline">{t('imprint')}</span>
              </Link>
              <Link href={`${l}/datenschutz`} className="flex items-center gap-2 text-small transition-colors group" style={{ color: 'var(--plattform-ink)' }}>
                <ShieldCheck aria-hidden className="w-[1em] h-[1em] shrink-0 opacity-40" />
                <span className="group-hover:underline">{t('privacy')}</span>
              </Link>
              <Link href={`${l}/barrierefreiheit`} className="flex items-center gap-2 text-small transition-colors group" style={{ color: 'var(--plattform-ink)' }}>
                <Accessibility aria-hidden className="w-[1em] h-[1em] shrink-0 opacity-40" />
                <span className="group-hover:underline">{t('accessibility')}</span>
              </Link>
              <Link href={`${l}/cookies`} className="flex items-center gap-2 text-small transition-colors group" style={{ color: 'var(--plattform-ink)' }}>
                <Cookie aria-hidden className="w-[1em] h-[1em] shrink-0 opacity-40" />
                <span className="group-hover:underline">{t('cookies')}</span>
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
              {t('tagline')}
            </p>
            <Link
              href={`${l}/starten`}
              className="self-start inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-small font-normal text-[var(--plattform-white)] transition-colors bg-[var(--plattform)] hover:bg-[var(--plattform-accent)]"
            >
              <Flag aria-hidden className="w-[1em] h-[1em] shrink-0" />
              {t('startCta')}
            </Link>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t px-6 md:px-16 lg:px-24 py-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <p className="text-small" style={{ color: 'var(--plattform-ink)', opacity: 0.85 }}>
            {t('copyright', { year: new Date().getFullYear(), city: cityName })}
          </p>
          <div className="flex items-center gap-6">
            <Link href={`${l}/impressum`} className="text-small transition-colors hover:underline" style={{ color: 'var(--plattform-ink)', opacity: 0.85 }}>
              {t('imprintShort')}
            </Link>
            <Link href={`${l}/datenschutz`} className="text-small transition-colors hover:underline" style={{ color: 'var(--plattform-ink)', opacity: 0.85 }}>
              {t('privacyShort')}
            </Link>
            <Link href={`${l}/cookies`} className="text-small transition-colors hover:underline" style={{ color: 'var(--plattform-ink)', opacity: 0.85 }}>
              {t('cookiesShort')}
            </Link>
            <Link href={`${l}/barrierefreiheit`} className="text-small transition-colors hover:underline" style={{ color: 'var(--plattform-ink)', opacity: 0.85 }}>
              {t('accessibilityShort')}
            </Link>
            <Link href="/admin" className="text-small transition-colors hover:underline" style={{ color: 'var(--plattform-ink)', opacity: 0.85 }}>
              {t('admin')}
            </Link>
          </div>
        </div>
      </div>

      {/* Partner logos — last band of the page */}
      {sponsors.length > 0 && (
        <section aria-label={t('partners')} className="border-t px-6 md:px-16 lg:px-24 py-10">
          {/* Logos only — the label stays as aria-label for screen readers */}
          <SponsorStrip sponsors={sponsors} />
        </section>
      )}
    </footer>
  )
}
