'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  Check, Lock, Newspaper, CalendarDays, BarChart2, MessageSquare, CheckSquare,
  MessageCircle, Kanban, FolderOpen, Bot,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { setProjectModules } from '@/actions/manage/project'
import { MODULE_ORDER } from '@/lib/options/modules'

const MODULE_ICONS: Record<string, LucideIcon> = {
  news: Newspaper, calendar: CalendarDays, polls: BarChart2, forum: MessageSquare,
  tasks: CheckSquare, chat: MessageCircle, board: Kanban, files: FolderOpen, 'urban-agent': Bot,
}

const MODULE_HINT_KEYS: Record<string, string> = {
  news: 'hintNews',
  calendar: 'hintCalendar',
  polls: 'hintPolls',
  forum: 'hintForum',
  tasks: 'hintTasks',
  chat: 'hintChat',
  board: 'hintBoard',
  files: 'hintFiles',
  'urban-agent': 'hintUrbanAgent',
}

const CORE = new Set(['news', 'calendar'])

export function ModuleForm({ slug, locale, initialModules }: { slug: string; locale: string; initialModules: string[] }) {
  const t = useTranslations('manage')
  const tModules = useTranslations('modules')
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [selected, setSelected] = useState<Set<string>>(new Set(initialModules))
  const [saved, setSaved] = useState<Set<string>>(new Set(initialModules))
  const [error, setError] = useState<string | null>(null)

  const dirty = selected.size !== saved.size || [...selected].some((m) => !saved.has(m))

  const toggle = (m: string) => {
    if (CORE.has(m)) return
    setSelected((s) => {
      const next = new Set(s)
      if (next.has(m)) next.delete(m); else next.add(m)
      return next
    })
  }

  const save = () => {
    setError(null)
    startTransition(async () => {
      const res = await setProjectModules(slug, locale, [...selected])
      if (res.error) { setError(res.error); return }
      setSaved(new Set(selected))
      router.refresh()
    })
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-title font-bold leading-tight mb-1" style={{ color: 'var(--project-dark)' }}>{t('moduleForm.title')}</h1>
      <p className="text-text mb-6" style={{ color: 'var(--project-dark)', opacity: 0.65 }}>
        {t('moduleForm.subtitle')}
      </p>

      <div className="grid sm:grid-cols-2 gap-3">
        {MODULE_ORDER.map((m) => {
          const Icon = MODULE_ICONS[m] ?? FolderOpen
          const active = selected.has(m)
          const core = CORE.has(m)
          return (
            <button
              key={m}
              type="button"
              onClick={() => toggle(m)}
              disabled={pending || core}
              className="flex items-start gap-3 rounded-xl border p-4 text-left transition-all disabled:cursor-default"
              style={{
                background: active ? 'var(--project-light)' : 'var(--project-white)',
                borderColor: active ? 'var(--project-dark)' : 'color-mix(in srgb, var(--project-mid) 20%, transparent)',
                opacity: core ? 0.75 : 1,
              }}
            >
              <Icon className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--project-dark)' }} />
              <span className="flex-1 min-w-0">
                <span className="flex items-center gap-2 font-semibold text-text" style={{ color: 'var(--project-dark)' }}>
                  {tModules(m)}
                  {core && <Lock className="w-3.5 h-3.5" style={{ opacity: 0.5 }} />}
                </span>
                <span className="block text-small mt-0.5" style={{ color: 'var(--project-dark)', opacity: 0.55 }}>
                  {MODULE_HINT_KEYS[m] ? t(`moduleForm.${MODULE_HINT_KEYS[m]}`) : ''}
                </span>
              </span>
              <span
                className="w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5"
                style={{
                  background: active ? 'var(--project-dark)' : 'transparent',
                  borderColor: active ? 'var(--project-dark)' : 'color-mix(in srgb, var(--project-mid) 40%, transparent)',
                }}
              >
                {active && <Check className="w-3.5 h-3.5" style={{ color: 'var(--project-white)' }} />}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-3 mt-6">
        <button
          type="button"
          onClick={save}
          disabled={pending || !dirty}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-cta font-semibold transition-opacity disabled:opacity-40"
          style={{ background: 'var(--project-dark)', color: 'var(--project-white)' }}
        >
          {!dirty && !pending ? <Check className="w-4 h-4" /> : null}
          {pending ? t('moduleForm.saving') : dirty ? t('moduleForm.save') : t('moduleForm.saved')}
        </button>
        {error && <p className="text-small" style={{ color: '#b91c1c' }}>{error}</p>}
      </div>
    </div>
  )
}
