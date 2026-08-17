// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import { getPayload } from 'payload'
import config from '@payload-config'
import { getTranslations } from 'next-intl/server'
import { FileText, Folder, Download, Eye, FolderOpen } from 'lucide-react'
import { visibilityWhere, type ViewerContext } from '@/lib/visibility'

const relId = (v: unknown): string | null => (v == null ? null : typeof v === 'object' ? String((v as { id: unknown }).id) : String(v))
function fmtSize(b: number | null | undefined): string {
  if (!b) return ''
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`
  return `${(b / 1024 / 1024).toFixed(1)} MB`
}
/** Short type tag, e.g. PDF, JPG — nicer than a raw mime string. */
function fileExt(filename: string, mimeType: string | null): string {
  const fromName = filename.includes('.') ? filename.split('.').pop() ?? '' : ''
  if (fromName && fromName.length <= 5) return fromName.toUpperCase()
  const sub = (mimeType ?? '').split('/')[1] ?? ''
  return sub ? sub.toUpperCase().slice(0, 5) : ''
}

interface VFile { id: string; label: string | null; filename: string; url: string | null; mimeType: string | null; filesize: number | null; folderId: string | null }

function FileRow({ f, folderName, labels }: { f: VFile; folderName: string | null; labels: { view: string; download: string } }) {
  const isImage = (f.mimeType ?? '').startsWith('image/')
  const isPdf = f.mimeType === 'application/pdf'
  const ext = fileExt(f.filename, f.mimeType)
  const meta = [ext, fmtSize(f.filesize)].filter(Boolean).join(' · ')
  return (
    <div className="flex items-center gap-5 rounded-xl border p-6" style={{ background: 'var(--project-white)', borderColor: 'color-mix(in srgb, var(--project-general) 20%, transparent)' }}>
      {isImage && f.url ? (
        <img src={f.url} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
      ) : (
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'var(--project-light)' }}
        >
          <FileText className="w-5 h-5" style={{ color: 'var(--project-accent)' }} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-text font-bold truncate" style={{ color: 'var(--project-accent)' }}>{f.label || f.filename}</p>
        {meta && (
          <p className="text-small" style={{ color: 'var(--project-ink)' }}>{meta}</p>
        )}
      </div>
      {folderName && (
        <span
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-small shrink-0 max-w-[12rem]"
          style={{ background: 'var(--project-light)', color: 'var(--project-ink)' }}
        >
          <Folder className="w-[1em] h-[1em] shrink-0" />
          <span className="truncate">{folderName}</span>
        </span>
      )}
      {(isImage || isPdf) && f.url && (
        <a
          href={f.url}
          target="_blank"
          rel="noreferrer"
          title={labels.view}
          aria-label={labels.view}
          className="p-2.5 rounded-lg shrink-0 transition-colors hover:bg-[var(--project-light)]"
          style={{ color: 'var(--project-ink)' }}
        >
          <Eye className="w-4 h-4" />
        </a>
      )}
      {f.url && (
        <a
          href={f.url}
          download
          title={labels.download}
          aria-label={labels.download}
          className="p-2.5 rounded-lg shrink-0 transition-colors hover:bg-[var(--project-light)]"
          style={{ color: 'var(--project-ink)' }}
        >
          <Download className="w-4 h-4" />
        </a>
      )}
    </div>
  )
}

/** Read-only file library for citizens/public, gated to the viewer's tier. */
export async function FilesBrowse({ projectId, viewer, hideTitle = false }: { projectId: string; viewer: ViewerContext; hideTitle?: boolean }) {
  const t = await getTranslations('filesBrowse')
  const payload = await getPayload({ config })
  const [foldersRes, filesRes] = await Promise.all([
    payload.find({ collection: 'folders', where: { and: [{ project: { equals: projectId } }, visibilityWhere(viewer)] }, sort: 'name', limit: 500, depth: 0, overrideAccess: true }),
    payload.find({ collection: 'file-uploads', where: { and: [{ project: { equals: projectId } }, visibilityWhere(viewer)] }, sort: '-createdAt', limit: 1000, depth: 0, overrideAccess: true }),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const folders = foldersRes.docs.map((d: any) => ({ id: String(d.id), name: d.name ?? '' }))
  const visibleFolderIds = new Set(folders.map((f) => f.id))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const files: VFile[] = filesRes.docs.map((d: any) => ({ id: String(d.id), label: d.label ?? null, filename: d.filename ?? '', url: d.url ?? null, mimeType: d.mimeType ?? null, filesize: d.filesize ?? null, folderId: relId(d.folder) }))

  const folderNames = new Map(folders.map((f) => [f.id, f.name]))
  const labels = { view: t('view'), download: t('download') }

  return (
    <div>
      {!hideTitle && (
        // Visually redundant with the breadcrumb — kept for screen readers (BITV).
        <h1 className="sr-only">{t('title')}</h1>
      )}

      {files.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border py-12" style={{ background: 'var(--project-white)', borderColor: 'color-mix(in srgb, var(--project-general) 20%, transparent)' }}>
          <FolderOpen className="w-8 h-8" style={{ color: 'var(--project-ink)' }} />
          <p className="text-text" style={{ color: 'var(--project-ink)' }}>{t('empty')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {files.map((f) => (
            <FileRow
              key={f.id}
              f={f}
              folderName={(f.folderId && visibleFolderIds.has(f.folderId) && folderNames.get(f.folderId)) || null}
              labels={labels}
            />
          ))}
        </div>
      )}
    </div>
  )
}
