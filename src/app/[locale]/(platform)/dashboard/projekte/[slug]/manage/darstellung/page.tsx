import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import { getProjectManagerContext } from '@/lib/auth/requireProjectManager'
import { projectDefaults } from '@/lib/defaults/project'
import { DarstellungForm } from '@/components/platform/manage/DarstellungForm'
import { DarstellungImages, type GalleryRow } from '@/components/platform/manage/DarstellungImages'

export default async function ManageDarstellungPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const ctx = await getProjectManagerContext(slug)
  if (!ctx) notFound()

  const payload = await getPayload({ config })
  const project = await payload.findByID({ collection: 'projects', id: ctx.project.id, depth: 1, overrideAccess: true })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = project as any

  const coverUrl: string | null = p.coverImage && typeof p.coverImage === 'object' ? (p.coverImage.url ?? null) : null

  const gallery: GalleryRow[] = (Array.isArray(p.gallery) ? p.gallery : [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((row: any) => {
      const img = row.image
      const id = img && typeof img === 'object' ? String(img.id) : img ? String(img) : null
      if (!id) return null
      return { image: id, caption: row.caption ?? '', url: img && typeof img === 'object' ? (img.url ?? null) : null }
    })
    .filter((r: GalleryRow | null): r is GalleryRow => r !== null)

  return (
    <div className="max-w-3xl">
      <h1 className="text-title font-bold leading-tight mb-1" style={{ color: 'var(--project-dark)' }}>Darstellung</h1>
      <p className="text-text mb-6" style={{ color: 'var(--project-dark)', opacity: 0.65 }}>Farbschema und Bilder des Projekts.</p>

      <DarstellungForm slug={slug} locale={locale} initialScheme={ctx.project.colorScheme ?? projectDefaults.colorScheme} />
      <DarstellungImages slug={slug} locale={locale} coverUrl={coverUrl} gallery={gallery} />
    </div>
  )
}
