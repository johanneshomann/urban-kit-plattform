import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import { getProjectManagerContext } from '@/lib/auth/requireProjectManager'
import { DEFAULT_PROJEKTPHASE } from '@/lib/options/projektphasen'
import { lexicalToMarkdown } from '@/lib/richtext'
import { AllgemeinForm, type AllgemeinInitial, type MemberOption } from '@/components/platform/manage/AllgemeinForm'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function memberName(u: any): string {
  const name = [u?.firstName, u?.lastName].filter(Boolean).join(' ').trim()
  return name || u?.email || 'Unbekannt'
}

export default async function ManageAllgemeinPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const ctx = await getProjectManagerContext(slug)
  if (!ctx) notFound()

  const payload = await getPayload({ config })
  const project = await payload.findByID({ collection: 'projects', id: ctx.project.id, depth: 0, overrideAccess: true })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = project as any

  const [projektbeschreibung, beteiligungsvorhaben, membersRes] = await Promise.all([
    lexicalToMarkdown(p.projektbeschreibung),
    lexicalToMarkdown(p.beteiligungsvorhaben),
    payload.find({
      collection: 'project-memberships',
      where: { and: [{ project: { equals: ctx.project.id } }, { status: { equals: 'active' } }] },
      depth: 1,
      limit: 200,
      overrideAccess: true,
    }),
  ])

  const seen = new Set<string>()
  const members: MemberOption[] = []
  for (const m of membersRes.docs) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const u = (m as any).user
    const id = u && typeof u === 'object' ? String(u.id) : u ? String(u) : null
    if (!id || seen.has(id)) continue
    seen.add(id)
    members.push({ id, name: u && typeof u === 'object' ? memberName(u) : id })
  }

  const ansprechpersonId = p.ansprechperson && typeof p.ansprechperson === 'object'
    ? String(p.ansprechperson.id)
    : p.ansprechperson ? String(p.ansprechperson) : ''

  const initial: AllgemeinInitial = {
    title: p.title ?? '',
    shortDescription: p.shortDescription ?? '',
    startYear: typeof p.startYear === 'number' ? p.startYear : null,
    projektphase: p.projektphase ?? DEFAULT_PROJEKTPHASE,
    thema: Array.isArray(p.thema) ? p.thema : [],
    stadtbereich: Array.isArray(p.stadtbereich) ? p.stadtbereich : [],
    altersgruppe: Array.isArray(p.altersgruppe) ? p.altersgruppe : [],
    gender: Array.isArray(p.gender) ? p.gender : [],
    kontakt: {
      email: p.kontakt?.email ?? '',
      telefon: p.kontakt?.telefon ?? '',
      website: p.kontakt?.website ?? '',
    },
    projektbeschreibung,
    beteiligungsvorhaben,
    ansprechperson: ansprechpersonId,
  }

  return <AllgemeinForm slug={slug} locale={locale} initial={initial} members={members} />
}
