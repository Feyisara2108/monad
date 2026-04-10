'use client';

import Link from 'next/link'
import { useAccount } from 'wagmi'
import { AppShell } from '@/components/AppShell'

export default function ViewerProfileEntryPage() {
  const { address, isConnected } = useAccount()

  return (
    <AppShell>
      <section className="surface-card rounded-[32px] p-6 sm:p-8">
        <h1 className="brand-font text-4xl text-[color:var(--copy-main)]">Your Pulse profile</h1>
        {isConnected && address ? (
          <div className="mt-5">
            <p className="text-base leading-7 text-[color:var(--copy-soft)]">
              Open your full creator page to manage your onchain identity and review your posts.
            </p>
            <Link
              href={`/profile/${address}`}
              className="mt-5 inline-flex rounded-full bg-[color:var(--accent-contrast)] px-5 py-3 font-semibold text-[color:var(--accent-on-contrast)]"
            >
              Open my profile
            </Link>
          </div>
        ) : (
          <p className="mt-5 text-base leading-7 text-[color:var(--copy-soft)]">
            Connect your wallet first, then come back here and we&apos;ll take you to your profile page.
          </p>
        )}
      </section>
    </AppShell>
  )
}
