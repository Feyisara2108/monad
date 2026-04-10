'use client';

import { Moon, Palette, SunMedium } from 'lucide-react'
import { useThemeMode } from '@/components/ThemeProvider'

export function ThemeToggle() {
  const { theme, setTheme } = useThemeMode()

  const themes = [
    { id: 'light', label: 'Light', icon: SunMedium },
    { id: 'dim', label: 'Dim', icon: Palette },
    { id: 'dark', label: 'Dark', icon: Moon },
  ] as const

  return (
    <div className="flex items-center gap-1 rounded-full border border-[color:var(--shell-border)] bg-[color:var(--shell-card)] p-1 shadow-sm">
      {themes.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => setTheme(item.id)}
          className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition ${
            theme === item.id
              ? 'bg-[color:var(--accent-strong)] text-white'
              : 'text-[color:var(--muted-copy)] hover:bg-[color:var(--shell-muted)]'
          }`}
        >
          <item.icon size={14} />
          <span className="hidden sm:inline">{item.label}</span>
        </button>
      ))}
    </div>
  )
}
