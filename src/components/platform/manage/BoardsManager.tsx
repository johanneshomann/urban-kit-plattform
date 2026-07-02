'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Kanban, Plus, Trash2, Pencil, Check, X } from 'lucide-react'
import { createBoard, renameBoard, deleteBoard } from '@/modules/board/actions'

export interface BoardItem {
  id: string
  name: string
}

export function BoardsManager({ slug, boards }: { slug: string; locale: string; boards: BoardItem[] }) {
  const t = useTranslations('manage')
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [newName, setNewName] = useState('')
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const run = (fn: () => Promise<{ error?: string }>) => {
    setError(null)
    startTransition(async () => {
      const res = await fn()
      if (res.error) { setError(res.error); return }
      router.refresh()
    })
  }

  return (
    <section className="max-w-2xl">
      <h1 className="flex items-center gap-2 text-display font-bold mb-1" style={{ color: 'var(--plattform-ink)' }}>
        <Kanban className="w-5 h-5" /> {t('boards.title')}
      </h1>
      <p className="text-text mb-5" style={{ color: 'var(--plattform-ink)', opacity: 0.7 }}>
        {t('boards.intro')}
      </p>

      <div className="flex gap-2 mb-6">
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t('boards.newBoardPlaceholder')}
          className="flex-1 px-3 py-2 rounded-lg border outline-none text-text" style={{ borderColor: '#e5e7eb', color: 'var(--plattform-ink)' }} />
        <button type="button" disabled={pending || !newName.trim()}
          onClick={() => run(async () => { const r = await createBoard(slug, newName); if (!r.error) setNewName(''); return r })}
          className="flex items-center gap-1 px-4 py-2 rounded-lg text-white text-cta font-semibold disabled:opacity-40" style={{ background: 'var(--plattform)' }}>
          <Plus className="w-4 h-4" /> {t('boards.addBoard')}
        </button>
      </div>

      {error && <p className="text-small mb-3" style={{ color: '#b91c1c' }}>{error}</p>}

      <div className="flex flex-col gap-2">
        {boards.length === 0 && <p className="text-text text-gray-400">{t('boards.empty')}</p>}
        {boards.map((b) => (
          <div key={b.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border" style={{ borderColor: '#e5e7eb' }}>
            {editing?.id === b.id ? (
              <>
                <input value={editing.name} onChange={(e) => setEditing({ id: b.id, name: e.target.value })}
                  className="flex-1 px-2 py-1 rounded border outline-none text-text" style={{ borderColor: '#e5e7eb' }} />
                <button type="button" disabled={pending} onClick={() => run(async () => { const res = await renameBoard(slug, b.id, editing.name); if (!res.error) setEditing(null); return res })} className="p-1.5 rounded text-white" style={{ background: 'var(--plattform)' }}><Check className="w-4 h-4" /></button>
                <button type="button" onClick={() => setEditing(null)} className="p-1.5 rounded border"><X className="w-4 h-4" /></button>
              </>
            ) : (
              <>
                <span className="flex-1 text-text font-medium" style={{ color: 'var(--plattform-ink)' }}>{b.name}</span>
                <button type="button" onClick={() => setEditing({ id: b.id, name: b.name })} title={t('boards.rename')} className="p-1.5 rounded hover:bg-gray-100"><Pencil className="w-4 h-4" /></button>
                <button type="button" disabled={pending} onClick={() => { if (confirm(t('boards.deleteConfirm', { name: b.name }))) run(() => deleteBoard(slug, b.id)) }} title={t('boards.delete')} className="p-1.5 rounded hover:bg-gray-100" style={{ color: '#b91c1c' }}><Trash2 className="w-4 h-4" /></button>
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
