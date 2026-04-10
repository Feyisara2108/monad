import type { PublicClient } from 'viem'
import {
  FEED_ENGINE_ABI,
  FEED_ENGINE_ADDRESS,
  PROFILE_REGISTRY_ABI,
  PROFILE_REGISTRY_ADDRESS,
} from '@/config/contracts'
import type { FeedPost, ProfileRecord } from '@/lib/types'

const ZERO_BIGINT = BigInt(0)
const COMMENT_PREVIEW_LIMIT = BigInt(3)
const FULL_COMMENT_LIMIT = BigInt(100)

export function mapProfile(address: `0x${string}`, value: any): ProfileRecord {
  return {
    address,
    username: value[0] ?? '',
    bio: value[1] ?? '',
    avatarURI: value[2] ?? '',
    postCount: Number(value[3] ?? ZERO_BIGINT),
    followerCount: Number(value[4] ?? ZERO_BIGINT),
    followingCount: Number(value[5] ?? ZERO_BIGINT),
    exists: Boolean(value[6]),
  }
}

export async function getProfile(publicClient: PublicClient, address: `0x${string}`) {
  const raw = await publicClient.readContract({
    address: PROFILE_REGISTRY_ADDRESS,
    abi: PROFILE_REGISTRY_ABI,
    functionName: 'profiles',
    args: [address],
  })

  return mapProfile(address, raw)
}

export async function getPostsByIds(
  publicClient: PublicClient,
  ids: bigint[],
  viewerAddress?: `0x${string}`,
  viewerHasProfile?: boolean
) {
  return getPostsByIdsWithCommentLimit(
    publicClient,
    ids,
    COMMENT_PREVIEW_LIMIT,
    viewerAddress,
    viewerHasProfile
  )
}

export async function getPostsByIdsWithCommentLimit(
  publicClient: PublicClient,
  ids: bigint[],
  commentLimit: bigint,
  viewerAddress?: `0x${string}`,
  viewerHasProfile?: boolean
) {
  const rawPosts = await Promise.all(
    ids.map((id) =>
      publicClient.readContract({
        address: FEED_ENGINE_ADDRESS,
        abi: FEED_ENGINE_ABI,
        functionName: 'posts',
        args: [id],
      })
    )
  )

  const authorAddresses = Array.from(
    new Set(rawPosts.map((entry: any) => entry[1] as `0x${string}`))
  )

  const profileEntries = await Promise.all(
    authorAddresses.map(async (authorAddress) => [
      authorAddress,
      await getProfile(publicClient, authorAddress),
    ])
  )

  const profileMap = new Map(profileEntries as Array<[`0x${string}`, ProfileRecord]>)

  return Promise.all(
    rawPosts.map(async (entry: any) => {
      const id = entry[0] as bigint
      const author = entry[1] as `0x${string}`
      const comments = (await publicClient.readContract({
        address: FEED_ENGINE_ADDRESS,
        abi: FEED_ENGINE_ABI,
        functionName: 'getComments',
        args: [id, ZERO_BIGINT, commentLimit],
      })) as Array<any>

      const commentProfiles = await Promise.all(
        comments.map(async (comment) => {
          const commentAuthor = comment.author as `0x${string}`
          if (profileMap.has(commentAuthor)) {
            return profileMap.get(commentAuthor)
          }

          const profile = await getProfile(publicClient, commentAuthor)
          profileMap.set(commentAuthor, profile)
          return profile
        })
      )

      const likedByViewer =
        viewerAddress && viewerHasProfile
          ? ((await publicClient.readContract({
              address: FEED_ENGINE_ADDRESS,
              abi: FEED_ENGINE_ABI,
              functionName: 'hasLiked',
              args: [id, viewerAddress],
            })) as boolean)
          : false

      const isFollowingAuthor =
        viewerAddress && author !== viewerAddress && viewerHasProfile
          ? ((await publicClient.readContract({
              address: PROFILE_REGISTRY_ADDRESS,
              abi: PROFILE_REGISTRY_ABI,
              functionName: 'isFollowing',
              args: [viewerAddress, author],
            })) as boolean)
          : false

      return {
        id,
        author,
        content: entry[2] ?? '',
        mediaURI: entry[3] ?? '',
        mediaType: Number(entry[4] ?? 0),
        likeCount: Number(entry[5] ?? ZERO_BIGINT),
        commentCount: Number(entry[6] ?? ZERO_BIGINT),
        authorPostCount: Number(entry[7] ?? ZERO_BIGINT),
        createdAt: Number(entry[8] ?? ZERO_BIGINT),
        exists: Boolean(entry[9]),
        likedByViewer,
        isFollowingAuthor,
        profile: profileMap.get(author),
        comments: comments.map((comment, index) => ({
          author: comment.author as `0x${string}`,
          content: comment.content as string,
          createdAt: Number(comment.createdAt ?? ZERO_BIGINT),
          profile: commentProfiles[index],
        })),
      } satisfies FeedPost
    })
  )
}

export async function getPostDetail(
  publicClient: PublicClient,
  postId: bigint,
  viewerAddress?: `0x${string}`,
  viewerHasProfile?: boolean
) {
  const [post] = await getPostsByIdsWithCommentLimit(
    publicClient,
    [postId],
    FULL_COMMENT_LIMIT,
    viewerAddress,
    viewerHasProfile
  )

  return post
}
