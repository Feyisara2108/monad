export type ProfileRecord = {
  address: `0x${string}`
  username: string
  bio: string
  avatarURI: string
  postCount: number
  followerCount: number
  followingCount: number
  exists: boolean
}

export type CommentRecord = {
  author: `0x${string}`
  content: string
  createdAt: number
  profile?: ProfileRecord
}

export type FeedPost = {
  id: bigint
  author: `0x${string}`
  content: string
  mediaURI: string
  mediaType: number
  likeCount: number
  commentCount: number
  authorPostCount: number
  createdAt: number
  exists: boolean
  likedByViewer: boolean
  isFollowingAuthor: boolean
  profile?: ProfileRecord
  comments: CommentRecord[]
}

export type ActivityItem = {
  id: string
  type: 'like' | 'comment' | 'follow' | 'post'
  actor: `0x${string}`
  actorProfile?: ProfileRecord
  targetPostId?: bigint
  content?: string
  createdAt: number
}
