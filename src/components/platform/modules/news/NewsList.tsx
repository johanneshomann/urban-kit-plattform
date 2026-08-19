// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowDown, ChevronDown, ChevronRight, ImagePlus, Newspaper, Pencil, Plus, Search, Trash2, Undo2, Upload, Users, X } from 'lucide-react'
import { AudienceChip } from '@/components/platform/AudienceChip'
import { ModulePageHeader } from '@/components/platform/ModulePageHeader'
import { useTranslations } from 'next-intl'
import { ContentItemMenu } from '@/components/platform/ContentItemMenu'
import { FormModal } from '@/components/platform/FormModal'
import { RichTextEditor, type EditorReference } from '@/components/platform/RichTextEditor'
import { searchWorkspaceAction } from '@/actions/search-workspace'
import { SaveButton } from '@/components/platform/SaveButton'
import {
  deleteProjectNewsPost, getNewsEditData, removeNewsFeaturedImage,
  setNewsFeaturedImage, setNewsPublish, updateProjectNewsPost, type NewsEditData,
} from '@/actions/manage/news'
import { matchesTeamFilter } from '@/lib/team-scope'

export interface NewsListPost {
  id: string
  title: string
  slug: string
  publishedAt: string | null
  visibility: string | null
  visibilityTeams: string[]
  imageUrl: string | null
  authorName: string | null
  /** Viewer may manage THIS post (PM, or lead + own post) — mirrors the server guard. */
  canManage: boolean
}

const cardStyle = { background: 'var(--project-white)', borderColor: 'color-mix(in srgb, var(--project-general) 20%, transparent)', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }
const toggleStyle = (on: boolean) => ({
  background: on ? 'var(--project-dark)' : 'transparent',
  color: on ? 'var(--project-black)' : 'var(--project-accent)',
  borderColor: on ? 'var(--project-dark)' : 'color-mix(in srgb, var(--project-general) 35%, transparent)',
})

/**
 * Citizen news list with the standard module header: date sort (toggles
 * newest/oldest), team-first sort (only for viewers with teams) and — for PMs —
 * the create button linking to the news manager (authoring lives there).
 */
export function NewsList({ locale, slug, posts, viewerTeams, canCreate, isPM, isLoggedIn, agentEnabled, teamCatalog }: {
  locale: string
  slug: string
  posts: NewsListPost[]
  /** Teams of the viewer — enables the team sort toggle. */
  viewerTeams: string[]
  /** Logged-in viewers get the bookmark + the common ⋯-menu on every card. */
  isLoggedIn: boolean
  /** urban-agent module enabled and viewer may use it (for the menu item). */
  agentEnabled: boolean
  /** PM only — news authoring (drafts, publish, schedule) lives in manage. */
  canCreate: boolean
  /** PMs pick any visibility in the edit popup; leads are fixed to TEAM. */
  isPM: boolean
  /** Team catalog for the edit popup's pills (PM: project catalog, lead: led teams). */
  teamCatalog: string[]
}) {
  const router = useRouter()
  const tModules = useTranslations('modules')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [dateAsc, setDateAsc] = useState(false)
  const [teamSel, setTeamSel] = useState<string | null>(null)
  const [teamOpen, setTeamOpen] = useState(false)
  const teamRef = useRef<HTMLDivElement>(null)

  const run = (fn: () => Promise<{ error?: string; ok?: boolean }>, after?: () => void) => {
    setError(null)
    startTransition(async () => {
      const res = await fn()
      if (res.error) { setError(res.error); return }
      after?.()
      router.refresh()
    })
  }

  // Edit popup state — loaded on demand (body converted to markdown server-side)
  const [editing, setEditing] = useState<({ id: string } & NewsEditData) | null>(null)
  const [statusSel, setStatusSel] = useState<'draft' | 'published' | 'scheduled'>('draft')
  const [scheduleAt, setScheduleAt] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)
  const toLocalInput = (iso: string) => {
    const d = new Date(iso)
    const p = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
  }
  const statusOf = (publishedAt: string | null) =>
    !publishedAt ? 'draft' as const : new Date(publishedAt).getTime() > Date.now() ? 'scheduled' as const : 'published' as const
  const openEdit = (postId: string) => {
    setError(null)
    startTransition(async () => {
      const res = await getNewsEditData(slug, postId)
      if ('error' in res) { setError(res.error); return }
      const status = statusOf(res.data.publishedAt)
      setStatusSel(status)
      setScheduleAt(status === 'scheduled' && res.data.publishedAt ? toLocalInput(res.data.publishedAt) : '')
      setEditing({ id: postId, ...res.data })
    })
  }
  const setF = <K extends keyof NewsEditData>(k: K, v: NewsEditData[K]) => setEditing((e) => (e ? { ...e, [k]: v } : e))
  // @-references in the editor: reuse the visibility-scoped workspace search
  const referenceSearch = async (query: string): Promise<EditorReference[]> => {
    const res = await searchWorkspaceAction({ slug, query })
    if ('error' in res) return []
    return res.results.map((r) => ({
      label: r.title,
      href: `/${locale}/dashboard/projekte/${slug}${r.href}`,
      meta: tModules(r.module),
    }))
  }
  // One save applies content AND the status selection (draft/publish/schedule)
  const saveEdit = () => {
    if (!editing) return
    const { id } = editing
    const prevStatus = statusOf(editing.publishedAt)
    run(
      async () => {
        const res = await updateProjectNewsPost(slug, locale, id, {
          title: editing.title,
          contentState: editing.content ?? '',
          visibility: editing.visibility,
          visibilityTeams: editing.visibilityTeams,
        })
        if (res.error) return res
        if (statusSel === 'draft' && prevStatus !== 'draft') return setNewsPublish(slug, locale, id, 'draft')
        if (statusSel === 'published' && prevStatus !== 'published') return setNewsPublish(slug, locale, id, 'now')
        if (statusSel === 'scheduled' && scheduleAt && (prevStatus !== 'scheduled' || (editing.publishedAt && toLocalInput(editing.publishedAt) !== scheduleAt))) {
          return setNewsPublish(slug, locale, id, 'schedule', scheduleAt)
        }
        return res
      },
      () => setEditing(null),
    )
  }
  // Image/publish actions mutate server state the open popup shows — run the
  // action, then re-fetch the edit payload so the popup reflects it.
  const runAndReload = (fn: () => Promise<{ error?: string; ok?: boolean }>) => {
    if (!editing) return
    const postId = editing.id
    setError(null)
    startTransition(async () => {
      const res = await fn()
      if (res.error) { setError(res.error); return }
      const fresh = await getNewsEditData(slug, postId)
      // Only take over the server-owned fields — unsaved title/body/visibility
      // edits in the open popup must survive an image upload or status change.
      if (!('error' in fresh)) {
        setEditing((prev) => prev && prev.id === postId
          ? { ...prev, featuredImageUrl: fresh.data.featuredImageUrl, publishedAt: fresh.data.publishedAt }
          : prev)
      }
      router.refresh()
    })
  }
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !editing) return
    const fd = new FormData()
    fd.append('file', file)
    runAndReload(() => setNewsFeaturedImage(slug, locale, editing.id, fd))
  }
  // TEAM visibility must name at least one team before saving (leads are
  // always TEAM-scoped, so the rule applies to them whenever teams exist).
  const teamMissing = !!editing
    && (isPM ? editing.visibility === 'TEAM' : true)
    && teamCatalog.length > 0
    && editing.visibilityTeams.length === 0

  // Close the team dropdown on outside click / Escape
  useEffect(() => {
    if (!teamOpen) return
    const onDown = (e: MouseEvent) => {
      if (teamRef.current && !teamRef.current.contains(e.target as Node)) setTeamOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setTeamOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [teamOpen])

  const sorted = useMemo(() => {
    const byDate = (a: NewsListPost, b: NewsListPost) => {
      const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0
      const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0
      return dateAsc ? ta - tb : tb - ta
    }
    // Team filter: only posts addressed to the selected team (same semantics
    // as the ?team= filter — untagged TEAM posts count for every team).
    let filtered = teamSel ? posts.filter((p) => matchesTeamFilter(p, teamSel)) : posts
    const q = query.trim().toLowerCase()
    if (q) filtered = filtered.filter((p) => p.title.toLowerCase().includes(q) || (p.authorName ?? '').toLowerCase().includes(q))
    return [...filtered].sort(byDate)
  }, [posts, dateAsc, teamSel, query])

  return (
    <div>
      <ModulePageHeader
        title="News"
        end={canCreate && (
          <Link
            href={`/${locale}/dashboard/projekte/${slug}/manage/inhalte/news`}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-cta font-semibold"
            style={{ background: 'var(--project-accent)', color: 'var(--project-white)' }}
          >
            <Plus className="w-4 h-4" aria-hidden /> Neue News
          </Link>
        )}
      >
        {/* Quick title/author filter, ahead of the sort controls */}
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border"
          style={{ background: 'var(--project-white)', borderColor: 'color-mix(in srgb, var(--project-general) 35%, transparent)' }}
        >
          <Search className="w-3.5 h-3.5 shrink-0" aria-hidden style={{ color: 'var(--project-ink)' }} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Suchen …"
            aria-label="News durchsuchen"
            className="w-32 sm:w-44 bg-transparent text-small outline-none placeholder:opacity-60"
            style={{ color: 'var(--project-accent)' }}
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label="Suche zurücksetzen" className="cursor-pointer opacity-50 hover:opacity-100">
              <X className="w-3.5 h-3.5" aria-hidden style={{ color: 'var(--project-ink)' }} />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setDateAsc((v) => !v)}
          title={dateAsc ? 'Älteste zuerst' : 'Neueste zuerst'}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-small font-medium border transition-colors cursor-pointer"
          style={toggleStyle(false)}
        >
          <ArrowDown className={`w-3.5 h-3.5 transition-transform ${dateAsc ? 'rotate-180' : ''}`} aria-hidden />
          Datum
        </button>
        {viewerTeams.length > 0 && (
          <div ref={teamRef} className="relative">
            <button
              type="button"
              onClick={() => setTeamOpen((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={teamOpen}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-small font-medium border transition-colors cursor-pointer"
              style={toggleStyle(teamSel !== null)}
            >
              <Users className="w-3.5 h-3.5" aria-hidden />
              {teamSel ? `Für Team: ${teamSel}` : viewerTeams.length > 1 ? 'Meine Teams' : 'Mein Team'}
              <ChevronDown className={`w-3 h-3 transition-transform ${teamOpen ? 'rotate-180' : ''}`} aria-hidden />
            </button>
            {teamOpen && (
              <div
                role="listbox"
                aria-label="Nach Team filtern"
                className="popover-in absolute right-0 top-full mt-1 z-50 min-w-40 rounded-lg border py-1 shadow-lg"
                style={{ background: 'var(--project-white)', borderColor: 'color-mix(in srgb, var(--project-general) 25%, transparent)' }}
              >
                {[null, ...viewerTeams].map((t) => (
                  <button
                    key={t ?? '__all'}
                    type="button"
                    role="option"
                    aria-selected={teamSel === t}
                    onClick={() => { setTeamSel(t); setTeamOpen(false) }}
                    className="w-full px-3 py-2 text-left text-small font-medium transition-colors cursor-pointer hover:bg-[color-mix(in_srgb,var(--project-general)_12%,transparent)]"
                    style={{ color: 'var(--project-accent)', ...(teamSel === t ? { background: 'color-mix(in srgb, var(--project-general) 16%, transparent)' } : {}) }}
                  >
                    {t ?? 'Alle Teams'}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </ModulePageHeader>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border py-12" style={cardStyle}>
          <Newspaper className="w-8 h-8" style={{ color: 'var(--project-ink)' }} />
          <p className="text-text" style={{ color: 'var(--project-ink)' }}>Noch keine Beiträge.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {error && <p className="text-small px-4 py-2.5 rounded-lg" style={{ color: 'var(--project-danger)', background: 'var(--project-danger-surface)' }}>{error}</p>}
          {sorted.map((p) => (
            // No overflow-hidden on the card — it would clip the gear dropdown;
            // the image block clips itself to the rounded left edge instead.
            <div key={p.id} className="flex items-stretch rounded-xl border transition-shadow hover:shadow-md" style={cardStyle}>
            <Link
              href={`/${locale}/dashboard/projekte/${slug}/m/news/${p.slug}`}
              className="flex-1 min-w-0 flex items-stretch"
            >
              {/* Image flush left at full card height; icon tile as fallback */}
              <div className="w-24 sm:w-32 shrink-0 self-stretch rounded-l-xl overflow-hidden" style={p.imageUrl ? undefined : { background: 'var(--project-accent)' }}>
                {p.imageUrl
                  ? <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><Newspaper aria-hidden className="w-7 h-7" style={{ color: 'var(--project-white)' }} /></div>}
              </div>
              <div className="flex-1 min-w-0 p-4 flex flex-col justify-center">
                {/* Date + author above the title */}
                {(p.publishedAt || p.authorName) && (
                  <p className="text-small mb-1 truncate" style={{ color: 'var(--project-ink)' }}>
                    {[
                      p.publishedAt
                        ? new Date(p.publishedAt).toLocaleDateString(locale === 'en' ? 'en-GB' : 'de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
                        : null,
                      p.authorName,
                    ].filter(Boolean).join(' · ')}
                  </p>
                )}
                <p className="text-display font-semibold leading-snug truncate" style={{ color: 'var(--project-accent)' }}>{p.title}</p>
                {/* Chips row under the title */}
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <AudienceChip visibility={p.visibility} visibilityTeams={p.visibilityTeams} />
                </div>
              </div>
              <ChevronRight className="w-5 h-5 shrink-0 self-center mr-4" style={{ color: 'var(--project-ink)' }} />
            </Link>
            {/* Outside the link (no nested interactives): the bookmark button
                for every logged-in viewer, the ⋯-menu only for whoever may act
                on THIS post (PM, or lead + own post); server re-checks all. */}
            {isLoggedIn && (
              <div className="self-center pr-2 flex items-center">
                <SaveButton slug={slug} module="news" itemId={p.id} />
                <ContentItemMenu
                  slug={slug}
                  locale={locale}
                  agentEnabled={agentEnabled}
                  item={{
                    module: 'news', itemId: p.id, title: p.title, href: `/m/news/${p.slug}`,
                    // PUBLIC posts have a public detail page — offer its link too
                    publicHref: p.visibility === 'PUBLIC' ? `/${locale}/projekte/${slug}/news/${p.slug}` : undefined,
                  }}
                  disabled={pending}
                  extraItems={p.canManage
                    ? [
                        { key: 'edit', label: 'Bearbeiten', icon: Pencil, onSelect: () => openEdit(p.id) },
                        { key: 'unpublish', label: 'Zurückziehen', icon: Undo2, onSelect: () => run(() => setNewsPublish(slug, locale, p.id, 'draft')) },
                        { key: 'delete', label: 'Löschen', icon: Trash2, variant: 'danger', confirmLabel: 'Wirklich löschen?', onSelect: () => run(() => deleteProjectNewsPost(slug, locale, p.id)) },
                      ]
                    : []}
                />
              </div>
            )}
            </div>
          ))}
        </div>
      )}

      {/* Edit popup — grid layout:
          Status | Sichtbarkeit
          Titel  | Titelbild
          Inhalt (full width)
          Speichern (full width) — the status selection applies on save. */}
      {editing && (() => {
        const inputStyle = { borderColor: 'color-mix(in srgb, var(--project-general) 30%, transparent)', color: 'var(--project-accent)', background: 'var(--project-white)' }
        const labelCls = 'block text-small font-medium mb-1.5'
        const labelStyle = { color: 'var(--project-accent)' }
        return (
        <FormModal title="News bearbeiten" size="2xl" onClose={() => setEditing(null)}>
          {error && <p role="alert" className="text-small mb-4 px-4 py-2.5 rounded-lg" style={{ color: 'var(--project-danger)', background: 'var(--project-danger-surface)' }}>{error}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* ── Status ── */}
            <div>
              <label htmlFor="news-edit-status" className={labelCls} style={labelStyle}>Status</label>
              <select
                id="news-edit-status" value={statusSel}
                onChange={(e) => setStatusSel(e.target.value as 'draft' | 'published' | 'scheduled')}
                className="w-full px-3 py-2 rounded-lg border text-text outline-none" style={inputStyle}
              >
                <option value="draft">Entwurf</option>
                <option value="published">Veröffentlicht</option>
                <option value="scheduled">Geplant</option>
              </select>
              {statusSel === 'scheduled' && (
                <div className="mt-2">
                  <label htmlFor="news-edit-schedule" className="sr-only">Zeitpunkt der Veröffentlichung</label>
                  <input
                    id="news-edit-schedule" type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-text outline-none" style={inputStyle}
                  />
                </div>
              )}
            </div>

            {/* ── Sichtbarkeit ── */}
            <div>
              {isPM ? (
                <>
                  <label htmlFor="news-edit-visibility" className={labelCls} style={labelStyle}>Sichtbarkeit</label>
                  <select
                    id="news-edit-visibility" value={editing.visibility} onChange={(e) => setF('visibility', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-text outline-none" style={inputStyle}
                  >
                    <option value="PUBLIC">Öffentlich</option>
                    <option value="PROJECT">Alle im Projekt</option>
                    <option value="TEAM">Team</option>
                  </select>
                </>
              ) : (
                <>
                  <span className={labelCls} style={labelStyle}>Sichtbarkeit</span>
                  {/* Team leads always publish for their team(s) — no free choice */}
                  <p className="text-small px-3 py-2 rounded-lg" style={{ background: 'var(--project-light)', color: 'var(--project-ink)' }}>
                    Nur Team — Ihre News sind auf Ihre Teams beschränkt.
                  </p>
                </>
              )}
              {(editing.visibility === 'TEAM' || !isPM) && teamCatalog.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Teams auswählen">
                  {teamCatalog.map((tag) => {
                    const on = editing.visibilityTeams.includes(tag)
                    return (
                      <button
                        key={tag} type="button" aria-pressed={on}
                        onClick={() => setF('visibilityTeams', on ? editing.visibilityTeams.filter((t) => t !== tag) : [...editing.visibilityTeams, tag])}
                        className="text-small px-2.5 py-1 rounded-full border transition-colors cursor-pointer"
                        style={{ background: on ? 'var(--project-dark)' : 'transparent', color: on ? 'var(--project-black)' : 'var(--project-accent)', borderColor: on ? 'var(--project-dark)' : 'color-mix(in srgb, var(--project-general) 35%, transparent)' }}
                      >
                        {tag}
                      </button>
                    )
                  })}
                </div>
              )}
              {teamMissing && (
                <p className="text-small mt-2" style={{ color: 'var(--project-danger)' }}>
                  Bitte mindestens ein Team auswählen.
                </p>
              )}
            </div>

            {/* ── Titel ── */}
            <div>
              <label htmlFor="news-edit-title" className={labelCls} style={labelStyle}>Titel</label>
              <input
                id="news-edit-title" type="text" autoFocus value={editing.title} onChange={(e) => setF('title', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-text outline-none" style={inputStyle}
              />
            </div>

            {/* ── Titelbild ── */}
            <div>
              <span className={labelCls} style={labelStyle}>Titelbild</span>
              <div className="flex items-center gap-2.5">
                <div className="w-20 h-11 rounded-lg overflow-hidden flex items-center justify-center shrink-0" style={{ background: 'var(--project-light)' }}>
                  {editing.featuredImageUrl
                    ? <img src={editing.featuredImageUrl} alt="Aktuelles Titelbild" className="w-full h-full object-cover" />
                    : <ImagePlus aria-hidden className="w-5 h-5" style={{ color: 'var(--project-ink)' }} />}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button" onClick={() => fileInput.current?.click()} disabled={pending}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-small font-medium border disabled:opacity-40 cursor-pointer"
                    style={{ color: 'var(--project-accent)', borderColor: 'color-mix(in srgb, var(--project-general) 30%, transparent)' }}
                  >
                    <Upload className="w-3.5 h-3.5" aria-hidden /> {editing.featuredImageUrl ? 'Ändern' : 'Hochladen'}
                  </button>
                  {editing.featuredImageUrl && (
                    <button
                      type="button" onClick={() => runAndReload(() => removeNewsFeaturedImage(slug, locale, editing.id))} disabled={pending}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-small disabled:opacity-40 cursor-pointer"
                      style={{ color: 'var(--project-danger)' }}
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden /> Entfernen
                    </button>
                  )}
                </div>
              </div>
              <input ref={fileInput} type="file" accept="image/*" hidden onChange={onFile} aria-label="Titelbild auswählen" />
            </div>

            {/* ── Inhalt ── */}
            <div className="sm:col-span-2">
              <span className={labelCls} style={labelStyle}>Inhalt</span>
              {/* key: re-init the editor per post; native Lexical state, no markdown */}
              <RichTextEditor
                key={editing.id}
                value={editing.content}
                onChange={(state) => setF('content', state)}
                ariaLabel="Inhalt"
                minRows={10}
                referenceSearch={referenceSearch}
              />
            </div>

            {/* ── Speichern ── */}
            <div className="sm:col-span-2">
              <button
                type="button" onClick={saveEdit}
                disabled={pending || !editing.title.trim() || teamMissing || (statusSel === 'scheduled' && !scheduleAt)}
                className="w-full flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg text-cta font-semibold transition-opacity disabled:opacity-40 cursor-pointer"
                style={{ background: 'var(--project-accent)', color: 'var(--project-white)' }}
              >
                <Pencil className="w-4 h-4" aria-hidden /> Speichern
              </button>
            </div>
          </div>
        </FormModal>
        )
      })()}
    </div>
  )
}
