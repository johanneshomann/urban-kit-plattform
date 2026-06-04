import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { getPlatformColors, colorsToCssVars } from '@/lib/theme'
import '@/styles/globals.css'
import React from 'react'

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!routing.locales.includes(locale as 'de' | 'en')) {
    notFound()
  }

  const [messages, colors] = await Promise.all([getMessages(), getPlatformColors()])
  const cssVars = colorsToCssVars(colors)

  return (
    <html lang={locale} style={{ ['--theme' as string]: 'loaded' }}>
      <head>
        <style>{`:root { ${cssVars} }`}</style>
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
