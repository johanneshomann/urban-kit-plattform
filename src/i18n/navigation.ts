import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

// Locale-aware navigation hooks — use these instead of next/navigation so the
// active locale prefix is preserved on client-side navigation.
export const { useRouter, usePathname } = createNavigation(routing)
