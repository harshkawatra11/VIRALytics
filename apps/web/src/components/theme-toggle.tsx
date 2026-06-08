'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'

type Theme = 'light' | 'dark'

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light')
  }, [])

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.classList.toggle('dark', next === 'dark')
    try {
      localStorage.setItem('theme', next)
    } catch {
      /* ignore */
    }
  }

  // Avoid hydration mismatch — render a stable placeholder until mounted.
  const isDark = mounted && theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark mode"
      className={cn(
        'relative flex h-7 w-12 items-center rounded-full border border-[var(--color-sidebar-border)] bg-[var(--color-sidebar-elevated)] px-0.5 transition-colors',
        className
      )}
    >
      <span
        className={cn(
          'flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#0b0e13] shadow-sm transition-transform duration-300',
          isDark ? 'translate-x-5' : 'translate-x-0'
        )}
      >
        {isDark ? <Moon size={13} /> : <Sun size={13} />}
      </span>
    </button>
  )
}
