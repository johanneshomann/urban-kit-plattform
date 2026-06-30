import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { getProjectManagerContext } from '@/lib/auth/requireProjectManager'
import { MODULE_LABELS, MODULE_ORDER, AUTHORABLE_MODULES } from '@/lib/options/modules'

export default async function ManageOverviewPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const ctx = await getProjectManagerContext(slug)
  if (!ctx) notFound()

  const manageBase = `/${locale}/dashboard/projekte/${slug}/manage`
  const enabled = (ctx.project.modules ?? ['news', 'calendar'])
    .filter((m): m is string => typeof m === 'string' && AUTHORABLE_MODULES.has(m))
    .sort((a, b) => MODULE_ORDER.indexOf(a as never) - MODULE_ORDER.indexOf(b as never))

  return (
    <div className="max-w-3xl">
      <p className="text-small font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--project-dark)', opacity: 0.5 }}>
        Verwalten
      </p>
      <h1 className="text-title font-bold leading-tight mb-2" style={{ color: 'var(--project-dark)' }}>
        {ctx.project.title}
      </h1>
      <p className="text-text mb-8" style={{ color: 'var(--project-dark)', opacity: 0.65 }}>
        Inhalte erstellen und das Projekt konfigurieren. Wähle links einen Bereich oder starte hier.
      </p>

      <h2 className="text-small font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--project-dark)', opacity: 0.45 }}>
        Inhalte
      </h2>
      <div className="grid sm:grid-cols-2 gap-3">
        {enabled.map((m) => {
          const authorable = AUTHORABLE_MODULES.has(m)
          return (
            <Link
              key={m}
              href={`${manageBase}/inhalte/${m}`}
              className="flex items-center justify-between rounded-xl px-4 py-3 transition-colors"
              style={{ background: 'var(--project-light)', color: 'var(--project-dark)' }}
            >
              <span className="font-medium">{MODULE_LABELS[m] ?? m}</span>
              <span className="flex items-center gap-2 text-small" style={{ opacity: 0.6 }}>
                {authorable ? 'Verwalten' : 'Bald'}
                <ChevronRight className="w-4 h-4" />
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
