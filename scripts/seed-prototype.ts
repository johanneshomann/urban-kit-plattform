// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

/**
 * Seeds the prototype projects from seed/content/* into the running database.
 * Idempotent: existing users are reused (by email), a project whose slug
 * already exists is skipped entirely. Run with:
 *
 *   npm run seed:prototype
 *
 * Deliberately creates NO admin account — on a fresh install the admin is
 * created manually via Payload's first-user onboarding at /admin.
 */
import { getPayload, type Payload } from 'payload'
import config from '@payload-config'
import { editorConfigFactory, convertMarkdownToLexical, type SanitizedServerEditorConfig } from '@payloadcms/richtext-lexical'
import * as Y from 'yjs'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { SEED_USERS } from '../seed/content/users'
import { pushStattPull } from '../seed/content/push-statt-pull'
import { mobilitaetXMulti } from '../seed/content/mobilitaet-x-multi'
import { kulturTrifftDigital } from '../seed/content/kultur-trifft-digital'
import { stadtdaten } from '../seed/content/stadtdaten'
import { nudging } from '../seed/content/nudging'
import { stadtkontaktMobil } from '../seed/content/stadtkontakt-mobil'
import { mitmachWerkstatt } from '../seed/content/mitmach-werkstatt'
import type { SeedImage, SeedProject } from '../seed/content/types'

const PROJECTS: SeedProject[] = [pushStattPull, mobilitaetXMulti, kulturTrifftDigital, stadtdaten, nudging, stadtkontaktMobil, mitmachWerkstatt]
const ASSETS = path.resolve(process.cwd(), 'seed', 'assets')
const PASSWORD = 'demo1234'
const COLOR_SCHEMES = ['Sandstein', 'Terrakotta', 'Feldgrau', 'Ozean', 'Kupfer']

const payload = await getPayload({ config })
const editorConfig: SanitizedServerEditorConfig = await editorConfigFactory.default({ config: payload.config })
const md = (markdown: string) => convertMarkdownToLexical({ editorConfig, markdown }) as never

const slugify = (s: string) =>
  s.toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 60)

const daysFromNow = (days: number, hour = 17) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

async function uploadMedia(opts: { file: string; alt: string; projectId?: string; userId: string }): Promise<string> {
  const data = await readFile(opts.file)
  const ext = path.extname(opts.file).toLowerCase()
  const mimetype = ext === '.pdf' ? 'application/pdf' : ext === '.webp' ? 'image/webp' : ext === '.png' ? 'image/png' : 'image/jpeg'
  const media = await payload.create({
    collection: 'media',
    data: { alt: opts.alt, visibility: 'PUBLIC', project: opts.projectId, uploadedBy: opts.userId } as never,
    file: { data, name: path.basename(opts.file), mimetype, size: data.length },
    overrideAccess: true,
  })
  return String(media.id)
}

// ── Excalidraw sticky notes → Yjs state ─────────────────────────────────────
function wrap(text: string, max = 26): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    if ((line + ' ' + w).trim().length > max) { lines.push(line.trim()); line = w }
    else line = `${line} ${w}`
  }
  if (line.trim()) lines.push(line.trim())
  return lines
}

function boardState(notes: string[]): string {
  const doc = new Y.Doc()
  const elements = doc.getMap<unknown>('elements')
  const base = {
    angle: 0, fillStyle: 'solid', strokeWidth: 1, strokeStyle: 'solid', roughness: 1,
    opacity: 100, groupIds: [] as string[], frameId: null, isDeleted: false,
    boundElements: [] as unknown[], link: null, locked: false, version: 1,
  }
  doc.transact(() => {
    notes.forEach((note, i) => {
      const col = i % 3
      const row = Math.floor(i / 3)
      const x = 80 + col * 280
      const y = 80 + row * 180
      const lines = wrap(note)
      const rectId = `seed-rect-${i}`
      const textId = `seed-text-${i}`
      elements.set(rectId, {
        ...base, id: rectId, type: 'rectangle', x, y, width: 240, height: Math.max(120, lines.length * 22 + 32),
        strokeColor: '#1e1e1e', backgroundColor: '#fff3bf', roundness: { type: 3 },
        seed: 1000 + i, versionNonce: 2000 + i, index: `a${i * 2}`, updated: Date.now(),
      })
      elements.set(textId, {
        ...base, id: textId, type: 'text', x: x + 14, y: y + 14, width: 212, height: lines.length * 22,
        strokeColor: '#1e1e1e', backgroundColor: 'transparent', roundness: null,
        text: lines.join('\n'), originalText: note, fontSize: 15, fontFamily: 1,
        textAlign: 'left', verticalAlign: 'top', containerId: null, autoResize: true,
        lineHeight: 1.35, seed: 3000 + i, versionNonce: 4000 + i, index: `a${i * 2 + 1}`, updated: Date.now(),
      })
    })
  })
  return Buffer.from(Y.encodeStateAsUpdate(doc)).toString('base64')
}

// ── Users ───────────────────────────────────────────────────────────────────
const userIdByEmail = new Map<string, string>()
for (const u of SEED_USERS) {
  const existing = await payload.find({ collection: 'users', where: { email: { equals: u.email } }, limit: 1, depth: 0, overrideAccess: true })
  if (existing.docs[0]) {
    userIdByEmail.set(u.email, String(existing.docs[0].id))
    continue
  }
  const created = await payload.create({
    collection: 'users',
    data: {
      email: u.email, password: PASSWORD, role: 'user',
      firstName: u.firstName, lastName: u.lastName, bio: u.bio,
      gender: u.gender, birthYear: u.birthYear, stadtbereich: u.stadtbereich,
      affiliations: u.affiliations, cityInfo: u.cityInfo,
      _verified: true,
    } as never,
    overrideAccess: true,
    disableVerificationEmail: true,
  })
  const id = String(created.id)
  userIdByEmail.set(u.email, id)
  // Belt and braces: the JWT strategy rejects unverified users
  await payload.update({ collection: 'users', id, data: { _verified: true } as never, overrideAccess: true }).catch(() => {})
  // Avatar, if the image has been dropped into seed/assets/avatare/
  if (u.avatar) {
    const avatarPath = path.join(ASSETS, 'avatare', u.avatar)
    if (existsSync(avatarPath)) {
      const mediaId = await uploadMedia({ file: avatarPath, alt: `${u.firstName} ${u.lastName}`, userId: id })
      await payload.update({ collection: 'users', id, data: { avatar: mediaId } as never, overrideAccess: true })
    }
  }
  console.log(`user   + ${u.email}`)
}

// ── Projects ────────────────────────────────────────────────────────────────
for (const [pIdx, p] of PROJECTS.entries()) {
  const existing = await payload.find({ collection: 'projects', where: { slug: { equals: p.slug } }, limit: 1, depth: 0, overrideAccess: true })
  if (existing.docs[0]) {
    console.log(`SKIP project ${p.slug} (already seeded)`)
    continue
  }
  const pmId = userIdByEmail.get(p.projektleitungEmail)
  if (!pmId) throw new Error(`PM ${p.projektleitungEmail} missing for ${p.slug}`)

  const project = await payload.create({
    collection: 'projects',
    data: {
      title: p.title, slug: p.slug, shortDescription: p.shortDescription,
      colorScheme: COLOR_SCHEMES[pIdx % COLOR_SCHEMES.length],
      isPublic: p.isPublic, joinRequestsEnabled: true,
      projektphase: p.projektphase, thema: p.thema, startYear: p.startYear,
      stadtbereich: p.stadtbereich, altersgruppe: p.altersgruppe, gender: p.gender,
      modules: ['news', 'calendar', 'polls', 'forum', 'tasks', 'board', 'files', 'urban-agent'],
      teams: p.teams,
      projektbeschreibung: md(p.beschreibung), beteiligungsvorhaben: md(p.beteiligungsvorhaben),
      kontakt: p.kontakt, ansprechperson: pmId,
    } as never,
    overrideAccess: true,
  })
  const projectId = String(project.id)
  console.log(`project + ${p.slug}`)

  // Images: cover + gallery from seed/assets/<slug>/
  const imageId = new Map<SeedImage, string>()
  for (const img of ['cover', 'galerie-1', 'galerie-2', 'galerie-3'] as SeedImage[]) {
    const file = ['.webp', '.jpg', '.jpeg', '.png'].map((e) => path.join(ASSETS, p.slug, `${img}${e}`)).find(existsSync)
    if (!file) continue
    imageId.set(img, await uploadMedia({ file, alt: `${p.title} – ${img}`, projectId, userId: pmId }))
  }
  await payload.update({
    collection: 'projects', id: projectId,
    data: {
      coverImage: imageId.get('cover'),
      gallery: (['galerie-1', 'galerie-2', 'galerie-3'] as SeedImage[])
        .filter((g) => imageId.has(g))
        .map((g) => ({ image: imageId.get(g), caption: '' })),
    } as never,
    overrideAccess: true,
  })

  // Memberships from the roster
  const memberEmails: string[] = []
  for (const u of SEED_USERS) {
    const m = u.memberships.find((m) => m.project === p.slug)
    if (!m) continue
    memberEmails.push(u.email)
    await payload.create({
      collection: 'project-memberships',
      data: {
        user: userIdByEmail.get(u.email), project: projectId, role: m.role, status: 'active',
        teams: m.teams ?? [], leadOf: m.leadOf ?? [],
      } as never,
      overrideAccess: true,
    })
  }
  const memberId = (email: string) => userIdByEmail.get(email)!
  // Comment authors rotate through the non-PM members
  const commenters = memberEmails.filter((e) => e !== p.projektleitungEmail)
  let commenterIdx = 0
  const nextCommenter = () => memberId(commenters[commenterIdx++ % commenters.length])

  // News
  for (const n of p.news) {
    await payload.create({
      collection: 'news-posts',
      data: {
        title: n.title, slug: slugify(n.title), content: md(n.body),
        visibility: n.visibility ?? 'PROJECT', visibilityTeams: n.teams ?? [],
        publishedAt: daysFromNow(-n.daysAgo, 9),
        featuredImage: n.image ? imageId.get(n.image) : undefined,
        author: n.authorEmail ? memberId(n.authorEmail) : pmId, project: projectId,
      } as never,
      overrideAccess: true,
    })
  }

  // Events
  for (const e of p.events) {
    await payload.create({
      collection: 'calendar-events',
      data: {
        title: e.title, slug: slugify(e.title), content: e.body ? md(e.body) : undefined,
        startDate: daysFromNow(e.inDays), endDate: e.allDay ? undefined : daysFromNow(e.inDays, 19),
        allDay: e.allDay ?? false, location: e.location, category: e.category,
        visibility: e.visibility ?? 'PROJECT', visibilityTeams: e.teams ?? [],
        author: pmId, project: projectId,
      } as never,
      overrideAccess: true,
    })
  }

  // Polls (+ questions + options)
  for (const poll of p.polls) {
    const created = await payload.create({
      collection: 'polls',
      data: {
        title: poll.title, slug: slugify(poll.title), description: poll.description,
        status: poll.status, allowAnonymous: poll.allowAnonymous ?? false,
        showLiveResults: poll.showLiveResults ?? false,
        closesAt: poll.status === 'active' ? daysFromNow(14) : daysFromNow(-2),
        visibility: poll.visibility ?? 'PROJECT', visibilityTeams: poll.teams ?? [],
        author: pmId, project: projectId,
      } as never,
      overrideAccess: true,
    })
    for (const [qIdx, q] of poll.questions.entries()) {
      const question = await payload.create({
        collection: 'poll-questions',
        data: { poll: String(created.id), text: q.text, type: q.type, order: qIdx } as never,
        overrideAccess: true,
      })
      for (const [oIdx, opt] of (q.options ?? []).entries()) {
        await payload.create({
          collection: 'poll-options',
          data: { question: String(question.id), text: opt, order: oIdx } as never,
          overrideAccess: true,
        })
      }
    }
  }

  // Forum (+ comments)
  for (const t of p.forum) {
    const thread = await payload.create({
      collection: 'forum-threads',
      data: {
        title: t.title, slug: slugify(t.title), content: md(t.body),
        visibility: t.visibility ?? 'PROJECT', visibilityTeams: t.teams ?? [],
        pinned: t.pinned ?? false,
        author: t.authorEmail ? memberId(t.authorEmail) : nextCommenter(), project: projectId,
      } as never,
      overrideAccess: true,
    })
    for (const c of t.comments) {
      await payload.create({
        collection: 'forum-comments',
        data: { thread: String(thread.id), content: md(c), author: nextCommenter(), project: projectId } as never,
        overrideAccess: true,
      })
    }
  }

  // Tasks (+ assignees)
  for (const task of p.tasks) {
    const created = await payload.create({
      collection: 'tasks',
      data: {
        title: task.title, description: task.description ? md(task.description) : undefined,
        status: task.status, priority: task.priority, labels: task.labels ?? [],
        visibility: task.visibility, visibilityTeams: task.teams ?? [],
        author: pmId, project: projectId,
      } as never,
      overrideAccess: true,
    })
    for (const email of task.assigneeEmails ?? []) {
      await payload.create({
        collection: 'task-assignees',
        data: { task: String(created.id), user: memberId(email) } as never,
        overrideAccess: true,
      })
    }
  }

  // Folders + files
  const folderId = new Map<string, string>()
  for (const name of p.folders) {
    const folder = await payload.create({
      collection: 'folders',
      data: { name, project: projectId, visibility: 'PROJECT', visibilityTeams: [] } as never,
      overrideAccess: true,
    })
    folderId.set(name, String(folder.id))
  }
  for (const f of p.files) {
    const filePath = f.source === 'pdf'
      ? path.join(ASSETS, 'dateien', 'urbankit-info.pdf')
      : ['.webp', '.jpg', '.jpeg', '.png'].map((e) => path.join(ASSETS, p.slug, `${f.source}${e}`)).find(existsSync)
    if (!filePath || !existsSync(filePath)) continue
    const data = await readFile(filePath)
    const ext = path.extname(filePath).toLowerCase()
    await payload.create({
      collection: 'file-uploads',
      data: {
        label: f.label, folder: f.folder ? folderId.get(f.folder) : undefined,
        visibility: f.visibility ?? 'PROJECT', visibilityTeams: f.teams ?? [],
        uploadedBy: pmId, project: projectId,
      } as never,
      file: {
        data, name: `${slugify(f.label)}${ext}`, size: data.length,
        mimetype: ext === '.pdf' ? 'application/pdf' : ext === '.webp' ? 'image/webp' : 'image/jpeg',
      },
      overrideAccess: true,
    })
  }

  // Board with premade sticky notes
  await payload.create({
    collection: 'board-canvases',
    data: { name: p.board.name, project: projectId, yjsState: boardState(p.board.notes) } as never,
    overrideAccess: true,
  })

  console.log(`        ${p.news.length} news, ${p.events.length} events, ${p.polls.length} polls, ${p.forum.length} threads, ${p.tasks.length} tasks, ${p.files.length} files, 1 board, ${memberEmails.length} members`)
}

// ── Landing-page hero defaults ──────────────────────────────────────────────
// Project covers (with the project title as caption) become the frontpage
// slideshow — only when the admin hasn't configured heroImages yet.
const settings = await payload.findGlobal({ slug: 'platform-settings', depth: 0, overrideAccess: true }).catch(() => null)
if (((settings as { heroImages?: unknown[] } | null)?.heroImages ?? []).length === 0) {
  const heroEntries: { image: string; caption: string }[] = []
  for (const p of PROJECTS) {
    const doc = (await payload.find({ collection: 'projects', where: { slug: { equals: p.slug } }, limit: 1, depth: 0, overrideAccess: true })).docs[0] as { coverImage?: unknown } | undefined
    const cover = doc?.coverImage
    if (cover) heroEntries.push({ image: String(typeof cover === 'object' ? (cover as { id: unknown }).id : cover), caption: p.title })
  }
  if (heroEntries.length) {
    await payload.updateGlobal({ slug: 'platform-settings', data: { heroImages: heroEntries } as never, overrideAccess: true })
    console.log(`hero    + ${heroEntries.length} cover(s) → platform-settings.heroImages`)
  }
}

console.log('Done.')
process.exit(0)
