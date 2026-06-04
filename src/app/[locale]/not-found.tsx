import Link from 'next/link'

export default function LocaleNotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center p-8 max-w-md">
        <h1 className="text-6xl font-bold text-gray-200 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Seite nicht gefunden</h2>
        <p className="text-gray-500 mb-8">
          Die gesuchte Seite existiert nicht oder wurde verschoben.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/de" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">
            Startseite
          </Link>
          <Link href="/de/bereich/projekte-archiv/alle-projekte" className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition text-sm">
            Projekte
          </Link>
        </div>
      </div>
    </main>
  )
}
