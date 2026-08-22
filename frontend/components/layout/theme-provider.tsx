'use client'

/**
 * ThemeProvider — reads workspace.theme_preset and applies it as data-theme
 * on <html> so the correct CSS variable block takes effect.
 *
 * Must be rendered inside <Providers> (needs React Query).
 * Placed in ConditionalShell so it only runs for authenticated pages.
 */

import { useEffect } from 'react'
import { useWorkspace } from '@/hooks/use-workspace'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { workspace } = useWorkspace()

  useEffect(() => {
    const html = document.documentElement
    const theme = workspace?.theme_preset ?? 'warm_dark'
    html.setAttribute('data-theme', theme)
  }, [workspace?.theme_preset])

  return <>{children}</>
}

/**
 * useApplyTheme — lightweight hook to apply a preview theme during onboarding
 * without needing a full workspace record.  Restored to workspace theme on unmount.
 */
export function useApplyPreviewTheme(theme: string | null) {
  useEffect(() => {
    if (!theme) return
    const html = document.documentElement
    const prev = html.getAttribute('data-theme')
    html.setAttribute('data-theme', theme)
    return () => {
      if (prev) html.setAttribute('data-theme', prev)
      else html.removeAttribute('data-theme')
    }
  }, [theme])
}
