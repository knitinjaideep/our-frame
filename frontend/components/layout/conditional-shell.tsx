'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { TopNav } from './top-nav'
import { ThemeProvider } from './theme-provider'
import { useWorkspace } from '@/hooks/use-workspace'

// Exact-match paths that render without the nav shell
const NO_SHELL_EXACT = ['/']
// Prefix-match paths that render without the nav shell
const NO_SHELL_PREFIX = ['/login', '/onboarding']

// Routes that render their own full-bleed hero and need the transparent nav
// to float directly over it — <main> must not add top padding here, or the
// nav sits over page background instead of the hero photograph.
const FULL_BLEED_HERO_ROUTES = ['/home']

/** Updates document.title to the workspace name once it loads. */
function WorkspaceTitle() {
  const { workspace } = useWorkspace()
  useEffect(() => {
    if (workspace?.name) {
      document.title = workspace.name
    }
  }, [workspace?.name])
  return null
}

export function ConditionalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const showShell =
    !NO_SHELL_EXACT.includes(pathname) &&
    !NO_SHELL_PREFIX.some((p) => pathname.startsWith(p))

  if (!showShell) {
    return <>{children}</>
  }

  const isFullBleedHero = FULL_BLEED_HERO_ROUTES.includes(pathname)

  return (
    <ThemeProvider>
      <WorkspaceTitle />
      <TopNav />
      <main className={isFullBleedHero ? 'min-h-screen' : 'min-h-screen pt-[var(--topbar-height)]'}>
        {children}
      </main>
    </ThemeProvider>
  )
}
