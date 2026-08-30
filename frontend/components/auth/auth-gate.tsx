'use client'

/**
 * AuthGate — wraps the entire app and enforces route rules.
 *
 * Single source of truth: GET /api/auth/bootstrap
 *
 * Route rules:
 *   not authenticated → /login
 *   authenticated     → allow through (setup state is handled by /home itself)
 *
 * Public paths bypass all checks and render immediately.
 */

import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { fetchBootstrap } from '@/lib/platform-api'

// Exact-match paths — '/' must be exact to avoid matching everything via startsWith
const PUBLIC_EXACT = ['/']
// Prefix-match paths
const PUBLIC_PREFIX = ['/login', '/onboarding', '/auth/callback']

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const isPublicPath =
    PUBLIC_EXACT.includes(pathname) ||
    PUBLIC_PREFIX.some((p) => pathname.startsWith(p))

  const { data: bootstrap, isLoading } = useQuery({
    queryKey: ['bootstrap'],
    queryFn: () => fetchBootstrap(),
    staleTime: 0,
    gcTime: 30_000,
    retry: false,
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

    redirectedRef.current = false
  }, [bootstrap, isLoading, isPublicPath, router])

  // Public paths always render
  if (isPublicPath) return <>{children}</>

  // Still loading — render nothing to avoid flash
  if (isLoading || !bootstrap) return null

  // Not authenticated — redirect in flight
  if (!bootstrap.authenticated) return null

  return <>{children}</>
}
