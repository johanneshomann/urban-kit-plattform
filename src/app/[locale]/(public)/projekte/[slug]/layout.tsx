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
      {children}
      <PublicFooter locale={locale} />
    </div>
  )
}