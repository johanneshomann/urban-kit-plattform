import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getWorkspaceContext } from '@/lib/workspace-context'
import { loadProjectActivity } from '@/lib/project-activity'
import { projectDefaults } from '@/lib/defaults/project'
import { PROJEKTPHASEN } from '@/lib/options/projektphasen'
import { ProjectHero } from '@/components/platform/ProjectHero'
import { RecentActivityCard } from '@/components/platform/RecentActivityCard'

/**
 * Workspace layout: owns the persistent project hero. Layouts survive
 * navigation within the segment, so the hero stays mounted while the page
 * content below (wrapped by template.tsx) fades between routes.
 * The manage area lives outside this group and keeps its own chrome.
 */
export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const ctx = await getWorkspaceContext(slug)
  if (!ctx) notFound()
  const { project, modules } = ctx

  const [tw, tax, payload] = await Promise.all([
    getTranslations({ locale, namespace: 'projectWorkspace' }),
    getTranslations({ locale, namespace: 'taxonomy' }),
    getPayload({ config }),
  ])
  const activity = await loadProjectActivity(payload, project.id, modules)

  const phase = PROJEKTPHASEN.find((p) => p.value === project.projektphase)
  const phaseLabel = phase ? tw('phaseLabel', { step: phase.step + 1, label: tax(`phase.${phase.value}`) }) : null

  return (
    <>
      <ProjectHero
        locale={locale}
        slug={slug}
        title={project.title}
        shortDescription={project.shortDescription ?? null}
        coverSrc={project.coverImage?.url ?? projectDefaults.coverImage}
        phaseLabel={phaseLabel}
        canManage={ctx.canManage}
        canRequestJoin={ctx.canRequestJoin}
        joinStatus={ctx.membershipStatus === 'requested' || ctx.membershipStatus === 'rejected' ? ctx.membershipStatus : null}
        activitySlot={
          <RecentActivityCard items={activity} locale={locale} moreHref={`/${locale}/dashboard/projekte/${slug}/m/news`} />
        }
      />
      {children}
    </>
  )
}
