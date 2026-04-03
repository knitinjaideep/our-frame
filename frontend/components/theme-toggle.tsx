'use client'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'

const themes = [
  { value: 'light',  label: 'Light',  icon: Sun },
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'dark',   label: 'Dark',   icon: Moon },
] as const

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  // Render a stable placeholder before hydration to avoid layout shift
  if (!mounted) {
    return (
      <div className={cn('h-8 w-[92px] rounded-full bg-muted/60', className)} />
    )
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full border border-border bg-muted/60 p-1',
        className
      )}
      role="group"
      aria-label="Choose colour theme"
    >
      {themes.map(({ value, label, icon: Icon }) => {
        const active = theme === value
        return (
          <button
            key={value}
            onClick={() => setTheme(value)}
            aria-label={`Switch to ${label} theme`}
            aria-pressed={active}
            title={label}
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-full transition-all duration-200',
              active
                ? 'shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
            style={
              active
                ? { backgroundColor: 'var(--background)', boxShadow: 'var(--shadow-card)' }
                : undefined
            }
          >
            <Icon className="h-3 w-3" />
          </button>
        )
      })}
    </div>
  )
}
