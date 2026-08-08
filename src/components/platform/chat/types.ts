type RoomType = 'project' | 'group' | 'dm'

export interface UserRef {
  id: string
  /** Null when unknown — render the localized fallback client-side. */
  name: string | null
  avatarUrl: string | null
}

/** Compact project reference with the two chameleon colors the UI renders. */
export interface ProjectChip {
  slug: string
  title: string
  light: string
  accent: string
}

export interface OverviewRoom {
  id: string
  type: RoomType
  /** Null for unnamed rooms/DMs — render the localized fallback client-side. */
  name: string | null
  role: 'owner' | 'member'
  status: 'active' | 'invited'
  /** Set for project rooms AND project-assigned groups. */
  project: ProjectChip | null
  /** DM partner incl. the projects shared with the viewer (the identity cue). */
  other: (UserRef & { sharedProjects?: { id: string; title: string; light: string; accent: string }[] }) | null
  /** Group rooms: active member count + owner display name. */
  memberCount?: number | null
  owner?: string | null
  lastMessageAt: string
  lastMessagePreview: string
  unread: number
}

export interface MessageDTO {
  id: string
  content: string
  author: UserRef
  attachment: { url: string; filename: string | null; mimeType: string | null } | null
  reactions: { emoji: string; count: number; mine: boolean }[]
  createdAt: string
}
