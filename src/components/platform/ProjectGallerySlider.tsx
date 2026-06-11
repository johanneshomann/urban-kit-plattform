'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface GalleryImage {
  url: string
  alt?: string | null
  caption?: string | null
}

export function ProjectGallerySlider({ images }: { images: GalleryImage[] }) {
  const [slidesPerView, setSlidesPerView] = useState(1)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const update = () => setSlidesPerView(window.innerWidth >= 640 ? 2 : 1)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const n = images.length
  const maxIndex = Math.max(0, n - slidesPerView)
  const clamp = (i: number) => Math.min(Math.max(i, 0), maxIndex)

  const prev = () => setIndex((i) => clamp(i - 1))
  const next = () => setIndex((i) => clamp(i + 1))

  const atStart = index === 0
  const atEnd = index >= maxIndex

  // Track is (n / slidesPerView) × container width.
  // Each slide = (100 / n)% of track = (slidesPerView / n) × container — shows exactly 1/slidesPerView.
  // Moving one step = (100 / n)% of track.
  const trackWidthPct = (n / slidesPerView) * 100
  const stepPct = 100 / n

  return (
    <div style={{ position: 'relative', width: '100%', overflow: 'hidden', borderRadius: '0.75rem' }}>
      {/* Track */}
      <div
        style={{
          display: 'flex',
          width: `${trackWidthPct}%`,
          transform: `translateX(-${index * stepPct}%)`,
          transition: 'transform 0.35s ease',
        }}
      >
        {images.map((img, i) => (
          <div
            key={i}
            style={{
              width: `${100 / n}%`,
              flexShrink: 0,
              position: 'relative',
              aspectRatio: '16/5',
              paddingRight: i < n - 1 ? '0.25rem' : 0,
            }}
          >
            <img
              src={img.url}
              alt={img.alt ?? img.caption ?? ''}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: '0.5rem' }}
            />
            {img.caption && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: i < n - 1 ? '0.25rem' : 0,
                  padding: '0.5rem 1rem',
                  background: 'linear-gradient(to top, rgba(0,0,0,0.45), transparent)',
                  color: '#fff',
                  fontSize: '0.8rem',
                  borderBottomLeftRadius: '0.5rem',
                  borderBottomRightRadius: '0.5rem',
                }}
              >
                {img.caption}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Prev */}
      <button
        onClick={prev}
        aria-label="Vorheriges Bild"
        style={{
          position: 'absolute', left: '0.75rem', top: '50%',
          transform: 'translateY(-50%)',
          background: 'var(--project-white)',
          border: '1.5px solid var(--project-light)',
          color: 'var(--project-dark)',
          borderRadius: '50%', width: '2rem', height: '2rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: atStart ? 'default' : 'pointer',
          boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
          opacity: atStart ? 0.3 : 1,
          transition: 'opacity 0.15s ease',
        }}
      >
        <ChevronLeft style={{ width: '1rem', height: '1rem' }} />
      </button>

      {/* Next */}
      <button
        onClick={next}
        aria-label="Nächstes Bild"
        style={{
          position: 'absolute', right: '0.75rem', top: '50%',
          transform: 'translateY(-50%)',
          background: 'var(--project-white)',
          border: '1.5px solid var(--project-light)',
          color: 'var(--project-dark)',
          borderRadius: '50%', width: '2rem', height: '2rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: atEnd ? 'default' : 'pointer',
          boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
          opacity: atEnd ? 0.3 : 1,
          transition: 'opacity 0.15s ease',
        }}
      >
        <ChevronRight style={{ width: '1rem', height: '1rem' }} />
      </button>

      {/* Dots */}
      <div
        style={{
          position: 'absolute', bottom: '0.6rem', left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex', gap: '0.35rem',
        }}
      >
        {Array.from({ length: maxIndex + 1 }).map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Position ${i + 1}`}
            style={{
              width: i === index ? '1.25rem' : '0.4rem',
              height: '0.4rem',
              borderRadius: '999px',
              background: 'var(--project-white)',
              opacity: i === index ? 1 : 0.5,
              border: 'none',
              cursor: 'pointer',
              transition: 'width 0.2s ease, opacity 0.2s ease',
              padding: 0,
            }}
          />
        ))}
      </div>
    </div>
  )
}
