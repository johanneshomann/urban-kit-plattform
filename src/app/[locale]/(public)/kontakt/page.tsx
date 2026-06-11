import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { PublicNavServer } from '@/components/public/PublicNavServer'
import { PublicFooter } from '@/components/public/PublicFooter'
import { EyebrowBadge } from '@/components/public/EyebrowBadge'
import { ScrollHint } from '@/components/public/ScrollHint'
import { getCitySettings } from '@/lib/instance'
import { Mail } from 'lucide-react'
import { KontaktForm } from './KontaktForm'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Kontakt – Urban KIT',
    description: 'Kontakt zur Urban KIT Plattform.',
  }
}

interface LegalContact {
  operatorName?: string
  contactEmail?: string
  technicalSupportEmail?: string
  streetAddress?: string
  zipCode?: string
  addressCity?: string
}

async function getLegalContact(): Promise<LegalContact> {
  try {
    const payload = await getPayload({ config })
    const data = await payload.findGlobal({ slug: 'legal-settings', overrideAccess: true })
    return data as unknown as LegalContact
  } catch {
    return {}
  }
}

export default async function KontaktPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const [{ cityName, cityLogoUrl }, legal] = await Promise.all([
    getCitySettings(),
    getLegalContact(),
  ])

  const operatorName = legal.operatorName || cityName
  const contactEmail = legal.contactEmail || 'urbankit@detmold.de'
  const supportEmail = legal.technicalSupportEmail || contactEmail
  const street = legal.streetAddress || 'Rathaus Detmold, Marktplatz 1'
  const zip = legal.zipCode || '32756'
  const city = legal.addressCity || 'Detmold'

  return (
    <div className="min-h-svh flex flex-col">
      <PublicNavServer locale={locale} />

      {/* Hero */}
      <section
        className="relative min-h-[calc(100svh-3.5rem)] flex flex-col justify-start overflow-hidden border-b px-6 md:px-16 lg:px-24 pt-20 pb-10 md:pt-28 md:pb-20"
        style={{ background: 'var(--plattform-light)' }}
      >
        <Mail
          className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 h-[45%] w-auto opacity-10 pointer-events-none"
          strokeWidth={1}
          aria-hidden="true"
          style={{ color: 'var(--plattform)' }}
        />
        <ScrollHint />
        <div className="relative z-10">
          <EyebrowBadge label="Kontakt" opacity={0.6} />
          <h1 className="text-hero font-black leading-none tracking-tight mb-5">
            Schreib uns<span style={{ color: 'var(--plattform)' }}>.</span>
          </h1>
          <p className="text-text leading-relaxed max-w-2xl" style={{ color: 'var(--plattform-ink)' }}>
            Du hast Fragen zur Plattform, zu einem Projekt oder möchtest Feedback geben?
            Wir freuen uns über deine Nachricht.
          </p>
        </div>
      </section>

      {/* Contact details */}
      <section
        className="min-h-svh flex flex-col justify-center px-6 md:px-16 lg:px-24 py-12 md:py-24"
        style={{ background: 'var(--plattform-light)' }}
      >
        <EyebrowBadge label="Kontaktdaten" opacity={0.6} />
        <h2 className="text-title font-black tracking-tight mb-10">
          So erreichst<br />du uns<span style={{ color: 'var(--plattform)' }}>.</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Left — contact info */}
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-xl border p-7 flex flex-col gap-5 hover:shadow-md transition-all">
              <div>
                <p className="text-small uppercase tracking-widest font-black mb-1" style={{ color: 'var(--plattform-ink)' }}>Plattformbetreiber</p>
                <p className="text-text font-semibold" style={{ color: 'var(--plattform-ink-accent)' }}>{operatorName}</p>
              </div>
              <div>
                <p className="text-small uppercase tracking-widest font-black mb-1" style={{ color: 'var(--plattform-ink)' }}>E-Mail</p>
                <a
                  href={`mailto:${contactEmail}`}
                  className="text-text transition-opacity hover:opacity-70"
                  style={{ color: 'var(--plattform)' }}
                >
                  {contactEmail}
                </a>
              </div>
              <div>
                <p className="text-small uppercase tracking-widest font-black mb-1" style={{ color: 'var(--plattform-ink)' }}>Adresse</p>
                <address className="not-italic text-text" style={{ color: 'var(--plattform-ink)' }}>
                  {street}<br />
                  {zip} {city}
                </address>
              </div>
            </div>
            <p className="text-small" style={{ color: 'var(--plattform-ink)' }}>
              Für technische Probleme mit deinem Konto wende dich bitte an{' '}
              <a
                href={`mailto:${supportEmail}`}
                className="transition-opacity hover:opacity-70"
                style={{ color: 'var(--plattform)' }}
              >
                {supportEmail}
              </a>
              .
            </p>
          </div>

          {/* Right — form */}
          <KontaktForm />
        </div>
      </section>

      <PublicFooter locale={locale} />
    </div>
  )
}
