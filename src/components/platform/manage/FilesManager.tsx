'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Upload, FolderPlus, Folder, Trash2, Download, Globe, Lock, Users as UsersIcon, FileText, X } from 'lucide-react'
import { createFolder, deleteFolder, setFolderVisibility, uploadFile, deleteFile, setFileVisibility } from '@/actions/files'

export interface FolderItem { id: string; name: string; visibility: string }
export interface FileItem { id: string; label: string | null; filename: string; url: string | null; mimeType: string | null; filesize: number | null; visibility: string; folderId: string | null }

const VISIBILITY = [
  { value: 'PUBLIC', labelKey: 'files.visPublic', icon: Globe },
  { value: 'INTERNAL', labelKey: 'files.visInternal', icon: Lock },
  { value: 'TEAM', labelKey: 'files.visTeam', icon: UsersIcon },
] as const
const cardStyle = { background: 'var(--project-white)', borderColor: 'color-mix(in srgb, var(--project-mid) 20%, transparent)' }
const inputStyle = { borderColor: 'color-mix(in srgb, var(--project-mid) 30%, transparent)', color: 'var(--project-dark)', background: 'var(--project-white)' }

function fmtSize(b: number | null): string {
  if (!b) return ''
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`
  return `${(b / 1024 / 1024).toFixed(1)} MB`
}

function VisSelect({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const t = useTranslations('manage')
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} className="px-2 py-1 rounded-lg border text-small outline-none" style={inputStyle}>
      {VISIBILITY.map((v) => <option key={v.value} value={v.value}>{t(v.labelKey)}</option>)}
    </select>
  )
}

export function FilesManager({ slug, locale, folders, files }: { slug: string; locale: string; folders: FolderItem[]; files: FileItem[] }) {
  const t = useTranslations('manage')
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const [uploadFolder, setUploadFolder] = useState<string>('')
  const [uploadVis, setUploadVis] = useState('INTERNAL')
  const [showFolderForm, setShowFolderForm] = useState(false)
  const [folderName, setFolderName] = useState('')
  const [folderVis, setFolderVis] = useState('INTERNAL')
  const [confirm, setConfirm] = useState<string | null>(null)

  const run = (fn: () => Promise<{ error?: string; ok?: boolean }>, after?: () => void) => {
    setError(null)
    startTransition(async () => {
      const res = await fn()
      if (res.error) { setError(res.error); return }
      after?.(); router.refresh()
    })
  }

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = ''
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    if (uploadFolder) fd.append('folderId', uploadFolder)
    fd.append('visibility', uploadVis)
    run(() => uploadFile(slug, locale, fd))
  }

  const FileRow = ({ f }: { f: FileItem }) => {
    const vm = VISIBILITY.find((v) => v.value === f.visibility)
    return (
      <div className="flex items-center gap-3 rounded-lg border px-3 py-2" style={cardStyle}>
        <FileText className="w-5 h-5 shrink-0" style={{ color: 'var(--project-mid)' }} />
        <div className="flex-1 min-w-0">
          <p className="text-text font-medium truncate" style={{ color: 'var(--project-dark)' }}>{f.label || f.filename}</p>
          <p className="text-small" style={{ color: 'var(--project-dark)', opacity: 0.5 }}>{fmtSize(f.filesize)}{f.mimeType ? ` · ${f.mimeType}` : ''}</p>
        </div>
        <VisSelect value={f.visibility} onChange={(v) => run(() => setFileVisibility(slug, locale, f.id, v))} disabled={pending} />
        {f.url && <a href={f.url} download title={t('files.download')} className="p-2 rounded-lg shrink-0" style={{ color: 'var(--project-dark)' }}><Download className="w-4 h-4" /></a>}
        {confirm === `f-${f.id}` ? (
          <span className="flex items-center gap-1">
            <button type="button" onClick={() => run(() => deleteFile(slug, locale, f.id), () => setConfirm(null))} disabled={pending} className="px-2 py-1 rounded text-small font-semibold" style={{ background: '#b91c1c', color: 'white' }}>{t('files.delete')}</button>
            <button type="button" onClick={() => setConfirm(null)} className="px-1.5 py-1 rounded text-small" style={{ color: 'var(--project-dark)', opacity: 0.6 }}>×</button>
          </span>
        ) : (
          <button type="button" onClick={() => setConfirm(`f-${f.id}`)} disabled={pending} title={t('files.delete')} className="p-2 rounded-lg shrink-0" style={{ color: '#b91c1c' }}><Trash2 className="w-4 h-4" /></button>
        )}
      </div>
    )
  }

  const looseFiles = files.filter((f) => !f.folderId)

  return (
    <div className="max-w-3xl">
      <h1 className="text-title font-bold leading-tight mb-1" style={{ color: 'var(--project-dark)' }}>{t('files.title')}</h1>
      <p className="text-text mb-6" style={{ color: 'var(--project-dark)', opacity: 0.65 }}>{t('files.intro')}</p>

      {error && <p className="text-small mb-4 px-4 py-2.5 rounded-lg" style={{ color: '#b91c1c', background: '#fef2f2' }}>{error}</p>}

      {/* Toolbar */}
      <div className="rounded-xl border p-4 mb-6 flex flex-wrap items-end gap-3" style={cardStyle}>
        <div>
          <label className="block text-small mb-1" style={{ color: 'var(--project-dark)', opacity: 0.6 }}>{t('files.folder')}</label>
          <select value={uploadFolder} onChange={(e) => setUploadFolder(e.target.value)} className="px-3 py-2 rounded-lg border text-text outline-none" style={inputStyle}>
            <option value="">{t('files.noFolder')}</option>
            {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-small mb-1" style={{ color: 'var(--project-dark)', opacity: 0.6 }}>{t('files.visibility')}</label>
          <VisSelect value={uploadVis} onChange={setUploadVis} disabled={pending} />
        </div>
        <button type="button" onClick={() => fileInput.current?.click()} disabled={pending} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-cta font-semibold disabled:opacity-40" style={{ background: 'var(--project-dark)', color: 'var(--project-white)' }}>
          <Upload className="w-4 h-4" /> {t('files.uploadFile')}
        </button>
        <button type="button" onClick={() => setShowFolderForm((s) => !s)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-cta font-medium border" style={{ color: 'var(--project-dark)', borderColor: 'color-mix(in srgb, var(--project-mid) 30%, transparent)' }}>
          {showFolderForm ? <X className="w-4 h-4" /> : <FolderPlus className="w-4 h-4" />} {t('files.folder')}
        </button>
        <input ref={fileInput} type="file" hidden onChange={onFile} />
      </div>

      {showFolderForm && (
        <div className="rounded-xl border p-4 mb-6 flex flex-wrap items-end gap-3" style={cardStyle}>
          <div className="flex-1 min-w-40">
            <label className="block text-small mb-1" style={{ color: 'var(--project-dark)', opacity: 0.6 }}>{t('files.folderName')}</label>
            <input type="text" value={folderName} onChange={(e) => setFolderName(e.target.value)} placeholder={t('files.folderNamePlaceholder')} className="w-full px-3 py-2 rounded-lg border text-text outline-none" style={inputStyle} />
          </div>
          <VisSelect value={folderVis} onChange={setFolderVis} disabled={pending} />
          <button type="button" onClick={() => run(() => createFolder(slug, locale, { name: folderName, visibility: folderVis }), () => { setFolderName(''); setShowFolderForm(false) })} disabled={pending || !folderName.trim()} className="px-4 py-2 rounded-lg text-cta font-semibold disabled:opacity-40" style={{ background: 'var(--project-dark)', color: 'var(--project-white)' }}>{t('files.create')}</button>
        </div>
      )}

      {folders.length === 0 && files.length === 0 && (
        <p className="text-text py-10 text-center" style={{ color: 'var(--project-dark)', opacity: 0.4 }}>{t('files.empty')}</p>
      )}

      {/* Folders */}
      <div className="flex flex-col gap-5">
        {folders.map((folder) => (
          <div key={folder.id}>
            <div className="flex items-center gap-2 mb-2">
              <Folder className="w-5 h-5 shrink-0" style={{ color: 'var(--project-mid)' }} />
              <h2 className="text-display font-semibold" style={{ color: 'var(--project-dark)' }}>{folder.name}</h2>
              <VisSelect value={folder.visibility} onChange={(v) => run(() => setFolderVisibility(slug, locale, folder.id, v))} disabled={pending} />
              {confirm === `fo-${folder.id}` ? (
                <span className="flex items-center gap-1 ml-auto">
                  <button type="button" onClick={() => run(() => deleteFolder(slug, locale, folder.id), () => setConfirm(null))} disabled={pending} className="px-2 py-1 rounded text-small font-semibold" style={{ background: '#b91c1c', color: 'white' }}>{t('files.deleteFolderAndFiles')}</button>
                  <button type="button" onClick={() => setConfirm(null)} className="px-1.5 py-1 rounded text-small" style={{ color: 'var(--project-dark)', opacity: 0.6 }}>×</button>
                </span>
              ) : (
                <button type="button" onClick={() => setConfirm(`fo-${folder.id}`)} disabled={pending} title={t('files.deleteFolder')} className="p-1.5 rounded ml-auto" style={{ color: '#b91c1c' }}><Trash2 className="w-4 h-4" /></button>
              )}
            </div>
            <div className="flex flex-col gap-2 pl-7">
              {files.filter((f) => f.folderId === folder.id).map((f) => <FileRow key={f.id} f={f} />)}
              {files.filter((f) => f.folderId === folder.id).length === 0 && <p className="text-small" style={{ color: 'var(--project-dark)', opacity: 0.4 }}>{t('files.emptyFolder')}</p>}
            </div>
          </div>
        ))}

        {looseFiles.length > 0 && (
          <div>
            <h2 className="text-small font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--project-dark)', opacity: 0.45 }}>{t('files.withoutFolder')}</h2>
            <div className="flex flex-col gap-2">{looseFiles.map((f) => <FileRow key={f.id} f={f} />)}</div>
          </div>
        )}
      </div>
    </div>
  )
}
