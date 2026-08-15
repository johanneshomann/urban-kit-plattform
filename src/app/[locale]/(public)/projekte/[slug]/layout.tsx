// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import type { ReactNode } from 'react'
import { PublicNavServer } from '@/components/public/PublicNavServer'
import { PublicFooter } from '@/components/public/PublicFooter'

// Static shell for the project stack: nav + footer stay outside the slide
// template so only the page content animates on sub-routes.
export default async function ProjectLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale } = await params
  return (
    <div className="min-h-svh flex flex-col">
      <PublicNavServer locale={locale} />
      <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col">
        {children}
      </main>
      <PublicFooter locale={locale} />
    </div>
  )
}