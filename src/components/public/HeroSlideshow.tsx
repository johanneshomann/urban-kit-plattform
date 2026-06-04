'use client'

import { useEffect, useState } from 'react'

export interface HeroImage {
  url: string
  alt?: string
  caption?: string
}

interface HeroSlideshowProps {
  images: HeroImage[]
  interval?: number
  overlayClass?: string
}

export function HeroSlideshow({ images, interval = 5000, overlayClass = 'bg-black/50' }: HeroSlideshowProps) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (images.length <= 1) return
    const id = setInterval(() => {
      setCurrent((i) => (i + 1) % images.length)
    }, interval)
    return () => clearInterval(id)
  }, [images.length, interval])

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
        <p className="absolute bottom-14 left-16 md:left-24 text-small font-normal z-10 opacity-40" style={{ color: 'var(--plattform-ink)' }}>
          {images[current].caption}
        </p>
      )}
    </div>
  )
}
