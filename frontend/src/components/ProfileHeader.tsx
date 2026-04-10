'use client';

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import type { ProfileRecord } from '@/lib/types'
import { formatAddress, getInitials, resolveIpfsUrl } from '@/lib/utils'

type ProfileHeaderProps = {
  profile: ProfileRecord
  isViewer: boolean
}

export function ProfileHeader({ profile, isViewer }: ProfileHeaderProps) {
  return (
    <section className="surface-card overflow-hidden rounded-[34px]">
      <div className="bg-[linear-gradient(135deg,#201712,#4d2d23_55%,#ff6b57)] px-6 py-10 text-[#fff8f1] sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur hover:bg-white/15"
          >
            <ArrowLeft size={16} />
            Back to feed
          </Link>

          <a
            href={`https://sepolia.etherscan.io/address/${profile.address}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur hover:bg-white/15"
          >
            View on explorer
            <ExternalLink size={16} />
          </a>
        </div>

        <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-5">
            {profile.avatarURI ? (
              <img
                src={resolveIpfsUrl(profile.avatarURI)}
                alt={profile.username}
                className="h-24 w-24 rounded-full border-4 border-white/20 object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white/20 bg-white/10 text-2xl font-semibold">
                {getInitials(profile.username, profile.address)}
              </div>
            )}

            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#f7c9b4]">
                {isViewer ? 'Your profile' : 'Creator profile'}
              </p>
              <h1 className="brand-font mt-2 text-4xl">{profile.username}</h1>
              <p className="mt-2 text-sm text-[#f8dfd4]">{formatAddress(profile.address)}</p>
              <p className="mt-4 max-w-xl text-sm leading-7 text-[#fff3ec]">
                {profile.bio || 'This creator has not added a bio yet.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Posts', value: profile.postCount },
              { label: 'Followers', value: profile.followerCount },
              { label: 'Following', value: profile.followingCount },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-white/10 px-4 py-3 text-center backdrop-blur">
                <p className="text-xl font-semibold">{stat.value}</p>
                <p className="text-xs uppercase tracking-[0.24em] text-[#f7c9b4]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
