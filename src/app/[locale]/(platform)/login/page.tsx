import { LoginForm } from './LoginForm'
import { getCitySettings } from '@/lib/instance'
import Link from 'next/link'
import { Mail } from 'lucide-react'

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const { cityName, cityLogoUrl } = await getCitySettings()

  return (
    <main className="min-h-screen flex flex-col md:flex-row">

      {/* Left branding panel — desktop only */}
      <div
        className="hidden md:flex md:w-2/5 shrink-0 flex-col justify-between px-6 py-2 md:px-10"
        style={{ background: 'var(--plattform)', color: 'var(--plattform-white)' }}
      >
        <Link href={`/${locale}`} className="font-bold text-text opacity-80 hover:opacity-100 transition-opacity">
          <span className="font-normal">Urban</span><span className="opacity-60">KIT</span>
          <span className="font-normal opacity-50"> – {cityName}</span>
        </Link>

        <div className="flex flex-col gap-5">
          <p className="text-title font-bold leading-tight">
            Willkommen zurück<span style={{ color: 'var(--plattform-white)' }}>!</span>
          </p>
          <p className="text-text" style={{ opacity: 0.65 }}>
            Melde dich an und nimm an städtischen Projekten und Beteiligungsprozessen teil.
          </p>
        </div>

        <div className="flex items-center gap-6">
          <p className="text-small" style={{ opacity: 0.25 }}>
            © {new Date().getFullYear()} UrbanKIT
          </p>
          <Link
            href={`/${locale}/kontakt`}
            className="flex items-center gap-2 text-small transition-opacity opacity-40 hover:opacity-80"
          >
            <Mail className="w-[1em] h-[1em] shrink-0" />
            Kontakt
          </Link>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col">

        {/* Mobile branding bar */}
        <div
          className="md:hidden flex items-center px-6 py-2"
          style={{ background: 'var(--plattform)', color: 'var(--plattform-white)' }}
        >
          <Link href={`/${locale}`} className="font-bold text-text">
            <span className="font-normal">Urban</span><span className="opacity-60">KIT</span>
            <span className="font-normal opacity-50"> – {cityName}</span>
          </Link>
        </div>

        {/* Centered form content */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 py-8">
          <div className="w-full max-w-sm flex flex-col gap-10">
            {cityLogoUrl && (
              <img src={cityLogoUrl} alt={cityName} className="h-16 w-auto object-contain" />
            )}
            <LoginForm registerHref={`/${locale}/register`} />
          </div>
        </div>

      </div>

    </main>
  )
}
