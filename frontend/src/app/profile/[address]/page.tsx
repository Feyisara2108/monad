'use client';

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { Grid3X3, Loader2, Rows3 } from 'lucide-react'
import { isAddress } from 'viem'
import { useAccount, usePublicClient, useReadContract, useWatchContractEvent } from 'wagmi'
import { AppShell } from '@/components/AppShell'
import { PostCard } from '@/components/PostCard'
import { ProfileHeader } from '@/components/ProfileHeader'
import {
  FEED_ENGINE_ABI,
  FEED_ENGINE_ADDRESS,
  PROFILE_REGISTRY_ABI,
  PROFILE_REGISTRY_ADDRESS,
  isContractsConfigured,
} from '@/config/contracts'
import { getPostsByIds, getProfile } from '@/lib/social'
import type { FeedPost, ProfileRecord } from '@/lib/types'
import { resolveIpfsUrl } from '@/lib/utils'

type LayoutMode = 'grid' | 'list'

const SAVED_POSTS_STORAGE_KEY = 'pulse:saved-posts'

export default function ProfilePage() {
  const params = useParams<{ address: string }>()
  const publicClient = usePublicClient()
  const { address: viewerAddress, isConnected } = useAccount()

  const [profile, setProfile] = useState<ProfileRecord | null>(null)
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('grid')
  const [savedPostIds, setSavedPostIds] = useState<string[]>([])

  const profileAddress = useMemo(() => {
    const candidate = params.address
    return candidate && isAddress(candidate) ? (candidate as `0x${string}`) : null
  }, [params.address])

  const { data: viewerProfileRaw } = useReadContract({
    address: PROFILE_REGISTRY_ADDRESS,
    abi: PROFILE_REGISTRY_ABI,
    functionName: 'profiles',
    args: viewerAddress ? [viewerAddress] : undefined,
    query: {
      enabled: Boolean(viewerAddress) && isContractsConfigured,
    },
  })

  const viewerHasProfile = Boolean(viewerProfileRaw?.[6])

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

  const loadProfilePage = useCallback(async () => {
    if (!publicClient || !profileAddress || !isContractsConfigured) {
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      const nextProfile = await getProfile(publicClient, profileAddress)
      setProfile(nextProfile)

      const ids = (await publicClient.readContract({
        address: FEED_ENGINE_ADDRESS,
        abi: FEED_ENGINE_ABI,
        functionName: 'getPostIdsByAuthor',
        args: [profileAddress],
      })) as bigint[]

      const nextPosts = await getPostsByIds(publicClient, [...ids].reverse(), viewerAddress, viewerHasProfile)
      setPosts(nextPosts)
    } finally {
      setLoading(false)
    }
  }, [profileAddress, publicClient, viewerAddress, viewerHasProfile])

  useEffect(() => {
    void loadProfilePage()
  }, [loadProfilePage])

  useWatchContractEvent({
    address: FEED_ENGINE_ADDRESS,
    abi: FEED_ENGINE_ABI,
    eventName: 'PostCreated',
    onLogs() {
      void loadProfilePage()
    },
  })

  useWatchContractEvent({
    address: FEED_ENGINE_ADDRESS,
    abi: FEED_ENGINE_ABI,
    eventName: 'PostLikeToggled',
    onLogs() {
      void loadProfilePage()
    },
  })

  useWatchContractEvent({
    address: FEED_ENGINE_ADDRESS,
    abi: FEED_ENGINE_ABI,
    eventName: 'CommentCreated',
    onLogs() {
      void loadProfilePage()
    },
  })

  useWatchContractEvent({
    address: PROFILE_REGISTRY_ADDRESS,
    abi: PROFILE_REGISTRY_ABI,
    eventName: 'ProfileUpdated',
    onLogs() {
      void loadProfilePage()
    },
  })

  useWatchContractEvent({
    address: PROFILE_REGISTRY_ADDRESS,
    abi: PROFILE_REGISTRY_ABI,
    eventName: 'Followed',
    onLogs() {
      void loadProfilePage()
    },
  })

  useWatchContractEvent({
    address: PROFILE_REGISTRY_ADDRESS,
    abi: PROFILE_REGISTRY_ABI,
    eventName: 'Unfollowed',
    onLogs() {
      void loadProfilePage()
    },
  })

  const toggleSavedPost = useCallback((postId: bigint) => {
    setSavedPostIds((current) => {
      const key = postId.toString()
      return current.includes(key) ? current.filter((item) => item !== key) : [key, ...current]
    })
  }, [])

  if (!profileAddress) {
    return (
      <div className="min-h-screen px-4 pb-20 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1480px]">
          <section className="surface-card rounded-[30px] p-8">
            <h1 className="brand-font text-4xl text-[#2a211c]">Invalid profile address</h1>
            <p className="mt-3 max-w-xl text-base leading-7 text-[#7b665d]">
              The URL you opened is not a valid wallet address.
            </p>
          </section>
        </div>
      </div>
    )
  }

  return (
    <AppShell
      rightAside={
        profile?.exists ? (
          <>
            <section className="surface-card rounded-[30px] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--accent-strong)]">Creator summary</p>
              <p className="mt-4 text-sm leading-7 text-[color:var(--copy-soft)]">
                This profile page is where a creator identity should feel strongest. The grid/list switch already gives it a more social-media-like personality.
              </p>
            </section>
            <section className="surface-card rounded-[30px] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--accent-strong)]">Quick stats</p>
              <div className="mt-4 grid gap-3">
                {[
                  { label: 'Posts', value: profile.postCount },
                  { label: 'Followers', value: profile.followerCount },
                  { label: 'Following', value: profile.followingCount },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-2xl bg-[color:var(--shell-muted)] px-4 py-3">
                    <p className="text-lg font-semibold text-[color:var(--copy-main)]">{stat.value}</p>
                    <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted-copy)]">{stat.label}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : null
      }
    >
        {loading ? (
          <section className="surface-card flex items-center gap-3 rounded-[30px] p-6 text-[color:var(--copy-soft)]">
            <Loader2 size={18} className="animate-spin" />
            <span>Loading profile...</span>
          </section>
        ) : !profile?.exists ? (
          <section className="surface-card rounded-[30px] p-8">
            <h1 className="brand-font text-4xl text-[color:var(--copy-main)]">Profile not found</h1>
            <p className="mt-3 max-w-xl text-base leading-7 text-[color:var(--copy-soft)]">
              This wallet has not created a Pulse profile yet.
            </p>
          </section>
        ) : (
          <div className="space-y-6">
            <ProfileHeader profile={profile} isViewer={profile.address === viewerAddress} />

            <section className="surface-card rounded-[30px] p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#b27863]">Profile content</p>
                  <h2 className="brand-font mt-2 text-3xl text-[#2b211d]">
                    {profile.username}&apos;s posts
                  </h2>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setLayoutMode('grid')}
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${layoutMode === 'grid' ? 'bg-[#1f1612] text-[#fff7ef]' : 'bg-[#fff5ef] text-[#6d564b]'}`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Grid3X3 size={16} />
                      Grid
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLayoutMode('list')}
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${layoutMode === 'list' ? 'bg-[#1f1612] text-[#fff7ef]' : 'bg-[#fff5ef] text-[#6d564b]'}`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Rows3 size={16} />
                      List
                    </span>
                  </button>
                </div>
              </div>
            </section>

            {posts.length === 0 ? (
              <section className="surface-card rounded-[30px] p-8">
                <h3 className="brand-font text-3xl text-[color:var(--copy-main)]">No posts yet</h3>
                <p className="mt-3 max-w-xl text-base leading-7 text-[color:var(--copy-soft)]">
                  This creator has a profile, but hasn&apos;t published any media or captions yet.
                </p>
              </section>
            ) : layoutMode === 'grid' ? (
              <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {posts.map((post) => (
                  <Link key={post.id.toString()} href={`/post/${post.id.toString()}`} className="surface-card overflow-hidden rounded-[30px] transition hover:-translate-y-1">
                    {post.mediaURI ? (
                      post.mediaType === 2 ? (
                        <video src={resolveIpfsUrl(post.mediaURI)} controls className="h-[320px] w-full bg-black object-cover" />
                      ) : (
                        <img src={resolveIpfsUrl(post.mediaURI)} alt={post.content || 'Pulse media'} className="h-[320px] w-full object-cover" />
                      )
                    ) : (
                      <div className="flex h-[320px] items-center justify-center bg-[linear-gradient(135deg,#fff2e8,#ffe2d2)] p-8 text-center text-[#755f55]">
                        <p className="text-lg leading-8">{post.content || 'Onchain text post'}</p>
                      </div>
                    )}
                    <div className="p-5">
                      <p className="line-clamp-3 text-sm leading-7 text-[#624d43]">{post.content || 'Media-only post'}</p>
                      <div className="mt-4 flex items-center justify-between text-sm text-[#9b7b6d]">
                        <span>{post.likeCount} likes</span>
                        <span>{post.commentCount} comments</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </section>
            ) : (
              <section className="space-y-5">
                {posts.map((post) => (
                  <PostCard
                    key={post.id.toString()}
                    post={post}
                    isOwner={post.author === viewerAddress}
                    canInteract={Boolean(isConnected && viewerHasProfile)}
                    isSaved={savedPostIds.includes(post.id.toString())}
                    onRefresh={() => void loadProfilePage()}
                    onToggleSave={toggleSavedPost}
                  />
                ))}
              </section>
            )}
          </div>
        )}
    </AppShell>
  )
}
