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

  return (
    <ThemeProvider>
      <WorkspaceTitle />
      <TopNav />
      <main className="min-h-screen pt-[var(--topbar-height)]">
        {children}
      </main>
    </ThemeProvider>
  )
}
