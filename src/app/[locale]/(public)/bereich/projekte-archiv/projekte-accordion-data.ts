import { FolderOpen, MapPin, Archive, type LucideIcon } from 'lucide-react'

export interface ProjekteFeature {
  icon: LucideIcon
  title: string
  body: string
}

export const PROJEKTE_FEATURES: ProjekteFeature[] = [
  {
    icon: FolderOpen,
    title: 'Projekte nachvollziehen',
    body: 'Sieh, was geplant ist, was entschieden wurde und wie sich Projekte entwickeln — vom ersten Entwurf bis zum Abschluss.',
  },
  {
    icon: MapPin,
    title: 'Filtern nach Thema & Ort',
    body: 'Finde schnell, was dich betrifft. In deinem Viertel oder zu einem bestimmten Thema.',
  },
  {
    icon: Archive,
    title: 'Archiv abgeschlossener Projekte',
    body: 'Auch beendete Projekte bleiben sichtbar — als Grundlage für spätere Entscheidungen und als Nachweis für Bürger:innen.',
  },
]
