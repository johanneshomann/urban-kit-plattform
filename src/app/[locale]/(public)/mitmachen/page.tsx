import { redirect } from 'next/navigation'

export default async function MitmachenPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  redirect(`/${locale}/starten`)
}
