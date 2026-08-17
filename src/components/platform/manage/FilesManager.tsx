// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Upload, FolderPlus, Folder, Trash2, Download, Globe, Lock, Users as UsersIcon, FileText } from 'lucide-react'
import { createFolder, deleteFolder, setFolderVisibility, uploadFile, deleteFile, setFileVisibility } from '@/actions/files'
import { FormModal } from '@/components/platform/FormModal'

export interface FolderItem { id: string; name: string; visibility: string; visibilityTeams: string[] }
export interface FileItem { id: string; label: string | null; filename: string; url: string | null; mimeType: string | null; filesize: number | null; visibility: string; visibilityTeams: string[]; folderId: string | null }

const VISIBILITY = [
  { value: 'PUBLIC', labelKey: 'files.visPublic', icon: Globe },
  { value: 'INTERNAL', labelKey: 'files.visInternal', icon: Lock },
  { value: 'TEAM', labelKey: 'files.visTeam', icon: UsersIcon },
] as const
const cardStyle = { background: 'var(--project-white)', borderColor: 'color-mix(in srgb, var(--project-general) 20%, transparent)' }
const inputStyle = { borderColor: 'color-mix(in srgb, var(--project-general) 30%, transparent)', color: 'var(--project-accent)', background: 'var(--project-white)' }

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

/** Tag pills for TEAM visibility (empty selection = whole Projektteam). */
function TeamPills({ catalog, value, onToggle, disabled }: { catalog: string[]; value: string[]; onToggle: (tag: string) => void; disabled?: boolean }) {
  if (catalog.length === 0) return null
  return (
    <span className="flex flex-wrap items-center gap-1">
      {catalog.map((tag) => {
        const on = value.includes(tag)
        return (
          <button key={tag} type="button" onClick={() => onToggle(tag)} disabled={disabled} className="text-[0.7rem] px-2 py-0.5 rounded-full border transition-colors disabled:opacity-40" style={{ background: on ? 'var(--project-dark)' : 'transparent', color: on ? 'var(--project-black)' : 'var(--project-accent)', borderColor: on ? 'var(--project-dark)' : 'color-mix(in srgb, var(--project-general) 35%, transparent)' }}>
            {tag}
          </button>
        )
      })}
    </span>
  )
}

/**
 * Self-contained upload popup: file choice happens inside, so folder,
 * visibility and team tags are set deliberately before uploading.
 * Mountable from the manager and the team page quick actions.
 */
export function FileUploadModal({ slug, locale, folders, teamCatalog, defaultVisibility = 'INTERNAL', onClose }: {
  slug: string
  locale: string
  folders: { id: string; name: string }[]
  teamCatalog: string[]
  defaultVisibility?: string
  onClose: () => void
}) {
  const t = useTranslations('manage')
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [folderId, setFolderId] = useState('')
  const [vis, setVis] = useState(defaultVisibility)
  const [teams, setTeams] = useState<string[]>([])
  const [file, setFile] = useState<File | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const submit = () => {
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    if (folderId) fd.append('folderId', folderId)
    fd.append('visibility', vis)
    if (vis === 'TEAM') for (const tag of teams) fd.append('visibilityTeams', tag)
    setError(null)
    startTransition(async () => {
      const res = await uploadFile(slug, locale, fd)
      if (res.error) { setError(res.error); return }
      onClose()
      router.refresh()
    })
  }

  return (
    <FormModal title={t('files.uploadFile')} onClose={onClose}>
      <div className="flex flex-col gap-3">
        {error && <p className="text-small px-4 py-2.5 rounded-lg" style={{ color: 'var(--project-danger)', background: 'var(--project-danger-surface)' }}>{error}</p>}
        <button type="button" onClick={() => fileInput.current?.click()} className="flex items-center justify-center gap-2 px-4 py-6 rounded-xl border border-dashed text-text" style={{ color: 'var(--project-accent)', borderColor: 'color-mix(in srgb, var(--project-general) 40%, transparent)', background: 'var(--project-light)' }}>
          <Upload className="w-4 h-4" /> {file ? file.name : t('files.uploadFile')}
        </button>
        <input ref={fileInput} type="file" hidden onChange={(e) => { setFile(e.target.files?.[0] ?? null); e.target.value = '' }} />
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-small mb-1" style={{ color: 'var(--project-ink)' }}>{t('files.folder')}</label>
            <select value={folderId} onChange={(e) => setFolderId(e.target.value)} className="px-3 py-2 rounded-lg border text-text outline-none" style={inputStyle}>
              <option value="">{t('files.noFolder')}</option>
              {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-small mb-1" style={{ color: 'var(--project-ink)' }}>{t('files.visibility')}</label>
            <VisSelect value={vis} onChange={setVis} disabled={pending} />
          </div>
        </div>
        {vis === 'TEAM' && (
          <TeamPills catalog={teamCatalog} value={teams} disabled={pending}
            onToggle={(tag) => setTeams((s) => (s.includes(tag) ? s.filter((x) => x !== tag) : [...s, tag]))} />
        )}
        <div>
          <button type="button" onClick={submit} disabled={pending || !file} className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-cta font-semibold transition-opacity disabled:opacity-40" style={{ background: 'var(--project-accent)', color: 'var(--project-white)' }}>
            <Upload className="w-4 h-4" /> {t('files.uploadFile')}
          </button>
        </div>
      </div>
    </FormModal>
  )
}

/** Folder create popup — name, visibility, optional team tags. */
export function FolderFormModal({ slug, locale, teamCatalog, defaultVisibility = 'INTERNAL', onClose }: {
  slug: string
  locale: string
  teamCatalog: string[]
  defaultVisibility?: string
  onClose: () => void
}) {
  const t = useTranslations('manage')
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [vis, setVis] = useState(defaultVisibility)
  const [teams, setTeams] = useState<string[]>([])

  const submit = () => {
    setError(null)
    startTransition(async () => {
      const res = await createFolder(slug, locale, { name, visibility: vis, visibilityTeams: vis === 'TEAM' ? teams : [] })
      if (res.error) { setError(res.error); return }
      onClose()
      router.refresh()
    })
  }

  return (
    <FormModal title={t('files.folderName')} onClose={onClose}>
      <div className="flex flex-col gap-3">
        {error && <p className="text-small px-4 py-2.5 rounded-lg" style={{ color: 'var(--project-danger)', background: 'var(--project-danger-surface)' }}>{error}</p>}
        <input type="text" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder={t('files.folderNamePlaceholder')} className="w-full px-3 py-2 rounded-lg border text-text outline-none" style={inputStyle} />
        <div>
          <label className="block text-small mb-1" style={{ color: 'var(--project-ink)' }}>{t('files.visibility')}</label>
          <VisSelect value={vis} onChange={setVis} disabled={pending} />
        </div>
        {vis === 'TEAM' && (
          <TeamPills catalog={teamCatalog} value={teams} disabled={pending}
            onToggle={(tag) => setTeams((s) => (s.includes(tag) ? s.filter((x) => x !== tag) : [...s, tag]))} />
        )}
        <div>
          <button type="button" onClick={submit} disabled={pending || !name.trim()} className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-cta font-semibold transition-opacity disabled:opacity-40" style={{ background: 'var(--project-accent)', color: 'var(--project-white)' }}>
            <FolderPlus className="w-4 h-4" /> {t('files.create')}
          </button>
        </div>
      </div>
    </FormModal>
  )
}

export function FilesManager({ slug, locale, folders, files, teamCatalog = [] }: { slug: string; locale: string; folders: FolderItem[]; files: FileItem[]; teamCatalog?: string[] }) {
  const t = useTranslations('manage')
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [modal, setModal] = useState<'upload' | 'folder' | null>(null)
  const [confirm, setConfirm] = useState<string | null>(null)

  const run = (fn: () => Promise<{ error?: string; ok?: boolean }>, after?: () => void) => {
    setError(null)
    startTransition(async () => {
      const res = await fn()
      if (res.error) { setError(res.error); return }
      after?.(); router.refresh()
    })
  }

  const FileRow = ({ f }: { f: FileItem }) => {
    const vm = VISIBILITY.find((v) => v.value === f.visibility)
    return (
      <div className="flex items-center gap-3 rounded-lg border px-3 py-2" style={cardStyle}>
        <FileText className="w-5 h-5 shrink-0" style={{ color: 'var(--project-ink)' }} />
        <div className="flex-1 min-w-0">
          <p className="text-text font-medium truncate" style={{ color: 'var(--project-accent)' }}>{f.label || f.filename}</p>
          <p className="text-small" style={{ color: 'var(--project-ink)' }}>{fmtSize(f.filesize)}{f.mimeType ? ` · ${f.mimeType}` : ''}</p>
        </div>
        <span className="flex flex-col items-end gap-1">
          <VisSelect value={f.visibility} onChange={(v) => run(() => setFileVisibility(slug, locale, f.id, v, f.visibilityTeams))} disabled={pending} />
          {f.visibility === 'TEAM' && (
            <TeamPills catalog={teamCatalog} value={f.visibilityTeams} disabled={pending}
              onToggle={(tag) => run(() => setFileVisibility(slug, locale, f.id, 'TEAM', f.visibilityTeams.includes(tag) ? f.visibilityTeams.filter((x) => x !== tag) : [...f.visibilityTeams, tag]))} />
          )}
        </span>
        {f.url && <a href={f.url} download title={t('files.download')} className="p-2 rounded-lg shrink-0" style={{ color: 'var(--project-accent)' }}><Download className="w-4 h-4" /></a>}
        {confirm === `f-${f.id}` ? (
          <span className="flex items-center gap-1">
            <button type="button" onClick={() => run(() => deleteFile(slug, locale, f.id), () => setConfirm(null))} disabled={pending} className="px-2 py-1 rounded text-small font-semibold" style={{ background: 'var(--project-danger)', color: 'var(--project-danger-on)' }}>{t('files.delete')}</button>
            <button type="button" onClick={() => setConfirm(null)} className="px-1.5 py-1 rounded text-small" style={{ color: 'var(--project-ink)' }}>×</button>
          </span>
        ) : (
          <button type="button" onClick={() => setConfirm(`f-${f.id}`)} disabled={pending} title={t('files.delete')} className="p-2 rounded-lg shrink-0" style={{ color: 'var(--project-danger)' }}><Trash2 className="w-4 h-4" /></button>
        )}
      </div>
    )
  }

  const looseFiles = files.filter((f) => !f.folderId)

  return (
    <div>
      <h1 className="sr-only">{t('files.title')}</h1>

      {error && <p className="text-small mb-4 px-4 py-2.5 rounded-lg" style={{ color: 'var(--project-danger)', background: 'var(--project-danger-surface)' }}>{error}</p>}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-end gap-2 mb-6">
        <button type="button" onClick={() => setModal('upload')} disabled={pending} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-cta font-semibold disabled:opacity-40" style={{ background: 'var(--project-accent)', color: 'var(--project-white)' }}>
          <Upload className="w-4 h-4" /> {t('files.uploadFile')}
        </button>
        <button type="button" onClick={() => setModal('folder')} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-cta font-medium border" style={{ color: 'var(--project-accent)', borderColor: 'color-mix(in srgb, var(--project-general) 30%, transparent)' }}>
          <FolderPlus className="w-4 h-4" /> {t('files.folder')}
        </button>
      </div>

      {modal === 'upload' && (
        <FileUploadModal slug={slug} locale={locale} folders={folders} teamCatalog={teamCatalog} onClose={() => setModal(null)} />
      )}
      {modal === 'folder' && (
        <FolderFormModal slug={slug} locale={locale} teamCatalog={teamCatalog} onClose={() => setModal(null)} />
      )}

      {folders.length === 0 && files.length === 0 && (
        <p className="text-text py-10 text-center" style={{ color: 'var(--project-ink)' }}>{t('files.empty')}</p>
      )}

      {/* Folders */}
      <div className="flex flex-col gap-5">
        {folders.map((folder) => (
          <div key={folder.id}>
            <div className="flex items-center gap-2 mb-2">
              <Folder className="w-5 h-5 shrink-0" style={{ color: 'var(--project-ink)' }} />
              <h2 className="text-display font-semibold" style={{ color: 'var(--project-accent)' }}>{folder.name}</h2>
              <VisSelect value={folder.visibility} onChange={(v) => run(() => setFolderVisibility(slug, locale, folder.id, v, folder.visibilityTeams))} disabled={pending} />
              {folder.visibility === 'TEAM' && (
                <TeamPills catalog={teamCatalog} value={folder.visibilityTeams} disabled={pending}
                  onToggle={(tag) => run(() => setFolderVisibility(slug, locale, folder.id, 'TEAM', folder.visibilityTeams.includes(tag) ? folder.visibilityTeams.filter((x) => x !== tag) : [...folder.visibilityTeams, tag]))} />
              )}
              {confirm === `fo-${folder.id}` ? (
                <span className="flex items-center gap-1 ml-auto">
                  <button type="button" onClick={() => run(() => deleteFolder(slug, locale, folder.id), () => setConfirm(null))} disabled={pending} className="px-2 py-1 rounded text-small font-semibold" style={{ background: 'var(--project-danger)', color: 'var(--project-danger-on)' }}>{t('files.deleteFolderAndFiles')}</button>
                  <button type="button" onClick={() => setConfirm(null)} className="px-1.5 py-1 rounded text-small" style={{ color: 'var(--project-ink)' }}>×</button>
                </span>
              ) : (
                <button type="button" onClick={() => setConfirm(`fo-${folder.id}`)} disabled={pending} title={t('files.deleteFolder')} className="p-1.5 rounded ml-auto" style={{ color: 'var(--project-danger)' }}><Trash2 className="w-4 h-4" /></button>
              )}
            </div>
            <div className="flex flex-col gap-2 pl-7">
              {files.filter((f) => f.folderId === folder.id).map((f) => <FileRow key={f.id} f={f} />)}
              {files.filter((f) => f.folderId === folder.id).length === 0 && <p className="text-small" style={{ color: 'var(--project-ink)' }}>{t('files.emptyFolder')}</p>}
            </div>
          </div>
        ))}

        {looseFiles.length > 0 && (
          <div>
            <h2 className="text-small font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--project-ink)' }}>{t('files.withoutFolder')}</h2>
            <div className="flex flex-col gap-2">{looseFiles.map((f) => <FileRow key={f.id} f={f} />)}</div>
          </div>
        )}
      </div>
    </div>
  )
}
