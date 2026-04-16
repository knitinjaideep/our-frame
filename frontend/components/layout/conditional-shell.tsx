'use client'

import { usePathname } from 'next/navigation'
import { TopNav } from './top-nav'

const NO_SHELL_PATHS = ['/login', '/onboarding']

export function ConditionalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const showShell = !NO_SHELL_PATHS.some((p) => pathname.startsWith(p))

  if (!showShell) {
    return <>{children}</>
  }

  return (
    <>
      <TopNav />
      <main className="min-h-screen pt-[var(--topbar-height)]">
        {children}
      </main>
    </>
  )
}
