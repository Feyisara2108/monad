'use client';

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Search } from 'lucide-react'
import { useAccount, usePublicClient, useReadContract, useWatchContractEvent } from 'wagmi'
import { AppShell } from '@/components/AppShell'
import { ComposeBox } from '@/components/ComposeBox'
import { PostCard } from '@/components/PostCard'
import { ProfileForm } from '@/components/ProfileForm'
import {
  FEED_ENGINE_ABI,
  FEED_ENGINE_ADDRESS,
  PROFILE_REGISTRY_ABI,
  PROFILE_REGISTRY_ADDRESS,
  isContractsConfigured,
} from '@/config/contracts'
import type { ActivityItem, FeedPost, ProfileRecord } from '@/lib/types'
import { extractTags, formatAddress, getInitials, includesText, resolveIpfsUrl } from '@/lib/utils'

const FEED_LIMIT = BigInt(18)
const ZERO_BIGINT = BigInt(0)
const COMMENT_PREVIEW_LIMIT = BigInt(3)
const SAVED_POSTS_STORAGE_KEY = 'pulse:saved-posts'

type FeedTab = 'latest' | 'following' | 'my-posts' | 'saved'

function mapProfile(address: `0x${string}`, value: any): ProfileRecord {
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

export default function HomePage() {
  const publicClient = usePublicClient()
  const { address, isConnected, chain } = useAccount()

  const [mounted, setMounted] = useState(false)
  const [loadingFeed, setLoadingFeed] = useState(true)
  const [refreshIndex, setRefreshIndex] = useState(0)
  const [feed, setFeed] = useState<FeedPost[]>([])
  const [status, setStatus] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [feedTab, setFeedTab] = useState<FeedTab>('latest')
  const [savedPostIds, setSavedPostIds] = useState<string[]>([])
  const [activity, setActivity] = useState<ActivityItem[]>([])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const saved = window.localStorage.getItem(SAVED_POSTS_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          setSavedPostIds(parsed)
        }
      }
    } catch {
      return
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(SAVED_POSTS_STORAGE_KEY, JSON.stringify(savedPostIds))
  }, [savedPostIds])

  const {
    data: viewerProfileRaw,
    refetch: refetchViewerProfile,
    isLoading: isProfileLoading,
  } = useReadContract({
    address: PROFILE_REGISTRY_ADDRESS,
    abi: PROFILE_REGISTRY_ABI,
    functionName: 'profiles',
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address) && isContractsConfigured,
    },
  })

  const viewerProfile = useMemo(
    () =>
      address && viewerProfileRaw
        ? mapProfile(address, viewerProfileRaw)
        : undefined,
    [address, viewerProfileRaw]
  )

  const canInteract = Boolean(isConnected && viewerProfile?.exists)

  const refreshAll = useCallback(() => {
    setRefreshIndex((value) => value + 1)
    refetchViewerProfile()
  }, [refetchViewerProfile])

  const loadFeed = useCallback(async () => {
    if (!publicClient || !isContractsConfigured) {
      setLoadingFeed(false)
      setFeed([])
      return
    }

    setLoadingFeed(true)
    setStatus('')

    try {
      const ids = (await publicClient.readContract({
        address: FEED_ENGINE_ADDRESS,
        abi: FEED_ENGINE_ABI,
        functionName: 'getRecentPostIds',
        args: [ZERO_BIGINT, FEED_LIMIT],
      })) as bigint[]

      if (!ids.length) {
        setFeed([])
        setLoadingFeed(false)
        return
      }

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
          mapProfile(
            authorAddress,
            await publicClient.readContract({
              address: PROFILE_REGISTRY_ADDRESS,
              abi: PROFILE_REGISTRY_ABI,
              functionName: 'profiles',
              args: [authorAddress],
            })
          ),
        ])
      )

      const profileMap = new Map(profileEntries as Array<[`0x${string}`, ProfileRecord]>)

      const mapped = await Promise.all(
        rawPosts.map(async (entry: any) => {
          const id = entry[0] as bigint
          const author = entry[1] as `0x${string}`
          const comments = (await publicClient.readContract({
            address: FEED_ENGINE_ADDRESS,
            abi: FEED_ENGINE_ABI,
            functionName: 'getComments',
            args: [id, ZERO_BIGINT, COMMENT_PREVIEW_LIMIT],
          })) as Array<any>

          const commentProfiles = await Promise.all(
            comments.map(async (comment) => {
              const commentAuthor = comment.author as `0x${string}`
              if (profileMap.has(commentAuthor)) {
                return profileMap.get(commentAuthor)
              }
              const profile = mapProfile(
                commentAuthor,
                await publicClient.readContract({
                  address: PROFILE_REGISTRY_ADDRESS,
                  abi: PROFILE_REGISTRY_ABI,
                  functionName: 'profiles',
                  args: [commentAuthor],
                })
              )
              profileMap.set(commentAuthor, profile)
              return profile
            })
          )

          const likedByViewer =
            address && viewerProfile?.exists
              ? ((await publicClient.readContract({
                  address: FEED_ENGINE_ADDRESS,
                  abi: FEED_ENGINE_ABI,
                  functionName: 'hasLiked',
                  args: [id, address],
                })) as boolean)
              : false

          const isFollowingAuthor =
            address && author !== address && viewerProfile?.exists
              ? ((await publicClient.readContract({
                  address: PROFILE_REGISTRY_ADDRESS,
                  abi: PROFILE_REGISTRY_ABI,
                  functionName: 'isFollowing',
                  args: [address, author],
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

      setFeed(mapped)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to load feed.')
    } finally {
      setLoadingFeed(false)
    }
  }, [address, publicClient, viewerProfile?.exists])

  useEffect(() => {
    void loadFeed()
  }, [loadFeed, refreshIndex])

  useWatchContractEvent({
    address: FEED_ENGINE_ADDRESS,
    abi: FEED_ENGINE_ABI,
    eventName: 'PostCreated',
    onLogs(logs) {
      setActivity((current) => [
        ...logs.map((log: any) => ({
          id: `post-${log.transactionHash}-${log.logIndex}`,
          type: 'post' as const,
          actor: log.args.author as `0x${string}`,
          targetPostId: log.args.postId as bigint,
          content: log.args.content as string,
          createdAt: Math.floor(Date.now() / 1000),
        })),
        ...current,
      ].slice(0, 25))
      refreshAll()
    },
  })

  useWatchContractEvent({
    address: FEED_ENGINE_ADDRESS,
    abi: FEED_ENGINE_ABI,
    eventName: 'PostLikeToggled',
    onLogs(logs) {
      setActivity((current) => [
        ...logs.map((log: any) => ({
          id: `like-${log.transactionHash}-${log.logIndex}`,
          type: 'like' as const,
          actor: log.args.user as `0x${string}`,
          targetPostId: log.args.postId as bigint,
          createdAt: Math.floor(Date.now() / 1000),
        })),
        ...current,
      ].slice(0, 25))
      refreshAll()
    },
  })

  useWatchContractEvent({
    address: FEED_ENGINE_ADDRESS,
    abi: FEED_ENGINE_ABI,
    eventName: 'CommentCreated',
    onLogs(logs) {
      setActivity((current) => [
        ...logs.map((log: any) => ({
          id: `comment-${log.transactionHash}-${log.logIndex}`,
          type: 'comment' as const,
          actor: log.args.author as `0x${string}`,
          targetPostId: log.args.postId as bigint,
          content: log.args.content as string,
          createdAt: Math.floor(Date.now() / 1000),
        })),
        ...current,
      ].slice(0, 25))
      refreshAll()
    },
  })

  useWatchContractEvent({
    address: PROFILE_REGISTRY_ADDRESS,
    abi: PROFILE_REGISTRY_ABI,
    eventName: 'ProfileCreated',
    onLogs() {
      refreshAll()
    },
  })

  useWatchContractEvent({
    address: PROFILE_REGISTRY_ADDRESS,
    abi: PROFILE_REGISTRY_ABI,
    eventName: 'ProfileUpdated',
    onLogs() {
      refreshAll()
    },
  })

  useWatchContractEvent({
    address: PROFILE_REGISTRY_ADDRESS,
    abi: PROFILE_REGISTRY_ABI,
    eventName: 'Followed',
    onLogs(logs) {
      setActivity((current) => [
        ...logs.map((log: any) => ({
          id: `follow-${log.transactionHash}-${log.logIndex}`,
          type: 'follow' as const,
          actor: log.args.follower as `0x${string}`,
          createdAt: Math.floor(Date.now() / 1000),
        })),
        ...current,
      ].slice(0, 25))
      refreshAll()
    },
  })

  useWatchContractEvent({
    address: PROFILE_REGISTRY_ADDRESS,
    abi: PROFILE_REGISTRY_ABI,
    eventName: 'Unfollowed',
    onLogs() {
      refreshAll()
    },
  })

  const feedTags = useMemo(() => extractTags(feed), [feed])
  const savedPostIdSet = useMemo(() => new Set(savedPostIds), [savedPostIds])
  const featuredCreators = useMemo(
    () =>
      feed
        .map((post) => post.profile)
        .filter((profile): profile is ProfileRecord => Boolean(profile?.exists))
        .slice(0, 4),
    [feed]
  )
  const searchFilteredFeed = useMemo(
    () =>
      feed.filter((post) => {
        if (!searchQuery.trim()) return true

        return (
          includesText(post.content, searchQuery) ||
          includesText(post.profile?.username || '', searchQuery) ||
          includesText(post.profile?.bio || '', searchQuery)
        )
      }),
    [feed, searchQuery]
  )
  const visibleFeed = useMemo(() => {
    switch (feedTab) {
      case 'following':
        return searchFilteredFeed.filter((post) => post.isFollowingAuthor || post.author === address)
      case 'my-posts':
        return searchFilteredFeed.filter((post) => post.author === address)
      case 'saved':
        return searchFilteredFeed.filter((post) => savedPostIdSet.has(post.id.toString()))
      case 'latest':
      default:
        return searchFilteredFeed
    }
  }, [address, feedTab, savedPostIdSet, searchFilteredFeed])
  const activityWithProfiles = useMemo(
    () =>
      activity.map((item) => ({
        ...item,
        actorProfile: feed.find((post) => post.author === item.actor)?.profile,
      })),
    [activity, feed]
  )
  const activeFeedSummary = useMemo(() => {
    switch (feedTab) {
      case 'following':
        return 'Posts from creators you follow.'
      case 'my-posts':
        return 'Everything you have published.'
      case 'saved':
        return 'Your saved collection lives locally in this browser.'
      case 'latest':
      default:
        return 'The freshest onchain posts across Pulse.'
    }
  }, [feedTab])

  const toggleSavedPost = useCallback((postId: bigint) => {
    setSavedPostIds((current) => {
      const key = postId.toString()
      return current.includes(key) ? current.filter((item) => item !== key) : [key, ...current]
    })
  }, [])

  if (!mounted) return null

  const topNotice = !isContractsConfigured ? (
    <section className="surface-card rounded-[24px] border border-[color:var(--shell-border)] px-5 py-4 text-sm text-[color:var(--copy-soft)]">
      Add `NEXT_PUBLIC_PROFILE_REGISTRY_ADDRESS`, `NEXT_PUBLIC_FEED_ENGINE_ADDRESS`, `NEXT_PUBLIC_SEPOLIA_RPC_URL`, and `PINATA_JWT` before using the app.
    </section>
  ) : isConnected && chain && chain.id !== 11155111 && chain.id !== 10143 ? (
    <section className="surface-card rounded-[24px] border border-[color:var(--shell-border)] px-5 py-4 text-sm text-[color:var(--copy-soft)]">
      Pulse is configured for Sepolia first. If you switch chains, make sure your frontend env contract addresses match that chain.
    </section>
  ) : undefined

  return (
    <AppShell
      topNotice={topNotice}
      rightAside={
        <>
          <section className="surface-card rounded-[30px] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--accent-strong)]">Your profile</p>
            {viewerProfile?.exists ? (
              <div className="mt-4">
                <div className="flex items-center gap-4">
                  {viewerProfile.avatarURI ? (
                    <img
                      src={resolveIpfsUrl(viewerProfile.avatarURI)}
                      alt={viewerProfile.username}
                      className="h-16 w-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(145deg,#ff9076,#ffd39b)] text-lg font-semibold text-[#43271c]">
                      {getInitials(viewerProfile.username, address)}
                    </div>
                  )}
                  <div>
                    <Link href={address ? `/profile/${address}` : '/'} className="text-xl font-semibold text-[color:var(--copy-main)] transition hover:text-[#ff6b57]">
                      {viewerProfile.username || formatAddress(address)}
                    </Link>
                    <p className="mt-1 text-sm text-[color:var(--muted-copy)]">{address ? formatAddress(address) : 'No wallet connected'}</p>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-6 text-[color:var(--copy-soft)]">
                  {viewerProfile.bio || 'Add a bio from the profile editor to personalize your presence.'}
                </p>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  {[
                    { label: 'Posts', value: viewerProfile.postCount },
                    { label: 'Followers', value: viewerProfile.followerCount },
                    { label: 'Following', value: viewerProfile.followingCount },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-2xl bg-[color:var(--shell-muted)] px-4 py-3 text-center">
                      <p className="text-lg font-semibold text-[color:var(--copy-main)]">{stat.value}</p>
                      <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted-copy)]">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-[color:var(--copy-soft)]">
                Connect a wallet and create a profile to unlock posting, following, likes, and comments.
              </p>
            )}
          </section>

          <section className="surface-card rounded-[30px] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--accent-strong)]">Trending tags</p>
            <div className="mt-4 space-y-3">
              {feedTags.length === 0 ? (
                <p className="text-sm text-[color:var(--copy-soft)]">Hashtags will appear here once creators start posting.</p>
              ) : (
                feedTags.map(([tag, count]) => (
                  <div key={tag} className="rounded-2xl bg-[color:var(--shell-muted)] px-4 py-3">
                    <p className="font-semibold text-[color:var(--copy-main)]">{tag}</p>
                    <p className="mt-1 text-sm text-[color:var(--muted-copy)]">{count} posts mentioning it</p>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="surface-card rounded-[30px] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--accent-strong)]">Featured creators</p>
            <div className="mt-4 space-y-3">
              {featuredCreators.length === 0 ? (
                <p className="text-sm text-[color:var(--copy-soft)]">Creator highlights will show up once the feed becomes active.</p>
              ) : (
                featuredCreators.map((profile) => (
                  <Link
                    key={`${profile.address}-${profile.username}`}
                    href={`/profile/${profile.address}`}
                    className="flex items-center gap-3 rounded-2xl bg-[color:var(--shell-muted)] px-4 py-3 transition hover:bg-[color:var(--shell-muted-strong)]"
                  >
                    {profile.avatarURI ? (
                      <img
                        src={resolveIpfsUrl(profile.avatarURI)}
                        alt={profile.username}
                        className="h-11 w-11 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(145deg,#ff9076,#ffd39b)] text-sm font-semibold text-[#41281e]">
                        {getInitials(profile.username, profile.address)}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-[color:var(--copy-main)]">{profile.username}</p>
                      <p className="text-sm text-[color:var(--muted-copy)]">{profile.postCount} posts</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>

          <section className="surface-card rounded-[30px] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--accent-strong)]">Activity</p>
            <div className="mt-4 space-y-3">
              {activityWithProfiles.length === 0 ? (
                <p className="text-sm text-[color:var(--copy-soft)]">New likes, comments, follows, and posts will appear here while you use the app.</p>
              ) : (
                activityWithProfiles.slice(0, 8).map((item) => {
                  const actorName = item.actorProfile?.username || formatAddress(item.actor)
                  const line =
                    item.type === 'like'
                      ? `${actorName} liked a post`
                      : item.type === 'comment'
                        ? `${actorName} commented: ${item.content}`
                        : item.type === 'follow'
                          ? `${actorName} followed someone`
                          : `${actorName} created a new post`

                  return (
                    <div key={item.id} className="rounded-2xl bg-[color:var(--shell-muted)] px-4 py-3">
                      <p className="text-sm font-medium leading-6 text-[color:var(--copy-main)]">{line}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.22em] text-[color:var(--muted-copy)]">
                        {new Date(item.createdAt * 1000).toLocaleTimeString()}
                      </p>
                    </div>
                  )
                })
              )}
            </div>
          </section>

          {status ? (
            <section className="surface-card rounded-[30px] p-5">
              <p className="text-sm text-[color:var(--copy-soft)]">{status}</p>
            </section>
          ) : null}
        </>
      }
    >
      <section className="surface-card overflow-hidden rounded-[34px] p-6 sm:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[color:var(--accent-strong)]">Pulse feed</p>
                  <h1 className="brand-font mt-3 text-4xl leading-tight text-[color:var(--copy-main)] sm:text-5xl">
                    A polished onchain social home for photos, videos, and conversation.
                  </h1>
                  <p className="mt-4 max-w-xl text-base leading-7 text-[color:var(--copy-soft)]">
                    Connect your wallet at the top-right, create your profile, upload media to IPFS, and publish posts that feel closer to a real social platform.
                  </p>
                </div>

                <div className="flex hide-scrollbar gap-3 overflow-x-auto pb-2">
                  {['Photos', 'Videos', 'Onchain identity', 'Creator feed'].map((chip) => (
                    <span
                      key={chip}
                      className="whitespace-nowrap rounded-full border border-[color:var(--shell-border)] bg-[color:var(--shell-card)] px-4 py-2 text-sm font-medium text-[color:var(--copy-soft)]"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </div>
      </section>

      <section className="surface-card rounded-[30px] p-4 sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'latest', label: 'Latest' },
                    { id: 'following', label: 'Following' },
                    { id: 'my-posts', label: 'My Posts' },
                    { id: 'saved', label: 'Saved' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setFeedTab(tab.id as FeedTab)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        feedTab === tab.id
                          ? 'bg-[color:var(--accent-contrast)] text-[color:var(--accent-on-contrast)]'
                          : 'bg-[color:var(--shell-muted)] text-[color:var(--copy-soft)] hover:bg-[color:var(--shell-muted-strong)]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <label className="flex items-center gap-3 rounded-full border border-[color:var(--shell-border)] bg-[color:var(--shell-card)] px-4 py-3 text-sm text-[color:var(--copy-soft)] lg:min-w-[320px]">
                  <Search size={16} />
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search captions, creators, or bios"
                    className="w-full bg-transparent outline-none"
                  />
                </label>
              </div>

              <p className="mt-4 text-sm text-[color:var(--copy-soft)]">{activeFeedSummary}</p>
      </section>

      {!isConnected ? (
        <section className="surface-card rounded-[32px] p-8">
                <h2 className="brand-font text-3xl text-[color:var(--copy-main)]">Connect your wallet to enter Pulse</h2>
                <p className="mt-3 max-w-2xl text-base leading-7 text-[color:var(--copy-soft)]">
                  Use RainbowKit in the top-right, switch to Sepolia after deployment, and then create your onchain profile to post like a real social app.
                </p>
        </section>
      ) : isProfileLoading ? (
        <section className="surface-card flex items-center gap-3 rounded-[32px] p-6 text-[color:var(--copy-soft)]">
          <Loader2 size={18} className="animate-spin" />
          <span>Loading your profile...</span>
        </section>
      ) : viewerProfile?.exists ? (
        <div className="space-y-6">
          <ComposeBox onComplete={refreshAll} />
          <ProfileForm profile={viewerProfile} onComplete={refreshAll} />
        </div>
      ) : (
        <ProfileForm onComplete={refreshAll} />
      )}

      <section className="space-y-5">
              {loadingFeed ? (
                <div className="surface-card flex items-center gap-3 rounded-[30px] p-6 text-[color:var(--copy-soft)]">
                  <Loader2 size={18} className="animate-spin" />
                  <span>Loading the latest posts from chain...</span>
                </div>
              ) : visibleFeed.length === 0 ? (
                <div className="surface-card rounded-[30px] p-8">
                  <h3 className="brand-font text-3xl text-[color:var(--copy-main)]">Nothing to show here yet</h3>
                  <p className="mt-3 max-w-xl text-base leading-7 text-[color:var(--copy-soft)]">
                    Try another tab, clear your search, or create the first profile and post to bring this view to life.
                  </p>
                </div>
              ) : (
                visibleFeed.map((post) => (
                  <PostCard
                    key={post.id.toString()}
                    post={post}
                    isOwner={post.author === address}
                    canInteract={canInteract}
                    isSaved={savedPostIdSet.has(post.id.toString())}
                    onRefresh={refreshAll}
                    onToggleSave={toggleSavedPost}
                  />
                ))
              )}
      </section>
    </AppShell>
  )
}
