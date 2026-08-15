// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import type { LucideIcon } from 'lucide-react'
import {
  Bike,
  BookOpen,
  Camera,
  Flower2,
  Heart,
  Leaf,
  Music,
  PawPrint,
  Rocket,
  Sparkles,
  Star,
  Sun,
} from 'lucide-react'

/**
 * Self-chosen profile badge icons — shown as a small overlay on the avatar.
 * Values mirror the `profileBadge` select options in the Users collection;
 * keep both lists in sync.
 */
export const PROFILE_BADGE_VALUES = [
  'star',
  'heart',
  'sparkles',
  'leaf',
  'sun',
  'flower',
  'rocket',
  'music',
  'camera',
  'book',
  'bike',
  'paw',
] as const

export type ProfileBadge = (typeof PROFILE_BADGE_VALUES)[number]

export const PROFILE_BADGE_ICONS: Record<ProfileBadge, LucideIcon> = {
  star: Star,
  heart: Heart,
  sparkles: Sparkles,
  leaf: Leaf,
  sun: Sun,
  flower: Flower2,
  rocket: Rocket,
  music: Music,
  camera: Camera,
  book: BookOpen,
  bike: Bike,
  paw: PawPrint,
}
