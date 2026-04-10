'use client';

import { BellRing, Sparkles } from 'lucide-react'
import { AppShell } from '@/components/AppShell'

export default function NotificationsPage() {
  return (
    <AppShell
      rightAside={
        <section className="surface-card rounded-[30px] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--accent-strong)]">Notification direction</p>
          <p className="mt-4 text-sm leading-7 text-[color:var(--copy-soft)]">
            This page is the right place for persisted likes, comments, follows, and mentions once we add a proper indexer or backend event store.
          </p>
        </section>
      }
    >
      <section className="surface-card rounded-[32px] p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">Notifications</p>
        <h1 className="brand-font mt-3 text-4xl text-[color:var(--copy-main)] sm:text-5xl">
          Keep track of reactions around your profile.
        </h1>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-[28px] bg-[color:var(--shell-muted)] p-5">
            <div className="flex items-center gap-3 text-[color:var(--copy-main)]">
              <BellRing size={20} />
              <p className="font-semibold">What will show here</p>
            </div>
            <p className="mt-3 text-sm leading-7 text-[color:var(--copy-soft)]">
              Follows, likes, comments, mentions, and post activity for the connected wallet.
            </p>
          </div>
          <div className="rounded-[28px] bg-[color:var(--shell-muted)] p-5">
            <div className="flex items-center gap-3 text-[color:var(--copy-main)]">
              <Sparkles size={20} />
              <p className="font-semibold">Next phase</p>
            </div>
            <p className="mt-3 text-sm leading-7 text-[color:var(--copy-soft)]">
              We still need a persistent notifications source so this becomes production-grade instead of just live-session activity.
            </p>
          </div>
        </div>
      </section>
    </AppShell>
  )
}
