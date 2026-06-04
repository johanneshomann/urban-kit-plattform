import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'
import { PublicNav } from '@/components/public/PublicNav'
import { PublicFooter } from '@/components/public/PublicFooter'
import { EyebrowBadge } from '@/components/public/EyebrowBadge'
import { ScrollHint } from '@/components/public/ScrollHint'
import { getCitySettings } from '@/lib/instance'
import { ScrollText } from 'lucide-react'

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Impressum – Urban KIT' }
}

export default async function ImpressumPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const { cityName, cityLogoUrl } = await getCitySettings()

  let impressumHtml: string | null = null
  try {
    const payload = await getPayload({ config })
    const data = await payload.findGlobal({ slug: 'legal-settings', overrideAccess: true })
    const content = (data as unknown as { impressumContent?: unknown }).impressumContent
    if (content) {
      impressumHtml = convertLexicalToHTML({ data: content as Parameters<typeof convertLexicalToHTML>[0]['data'] })
    }
  } catch {}

  return (
    <div className="min-h-svh flex flex-col">
      <PublicNav locale={locale} cityName={cityName} cityLogoUrl={cityLogoUrl} />

      {/* Hero */}
      <section
        className="relative min-h-[calc(100svh-3.5rem)] flex flex-col justify-start overflow-hidden border-b px-6 md:px-16 lg:px-24 pt-20 pb-10 md:pt-28 md:pb-20"
        style={{ background: 'var(--plattform-light)' }}
      >
        <ScrollText
          className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 h-[45%] w-auto opacity-10 pointer-events-none"
          strokeWidth={1}
          aria-hidden="true"
          style={{ color: 'var(--plattform)' }}
        />
        <ScrollHint />
        <div className="relative z-10 max-w-2xl">
          <EyebrowBadge label="Rechtliches" opacity={0.6} />
          <h1 className="text-hero font-black leading-none tracking-tight mb-5">
            Impressum<span style={{ color: 'var(--plattform)' }}>.</span>
          </h1>
          <p className="text-text leading-relaxed max-w-2xl" style={{ color: 'var(--plattform-ink)' }}>
            Angaben gemäß § 5 TMG — Verantwortlich für den Inhalt dieser Plattform.
          </p>
        </div>
      </section>

      {/* Content */}
      <section
        className="flex-1 px-6 md:px-16 lg:px-24 py-12 md:py-24"
        style={{ background: 'var(--plattform-light)' }}
      >
        <div className="max-w-3xl">
          {impressumHtml ? (
            <div
              className="prose prose-gray max-w-none text-text"
              style={{ color: 'var(--plattform-ink)' }}
              dangerouslySetInnerHTML={{ __html: impressumHtml }}
            />
          ) : (
            <p className="text-text" style={{ color: 'var(--plattform-ink)' }}>
              Impressum wurde noch nicht konfiguriert. Bitte im Admin-Panel unter
              „Legal – Kontakt &amp; Impressum" eintragen.
            </p>
          )}
        </div>
      </section>

      <PublicFooter locale={locale} />
    </div>
  )
}
