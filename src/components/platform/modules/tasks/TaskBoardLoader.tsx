import { getPayload } from 'payload'
import config from '@payload-config'
import { lexicalToMarkdown } from '@/lib/richtext'
import { TaskBoard, type TaskCardData, type TaskMember } from './TaskBoard'

const relId = (v: unknown): string | null => (v == null ? null : typeof v === 'object' ? String((v as { id: unknown }).id) : String(v))
function personName(u: unknown): string {
  if (!u || typeof u !== 'object') return 'Unbekannt'
  const o = u as { firstName?: string; lastName?: string; email?: string }
  return [o.firstName, o.lastName].filter(Boolean).join(' ').trim() || o.email || 'Unbekannt'
}

/** Loads the project's tasks, assignees and members, then renders the kanban board. */
export async function TaskBoardLoader({ slug, locale, projectId, userId }: { slug: string; locale: string; projectId: string; userId: string }) {
  const payload = await getPayload({ config })

  const [tasksRes, membersRes] = await Promise.all([
    payload.find({ collection: 'tasks', where: { project: { equals: projectId } }, sort: '-createdAt', limit: 500, depth: 0, overrideAccess: true }),
    payload.find({ collection: 'project-memberships', where: { and: [{ project: { equals: projectId } }, { status: { equals: 'active' } }] }, depth: 1, limit: 200, overrideAccess: true }),
  ])
  const taskIds = tasksRes.docs.map((t) => (t as { id: string | number }).id)
  const assigneesRes = taskIds.length
    ? await payload.find({ collection: 'task-assignees', where: { task: { in: taskIds } }, depth: 1, limit: 100000, overrideAccess: true })
    : { docs: [] as unknown[] }

  // members for the picker + current user's PM status
  const members: TaskMember[] = []
  const seen = new Set<string>()
  let isPM = false
  for (const m of membersRes.docs) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mm = m as any
    const u = mm.user
    const uid = u && typeof u === 'object' ? String(u.id) : u ? String(u) : null
    if (!uid) continue
    if (uid === userId && mm.role === 'PM') isPM = true
    if (!seen.has(uid)) { seen.add(uid); members.push({ id: uid, name: u && typeof u === 'object' ? personName(u) : uid }) }
  }

  // assignees per task
  const assigneesByTask = new Map<string, TaskMember[]>()
  const myTasks = new Set<string>()
  for (const a of assigneesRes.docs) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const aa = a as any
    const th = relId(aa.task); const u = aa.user
    if (!th) continue
    const uid = u && typeof u === 'object' ? String(u.id) : u ? String(u) : null
    const arr = assigneesByTask.get(th) ?? []
    if (uid) arr.push({ id: uid, name: u && typeof u === 'object' ? personName(u) : uid })
    assigneesByTask.set(th, arr)
    if (uid === userId) myTasks.add(th)
  }

  const tasks: TaskCardData[] = await Promise.all(
    tasksRes.docs.map(async (doc) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const t = doc as any
      const id = String(t.id)
      return {
        id,
        title: t.title ?? '',
        description: await lexicalToMarkdown(t.description),
        status: t.status ?? 'todo',
        priority: t.priority ?? 'medium',
        deadline: t.deadline ? String(t.deadline).slice(0, 10) : null,
        labels: Array.isArray(t.labels) ? t.labels : [],
        assignees: assigneesByTask.get(id) ?? [],
        canMove: isPM || myTasks.has(id),
      }
    }),
  )

  return <TaskBoard slug={slug} locale={locale} tasks={tasks} members={members} isPM={isPM} />
}
