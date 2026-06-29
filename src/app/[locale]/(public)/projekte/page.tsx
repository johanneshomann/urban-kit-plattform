import { redirect } from 'next/navigation'

// `/projekte` is referenced by the sitemap and external links — the canonical
// public listing lives under Bereich Projekte & Archiv.
export default async function ProjekteIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  redirect(`/${locale}/bereich/projekte-archiv/alle-projekte`)
}
