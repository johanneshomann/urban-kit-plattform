import { FolderOpen, MapPin, Archive, type LucideIcon } from 'lucide-react'

export interface ProjekteFeature {
  icon: LucideIcon
  // Translation keys (namespace `projekteArchiv`), resolved at render time.
  titleKey: string
  bodyKey: string
}

export const PROJEKTE_FEATURES: ProjekteFeature[] = [
  { icon: FolderOpen, titleKey: 'featProjectsTitle', bodyKey: 'featProjectsBody' },
  { icon: MapPin, titleKey: 'featFilterTitle', bodyKey: 'featFilterBody' },
  { icon: Archive, titleKey: 'featArchiveTitle', bodyKey: 'featArchiveBody' },
]
