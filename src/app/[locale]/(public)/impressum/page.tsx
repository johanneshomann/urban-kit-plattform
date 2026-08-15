// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { getTranslations } from 'next-intl/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'
import { PublicNavServer } from '@/components/public/PublicNavServer'
import { PublicFooter } from '@/components/public/PublicFooter'
import { EyebrowBadge } from '@/components/public/EyebrowBadge'
import { ScrollHint } from '@/components/public/ScrollHint'
import { getCitySettings } from '@/lib/instance'
import { hasRichTextContent } from '@/lib/richtext'
import { ScrollText } from 'lucide-react'

const accent = (chunks: ReactNode) => <span style={{ color: 'var(--plattform)' }}>{chunks}</span>

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'legal' })
  return { title: t('impressumMeta') }
}

export default async function ImpressumPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'legal' })
  const { cityName, cityLogoUrl } = await getCitySettings()

  let impressumHtml: string | null = null
  try {
    const payload = await getPayload({ config })
    const read = async (loc: 'de' | 'en') =>
      (await payload.findGlobal({
        slug: 'legal-settings',
        locale: loc,
        fallbackLocale: 'de',
        overrideAccess: true,
      })) as unknown as { impressum?: unknown }
    let content = (await read(locale as 'de' | 'en')).impressum
    // Payload's fallbackLocale only covers absent values — a saved-but-empty EN
    // document counts as a value and defeats it, so fall back to DE manually.
    if (locale !== 'de' && !hasRichTextContent(content)) content = (await read('de')).impressum
    if (hasRichTextContent(content)) {
      impressumHtml = convertLexicalToHTML({ data: content as Parameters<typeof convertLexicalToHTML>[0]['data'] })
    }
  } catch {}

  return (
    <div className="min-h-svh flex flex-col">
      <PublicNavServer locale={locale} />
      <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col">

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
        <div className="relative z-10 max-w-2xl">
          <EyebrowBadge label={t('eyebrow')} />
          <h1 className="text-hero font-black leading-none tracking-tight mb-5">
            {t.rich('impressumTitle', { accent })}
          </h1>
          <p className="text-text leading-relaxed max-w-2xl" style={{ color: 'var(--plattform-ink)' }}>
            {t('impressumIntro')}
          </p>
        </div>
        {/* Scroll hint last in the hero DOM: absolute-positioned, so visuals are unchanged, but Tab reaches it after the hero content instead of first. */}
        <ScrollHint />
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
              {t('impressumEmpty')}
            </p>
          )}
        </div>
      </section>

      </main>
      <PublicFooter locale={locale} />
    </div>
  )
}
