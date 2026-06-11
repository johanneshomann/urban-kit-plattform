import { notFound } from 'next/navigation'
import { getProjectManagerContext } from '@/lib/auth/requireProjectManager'
import { ModuleForm } from '@/components/platform/manage/ModuleForm'

export default async function ManageModulePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const ctx = await getProjectManagerContext(slug)
  if (!ctx) notFound()

  const modules = (ctx.project.modules ?? ['news', 'calendar']).filter((m): m is string => typeof m === 'string')

  return <ModuleForm slug={slug} locale={locale} initialModules={modules} />
}
