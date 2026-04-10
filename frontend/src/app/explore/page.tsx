'use client';

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Compass, Loader2, Search } from 'lucide-react'
import { useAccount, usePublicClient, useReadContract } from 'wagmi'
import { AppShell } from '@/components/AppShell'
import { FEED_ENGINE_ABI, FEED_ENGINE_ADDRESS, PROFILE_REGISTRY_ABI, PROFILE_REGISTRY_ADDRESS, isContractsConfigured } from '@/config/contracts'
import { getPostsByIds } from '@/lib/social'
import type { FeedPost } from '@/lib/types'
import { extractTags, includesText, resolveIpfsUrl } from '@/lib/utils'

const FEED_LIMIT = BigInt(30)
const ZERO_BIGINT = BigInt(0)

export default function ExplorePage() {
  const publicClient = usePublicClient()
  const { address } = useAccount()
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [query, setQuery] = useState('')

  const { data: viewerProfileRaw } = useReadContract({
    address: PROFILE_REGISTRY_ADDRESS,
    abi: PROFILE_REGISTRY_ABI,
    functionName: 'profiles',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) && isContractsConfigured },
  })

  useEffect(() => {
    async function load() {
      if (!publicClient || !isContractsConfigured) {
        setLoading(false)
        return
      }

      setLoading(true)
      const ids = (await publicClient.readContract({
        address: FEED_ENGINE_ADDRESS,
        abi: FEED_ENGINE_ABI,
        functionName: 'getRecentPostIds',
        args: [ZERO_BIGINT, FEED_LIMIT],
      })) as bigint[]

      const nextPosts = await getPostsByIds(publicClient, ids, address, Boolean(viewerProfileRaw?.[6]))
      setPosts(nextPosts)
      setLoading(false)
    }

    void load()
  }, [address, publicClient, viewerProfileRaw])

  const filteredPosts = useMemo(
    () =>
      posts.filter((post) =>
        !query.trim()
          ? true
          : includesText(post.content, query) || includesText(post.profile?.username || '', query)
      ),
    [posts, query]
  )

  const tags = useMemo(() => extractTags(posts), [posts])

  return (
    <AppShell
      rightAside={
        <>
          <section className="surface-card rounded-[30px] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--accent-strong)]">Explore tips</p>
            <p className="mt-4 text-sm leading-7 text-[color:var(--copy-soft)]">
              Explore is for discovering creators, tags, and media across Pulse. This is where trending culture and discovery should keep growing over time.
            </p>
          </section>
          <section className="surface-card rounded-[30px] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--accent-strong)]">Trending tags</p>
            <div className="mt-4 space-y-3">
              {tags.length === 0 ? (
                <p className="text-sm text-[color:var(--copy-soft)]">No hashtags yet.</p>
              ) : (
                tags.map(([tag, count]) => (
                  <div key={tag} className="rounded-2xl bg-[color:var(--shell-muted)] px-4 py-3">
                    <p className="font-semibold text-[color:var(--copy-main)]">{tag}</p>
                    <p className="mt-1 text-sm text-[color:var(--muted-copy)]">{count} mentions</p>
                  </div>
                ))
              )}
            </div>
          </section>
        </>
      }
    >
      <section className="surface-card rounded-[32px] p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">Explore</p>
        <h1 className="brand-font mt-3 text-4xl text-[color:var(--copy-main)] sm:text-5xl">
          Discover creators, tags, and media moments.
        </h1>
        <label className="mt-6 flex items-center gap-3 rounded-full border border-[color:var(--shell-border)] bg-[color:var(--shell-card)] px-4 py-3 text-sm text-[color:var(--muted-copy)]">
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search the explore feed"
            className="w-full bg-transparent outline-none"
          />
        </label>
      </section>

      {loading ? (
        <section className="surface-card flex items-center gap-3 rounded-[30px] p-6 text-[color:var(--copy-soft)]">
          <Loader2 size={18} className="animate-spin" />
          <span>Loading explore feed...</span>
        </section>
      ) : (
        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredPosts.map((post) => (
            <Link key={post.id.toString()} href={`/post/${post.id.toString()}`} className="surface-card overflow-hidden rounded-[28px] transition hover:-translate-y-1">
              {post.mediaURI ? (
                post.mediaType === 2 ? (
                  <video src={resolveIpfsUrl(post.mediaURI)} className="h-[280px] w-full bg-black object-cover" />
                ) : (
                  <img src={resolveIpfsUrl(post.mediaURI)} alt={post.content || 'Pulse media'} className="h-[280px] w-full object-cover" />
                )
              ) : (
                <div className="flex h-[280px] items-center justify-center bg-[linear-gradient(135deg,var(--shell-muted),var(--shell-muted-strong))] p-8 text-center text-[color:var(--copy-soft)]">
                  <Compass size={28} />
                </div>
              )}
              <div className="p-4">
                <p className="font-semibold text-[color:var(--copy-main)]">{post.profile?.username || 'Unknown creator'}</p>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-[color:var(--copy-soft)]">{post.content || 'Media-first post'}</p>
              </div>
            </Link>
          ))}
        </section>
      )}
    </AppShell>
  )
}
