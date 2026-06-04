'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center p-8 max-w-md">
        <h1 className="text-6xl font-bold text-gray-200 mb-4">500</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Etwas ist schiefgelaufen</h2>
        <p className="text-gray-500 mb-8">
          Ein unerwarteter Fehler ist aufgetreten. Du kannst es erneut versuchen oder zur Startseite zurückkehren.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
          >
            Erneut versuchen
          </button>
          <Link href="/de" className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition text-sm">
            Startseite
          </Link>
        </div>
      </div>
    </main>
  )
}
