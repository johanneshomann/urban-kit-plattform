import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { ModuleSection } from '@/components/platform/ModuleSection'
import { PARTICIPATE_MODULES, COLLABORATE_MODULES } from '@/lib/options/modules'
import { loadWorkspaceCards } from '@/lib/workspace-cards'
import { getWorkspaceContext } from '@/lib/workspace-context'

const P = {
  white: 'var(--project-white)',
  light: 'var(--project-light)',
  mid:   'var(--project-mid)',
  dark:  'var(--project-dark)',
} as const

// ─── page ─────────────────────────────────────────────────────────────────────
// The hero lives in the (workspace) layout; project info has its own subpage
// (./info). This page renders the module sections only.

export default async function ProjectDashboardPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const [tw, tax] = await Promise.all([
    getTranslations({ locale, namespace: 'projectWorkspace' }),
    getTranslations({ locale, namespace: 'taxonomy' }),
  ])

  // Shared with the layout via React.cache — one fetch per request
  const ctx = await getWorkspaceContext(slug)
  if (!ctx) notFound()
  const { project, modules, membershipId, savedOrder, isActiveMember } = ctx

  const payload = await getPayload({ config })

  // Content previews for the module cards (both sections)
  const cardData = await loadWorkspaceCards(payload, project.id, modules)

  // Build ordered module list: keep the user's saved order for active modules,
  // dropping stale entries for modules that were deactivated since it was saved.
  const savedActive = (savedOrder ?? []).filter((id) => modules.includes(id))
  const moduleOrder = savedActive.length === modules.length ? savedActive : modules

  // Partition into the two workspace sections, preserving the user's saved order.
  // Chat is excluded from both (it becomes a floating pop-up, not a card).
  const participateItems = moduleOrder.filter((id) => (PARTICIPATE_MODULES as readonly string[]).includes(id))
  const collaborateItems = moduleOrder.filter((id) => (COLLABORATE_MODULES as readonly string[]).includes(id))

  const themaList = (project.thema ?? []).filter(Boolean)

  return (
    <div
      className="p-6 md:p-8 flex flex-col gap-6"
      style={{
        background: P.light,
        minHeight: 'calc(100svh - 14rem)',
      }}
    >

      {/* thema tags */}
      {themaList.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {themaList.map((th) => (
            <span
              key={th}
              className="text-small px-2.5 py-0.5 rounded-full"
              style={{ background: P.white, border: `1px solid color-mix(in srgb, ${P.mid} 20%, transparent)`, color: P.dark, opacity: 0.8 }}
            >
              {tax(`thema.${th}`)}
            </span>
          ))}
        </div>
      )}

      {/* Mitmachen — always present (news + calendar guaranteed) */}
      <ModuleSection
        title={tw('sectionParticipate')}
        items={participateItems}
        fullOrder={moduleOrder}
        membershipId={membershipId}
        projectSlug={slug}
        locale={locale}
        {...cardData}
      />

      {/* Zusammen arbeiten — only for active members, only if non-empty */}
      {isActiveMember && collaborateItems.length > 0 && (
        <ModuleSection
          title={tw('sectionCollaborate')}
          items={collaborateItems}
          fullOrder={moduleOrder}
          membershipId={membershipId}
          projectSlug={slug}
          locale={locale}
          {...cardData}
        />
      )}

    </div>
  )
}
