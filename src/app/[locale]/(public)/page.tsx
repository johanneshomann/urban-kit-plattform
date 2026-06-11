import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { PublicNavServer } from '@/components/public/PublicNavServer'
import { PublicFooter } from '@/components/public/PublicFooter'
import { HeroSlideshow, type HeroImage } from '@/components/public/HeroSlideshow'
import { EyebrowBadge } from '@/components/public/EyebrowBadge'
import { CtaButton } from '@/components/public/CtaButton'
import { getCitySettings } from '@/lib/instance'
import { MessageCircleQuestion, Flag, FolderOpen, Info, HandHeart, Circle } from 'lucide-react'
import { ScrollHint } from '@/components/public/ScrollHint'

export async function generateMetadata(): Promise<Metadata> {
  const base = process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://urbankit.de'
  const { cityName } = await getCitySettings()
  return {
    title: `UrbanKIT – Stadtbeteiligung für ${cityName}`,
    description: `Informiere dich, diskutiere mit und gestalte ${cityName} aktiv mit.`,
    alternates: { canonical: `${base}/de` },
    openGraph: {
      title: `UrbanKIT – Stadtbeteiligung für ${cityName}`,
      description: `Informiere dich, diskutiere mit und gestalte ${cityName} aktiv mit.`,
      url: `${base}/de`,
      type: 'website',
    },
  }
}

async function getHeroImages(): Promise<HeroImage[]> {
  try {
    const payload = await getPayload({ config })
    const settings = await payload.findGlobal({ slug: 'platform-settings', depth: 1, overrideAccess: true })
    const raw = (settings as unknown as { heroImages?: { image: { url?: string; alt?: string }; caption?: string }[] }).heroImages ?? []
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? ''
    return raw
      .filter((item) => item.image?.url)
      .map((item) => ({
        url: item.image.url!.startsWith('http') ? item.image.url! : `${serverUrl}${item.image.url}`,
        alt: item.image.alt,
        caption: item.caption,
      }))
  } catch {
    return []
  }
}

async function getActiveProjects() {
  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'projects',
      where: { and: [{ status: { equals: 'active' } }, { visibility: { equals: 'PUBLIC' } }] },
      limit: 4,
      overrideAccess: true,
    })
    return result.docs as unknown as { id: string; title: string; slug: string; summary?: string }[]
  } catch {
    return []
  }
}

export default async function PublicHomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const [{ cityName, cityLogoUrl }, projects, heroImages] = await Promise.all([
    getCitySettings(),
    getActiveProjects(),
    getHeroImages(),
  ])

  return (
    <div className="min-h-svh flex flex-col">
      <PublicNavServer locale={locale} />

      {/* Hero */}
      <section className="relative flex-1 min-h-[calc(100svh-3.5rem)] flex flex-col overflow-hidden border-b bg-[var(--plattform-light)]">
        <ScrollHint />
        <HeroSlideshow images={heroImages} overlayClass="bg-white/78" />

        {/* Logo — top right */}
        {cityLogoUrl && (
          <div className="absolute top-0 right-0 z-10 px-6 pt-20 md:pt-28 md:px-16 lg:px-24">
            <img src={cityLogoUrl} alt={cityName} className="h-16 w-auto object-contain" />
          </div>
        )}

        {/* Main content — left-aligned, upper area */}
        <div className="relative z-10 flex-1 flex flex-col justify-start px-6 pt-20 md:pt-28 md:px-16 lg:px-24">
          {/* Eyebrow */}
          <EyebrowBadge label={`Digitale Bürgerbeteiligung in ${cityName}`} opacity={0.6} />

          {/* Headline */}
          <h1 className="text-hero font-black leading-none tracking-tight mb-5">
            {cityName} zum<br />
            Mitmachen<span style={{ color: 'var(--plattform)' }}>.</span>
          </h1>

          {/* Body */}
          <p className="text-text leading-relaxed max-w-2xl">
            UrbanKIT macht sichtbar, was in deiner Stadt passiert und gibt dir die Möglichkeit,
            dich direkt aktiv einzubringen.
          </p>
        </div>

        {/* CTAs — bottom right, stacked */}
        <div className="relative z-10 flex flex-col items-end gap-3 px-6 pb-8 md:pb-14 md:px-16 lg:px-24 self-end">
          <CtaButton href={`/${locale}/starten`} label="Jetzt starten" icon={<Flag />} wide />
          <CtaButton href={`/${locale}#aktuelle-projekte`} label="Aktuelle Projekte" icon={<FolderOpen />} wide />
        </div>
      </section>

      {/* Was ist UrbanKIT */}
      <section className="relative overflow-hidden min-h-svh flex flex-col justify-center px-6 md:px-16 lg:px-24 pt-8 pb-14 md:pt-12 md:pb-28 border-b" style={{ background: 'var(--plattform-light)' }}>
        {/* Decorative map pin */}
        <MessageCircleQuestion
          className="absolute right-16 top-1/2 -translate-y-1/2 h-[45%] w-auto opacity-10 pointer-events-none"
          strokeWidth={1}
          aria-hidden="true"
          style={{ color: 'var(--plattform)' }}
        />

        <div className="relative z-10 max-w-2xl">
          {/* Eyebrow */}
          <EyebrowBadge label="Verstehen" opacity={0.6} />

          {/* Headline */}
          <h2 className="text-title font-black tracking-tight mb-5">
            Was ist Urban<span style={{ color: 'var(--plattform)' }}>KIT</span>?
          </h2>

          {/* Body */}
          <p className="text-text leading-relaxed mb-12">
            UrbanKIT ist das digitale Tool für Bürger:innenbeteiligung der Stadt {cityName}. Hier
            siehst du, was geplant wird, kannst Fragen stellen, mitdiskutieren und deine Stimme
            einbringen, um Entscheidungen aktiv mit zu beeinflussen.
          </p>

          {/* CTA */}
          <CtaButton href={`/${locale}/ueber-urbankit`} label="UrbanKIT erklärt" icon={<Info />} />
        </div>
      </section>

      {/* Drei Bereiche */}
      <section className="min-h-svh flex flex-col justify-center pt-8 pb-14 md:pt-12 md:pb-28 px-6 md:px-16 lg:px-24 border-b" style={{ background: 'var(--plattform-light)' }}>
        <div className="w-full">
          <EyebrowBadge label="Orientierung" opacity={0.6} />
          <h2 className="text-title font-black tracking-tight mb-2">
            Drei Bereiche<span style={{ color: 'var(--plattform)' }}>.</span> Ein Ziel<span style={{ color: 'var(--plattform)' }}>.</span>
          </h2>
          <p className="text-text mb-12 max-w-2xl">
            UrbanKIT bündelt Beteiligung an einem Ort und trennt sie farblich sichtbar voneinander: Projekte sichtbar machen, Zusammenarbeit ermöglichen und Wissen zugänglich machen. Du kannst dich hier informieren oder dich einbringen, um Projekte mitzugestalten.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href={`/${locale}/bereich/projekte-archiv`} className="group block bg-white rounded-xl p-8 border hover:shadow-md hover:bg-[var(--projekte-light)] transition-all">
              <div className="flex items-center gap-3 mb-5">
                <Circle className="text-display w-[0.8em] h-[0.8em] shrink-0" fill="currentColor" strokeWidth={0} style={{ color: 'var(--projekte-dark)' }} />
                <h3 className="text-display font-black tracking-tight transition-colors" style={{ color: 'var(--projekte-dark)' }}>
                  Projekte & Archiv
                </h3>
              </div>
              <p className="text-text" style={{ color: 'var(--plattform-ink)' }}>
                Entdecke laufende und abgeschlossene Projekte. Sieh, woran gearbeitet wird, was entschieden wurde und wie Beteiligung wirkt.
              </p>
            </Link>
            <Link href={`/${locale}/bereich/zusammenarbeit`} className="group block bg-white rounded-xl p-8 border hover:shadow-md hover:bg-[var(--zusammenarbeit-light)] transition-all">
              <div className="flex items-center gap-3 mb-5">
                <Circle className="text-display w-[0.8em] h-[0.8em] shrink-0" fill="currentColor" strokeWidth={0} style={{ color: 'var(--zusammenarbeit-dark)' }} />
                <h3 className="text-display font-black tracking-tight transition-colors" style={{ color: 'var(--zusammenarbeit-dark)' }}>
                  Zusammenarbeit
                </h3>
              </div>
              <p className="text-text" style={{ color: 'var(--plattform-ink)' }}>
                Arbeite aktiv an Projekten mit. Stimme ab, tausche dich aus und entwickle gemeinsam Lösungen – strukturiert an einem Ort.
              </p>
            </Link>
            <Link href={`/${locale}/bereich/grundlagen`} className="group block bg-white rounded-xl p-8 border hover:shadow-md hover:bg-[var(--grundlagen-light)] transition-all">
              <div className="flex items-center gap-3 mb-5">
                <Circle className="text-display w-[0.8em] h-[0.8em] shrink-0" fill="currentColor" strokeWidth={0} style={{ color: 'var(--grundlagen-dark)' }} />
                <h3 className="text-display font-black tracking-tight transition-colors" style={{ color: 'var(--grundlagen-dark)' }}>
                  Grundlagen & Methoden
                </h3>
              </div>
              <p className="text-text" style={{ color: 'var(--plattform-ink)' }}>
                Verstehe, wie gute Beteiligung funktioniert. Hier findest du Methoden, Hintergründe und Orientierung für Planung und Umsetzung.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* Aktuelle Projekte */}
      <section id="aktuelle-projekte" className="min-h-svh flex flex-col justify-center pt-8 pb-14 md:pt-12 md:pb-28 px-6 md:px-16 lg:px-24 border-b" style={{ background: 'var(--projekte-light)' }}>
        <div className="w-full">
          <EyebrowBadge label="Entdecken" bg="var(--projekte)" color="var(--plattform-ink)" />
          <h2 className="text-title font-black tracking-tight mb-2">
            Aktuelle Projekte<span style={{ color: 'var(--projekte)' }}>:</span>
          </h2>
          <p className="text-text mb-12 max-w-2xl">
            Hier siehst du, woran auf UrbanKIT gerade gearbeitet wird. Jedes Projekt ist ein Ort für Information, Diskussion und echte Mitgestaltung.
          </p>
          {projects.length === 0 ? (
            <p className="text-text" style={{ color: 'var(--plattform-ink)' }}>Aktuell keine öffentlichen Projekte.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {projects.map((p) => (
                <Link
                  key={p.id}
                  href={`/${locale}/projekte/${p.slug}`}
                  className="group block bg-white rounded-xl p-8 border hover:shadow-md hover:bg-[var(--projekte-light)] transition-all min-h-48"
                >
                  <h3 className="text-display font-black tracking-tight mb-5 transition-colors" style={{ color: 'var(--projekte-dark)' }}>
                    {p.title}
                  </h3>
                  {p.summary && <p className="text-text line-clamp-2" style={{ color: 'var(--plattform-ink)' }}>{p.summary}</p>}
                </Link>
              ))}
            </div>
          )}
          <CtaButton href={`/${locale}/bereich/projekte-archiv/alle-projekte`} label="Alle Projekte" icon={<FolderOpen />} variant="projekte" />
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden min-h-svh flex flex-col justify-center pt-8 pb-14 md:pt-12 md:pb-28 px-6 md:px-16 lg:px-24 border-b" style={{ background: 'var(--plattform-light)' }}>
        <HandHeart
          className="absolute right-16 top-1/2 -translate-y-1/2 h-[45%] w-auto opacity-10 pointer-events-none"
          strokeWidth={1}
          aria-hidden="true"
          style={{ color: 'var(--plattform)' }}
        />
        <div className="relative z-10 max-w-4xl">
          <EyebrowBadge label="Jetzt mitmachen" opacity={0.6} />
          <h2 className="text-hero font-black leading-none tracking-tight mb-5">
            Gestalte {cityName} mit<span style={{ color: 'var(--plattform)' }}>.</span>
          </h2>
          <p className="text-text mb-12">
            UrbanKIT ist kostenlos und offen für alle Bürger:innen in {cityName}. Du brauchst kein Vorwissen – nur Interesse. Melde dich an, folge Projekten, stelle Fragen und bring deine Perspektive ein.
          </p>
          <CtaButton href={`/${locale}/starten`} label="Jetzt starten" icon={<Flag />} />
        </div>
      </section>

      <PublicFooter locale={locale} />
    </div>
  )
}
