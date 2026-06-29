import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'
import { PublicNavServer } from '@/components/public/PublicNavServer'
import { PublicFooter } from '@/components/public/PublicFooter'
import { EyebrowBadge } from '@/components/public/EyebrowBadge'
import { ScrollHint } from '@/components/public/ScrollHint'
import { Cookie } from 'lucide-react'

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Cookie-Richtlinie – Urban KIT' }
}

export default async function CookiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  let cookiesHtml: string | null = null
  try {
    const payload = await getPayload({ config })
    const data = await payload.findGlobal({
      slug: 'legal-settings',
      locale: locale as 'de' | 'en',
      fallbackLocale: 'de',
      overrideAccess: true,
    })
    const content = (data as unknown as { cookies?: unknown }).cookies
    if (content) {
      cookiesHtml = convertLexicalToHTML({ data: content as Parameters<typeof convertLexicalToHTML>[0]['data'] })
    }
  } catch {}

  return (
    <div className="min-h-svh flex flex-col">
      <PublicNavServer locale={locale} />

      {/* Hero */}
      <section
        className="relative min-h-[calc(100svh-3.5rem)] flex flex-col justify-start overflow-hidden border-b px-6 md:px-16 lg:px-24 pt-20 pb-10 md:pt-28 md:pb-20"
        style={{ background: 'var(--plattform-light)' }}
      >
        <Cookie
          className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 h-[45%] w-auto opacity-10 pointer-events-none"
          strokeWidth={1}
          aria-hidden="true"
          style={{ color: 'var(--plattform)' }}
        />
        <ScrollHint />
        <div className="relative z-10 max-w-2xl">
          <EyebrowBadge label="Rechtliches" opacity={0.6} />
          <h1 className="text-hero font-black leading-none tracking-tight mb-5">
            Cookies<span style={{ color: 'var(--plattform)' }}>.</span>
          </h1>
          <p className="text-text leading-relaxed max-w-2xl" style={{ color: 'var(--plattform-ink)' }}>
            Cookie-Richtlinie — Informationen zu den auf dieser Plattform eingesetzten Cookies.
          </p>
        </div>
      </section>

      {/* Content */}
      <section
        className="flex-1 px-6 md:px-16 lg:px-24 py-12 md:py-24"
        style={{ background: 'var(--plattform-light)' }}
      >
        <div className="max-w-3xl">
          {cookiesHtml ? (
            <div
              className="prose prose-gray max-w-none text-text"
              style={{ color: 'var(--plattform-ink)' }}
              dangerouslySetInnerHTML={{ __html: cookiesHtml }}
            />
          ) : (
            <p className="text-text" style={{ color: 'var(--plattform-ink)' }}>
              Die Cookie-Richtlinie wurde noch nicht konfiguriert. Bitte im Admin-Panel unter
              „Legal – Kontakt &amp; Recht" → „Cookie-Richtlinie" eintragen.
            </p>
          )}
        </div>
      </section>

      <PublicFooter locale={locale} />
    </div>
  )
}
