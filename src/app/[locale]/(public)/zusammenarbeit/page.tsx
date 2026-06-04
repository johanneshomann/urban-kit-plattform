import { redirect } from 'next/navigation'

export default async function ZusammenarbeitPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  redirect(`/${locale}/bereich/zusammenarbeit`)
}
