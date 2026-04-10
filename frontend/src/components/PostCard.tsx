'use client';

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Bookmark, Heart, Loader2, MessageCircle, UserPlus, UserRoundCheck } from 'lucide-react'
import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { FEED_ENGINE_ABI, FEED_ENGINE_ADDRESS, PROFILE_REGISTRY_ABI, PROFILE_REGISTRY_ADDRESS } from '@/config/contracts'
import { formatContractError } from '@/lib/client'
import type { FeedPost } from '@/lib/types'
import { cn, formatAddress, formatDate, getInitials, resolveIpfsUrl } from '@/lib/utils'

type PostCardProps = {
  post: FeedPost
  isOwner: boolean
  canInteract: boolean
  isSaved: boolean
  onRefresh: () => void
  onToggleSave: (postId: bigint) => void
}

export function PostCard({ post, isOwner, canInteract, isSaved, onRefresh, onToggleSave }: PostCardProps) {
  const [comment, setComment] = useState('')
  const [message, setMessage] = useState('')

  const {
    data: likeHash,
    writeContract: writeFeedContract,
    isPending: isFeedPending,
    error: feedError,
  } = useWriteContract()
  const {
    data: followHash,
    writeContract: writeProfileContract,
    isPending: isProfilePending,
    error: profileError,
  } = useWriteContract()

  const likeReceipt = useWaitForTransactionReceipt({ hash: likeHash })
  const followReceipt = useWaitForTransactionReceipt({ hash: followHash })

  useEffect(() => {
    if (likeReceipt.isSuccess || followReceipt.isSuccess) {
      setMessage('Action confirmed onchain.')
      setComment('')
      onRefresh()
    }
  }, [followReceipt.isSuccess, likeReceipt.isSuccess, onRefresh])

  useEffect(() => {
    const nextError = feedError?.message || profileError?.message || ''
    if (nextError) {
      setMessage(formatContractError(nextError))
    }
  }, [feedError, profileError])

  const displayName = post.profile?.username || formatAddress(post.author)
  const avatar = resolveIpfsUrl(post.profile?.avatarURI)

  const handleToggleLike = () => {
    setMessage('')
    writeFeedContract({
      address: FEED_ENGINE_ADDRESS,
      abi: FEED_ENGINE_ABI,
      functionName: 'toggleLike',
      args: [post.id],
    })
  }

  const handleComment = () => {
    if (!comment.trim()) return
    setMessage('')
    writeFeedContract({
      address: FEED_ENGINE_ADDRESS,
      abi: FEED_ENGINE_ABI,
      functionName: 'addComment',
      args: [post.id, comment.trim()],
    })
  }

  const handleFollowToggle = () => {
    setMessage('')
    writeProfileContract({
      address: PROFILE_REGISTRY_ADDRESS,
      abi: PROFILE_REGISTRY_ABI,
      functionName: post.isFollowingAuthor ? 'unfollow' : 'follow',
      args: [post.author],
    })
  }

  return (
    <article className="surface-card fade-up overflow-hidden rounded-[30px]">
      <div className="flex items-start gap-4 p-5 sm:p-6">
        {avatar ? (
          <img
            src={avatar}
            alt={displayName}
            className="h-12 w-12 rounded-full object-cover ring-2 ring-white/80"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(145deg,#ff9076,#ffcb8d)] text-sm font-semibold text-[#45261b]">
            {getInitials(post.profile?.username, post.author)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Link href={`/profile/${post.author}`} className="font-semibold text-[#2c211c] transition hover:text-[#ff6b57]">
                  {displayName}
                </Link>
                <span className="text-sm text-[#9a7c6c]">@{formatAddress(post.author)}</span>
              </div>
              <p className="mt-1 text-sm text-[#907364]">{formatDate(post.createdAt)}</p>
            </div>

            {!isOwner ? (
              <button
                type="button"
                onClick={handleFollowToggle}
                disabled={!canInteract || isProfilePending || followReceipt.isLoading}
                className="inline-flex items-center gap-2 rounded-full border border-[#ead8ce] bg-white px-4 py-2 text-sm font-semibold text-[#3b2c25] transition hover:border-[#ff6b57] hover:text-[#ff6b57] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {post.isFollowingAuthor ? <UserRoundCheck size={16} /> : <UserPlus size={16} />}
                {post.isFollowingAuthor ? 'Following' : 'Follow'}
              </button>
            ) : null}
          </div>

          {post.profile?.bio ? <p className="mt-3 text-sm leading-6 text-[#7b685f]">{post.profile.bio}</p> : null}
          {post.content ? (
            <Link href={`/post/${post.id.toString()}`} className="mt-4 block whitespace-pre-wrap text-[15px] leading-7 text-[#2f2622] transition hover:text-[#ff6b57]">
              {post.content}
            </Link>
          ) : null}
        </div>
      </div>

      {post.mediaURI ? (
        <div className="border-y border-[#f2dfd5] bg-[#fff5ef]">
          {post.mediaType === 2 ? (
            <Link href={`/post/${post.id.toString()}`} className="block">
              <video src={resolveIpfsUrl(post.mediaURI)} controls className="max-h-[560px] w-full bg-black object-cover" />
            </Link>
          ) : (
            <Link href={`/post/${post.id.toString()}`} className="block">
              <img src={resolveIpfsUrl(post.mediaURI)} alt={post.content || 'Pulse media'} className="max-h-[560px] w-full object-cover" />
            </Link>
          )}
        </div>
      ) : null}

      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-5 text-sm text-[#7b685f]">
          <button
            type="button"
            onClick={handleToggleLike}
            disabled={!canInteract || isFeedPending || likeReceipt.isLoading}
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-4 py-2 transition disabled:cursor-not-allowed disabled:opacity-60',
              post.likedByViewer ? 'bg-[#ffe3dd] text-[#d44e41]' : 'bg-[#fff3ed] text-[#6d564b]'
            )}
          >
            {isFeedPending || likeReceipt.isLoading ? <Loader2 size={16} className="animate-spin" /> : <Heart size={16} fill={post.likedByViewer ? 'currentColor' : 'none'} />}
            <span>{post.likeCount} likes</span>
          </button>
          <Link href={`/post/${post.id.toString()}`} className="inline-flex items-center gap-2 rounded-full bg-[#fff3ed] px-4 py-2">
            <MessageCircle size={16} />
            <span>{post.commentCount} comments</span>
          </Link>
          <button
            type="button"
            onClick={() => onToggleSave(post.id)}
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-4 py-2 transition',
              isSaved ? 'bg-[#1f1612] text-[#fff7ef]' : 'bg-[#fff8f4] text-[#6d564b]'
            )}
          >
            <Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} />
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>
          <div className="rounded-full bg-[#fff8f4] px-4 py-2 text-xs uppercase tracking-[0.24em] text-[#af7a67]">
            Post #{post.authorPostCount}
          </div>
        </div>

        <div className="mt-5 rounded-[24px] border border-[#efddd3] bg-[#fffdfb] p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h4 className="font-semibold text-[#2f241f]">Conversation</h4>
            <span className="text-xs uppercase tracking-[0.24em] text-[#b38a78]">Recent comments</span>
          </div>

          <div className="space-y-3">
            {post.comments.length === 0 ? (
              <p className="text-sm text-[#998073]">No comments yet. Start the conversation.</p>
            ) : (
              post.comments.map((item, index) => (
                <div key={`${post.id.toString()}-${item.author}-${index}`} className="rounded-2xl bg-[#fff5ef] px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-[#342723]">
                      {item.profile?.username || formatAddress(item.author)}
                    </span>
                    <span className="text-xs text-[#9d7f71]">{formatDate(item.createdAt)}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#6b554a]">{item.content}</p>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder={canInteract ? 'Write a thoughtful comment...' : 'Create a profile to comment'}
              disabled={!canInteract}
              className="min-w-0 flex-1 rounded-2xl border border-[#ead8ce] bg-white px-4 py-3 outline-none transition focus:border-[#ff6b57] focus:soft-ring disabled:cursor-not-allowed disabled:bg-[#f5efeb]"
            />
            <button
              type="button"
              onClick={handleComment}
              disabled={!canInteract || !comment.trim() || isFeedPending || likeReceipt.isLoading}
              className="rounded-2xl bg-[#1f1612] px-5 py-3 font-semibold text-[#fff7ef] transition hover:bg-[#2b1f1a] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Comment
            </button>
          </div>

          {message ? <div className="status-card success mt-3">{message}</div> : <div className="status-card success mt-3 opacity-0">.</div>}
        </div>
      </div>
    </article>
  )
}
