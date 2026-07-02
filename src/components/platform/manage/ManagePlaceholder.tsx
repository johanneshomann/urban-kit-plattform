import { Construction } from 'lucide-react'
import { useTranslations } from 'next-intl'

/** Placeholder for manage sections that aren't built yet. */
export function ManagePlaceholder({ title, hint }: { title: string; hint?: string }) {
  const t = useTranslations('manage')
  return (
    <div className="max-w-2xl">
      <h1 className="text-display font-bold mb-2" style={{ color: 'var(--project-dark)' }}>{title}</h1>
      <div
        className="mt-6 flex items-center gap-3 rounded-xl px-5 py-4"
        style={{ background: 'var(--project-light)', color: 'var(--project-dark)' }}
      >
        <Construction className="w-5 h-5 shrink-0" style={{ opacity: 0.6 }} />
        <p className="text-text" style={{ opacity: 0.7 }}>{hint ?? t('placeholder.comingSoon')}</p>
      </div>
    </div>
  )
}
