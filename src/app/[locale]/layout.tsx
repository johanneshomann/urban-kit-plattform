import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { getPlatformColors, colorsToCssVars } from '@/lib/theme'
import { AccessibilityProvider } from '@/components/accessibility/AccessibilityProvider'
import { AccessibilityButton } from '@/components/accessibility/AccessibilityButton'
import '@/styles/globals.css'
import React from 'react'

// Applies saved accessibility prefs before paint to avoid a flash of default styling.
const A11Y_PREPAINT_SCRIPT = `(function(){try{var s=JSON.parse(localStorage.getItem('uk-a11y'));if(!s)return;var r=document.documentElement;if(typeof s.fontScale==='number'&&s.fontScale!==1){r.style.fontSize=Math.round(s.fontScale*100)+'%';}r.classList.toggle('a11y-reduce-motion',!!s.reduceMotion);r.classList.toggle('a11y-high-contrast',!!s.highContrast);r.classList.toggle('a11y-underline-links',!!s.underlineLinks);}catch(e){}})();`

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
    <html lang={locale} style={cssVars as React.CSSProperties} suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: A11Y_PREPAINT_SCRIPT }} />
        <NextIntlClientProvider messages={messages}>
          <AccessibilityProvider>
            {children}
            <AccessibilityButton />
          </AccessibilityProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
