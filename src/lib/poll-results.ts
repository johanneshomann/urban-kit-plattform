import 'server-only'
import type { Payload } from 'payload'

export interface QuestionResult {
  id: string
  text: string
  type: string
  options: { id: string; text: string; count: number }[]
  textAnswers: string[]
  scale: { average: number; distribution: Record<number, number>; count: number } | null
  answerCount: number
}
export interface PollResults {
  participantCount: number
  questions: QuestionResult[]
}

const relId = (v: unknown): string | null => (v == null ? null : typeof v === 'object' ? String((v as { id: unknown }).id) : String(v))

/** Aggregate a poll's votes into per-question results. */
export async function computeResults(payload: Payload, pollId: string): Promise<PollResults> {
  const [questionsRes, optionsRes, votesRes] = await Promise.all([
    payload.find({ collection: 'poll-questions', where: { poll: { equals: pollId } }, sort: 'order', limit: 500, depth: 0, overrideAccess: true }),
    payload.find({ collection: 'poll-options', where: {}, limit: 2000, depth: 0, overrideAccess: true }),
    payload.find({ collection: 'poll-votes', where: { poll: { equals: pollId } }, limit: 100000, depth: 0, overrideAccess: true }),
  ])

  const identities = new Set<string>()
  for (const v of votesRes.docs) {
    const vv = v as { user?: unknown; sessionToken?: string }
    identities.add(relId(vv.user) ?? vv.sessionToken ?? 'anon')
  }

  const questions: QuestionResult[] = questionsRes.docs.map((q) => {
    const qq = q as { id: string | number; text: string; type: string }
    const qid = String(qq.id)
    const qVotes = votesRes.docs.filter((v) => relId((v as { question?: unknown }).question) === qid)
    const opts = optionsRes.docs.filter((o) => relId((o as { question?: unknown }).question) === qid)

    const options = opts.map((o) => {
      const oid = String((o as { id: unknown }).id)
      return { id: oid, text: String((o as { text?: string }).text ?? ''), count: qVotes.filter((v) => relId((v as { option?: unknown }).option) === oid).length }
    })

    const textAnswers = qq.type === 'text'
      ? qVotes.map((v) => String((v as { textAnswer?: string }).textAnswer ?? '').trim()).filter(Boolean)
      : []

    let scale: QuestionResult['scale'] = null
    if (qq.type === 'scale') {
      const nums = qVotes.map((v) => (v as { scaleAnswer?: number }).scaleAnswer).filter((n): n is number => typeof n === 'number')
      const distribution: Record<number, number> = {}
      for (const n of nums) distribution[n] = (distribution[n] ?? 0) + 1
      scale = { average: nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0, distribution, count: nums.length }
    }

    return { id: qid, text: qq.text, type: qq.type, options, textAnswers, scale, answerCount: qVotes.length }
  })

  return { participantCount: identities.size, questions }
}
