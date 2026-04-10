'use client';

import Link from 'next/link'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Bell, Compass, Home, Sparkles, UserCircle2 } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useAccount } from 'wagmi'
import { Logo } from '@/components/Logo'
import { ThemeToggle } from '@/components/ThemeToggle'

type AppShellProps = {
  children: React.ReactNode
  rightAside?: React.ReactNode
  topNotice?: React.ReactNode
}

export function AppShell({ children, rightAside, topNotice }: AppShellProps) {
  const pathname = usePathname()
  const { address, chain } = useAccount()

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/explore', label: 'Explore', icon: Compass },
    { href: '/notifications', label: 'Notifications', icon: Bell },
    { href: address ? `/profile/${address}` : '/profile', label: 'Profile', icon: UserCircle2 },
  ]

  return (
    <div className="min-h-screen px-3 pb-28 pt-3 sm:px-5 lg:px-8">
      <div className="mx-auto max-w-[1480px]">
        <header className="surface-card sticky top-3 z-30 mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[26px] px-4 py-3 sm:px-5">
          <Logo />

          <div className="hidden items-center gap-3 rounded-full bg-[color:var(--shell-muted)] px-4 py-2 text-sm text-[color:var(--muted-copy)] md:flex">
            <Sparkles size={16} />
            <span>{chain ? `${chain.name} connected` : 'Connect to Sepolia or Monad'}</span>
          </div>

          <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
            <ThemeToggle />
            <ConnectButton showBalance={false} chainStatus="icon" />
          </div>
        </header>

        {topNotice ? <div className="mb-5">{topNotice}</div> : null}

        <div className="feed-grid items-start">
          <aside className="hidden lg:block">
            <div className="surface-card sticky top-24 rounded-[28px] p-4">
              <nav className="space-y-2">
                {navItems.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                        isActive
                          ? 'bg-[color:var(--accent-contrast)] text-[color:var(--accent-on-contrast)]'
                          : 'bg-[color:var(--shell-muted)] text-[color:var(--copy-main)] hover:bg-[color:var(--shell-muted-strong)]'
                      }`}
                    >
                      <item.icon size={18} />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </nav>

              <div className="mt-5 rounded-[24px] bg-[linear-gradient(160deg,var(--promo-deep),var(--promo-mid)_52%,var(--promo-hot))] p-[1px]">
                <div className="rounded-[23px] bg-[color:var(--promo-surface)] p-5 text-[color:var(--promo-copy)]">
                  <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--promo-kicker)]">Pulse design note</p>
                  <p className="mt-3 brand-font text-2xl">Instagram energy, onchain memory.</p>
                  <p className="mt-3 text-sm leading-6 opacity-90">
                    These note cards guide the user and explain how Pulse works, so yes, they act like smart product direction inside the UI.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          <main className="min-w-0 space-y-5">{children}</main>

          <aside className="space-y-5">{rightAside}</aside>
        </div>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-40 rounded-[26px] border border-[color:var(--shell-border)] bg-[color:var(--shell-card)] p-2 shadow-[0_16px_50px_rgba(0,0,0,0.18)] backdrop-blur lg:hidden">
        <div className="grid grid-cols-4 gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-3 text-[11px] font-semibold transition ${
                  isActive
                    ? 'bg-[color:var(--accent-contrast)] text-[color:var(--accent-on-contrast)]'
                    : 'text-[color:var(--muted-copy)] hover:bg-[color:var(--shell-muted)]'
                }`}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
