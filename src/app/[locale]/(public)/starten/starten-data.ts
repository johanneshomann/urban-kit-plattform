import { UserRound, Building2, Trash2, Search, FileText, UserPlus, Layers, Library, CheckCircle, type LucideIcon } from 'lucide-react'

export interface Feature {
  icon: LucideIcon
  // Translation keys (namespace `starten`), resolved at render time.
  titleKey: string
  bodyKey: string
}

export const STEP_FEATURES: Feature[][] = [
  [
    { icon: UserRound, titleKey: 'featAnonTitle', bodyKey: 'featAnonBody' },
    { icon: Building2, titleKey: 'featAppmoTitle', bodyKey: 'featAppmoBody' },
    { icon: Trash2, titleKey: 'featDeleteTitle', bodyKey: 'featDeleteBody' },
  ],
  [
    { icon: Search, titleKey: 'featSearchTitle', bodyKey: 'featSearchBody' },
    { icon: FileText, titleKey: 'featContextTitle', bodyKey: 'featContextBody' },
    { icon: UserPlus, titleKey: 'featJoinTitle', bodyKey: 'featJoinBody' },
  ],
  [
    { icon: Layers, titleKey: 'featModulesTitle', bodyKey: 'featModulesBody' },
    { icon: Library, titleKey: 'featBasicsTitle', bodyKey: 'featBasicsBody' },
    { icon: CheckCircle, titleKey: 'featResultTitle', bodyKey: 'featResultBody' },
  ],
]
