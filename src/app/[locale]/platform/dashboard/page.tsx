import { TopBar } from '@/components/layout/TopBar'
import Link from 'next/link'

export default async function AppHomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar locale={locale} />
      <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Meine Projekte</h1>
        </div>
        <div className="text-gray-500 text-sm py-12 text-center">
          Noch keine Projekte. Projekte werden in Phase 2 erstellt.
        </div>
        <div className="mt-4 text-center">
          <Link
            href="/admin"
            className="text-blue-600 hover:underline text-sm"
          >
            Anmelden →
          </Link>
        </div>
      </main>
    </div>
  )
}
