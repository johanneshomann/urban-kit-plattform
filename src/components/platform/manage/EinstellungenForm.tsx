'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Check, Globe, UserPlus, AlertTriangle } from 'lucide-react'
import { updateProjectVisibility, deleteProject } from '@/actions/manage/settings'

export interface EinstellungenInitial {
  isPublic: boolean
  joinRequestsEnabled: boolean
}

const cardStyle = { background: 'var(--project-white)', borderColor: 'color-mix(in srgb, var(--project-mid) 20%, transparent)' }

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative w-11 h-6 rounded-full shrink-0 transition-colors disabled:opacity-50"
      style={{ background: checked ? 'var(--project-dark)' : 'color-mix(in srgb, var(--project-mid) 35%, transparent)' }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform"
        style={{ transform: checked ? 'translateX(20px)' : 'translateX(0)' }}
      />
    </button>
  )
}

function SettingRow({
  icon: Icon, title, hint, checked, onChange, disabled,
}: {
  icon: typeof Globe; title: string; hint: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <Icon className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--project-dark)' }} />
      <div className="flex-1 min-w-0">
        <p className="text-text font-medium" style={{ color: 'var(--project-dark)' }}>{title}</p>
        <p className="text-small mt-0.5" style={{ color: 'var(--project-dark)', opacity: 0.55 }}>{hint}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  )
}

export function EinstellungenForm({
  slug, locale, projectTitle, initial,
}: {
  slug: string; locale: string; projectTitle: string; initial: EinstellungenInitial
}) {
  const t = useTranslations('manage')
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(true)

  const [isPublic, setIsPublic] = useState(initial.isPublic)
  const [joinRequestsEnabled, setJoinRequestsEnabled] = useState(initial.joinRequestsEnabled)

  // Danger zone
  const [confirmText, setConfirmText] = useState('')
  const [deletePending, startDelete] = useTransition()
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const dirty = isPublic !== initial.isPublic || joinRequestsEnabled !== initial.joinRequestsEnabled

  const save = () => {
    setError(null)
    startTransition(async () => {
      const res = await updateProjectVisibility(slug, locale, { isPublic, joinRequestsEnabled })
      if (res.error) { setError(res.error); return }
      setSaved(true)
      router.refresh()
    })
  }

  const onChange = (fn: () => void) => { fn(); setSaved(false) }

  const remove = () => {
    setDeleteError(null)
    startDelete(async () => {
      const res = await deleteProject(slug, locale, confirmText)
      // On success the action redirects; only an error returns here.
      if (res?.error) setDeleteError(res.error)
    })
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-title font-bold leading-tight mb-1" style={{ color: 'var(--project-dark)' }}>{t('einstellungen.title')}</h1>
      <p className="text-text mb-6" style={{ color: 'var(--project-dark)', opacity: 0.65 }}>{t('einstellungen.subtitle')}</p>

      {/* Visibility */}
      <div className="rounded-xl border p-5" style={cardStyle}>
        <h2 className="text-small font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--project-dark)', opacity: 0.5 }}>{t('einstellungen.sectionVisibility')}</h2>
        <div className="divide-y" style={{ borderColor: 'color-mix(in srgb, var(--project-mid) 15%, transparent)' }}>
          <SettingRow
            icon={Globe}
            title={t('einstellungen.publicTitle')}
            hint={t('einstellungen.publicHint')}
            checked={isPublic}
            onChange={(v) => onChange(() => setIsPublic(v))}
            disabled={pending}
          />
          <SettingRow
            icon={UserPlus}
            title={t('einstellungen.joinTitle')}
            hint={t('einstellungen.joinHint')}
            checked={joinRequestsEnabled}
            onChange={(v) => onChange(() => setJoinRequestsEnabled(v))}
            disabled={pending}
          />
        </div>

        <div className="flex items-center gap-3 mt-4">
          <button
            type="button"
            onClick={save}
            disabled={pending || !dirty}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-cta font-semibold transition-opacity disabled:opacity-40"
            style={{ background: 'var(--project-dark)', color: 'var(--project-white)' }}
          >
            {saved && !dirty && !pending ? <Check className="w-4 h-4" /> : null}
            {pending ? t('einstellungen.saving') : dirty ? t('einstellungen.save') : t('einstellungen.saved')}
          </button>
          {error && <p className="text-small" style={{ color: '#b91c1c' }}>{error}</p>}
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-xl border p-5 mt-6" style={{ background: '#fef2f2', borderColor: '#fecaca' }}>
        <h2 className="flex items-center gap-2 text-small font-bold uppercase tracking-widest mb-2" style={{ color: '#b91c1c' }}>
          <AlertTriangle className="w-4 h-4" /> {t('einstellungen.dangerZone')}
        </h2>
        <p className="text-text" style={{ color: '#7f1d1d' }}>
          {t('einstellungen.dangerText')}
        </p>
        <p className="text-small mt-3 mb-1.5" style={{ color: '#7f1d1d' }}>
          {t.rich('einstellungen.confirmPrompt', {
            title: projectTitle,
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={projectTitle}
            className="flex-1 px-3 py-2 rounded-lg border text-text outline-none"
            style={{ borderColor: '#fecaca', color: '#7f1d1d', background: 'white' }}
          />
          <button
            type="button"
            onClick={remove}
            disabled={deletePending || confirmText.trim() !== projectTitle.trim()}
            className="flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-cta font-semibold transition-opacity disabled:opacity-40"
            style={{ background: '#b91c1c', color: 'white' }}
          >
            <AlertTriangle className="w-4 h-4" />
            {deletePending ? t('einstellungen.deleting') : t('einstellungen.deleteProject')}
          </button>
        </div>
        {deleteError && <p className="text-small mt-2" style={{ color: '#b91c1c' }}>{deleteError}</p>}
      </div>
    </div>
  )
}
