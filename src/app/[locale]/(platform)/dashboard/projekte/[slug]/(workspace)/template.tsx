'use client'

import { usePathname } from 'next/navigation'

/**
 * Replays the `.card-in` fade (globals.css — honors prefers-reduced-motion and
 * the a11y reduce-motion toggle) on the content below the persistent hero.
 * Keyed on the full pathname: a bare template only remounts when its immediate
 * child segment changes, which misses navigations within m/ (item → module
 * list). The key forces a remount — and thus the fade — on every route change.
 */
export default function WorkspaceTemplate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return <div key={pathname} className="card-in">{children}</div>
}
