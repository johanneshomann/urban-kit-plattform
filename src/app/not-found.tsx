import Link from 'next/link'

export default function RootNotFound() {
  return (
    <html lang="de">
      <body className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <h1 className="text-6xl font-bold text-gray-200 mb-4">404</h1>
          <p className="text-xl text-gray-600 mb-6">Seite nicht gefunden</p>
          <Link href="/de" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">
            Zur Startseite
          </Link>
        </div>
      </body>
    </html>
  )
}
