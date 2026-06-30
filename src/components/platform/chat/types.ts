export type RoomType = 'project' | 'group' | 'dm'

export interface UserRef {
  id: string
  name: string
  avatarUrl: string | null
}

export interface OverviewRoom {
  id: string
  type: RoomType
  name: string
  role: 'owner' | 'member'
  status: 'active' | 'invited'
  project: { slug: string; title: string } | null
  other: UserRef | null
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
