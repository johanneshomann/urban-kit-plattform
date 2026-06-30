import 'server-only'
import { lexicalToMarkdown } from '@/lib/richtext'
import type { NewsPost, CalendarEvent, Poll, Project } from '@/payload-types'

/**
 * Turns the assembled project context into a plain-text briefing for the LLM.
 *
 * GDPR note: we deliberately exclude all personal data — author names, member
 * lists, e-mail addresses, votes. Only project content the viewer may already
 * see (titles, descriptions, dates, locations) is forwarded to the provider.
 */

const fmtDate = (iso?: string | null): string => {
  if (!iso) return ''
  try {
    return new Intl.DateTimeFormat('de-DE', { dateStyle: 'long' }).format(new Date(iso))
  } catch {
    return String(iso).slice(0, 10)
  }
}

const truncate = (s: string, max = 600): string => (s.length > max ? `${s.slice(0, max)}…` : s)

export async function buildContextText(ctx: {
  project: Project | null
  news: NewsPost[]
  events: CalendarEvent[]
  polls: Poll[]
}): Promise<string> {
  const parts: string[] = []

  if (ctx.project) {
    const p = ctx.project
    const head = [`# Projekt: ${p.title}`]
    if (p.shortDescription) head.push(p.shortDescription)
    const body = await lexicalToMarkdown(p.projektbeschreibung)
    if (body) head.push(truncate(body, 1500))
    if (p.status) head.push(`Status: ${p.status}`)
    if (p.projektphase) head.push(`Phase: ${p.projektphase}`)
    parts.push(head.join('\n'))
  }

  if (ctx.news.length) {
    const items = await Promise.all(
      ctx.news.map(async (n) => {
        const body = await lexicalToMarkdown(n.content)
        const date = fmtDate(n.publishedAt)
        return `- ${n.title}${date ? ` (${date})` : ''}${body ? `: ${truncate(body)}` : ''}`
      }),
    )
    parts.push(`# Neuigkeiten\n${items.join('\n')}`)
  }

  if (ctx.events.length) {
    const items = await Promise.all(
      ctx.events.map(async (e) => {
        const body = await lexicalToMarkdown(e.content)
        const when = fmtDate(e.startDate) + (e.endDate && e.endDate !== e.startDate ? ` – ${fmtDate(e.endDate)}` : '')
        const loc = e.location ? `, Ort: ${e.location}` : ''
        return `- ${e.title} (${when}${loc})${body ? `: ${truncate(body, 300)}` : ''}`
      }),
    )
    parts.push(`# Termine\n${items.join('\n')}`)
  }

  if (ctx.polls.length) {
    const items = ctx.polls.map((q) => {
      const status = q.status === 'active' ? 'läuft' : q.status === 'closed' ? 'beendet' : 'Entwurf'
      const closes = q.closesAt ? `, endet ${fmtDate(q.closesAt)}` : ''
      return `- ${q.title} (${status}${closes})${q.description ? `: ${truncate(q.description, 300)}` : ''}`
    })
    parts.push(`# Umfragen\n${items.join('\n')}`)
  }

  return parts.join('\n\n').trim()
}

export const URBAN_AGENT_SYSTEM_PROMPT = `Sie sind der Urban-Agent, ein hilfreicher Assistent für eine Bürgerbeteiligungsplattform.
Sie beantworten Fragen ausschließlich auf Grundlage der unten bereitgestellten Projektinformationen.

Regeln:
- Antworten Sie in formeller, höflicher Sprache (Sie-Form) und auf Deutsch, sofern die Frage nicht auf Englisch gestellt wird.
- Stützen Sie sich nur auf die bereitgestellten Projektinhalte. Erfinden Sie keine Termine, Beschlüsse oder Fakten.
- Wenn die Information nicht im Kontext enthalten ist, sagen Sie das offen und verweisen Sie ggf. auf die Projektverantwortlichen.
- Geben Sie niemals personenbezogene Daten preis und spekulieren Sie nicht über einzelne Teilnehmende.
- Fassen Sie sich kurz und konkret.`
