'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Trash2, ArrowUp, ArrowDown, ImagePlus, Check } from 'lucide-react'
import {
  updateProjectCover, removeProjectCover, addGalleryImage, saveProjectGallery,
} from '@/actions/manage/project'

export interface GalleryRow { image: string; caption: string; url: string | null }

const cardStyle = { background: 'var(--project-white)', borderColor: 'color-mix(in srgb, var(--project-mid) 20%, transparent)' }
const sectionTitle = 'text-small font-bold uppercase tracking-widest mb-4'

function gallerySignature(rows: GalleryRow[]) {
  return rows.map((r) => r.image).join('|')
}

export function DarstellungImages({
  slug, locale, coverUrl, gallery,
}: {
  slug: string; locale: string; coverUrl: string | null; gallery: GalleryRow[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const coverInput = useRef<HTMLInputElement>(null)
  const galleryInput = useRef<HTMLInputElement>(null)

  // Local, editable gallery (captions + order). Re-synced when the server set changes.
  const [rows, setRows] = useState<GalleryRow[]>(gallery)
  const [savedSig, setSavedSig] = useState(gallerySignature(gallery))
  useEffect(() => {
    setRows(gallery)
    setSavedSig(gallerySignature(gallery))
  }, [gallery])

  const dirty = gallerySignature(rows) !== savedSig || rows.some((r, i) => r.caption !== (gallery[i]?.caption ?? ''))

  const run = (fn: () => Promise<{ error?: string; ok?: boolean }>, after?: () => void) => {
    setError(null)
    startTransition(async () => {
      const res = await fn()
      if (res.error) { setError(res.error); return }
      after?.()
      router.refresh()
    })
  }

  const onCoverFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const fd = new FormData(); fd.append('file', file)
    run(() => updateProjectCover(slug, locale, fd))
  }

  const onGalleryFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const fd = new FormData(); fd.append('file', file)
    run(() => addGalleryImage(slug, locale, fd))
  }

  const setCaption = (i: number, caption: string) => setRows((r) => r.map((row, idx) => idx === i ? { ...row, caption } : row))
  const removeRow = (i: number) => setRows((r) => r.filter((_, idx) => idx !== i))
  const move = (i: number, dir: -1 | 1) => setRows((r) => {
    const j = i + dir
    if (j < 0 || j >= r.length) return r
    const next = [...r];[next[i], next[j]] = [next[j], next[i]]; return next
  })
  const saveGallery = () => run(() => saveProjectGallery(slug, locale, rows.map((r) => ({ image: r.image, caption: r.caption }))))

  return (
    <div className="flex flex-col gap-4 mt-4">
      {/* Cover */}
      <div className="rounded-xl border p-5" style={cardStyle}>
        <h2 className={sectionTitle} style={{ color: 'var(--project-dark)', opacity: 0.5 }}>Titelbild</h2>
        <div className="flex items-center gap-4">
          <div className="w-40 h-24 rounded-lg overflow-hidden shrink-0 flex items-center justify-center" style={{ background: 'var(--project-light)' }}>
            {coverUrl
              ? <img src={coverUrl} alt="" className="w-full h-full object-cover" />
              : <ImagePlus className="w-6 h-6" style={{ color: 'var(--project-dark)', opacity: 0.4 }} />}
          </div>
          <div className="flex flex-col gap-2">
            <button type="button" onClick={() => coverInput.current?.click()} disabled={pending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-cta font-semibold transition-opacity disabled:opacity-40"
              style={{ background: 'var(--project-dark)', color: 'var(--project-white)' }}>
              <Upload className="w-4 h-4" /> {coverUrl ? 'Bild ändern' : 'Bild hochladen'}
            </button>
            {coverUrl && (
              <button type="button" onClick={() => run(() => removeProjectCover(slug, locale))} disabled={pending}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-cta transition-colors disabled:opacity-40" style={{ color: '#b91c1c' }}>
                <Trash2 className="w-4 h-4" /> Entfernen
              </button>
            )}
          </div>
          <input ref={coverInput} type="file" accept="image/*" hidden onChange={onCoverFile} />
        </div>
      </div>

      {/* Gallery */}
      <div className="rounded-xl border p-5" style={cardStyle}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={sectionTitle + ' mb-0'} style={{ color: 'var(--project-dark)', opacity: 0.5 }}>Galerie</h2>
          <button type="button" onClick={() => galleryInput.current?.click()} disabled={pending}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-small font-semibold transition-opacity disabled:opacity-40"
            style={{ background: 'var(--project-dark)', color: 'var(--project-white)' }}>
            <ImagePlus className="w-4 h-4" /> Bild hinzufügen
          </button>
          <input ref={galleryInput} type="file" accept="image/*" hidden onChange={onGalleryFile} />
        </div>

        {rows.length === 0 ? (
          <p className="text-text py-6 text-center" style={{ color: 'var(--project-dark)', opacity: 0.4 }}>Noch keine Galeriebilder.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {rows.map((row, i) => (
              <div key={row.image} className="flex items-center gap-3 rounded-lg border p-2" style={cardStyle}>
                <div className="w-20 h-14 rounded overflow-hidden shrink-0" style={{ background: 'var(--project-light)' }}>
                  {row.url && <img src={row.url} alt="" className="w-full h-full object-cover" />}
                </div>
                <input
                  className="flex-1 px-3 py-2 rounded-lg border text-text outline-none"
                  style={{ borderColor: 'color-mix(in srgb, var(--project-mid) 30%, transparent)', color: 'var(--project-dark)', background: 'var(--project-white)' }}
                  placeholder="Bildunterschrift …"
                  value={row.caption}
                  onChange={(e) => setCaption(i, e.target.value)}
                />
                <div className="flex items-center gap-1 shrink-0" style={{ color: 'var(--project-dark)' }}>
                  <button type="button" onClick={() => move(i, -1)} disabled={pending || i === 0} className="p-1.5 rounded disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
                  <button type="button" onClick={() => move(i, 1)} disabled={pending || i === rows.length - 1} className="p-1.5 rounded disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
                  <button type="button" onClick={() => removeRow(i)} disabled={pending} className="p-1.5 rounded disabled:opacity-40" style={{ color: '#b91c1c' }}><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {rows.length > 0 && (
          <div className="flex items-center gap-3 mt-4">
            <button type="button" onClick={saveGallery} disabled={pending || !dirty}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-cta font-semibold transition-opacity disabled:opacity-40"
              style={{ background: 'var(--project-dark)', color: 'var(--project-white)' }}>
              {!dirty && !pending ? <Check className="w-4 h-4" /> : null}
              {pending ? 'Speichern …' : dirty ? 'Galerie speichern' : 'Gespeichert'}
            </button>
          </div>
        )}
      </div>

      {error && <p className="text-small" style={{ color: '#b91c1c' }}>{error}</p>}
    </div>
  )
}
