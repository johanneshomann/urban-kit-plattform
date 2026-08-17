// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Plus, Trash2, Pencil } from 'lucide-react'
import { createProjectPoll, editPollDraft, type CreatePollInput, type PollQuestionInput } from '@/actions/manage/polls'
import { FormModal } from '@/components/platform/FormModal'

const QUESTION_TYPES = [
  { value: 'single', labelKey: 'polls.typeSingle' },
  { value: 'multiple', labelKey: 'polls.typeMultiple' },
  { value: 'text', labelKey: 'polls.typeText' },
  { value: 'scale', labelKey: 'polls.typeScale' },
]

const cardStyle = { background: 'var(--project-white)', borderColor: 'color-mix(in srgb, var(--project-general) 20%, transparent)' }
const inputCls = 'px-3 py-2 rounded-lg border text-text outline-none'
const inputStyle = { borderColor: 'color-mix(in srgb, var(--project-general) 30%, transparent)', color: 'var(--project-accent)', background: 'var(--project-white)' }

interface DraftQuestion { text: string; type: string; optionsText: string }
const emptyQuestion = (): DraftQuestion => ({ text: '', type: 'single', optionsText: '' })

function isoToLocalInput(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso); if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * Self-contained poll create/draft-edit popup. Mountable from the manage
 * list, the member-facing polls page (create button) and the team page
 * quick actions. `editing: null` = create; `leadMode` hides the visibility
 * select (server forces TEAM ∩ leadOf) and defaults new polls to TEAM.
 */
export function PollFormModal({ slug, locale, editing, teamCatalog, leadMode = false, onClose }: {
  slug: string
  locale: string
  editing: { pollId: string; data: CreatePollInput } | null
  teamCatalog: string[]
  leadMode?: boolean
  onClose: () => void
}) {
  const t = useTranslations('manage')
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const d = editing?.data
  const [title, setTitle] = useState(d?.title ?? '')
  const [description, setDescription] = useState(d?.description ?? '')
  const [closesAt, setClosesAt] = useState(isoToLocalInput(d?.closesAt))
  const [visibility, setVisibility] = useState(d?.visibility ?? (leadMode ? 'TEAM' : 'PROJECT'))
  const [visibilityTeams, setVisibilityTeams] = useState<string[]>(Array.isArray(d?.visibilityTeams) ? d.visibilityTeams : [])
  const [allowAnonymous, setAllowAnonymous] = useState(!!d?.allowAnonymous)
  const [showLiveResults, setShowLiveResults] = useState(!!d?.showLiveResults)
  const [questions, setQuestions] = useState<DraftQuestion[]>(
    d?.questions.length ? d.questions.map((q) => ({ text: q.text, type: q.type, optionsText: q.options.join('\n') })) : [emptyQuestion()],
  )

  const setQ = (i: number, patch: Partial<DraftQuestion>) => setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)))

  const submit = () => {
    const qInput: PollQuestionInput[] = questions.map((q) => ({ text: q.text, type: q.type, options: q.optionsText.split('\n').map((o) => o.trim()).filter(Boolean) }))
    const input = { title, description, closesAt: closesAt || undefined, visibility, visibilityTeams, allowAnonymous, showLiveResults, questions: qInput }
    setError(null)
    startTransition(async () => {
      const res = editing ? await editPollDraft(slug, locale, editing.pollId, input) : await createProjectPoll(slug, locale, input)
      if (res.error) { setError(res.error); return }
      onClose()
      router.refresh()
    })
  }

  return (
    <FormModal title={editing ? t('polls.editDraft') : t('polls.newPoll')} size="xl" onClose={onClose}>
      <div className="flex flex-col gap-3">
        {error && <p className="text-small px-4 py-2.5 rounded-lg" style={{ color: 'var(--project-danger)', background: 'var(--project-danger-surface)' }}>{error}</p>}
        <input type="text" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('polls.titlePlaceholder')} className={`${inputCls} w-full`} style={inputStyle} />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder={t('polls.descriptionPlaceholder')} className={`${inputCls} w-full`} style={inputStyle} />
        <div className="grid sm:grid-cols-2 gap-2">
          <div>
            <label className="block text-small mb-1" style={{ color: 'var(--project-ink)' }}>{t('polls.closesAtLabel')}</label>
            <input type="datetime-local" value={closesAt} onChange={(e) => setClosesAt(e.target.value)} className={`${inputCls} w-full`} style={inputStyle} />
          </div>
          {!leadMode && (
            <div>
              <label className="block text-small mb-1" style={{ color: 'var(--project-ink)' }}>{t('polls.visibilityLabel')}</label>
              <select value={visibility} onChange={(e) => setVisibility(e.target.value)} className={`${inputCls} w-full`} style={inputStyle}>
                <option value="PUBLIC">{t('polls.visibilityPublic')}</option><option value="PROJECT">{t('polls.visibilityProject')}</option><option value="TEAM">{t('polls.visibilityTeam')}</option>
              </select>
            </div>
          )}
        </div>
        {visibility === 'TEAM' && teamCatalog.length > 0 && (
          <div>
            <span className="text-small font-medium mb-1.5 block" style={{ color: 'var(--project-accent)' }}>
              {t('members.teamLabel')}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {teamCatalog.map((tag) => {
                const active = visibilityTeams.includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setVisibilityTeams((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])}
                    className="text-small px-2.5 py-1 rounded-full border transition-colors"
                    style={{
                      background: active ? 'var(--project-dark)' : 'transparent',
                      color: active ? 'var(--project-black)' : 'var(--project-accent)',
                      borderColor: active ? 'var(--project-dark)' : 'color-mix(in srgb, var(--project-general) 35%, transparent)',
                    }}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-small cursor-pointer" style={{ color: 'var(--project-accent)' }}>
            <input type="checkbox" checked={allowAnonymous} onChange={(e) => setAllowAnonymous(e.target.checked)} /> {t('polls.allowAnonymous')}
          </label>
          <label className="flex items-center gap-2 text-small cursor-pointer" style={{ color: 'var(--project-accent)' }}>
            <input type="checkbox" checked={showLiveResults} onChange={(e) => setShowLiveResults(e.target.checked)} /> {t('polls.showLiveResults')}
          </label>
        </div>

        <p className="text-small font-bold uppercase tracking-widest mt-2" style={{ color: 'var(--project-ink)' }}>{t('polls.questionsHeading')}</p>
        {questions.map((q, i) => (
          <div key={i} className="rounded-lg border p-3 flex flex-col gap-2" style={cardStyle}>
            <div className="flex gap-2">
              <input type="text" value={q.text} onChange={(e) => setQ(i, { text: e.target.value })} placeholder={t('polls.questionPlaceholder', { number: i + 1 })} className={`${inputCls} flex-1`} style={inputStyle} />
              <select value={q.type} onChange={(e) => setQ(i, { type: e.target.value })} className={inputCls} style={inputStyle}>
                {QUESTION_TYPES.map((qt) => <option key={qt.value} value={qt.value}>{t(qt.labelKey)}</option>)}
              </select>
              <button type="button" onClick={() => setQuestions((qs) => qs.filter((_, idx) => idx !== i))} disabled={questions.length === 1} title={t('polls.removeQuestion')} className="p-2 rounded-lg disabled:opacity-30" style={{ color: 'var(--project-danger)' }}><Trash2 className="w-4 h-4" /></button>
            </div>
            {(q.type === 'single' || q.type === 'multiple') && (
              <textarea value={q.optionsText} onChange={(e) => setQ(i, { optionsText: e.target.value })} rows={3} placeholder={t('polls.optionsPlaceholder')} className={`${inputCls} w-full`} style={inputStyle} />
            )}
          </div>
        ))}
        <button type="button" onClick={() => setQuestions((qs) => [...qs, emptyQuestion()])} className="flex items-center gap-1.5 text-small font-semibold self-start" style={{ color: 'var(--project-accent)' }}><Plus className="w-4 h-4" /> {t('polls.addQuestion')}</button>

        <div>
          <button type="button" onClick={submit} disabled={pending || !title.trim() || questions.every((q) => !q.text.trim())}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-cta font-semibold transition-opacity disabled:opacity-40" style={{ background: 'var(--project-accent)', color: 'var(--project-white)' }}>
            {editing ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {editing ? t('polls.saveDraft') : t('polls.createPoll')}
          </button>
        </div>
      </div>
    </FormModal>
  )
}
