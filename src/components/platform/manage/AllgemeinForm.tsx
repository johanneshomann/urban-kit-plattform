'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Check } from 'lucide-react'
import { updateProjectSettings } from '@/actions/manage/project'
import {
  THEMA_OPTIONS, STADTBEREICH_OPTIONS, ALTERSGRUPPE_OPTIONS, GENDER_OPTIONS, type FieldOption,
} from '@/lib/options/project-fields'
import { projektphaseOptions } from '@/lib/options/projektphasen'

export interface MemberOption { id: string; name: string }

export interface AllgemeinInitial {
  title: string
  shortDescription: string
  startYear: number | null
  projektphase: string
  thema: string[]
  stadtbereich: string[]
  altersgruppe: string[]
  gender: string[]
  kontakt: { email: string; telefon: string; website: string }
  projektbeschreibung: string
  beteiligungsvorhaben: string
  ansprechperson: string
}

const inputStyle = {
  borderColor: 'color-mix(in srgb, var(--project-mid) 30%, transparent)',
  color: 'var(--project-dark)',
  background: 'var(--project-white)',
}
const inputCls = 'w-full px-3 py-2 rounded-lg border text-text outline-none'

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-small font-semibold mb-1.5" style={{ color: 'var(--project-dark)' }}>{children}</label>
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border p-5" style={{ background: 'var(--project-white)', borderColor: 'color-mix(in srgb, var(--project-mid) 20%, transparent)' }}>
      <h2 className="text-small font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--project-dark)', opacity: 0.5 }}>{title}</h2>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  )
}

function ChipMultiSelect({ options, value, onChange }: { options: FieldOption[]; value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = value.includes(o.value)
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => toggle(o.value)}
            className="text-small px-3 py-1.5 rounded-full border transition-colors"
            style={{
              background: active ? 'var(--project-dark)' : 'transparent',
              color: active ? 'var(--project-white)' : 'var(--project-dark)',
              borderColor: active ? 'var(--project-dark)' : 'color-mix(in srgb, var(--project-mid) 35%, transparent)',
            }}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function AllgemeinForm({ slug, locale, initial, members }: { slug: string; locale: string; initial: AllgemeinInitial; members: MemberOption[] }) {
  const t = useTranslations('manage')
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [state, setState] = useState<AllgemeinInitial>(initial)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const set = <K extends keyof AllgemeinInitial>(k: K, v: AllgemeinInitial[K]) => {
    setState((s) => ({ ...s, [k]: v })); setSaved(false)
  }
  const setKontakt = (k: keyof AllgemeinInitial['kontakt'], v: string) => {
    setState((s) => ({ ...s, kontakt: { ...s.kontakt, [k]: v } })); setSaved(false)
  }

  const save = () => {
    setError(null)
    startTransition(async () => {
      const res = await updateProjectSettings(slug, locale, {
        title: state.title,
        shortDescription: state.shortDescription,
        startYear: state.startYear,
        projektphase: state.projektphase || undefined,
        thema: state.thema,
        stadtbereich: state.stadtbereich,
        altersgruppe: state.altersgruppe,
        gender: state.gender,
        kontakt: state.kontakt,
        projektbeschreibung: state.projektbeschreibung,
        beteiligungsvorhaben: state.beteiligungsvorhaben,
        ansprechperson: state.ansprechperson,
      })
      if (res.error) { setError(res.error); return }
      setSaved(true)
      router.refresh()
    })
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-title font-bold leading-tight mb-1" style={{ color: 'var(--project-dark)' }}>{t('allgemein.title')}</h1>
      <p className="text-text mb-6" style={{ color: 'var(--project-dark)', opacity: 0.65 }}>{t('allgemein.subtitle')}</p>

      <div className="flex flex-col gap-4">
        <Section title={t('allgemein.sectionBasics')}>
          <div>
            <Label>{t('allgemein.labelTitle')}</Label>
            <input className={inputCls} style={inputStyle} value={state.title} onChange={(e) => set('title', e.target.value)} />
          </div>
          <div>
            <Label>{t('allgemein.labelShortDescription')}</Label>
            <textarea className={inputCls} style={inputStyle} rows={3} value={state.shortDescription} onChange={(e) => set('shortDescription', e.target.value)} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>{t('allgemein.labelStartYear')}</Label>
              <input
                type="number"
                className={inputCls}
                style={inputStyle}
                value={state.startYear ?? ''}
                onChange={(e) => set('startYear', e.target.value === '' ? null : Number(e.target.value))}
              />
            </div>
            <div>
              <Label>{t('allgemein.labelProjektphase')}</Label>
              <select className={inputCls} style={inputStyle} value={state.projektphase} onChange={(e) => set('projektphase', e.target.value)}>
                {projektphaseOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
        </Section>

        <Section title={t('allgemein.sectionDescription')}>
          <div>
            <Label>{t('allgemein.labelProjektbeschreibung')}</Label>
            <textarea
              className={`${inputCls} font-mono`}
              style={inputStyle}
              rows={8}
              value={state.projektbeschreibung}
              onChange={(e) => set('projektbeschreibung', e.target.value)}
              placeholder={t('allgemein.placeholderProjektbeschreibung')}
            />
            <p className="text-small mt-1" style={{ color: 'var(--project-dark)', opacity: 0.5 }}>{t('allgemein.markdownHint')}</p>
          </div>
          <div>
            <Label>{t('allgemein.labelBeteiligungsvorhaben')}</Label>
            <textarea
              className={`${inputCls} font-mono`}
              style={inputStyle}
              rows={6}
              value={state.beteiligungsvorhaben}
              onChange={(e) => set('beteiligungsvorhaben', e.target.value)}
              placeholder={t('allgemein.placeholderBeteiligungsvorhaben')}
            />
          </div>
        </Section>

        <Section title={t('allgemein.sectionTargetGroups')}>
          <div><Label>{t('allgemein.labelThema')}</Label><ChipMultiSelect options={THEMA_OPTIONS} value={state.thema} onChange={(v) => set('thema', v)} /></div>
          <div><Label>{t('allgemein.labelStadtbereich')}</Label><ChipMultiSelect options={STADTBEREICH_OPTIONS} value={state.stadtbereich} onChange={(v) => set('stadtbereich', v)} /></div>
          <div><Label>{t('allgemein.labelAltersgruppe')}</Label><ChipMultiSelect options={ALTERSGRUPPE_OPTIONS} value={state.altersgruppe} onChange={(v) => set('altersgruppe', v)} /></div>
          <div><Label>{t('allgemein.labelZielgruppe')}</Label><ChipMultiSelect options={GENDER_OPTIONS} value={state.gender} onChange={(v) => set('gender', v)} /></div>
        </Section>

        <Section title={t('allgemein.sectionContact')}>
          <div>
            <Label>{t('allgemein.labelAnsprechperson')}</Label>
            <select className={inputCls} style={inputStyle} value={state.ansprechperson} onChange={(e) => set('ansprechperson', e.target.value)}>
              <option value="">{t('allgemein.optionNone')}</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div><Label>{t('allgemein.labelEmail')}</Label><input className={inputCls} style={inputStyle} value={state.kontakt.email} onChange={(e) => setKontakt('email', e.target.value)} /></div>
            <div><Label>{t('allgemein.labelTelefon')}</Label><input className={inputCls} style={inputStyle} value={state.kontakt.telefon} onChange={(e) => setKontakt('telefon', e.target.value)} /></div>
            <div><Label>{t('allgemein.labelWebsite')}</Label><input className={inputCls} style={inputStyle} value={state.kontakt.website} onChange={(e) => setKontakt('website', e.target.value)} /></div>
          </div>
        </Section>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-cta font-semibold transition-opacity disabled:opacity-40"
            style={{ background: 'var(--project-dark)', color: 'var(--project-white)' }}
          >
            {saved ? <Check className="w-4 h-4" /> : null}
            {pending ? t('allgemein.saving') : saved ? t('allgemein.saved') : t('allgemein.save')}
          </button>
          {error && <p className="text-small" style={{ color: '#b91c1c' }}>{error}</p>}
        </div>
      </div>
    </div>
  )
}
