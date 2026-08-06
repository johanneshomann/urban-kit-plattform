# Implementation Plan

Implement a dynamic page-slide transition on the dashboard so that clicking "Go to project space" or "Manage project" slides the current page content to the left while the project page slides in from the right. Navigating back to the dashboard reverses the direction (slide in from left).

The transition is purely visual — the App Router handles all data fetching and state. The approach uses a client-side wrapper that detects navigation direction from the pathname and applies the existing CSS slide animations (`animate-slide-left` / `animate-slide-right`). The project sidebar fades in independently via `card-in`, while only the content area slides.

[Types]

No new types needed. The existing `NotificationItem` type in `dashboard/layout.tsx` is unchanged.

[Files]

**New files to create:**

1. `src/components/platform/DashboardTransition.tsx`
   - Client component wrapping the dashboard layout's children
   - Uses `usePathname()` and `useRef` to detect forward/backward navigation
   - Forward: pathname goes from `/dashboard` to `/dashboard/projekte/*` → applies `animate-slide-left` (slide in from right)
   - Backward: pathname goes from `/dashboard/projekte/*` to `/dashboard` → applies `animate-slide-right` (slide in from left)
   - Same-page navigations (e.g. workspace → manage) → no animation (handled by existing `card-in` in workspace template)
   - Uses a `key` on the wrapper div to force remount on each navigation, triggering the CSS animation
   - Includes `overflow-hidden` on the outer container to prevent horizontal scrollbars during the slide

**Existing files to modify:**

1. `src/app/[locale]/(platform)/dashboard/layout.tsx`
   - Import `DashboardTransition`
   - Wrap the `<DashboardShell>` children (or the `<main>` content) with `DashboardTransition`
   - The PlatformDock stays outside the transition wrapper (it should not slide)

2. `src/app/[locale]/(platform)/dashboard/projekte/[slug]/layout.tsx`
   - Add `card-in` animation class to the sidebar container so it fades in when the project layout mounts
   - The sidebar is the `<ProjectSidebar>` wrapper — add `card-in` with a slight delay so it loads after the content slide starts
   - The content area already gets `card-in` from the workspace template; for the manage area, add `card-in` to the manage layout

3. `src/app/[locale]/(platform)/dashboard/projekte/[slug]/manage/layout.tsx`
   - Add `card-in` animation class to the wrapper div so the manage area fades in consistently

[Functions]

**New functions:**

1. `DashboardTransition` (component, `src/components/platform/DashboardTransition.tsx`)
   - `props: { children: React.ReactNode }`
   - Uses `usePathname()` to detect route changes
   - Uses `useRef` to track the previous pathname
   - Uses `useState` to track animation direction (`'left' | 'right' | null`)
   - On pathname change, determines direction and sets animation class
   - Renders `<div className="overflow-hidden">` containing `<div className={animClass}>` with `key={animKey}`
   - `animClass` is `'animate-slide-left'` (forward) or `'animate-slide-right'` (backward)
   - No animation for same-level navigations (e.g. workspace → manage within same project)

[Classes]

No new classes. The existing CSS animation classes are used:
- `animate-slide-left` — slides in from right (for forward navigation to project)
- `animate-slide-right` — slides in from left (for backward navigation to dashboard)
- `card-in` — fades in + slides up 10px (for sidebar and content area within project)

[Dependencies]

No new dependencies.

[Testing]

1. Navigate from dashboard to a project workspace by clicking "Projektraum öffnen" — verify the content slides in from the right and the sidebar fades in separately
2. Navigate from dashboard to manage area by clicking "Projekt verwalten" — verify the same slide effect
3. Navigate back to dashboard using browser back or dashboard nav link — verify the dashboard slides in from the left
4. Navigate between workspace modules (e.g. info → news) — verify no horizontal slide, only the existing `card-in` animation
5. Verify `prefers-reduced-motion` is respected (the existing `@media (prefers-reduced-motion: reduce)` block disables all animations)
6. Verify the PlatformDock and AccessibilityFAB stay fixed during transitions

[Implementation Order]

1. Create `DashboardTransition.tsx`
2. Modify `dashboard/layout.tsx` to wrap content with `DashboardTransition`
3. Modify `[slug]/layout.tsx` to add `card-in` to the sidebar
4. Modify `manage/layout.tsx` to add `card-in` to the manage area