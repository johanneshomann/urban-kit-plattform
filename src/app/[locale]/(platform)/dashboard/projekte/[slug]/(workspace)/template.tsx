'use client'

/**
 * Remounts on every navigation within the workspace group, replaying the
 * `.card-in` fade (globals.css — honors prefers-reduced-motion and the
 * a11y reduce-motion toggle) on the content below the persistent hero.
 */
export default function WorkspaceTemplate({ children }: { children: React.ReactNode }) {
  return <div className="card-in">{children}</div>
}
