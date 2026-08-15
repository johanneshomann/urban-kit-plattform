// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { useEffect, useState } from 'react'
import { useAccessibility } from '@/components/accessibility/AccessibilityProvider'

export interface HeroImage {
  url: string
  alt?: string
  caption?: string
}

interface HeroSlideshowProps {
  images: HeroImage[]
  interval?: number
  /** Wash over the slides — required so the tint stays a caller-side token choice. */
  overlayClass: string
}

export function HeroSlideshow({ images, interval = 5000, overlayClass }: HeroSlideshowProps) {
  const [current, setCurrent] = useState(0)
  const { settings } = useAccessibility()

  // Auto-advance is motion (WCAG 2.2.2 / 2.3.3): the reduce-motion preference
  // freezes the slideshow entirely — CSS can only shorten the crossfade, which
  // would turn the rotation into a hard cut instead of stopping it.
  useEffect(() => {
    if (images.length <= 1 || settings.reduceMotion) return
    const id = setInterval(() => {
      setCurrent((i) => (i + 1) % images.length)
    }, interval)
    return () => clearInterval(id)
  }, [images.length, interval, settings.reduceMotion])

  if (images.length === 0) return null

  return (
    <div className="absolute inset-0 overflow-hidden">
      {images.map((img, i) => (
        <img
          key={img.url}
          src={img.url}
          alt={img.alt ?? img.caption ?? ''}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 blur-[2px] scale-105"
          style={{ opacity: i === current ? 1 : 0 }}
          aria-hidden={i !== current}
        />
      ))}
      <div className={`absolute inset-0 ${overlayClass}`} />
      {images[current]?.caption && (
        <p
          className="absolute bottom-14 left-16 md:left-24 text-small font-normal z-10 px-2.5 py-1 rounded-lg"
          style={{ color: 'var(--plattform-ink)', background: 'var(--plattform-white-transparent)' }}
        >
          {images[current].caption}
        </p>
      )}
    </div>
  )
}
