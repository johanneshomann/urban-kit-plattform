import { getPayload } from 'payload'
import config from '@payload-config'
import { FileText, Folder, Download, Eye, FolderOpen } from 'lucide-react'
import { visibilityWhere, type ViewerTier } from '@/lib/visibility'

const relId = (v: unknown): string | null => (v == null ? null : typeof v === 'object' ? String((v as { id: unknown }).id) : String(v))
function fmtSize(b: number | null | undefined): string {
  if (!b) return ''
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`
  return `${(b / 1024 / 1024).toFixed(1)} MB`
}

interface VFile { id: string; label: string | null; filename: string; url: string | null; mimeType: string | null; filesize: number | null; folderId: string | null }

const cardStyle = { background: 'var(--project-white)', borderColor: 'color-mix(in srgb, var(--project-mid) 20%, transparent)' }

function FileRow({ f }: { f: VFile }) {
  const isImage = (f.mimeType ?? '').startsWith('image/')
  const isPdf = f.mimeType === 'application/pdf'
  return (
    <div className="flex items-center gap-3 rounded-lg border px-3 py-2" style={cardStyle}>
      {isImage && f.url
        ? <img src={f.url} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
        : <FileText className="w-5 h-5 shrink-0" style={{ color: 'var(--project-mid)' }} />}
      <div className="flex-1 min-w-0">
        <p className="text-text font-medium truncate" style={{ color: 'var(--project-dark)' }}>{f.label || f.filename}</p>
        <p className="text-small" style={{ color: 'var(--project-dark)', opacity: 0.5 }}>{fmtSize(f.filesize)}{f.mimeType ? ` · ${f.mimeType}` : ''}</p>
      </div>
      {(isImage || isPdf) && f.url && (
        <a href={f.url} target="_blank" rel="noreferrer" title="Ansehen" className="p-2 rounded-lg shrink-0" style={{ color: 'var(--project-dark)' }}><Eye className="w-4 h-4" /></a>
      )}
      {f.url && <a href={f.url} download title="Herunterladen" className="p-2 rounded-lg shrink-0" style={{ color: 'var(--project-dark)' }}><Download className="w-4 h-4" /></a>}
    </div>
  )
}

/** Read-only file library for citizens/public, gated to the viewer's tier. */
export async function FilesBrowse({ projectId, tier }: { projectId: string; tier: ViewerTier }) {
  const payload = await getPayload({ config })
  const [foldersRes, filesRes] = await Promise.all([
    payload.find({ collection: 'folders', where: { and: [{ project: { equals: projectId } }, visibilityWhere(tier)] }, sort: 'name', limit: 500, depth: 0, overrideAccess: true }),
    payload.find({ collection: 'file-uploads', where: { and: [{ project: { equals: projectId } }, visibilityWhere(tier)] }, sort: '-createdAt', limit: 1000, depth: 0, overrideAccess: true }),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const folders = foldersRes.docs.map((d: any) => ({ id: String(d.id), name: d.name ?? '' }))
  const visibleFolderIds = new Set(folders.map((f) => f.id))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const files: VFile[] = filesRes.docs.map((d: any) => ({ id: String(d.id), label: d.label ?? null, filename: d.filename ?? '', url: d.url ?? null, mimeType: d.mimeType ?? null, filesize: d.filesize ?? null, folderId: relId(d.folder) }))

  const loose = files.filter((f) => !f.folderId || !visibleFolderIds.has(f.folderId))

  return (
    <div>
      <h1 className="text-title font-bold leading-tight mb-6" style={{ color: 'var(--project-dark)' }}>Dateien</h1>

      {files.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border py-12" style={cardStyle}>
          <FolderOpen className="w-8 h-8" style={{ color: 'var(--project-mid)', opacity: 0.5 }} />
          <p className="text-text" style={{ color: 'var(--project-dark)', opacity: 0.5 }}>Noch keine Dateien.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {folders.map((folder) => {
            const inFolder = files.filter((f) => f.folderId === folder.id)
            if (inFolder.length === 0) return null
            return (
              <div key={folder.id}>
                <div className="flex items-center gap-2 mb-2">
                  <Folder className="w-5 h-5 shrink-0" style={{ color: 'var(--project-mid)' }} />
                  <h2 className="text-display font-semibold" style={{ color: 'var(--project-dark)' }}>{folder.name}</h2>
                </div>
                <div className="flex flex-col gap-2 pl-7">{inFolder.map((f) => <FileRow key={f.id} f={f} />)}</div>
              </div>
            )
          })}
          {loose.length > 0 && (
            <div>
              {folders.length > 0 && <h2 className="text-small font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--project-dark)', opacity: 0.45 }}>Weitere Dateien</h2>}
              <div className="flex flex-col gap-2">{loose.map((f) => <FileRow key={f.id} f={f} />)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
