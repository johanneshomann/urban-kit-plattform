'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { useTranslations } from 'next-intl'

type GalleryImage = { url: string; alt?: string | null; caption?: string | null }

// Two thumbnail rows (h-56 = 14rem each + 1rem gap); more is revealed via chevron.
const MAX_HEIGHT = '29rem'

/**
 * Project gallery: clickable grid → fullscreen lightbox. Grid clamps to two
 * rows with a centered chevron reveal (methodensammlung ExpandableContent
 * pattern). Lightbox: keyboard arrows, Escape, scroll-lock, focus trap.
 */
export function GalleryLightbox({ images, locale }: { images: GalleryImage[]; locale: string }) {
  const t = useTranslations('projectDetail')
  const items = images.filter((img) => img.url)
  const de = locale === 'de'
  const overflowing = items.length > 6
  const [expanded, setExpanded] = useState(false)
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => setMounted(true), [])

  const close = useCallback(() => setOpenIndex(null), [])
  const prev = useCallback(
    () => setOpenIndex((i) => (i === null ? i : (i - 1 + items.length) % items.length)),
    [items.length],
  )
  const next = useCallback(
    () => setOpenIndex((i) => (i === null ? i : (i + 1) % items.length)),
    [items.length],
  )

  useEffect(() => {
    if (openIndex === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'Tab') {
        const node = dialogRef.current
        if (!node) return
        const f = Array.from(node.querySelectorAll<HTMLElement>('button:not([disabled])'))
        if (!f.length) return
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus() }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus() }
      }
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey) }
  }, [openIndex, close, prev, next])

  if (items.length === 0) return null

  const revealLabel = expanded ? (de ? 'Weniger anzeigen' : 'Show less') : (de ? 'Mehr anzeigen' : 'Show more')

  return (
    <>
      <div className="relative">
        <div
          className="grid grid-cols-2 md:grid-cols-3 gap-4 overflow-hidden"
          style={{ maxHeight: expanded ? 'none' : MAX_HEIGHT, transition: 'max-height 0.35s cubic-bezier(0.22,1,0.36,1)' }}
        >
          {items.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setOpenIndex(i)}
              aria-label={img.caption || img.alt || t('galleryImage', { n: i + 1 })}
              className="group relative overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-zoom-in"
            >
              <img
                src={img.url}
                alt={img.alt ?? img.caption ?? ''}
                className="w-full h-48 sm:h-56 object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            </button>
          ))}
        </div>

        {overflowing && (
          <>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-24 z-10 transition-opacity duration-300"
              style={{ background: `linear-gradient(to bottom, transparent, ${expanded ? 'transparent' : 'var(--plattform-light)'})` }}
            />
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              aria-label={revealLabel}
              className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 z-20 flex items-center justify-center w-9 h-9 rounded-full shadow-md cursor-pointer transition-transform hover:scale-110"
              style={{ background: 'var(--plattform)', color: 'var(--plattform-white)' }}
            >
              <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} aria-hidden />
            </button>
          </>
        )}
      </div>

      {mounted && openIndex !== null && createPortal(
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={items[openIndex].caption || items[openIndex].alt || t('galleryClose')}
          onClick={close}
          className="lightbox-fade fixed inset-0 z-[9999] flex items-center justify-center p-6"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
        >
          <button
            type="button"
            onClick={close}
            aria-label={t('galleryClose')}
            data-autofocus
            className="absolute top-4 right-4 w-11 h-11 rounded-full flex items-center justify-center transition-transform hover:scale-110"
            style={{ background: 'var(--plattform-white-transparent)', color: 'var(--plattform-ink-accent)', backdropFilter: 'blur(6px)' }}
          >
            <X className="w-5 h-5" />
          </button>

          {items.length > 1 && (
            <>
              <button type="button" onClick={(e) => { e.stopPropagation(); prev() }} aria-label={t('prevImage')}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                style={{ background: 'var(--plattform-white-transparent)', color: 'var(--plattform-ink-accent)', backdropFilter: 'blur(6px)' }}>
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); next() }} aria-label={t('nextImage')}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                style={{ background: 'var(--plattform-white-transparent)', color: 'var(--plattform-ink-accent)', backdropFilter: 'blur(6px)' }}>
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          <figure key={openIndex} className="lightbox-zoom flex flex-col items-center gap-3 max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img src={items[openIndex].url} alt={items[openIndex].alt ?? ''} className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-lg" />
            {(items[openIndex].caption || items[openIndex].alt) && (
              <figcaption className="text-small text-center px-4" style={{ color: 'var(--plattform-white)' }}>
                {items[openIndex].caption || items[openIndex].alt}
              </figcaption>
            )}
          </figure>
        </div>,
        document.body,
      )}
    </>
  )
}