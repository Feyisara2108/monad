'use client';

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useAccount, usePublicClient, useReadContract, useWatchContractEvent } from 'wagmi'
import { AppShell } from '@/components/AppShell'
import { PostCard } from '@/components/PostCard'
import {
  FEED_ENGINE_ABI,
  FEED_ENGINE_ADDRESS,
  PROFILE_REGISTRY_ABI,
  PROFILE_REGISTRY_ADDRESS,
  isContractsConfigured,
} from '@/config/contracts'
import { getPostDetail } from '@/lib/social'
import type { FeedPost } from '@/lib/types'

const SAVED_POSTS_STORAGE_KEY = 'pulse:saved-posts'

export default function PostDetailPage() {
  const params = useParams<{ id: string }>()
  const publicClient = usePublicClient()
  const { address, isConnected } = useAccount()

  const [post, setPost] = useState<FeedPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [savedPostIds, setSavedPostIds] = useState<string[]>([])

  const postId = useMemo(() => {
    if (!params.id || !/^\d+$/.test(params.id)) return null
    return BigInt(params.id)
  }, [params.id])

  const { data: viewerProfileRaw } = useReadContract({
    address: PROFILE_REGISTRY_ADDRESS,
    abi: PROFILE_REGISTRY_ABI,
    functionName: 'profiles',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) && isContractsConfigured },
  })

  const viewerHasProfile = Boolean(viewerProfileRaw?.[6])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const saved = window.localStorage.getItem(SAVED_POSTS_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) setSavedPostIds(parsed)
      }
    } catch {
      return
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(SAVED_POSTS_STORAGE_KEY, JSON.stringify(savedPostIds))
  }, [savedPostIds])

  const loadPost = useCallback(async () => {
    if (!publicClient || !postId || !isContractsConfigured) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const nextPost = await getPostDetail(publicClient, postId, address, viewerHasProfile)
      setPost(nextPost)
    } catch {
      setPost(null)
    } finally {
      setLoading(false)
    }
  }, [address, postId, publicClient, viewerHasProfile])

  useEffect(() => {
    void loadPost()
  }, [loadPost])

  useWatchContractEvent({
    address: FEED_ENGINE_ADDRESS,
    abi: FEED_ENGINE_ABI,
    eventName: 'PostLikeToggled',
    onLogs() {
      void loadPost()
    },
  })

  useWatchContractEvent({
    address: FEED_ENGINE_ADDRESS,
    abi: FEED_ENGINE_ABI,
    eventName: 'CommentCreated',
    onLogs() {
      void loadPost()
    },
  })

  useWatchContractEvent({
    address: PROFILE_REGISTRY_ADDRESS,
    abi: PROFILE_REGISTRY_ABI,
    eventName: 'Followed',
    onLogs() {
      void loadPost()
    },
  })

  useWatchContractEvent({
    address: PROFILE_REGISTRY_ADDRESS,
    abi: PROFILE_REGISTRY_ABI,
    eventName: 'Unfollowed',
    onLogs() {
      void loadPost()
    },
  })

  const toggleSavedPost = useCallback((targetPostId: bigint) => {
    setSavedPostIds((current) => {
      const key = targetPostId.toString()
      return current.includes(key) ? current.filter((item) => item !== key) : [key, ...current]
    })
  }, [])

  return (
    <AppShell
      rightAside={
        post ? (
          <>
            <section className="surface-card rounded-[30px] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--accent-strong)]">Post detail</p>
              <p className="mt-4 text-sm leading-7 text-[color:var(--copy-soft)]">
                This page shows the full thread, so users can focus on one post instead of losing context in the feed.
              </p>
            </section>
            <section className="surface-card rounded-[30px] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--accent-strong)]">Quick actions</p>
              <div className="mt-4 flex flex-col gap-3">
                <Link href={`/profile/${post.author}`} className="rounded-2xl bg-[color:var(--shell-muted)] px-4 py-3 text-sm font-semibold text-[color:var(--copy-main)]">
                  View creator profile
                </Link>
                <Link href="/explore" className="rounded-2xl bg-[color:var(--shell-muted)] px-4 py-3 text-sm font-semibold text-[color:var(--copy-main)]">
                  Explore more posts
                </Link>
              </div>
            </section>
          </>
        ) : null
      }
    >
      <section className="surface-card rounded-[30px] p-4">
        <Link href="/" className="inline-flex items-center gap-2 rounded-full bg-[color:var(--shell-muted)] px-4 py-2 text-sm font-semibold text-[color:var(--copy-main)]">
          <ArrowLeft size={16} />
          Back to feed
        </Link>
      </section>

      {loading ? (
        <section className="surface-card flex items-center gap-3 rounded-[30px] p-6 text-[color:var(--copy-soft)]">
          <Loader2 size={18} className="animate-spin" />
          <span>Loading post...</span>
        </section>
      ) : !post?.exists ? (
        <section className="surface-card rounded-[30px] p-8">
          <h1 className="brand-font text-4xl text-[color:var(--copy-main)]">Post not found</h1>
          <p className="mt-3 max-w-xl text-base leading-7 text-[color:var(--copy-soft)]">
            This post may not exist, or your frontend may still be pointing to the wrong contract addresses.
          </p>
        </section>
      ) : (
        <PostCard
          post={post}
          isOwner={post.author === address}
          canInteract={Boolean(isConnected && viewerHasProfile)}
          isSaved={savedPostIds.includes(post.id.toString())}
          onRefresh={() => void loadPost()}
          onToggleSave={toggleSavedPost}
        />
      )}
    </AppShell>
  )
}
