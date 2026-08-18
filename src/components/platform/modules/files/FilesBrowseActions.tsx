// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Trash2 } from 'lucide-react'
import { deleteFile } from '@/actions/files'
import { FileUploadModal } from '@/components/platform/manage/FilesManager'

/** "Neue Datei" button on the member-facing files page (team-tier viewers). */
export function FilesUploadButton({ slug, locale, folders, teamCatalog }: {
  slug: string
  locale: string
  folders: { id: string; name: string }[]
  teamCatalog: string[]
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <div className="flex items-center justify-end mb-4">
        <button type="button" onClick={() => setOpen(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-cta font-semibold" style={{ background: 'var(--project-accent)', color: 'var(--project-white)' }}>
          <Upload className="w-4 h-4" /> Neue Datei
        </button>
      </div>
      {open && (
        <FileUploadModal slug={slug} locale={locale} folders={folders} teamCatalog={teamCatalog} onClose={() => setOpen(false)} />
      )}
    </>
  )
}

/** Confirm-then-delete for a file row (own uploads, PMs any). */
export function FileDeleteButton({ slug, locale, fileId }: { slug: string; locale: string; fileId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const remove = () => {
    setError(null)
    startTransition(async () => {
      const res = await deleteFile(slug, locale, fileId)
      if (res.error) { setError(res.error); return }
      setConfirming(false)
      router.refresh()
    })
  }

  return (
    <span className="flex items-center gap-1 shrink-0">
      {error && <span className="text-small" style={{ color: 'var(--project-danger)' }}>{error}</span>}
      {confirming ? (
        <>
          <button type="button" onClick={remove} disabled={pending} className="px-2.5 py-1.5 rounded-lg text-small font-semibold disabled:opacity-40" style={{ background: 'var(--project-danger)', color: 'var(--project-danger-on)' }}>Löschen</button>
          <button type="button" onClick={() => setConfirming(false)} className="px-2 py-1.5 rounded-lg text-small" style={{ color: 'var(--project-ink)' }}>Abbrechen</button>
        </>
      ) : (
        <button type="button" onClick={() => setConfirming(true)} disabled={pending} title="Datei löschen" className="p-2.5 rounded-lg transition-colors hover:bg-[var(--project-light)] disabled:opacity-40" style={{ color: 'var(--project-danger)' }}>
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </span>
  )
}
