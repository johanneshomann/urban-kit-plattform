'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Settings2 } from 'lucide-react'
import { useDashboardBg } from './DashboardShell'

export interface DashboardCardData {
  id: string
  slug: string
  title: string
  coverSrc: string
  galleryImages: string[]
  roleLabel: string
  pulse: string[]
  canManage: boolean
  scheme: { light: string; mid: string; dark: string; accent: string; white: string }
}

interface DashboardGridProps {
  locale: string
  cards: DashboardCardData[]
}

function CardItem({ card, locale }: { card: DashboardCardData; locale: string }) {
  const t = useTranslations('dashboard')
  const [bottomImage, setBottomImage] = useState(card.coverSrc)
  const [topImage, setTopImage] = useState(card.coverSrc)
  const [topOpacity, setTopOpacity] = useState(1)

  const changeImage = (src: string) => {
    if (src === topImage) return
    setBottomImage(topImage)
    setTopImage(src)
    setTopOpacity(0)
    requestAnimationFrame(() => requestAnimationFrame(() => setTopOpacity(1)))
  }

  return (
    <div className="relative group">
      {card.canManage && (
        <Link
          href={`/${locale}/dashboard/projekte/${card.slug}/manage`}
          className="absolute top-2 right-2 z-10 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
          style={{ background: card.scheme.white, color: card.scheme.dark }}
          title={t('manageProject')}
        >
          <Settings2 className="text-text w-[1em] h-[1em]" />
        </Link>
      )}
      <Link
        href={`/${locale}/dashboard/projekte/${card.slug}`}
        className="block rounded-xl overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5"
        style={{ border: `1.5px solid ${card.scheme.light}`, background: card.scheme.white }}
      >
        <div className="h-72 w-full relative">
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={bottomImage}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            <img
              src={topImage}
              alt=""
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105"
              style={{ opacity: topOpacity, transition: 'opacity 0.35s ease, transform 0.5s ease' }}
            />
          </div>
          {card.galleryImages.length > 0 && (
            <div
              className="absolute flex gap-1.5 z-10 rounded-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ bottom: '8px', right: '8px', padding: '6px', background: 'rgba(255,255,255,0.25)' }}
            >
              {[card.coverSrc, ...card.galleryImages].slice(0, 4).map((src, i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-md overflow-hidden shrink-0 shadow-md cursor-pointer transition-transform hover:scale-110"
                  onMouseEnter={(e) => { e.preventDefault(); changeImage(src) }}
                >
                  <img src={src} alt="" className="w-full h-full object-cover image-fade-in" />
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-4" style={{ background: card.scheme.light }}>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-display font-semibold leading-snug" style={{ color: card.scheme.dark }}>
              {card.title}
            </h3>
            <span
              className="text-small shrink-0 px-2 py-0.5 rounded-full font-medium mt-0.5"
              style={{ background: card.scheme.mid, color: card.scheme.white }}
            >
              {card.roleLabel}
            </span>
          </div>
          {card.pulse.length > 0 ? (
            <p className="text-small mt-1.5" style={{ color: card.scheme.dark, opacity: 0.6 }}>
              <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 mb-0.5" style={{ background: card.scheme.accent }} />
              {card.pulse.join(' · ')}
            </p>
          ) : (
            <p className="text-small mt-1.5" style={{ color: card.scheme.dark, opacity: 0.35 }}>{t('noActivity')}</p>
          )}
        </div>
      </Link>
    </div>
  )
}

export function DashboardGrid({ locale, cards }: DashboardGridProps) {
  const setBg = useDashboardBg()

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {cards.map((card) => (
        <div
          key={card.id}
          onMouseEnter={() => setBg(card.scheme.white)}
          onMouseLeave={() => setBg(null)}
        >
          <CardItem card={card} locale={locale} />
        </div>
      ))}
    </div>
  )
}
