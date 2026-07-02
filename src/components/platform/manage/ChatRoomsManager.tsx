'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { MessageCircle, Plus, Trash2, Pencil, Check, X } from 'lucide-react'
import { createProjectRoom, renameRoom, deleteRoom } from '@/modules/chat/actions'

export interface ChatRoomItem {
  id: string
  name: string
  memberCount: number
}

export function ChatRoomsManager({ slug, rooms }: { slug: string; locale: string; rooms: ChatRoomItem[] }) {
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
        <MessageCircle className="w-5 h-5" /> {t('chat.title')}
      </h1>
      <p className="text-text mb-5" style={{ color: 'var(--plattform-ink)', opacity: 0.7 }}>
        {t('chat.intro')}
      </p>

      <div className="flex gap-2 mb-6">
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t('chat.newRoomPlaceholder')}
          className="flex-1 px-3 py-2 rounded-lg border outline-none text-text" style={{ borderColor: '#e5e7eb', color: 'var(--plattform-ink)' }} />
        <button type="button" disabled={pending || !newName.trim()}
          onClick={() => run(async () => { const r = await createProjectRoom(slug, newName); if (!r.error) setNewName(''); return r })}
          className="flex items-center gap-1 px-4 py-2 rounded-lg text-white text-cta font-semibold disabled:opacity-40" style={{ background: 'var(--plattform)' }}>
          <Plus className="w-4 h-4" /> {t('chat.addRoom')}
        </button>
      </div>

      {error && <p className="text-small mb-3" style={{ color: '#b91c1c' }}>{error}</p>}

      <div className="flex flex-col gap-2">
        {rooms.length === 0 && <p className="text-text text-gray-400">{t('chat.empty')}</p>}
        {rooms.map((r) => (
          <div key={r.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border" style={{ borderColor: '#e5e7eb' }}>
            {editing?.id === r.id ? (
              <>
                <input value={editing.name} onChange={(e) => setEditing({ id: r.id, name: e.target.value })}
                  className="flex-1 px-2 py-1 rounded border outline-none text-text" style={{ borderColor: '#e5e7eb' }} />
                <button type="button" disabled={pending} onClick={() => run(async () => { const res = await renameRoom(r.id, editing.name); if (!res.error) setEditing(null); return res })} className="p-1.5 rounded text-white" style={{ background: 'var(--plattform)' }}><Check className="w-4 h-4" /></button>
                <button type="button" onClick={() => setEditing(null)} className="p-1.5 rounded border"><X className="w-4 h-4" /></button>
              </>
            ) : (
              <>
                <span className="flex-1 text-text font-medium" style={{ color: 'var(--plattform-ink)' }}>{r.name}</span>
                <span className="text-small text-gray-400">{t('chat.memberCount', { count: r.memberCount })}</span>
                <button type="button" onClick={() => setEditing({ id: r.id, name: r.name })} title={t('chat.rename')} className="p-1.5 rounded hover:bg-gray-100"><Pencil className="w-4 h-4" /></button>
                <button type="button" disabled={pending} onClick={() => { if (confirm(t('chat.deleteConfirm', { name: r.name }))) run(() => deleteRoom(r.id)) }} title={t('chat.delete')} className="p-1.5 rounded hover:bg-gray-100" style={{ color: '#b91c1c' }}><Trash2 className="w-4 h-4" /></button>
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
