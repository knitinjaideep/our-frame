'use client'

/**
 * AuthGate — wraps the entire app and enforces route rules.
 *
 * Single source of truth: GET /api/auth/bootstrap
 * This avoids the stale-cache race that plagued separate useCurrentUser +
 * useWorkspaces queries (different stale times, wrong workspace selection,
 * simultaneous navigation decisions).
 *
 * Route rules:
 *   not authenticated          → /login
 *   authenticated, no workspace → /onboarding
 *   authenticated, !onboarding_complete → /onboarding
 *   authenticated, onboarding_complete → allow through
 *
 * Public paths bypass all checks and render immediately.
 */

import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { fetchBootstrap } from '@/lib/platform-api'

const PUBLIC_PATHS = ['/login', '/onboarding', '/auth/callback']

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  // staleTime:0 — always reflect server state. gcTime keeps the result in
  // memory across renders so we don't flicker while re-fetching.
  const { data: bootstrap, isLoading } = useQuery({
    queryKey: ['bootstrap'],
    queryFn: () => fetchBootstrap(),
    staleTime: 0,
    gcTime: 30_000,
    retry: false,
    // Don't run on public pages — avoids a redundant network call on /login
    enabled: !isPublicPath,
  })

  const redirectedRef = useRef(false)

  useEffect(() => {
    if (isPublicPath) return
    if (isLoading) return
    if (!bootstrap) return
    if (redirectedRef.current) return

    if (!bootstrap.authenticated) {
      console.debug('[AuthGate] not authenticated → /login')
      redirectedRef.current = true
      router.replace('/login')
      return
    }

    if (!bootstrap.has_workspace || !bootstrap.onboarding_complete) {
      console.debug(
        '[AuthGate] onboarding incomplete (workspace=%s, onboarding_complete=%s) → /onboarding',
        bootstrap.active_workspace_id,
        bootstrap.onboarding_complete,
      )
      redirectedRef.current = true
      router.replace('/onboarding')
      return
    }

    // Fully set up — allow through (no redirect, just reset guard)
    redirectedRef.current = false
  }, [bootstrap, isLoading, isPublicPath, router])

  // Public paths always render
  if (isPublicPath) return <>{children}</>

  // Still loading first bootstrap response — render nothing to avoid flash
  if (isLoading || !bootstrap) return null

  // Not ready — redirect is in flight, don't render app content
  if (!bootstrap.authenticated || !bootstrap.has_workspace || !bootstrap.onboarding_complete) {
    return null
  }

  return <>{children}</>
}
