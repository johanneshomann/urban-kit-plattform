import { redirect } from 'next/navigation'

export default async function ({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  redirect(`/${locale}/bereich/grundlagen/partizipation`)
}
