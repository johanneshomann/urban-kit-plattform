import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

// Locale-aware navigation primitives — use these instead of next/link and
// next/navigation so the active locale prefix is preserved on navigation.
export const { Link, redirect, useRouter, usePathname, getPathname } = createNavigation(routing)
