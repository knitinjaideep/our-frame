'use client'

/**
 * AuthCallbackView — landing page after Google login OAuth redirect.
 *
 * The backend redirects here as: /auth/callback?t=<session_token>
 *
 * We call GET /api/auth/bootstrap (with ?t= fallback) which returns a single
 * unified payload describing the full app state. We then route deterministically
 * based on `next_route` from that payload — no more racing independent queries.
 */

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { fetchBootstrap } from '@/lib/platform-api'
import { API_BASE } from '@/lib/api-client'

const SESSION_STORAGE_KEY = 'of_session_t'

export function AuthCallbackView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const qc = useQueryClient()
  const [status, setStatus] = useState('Completing sign-in…')

  useEffect(() => {
    const token = searchParams.get('t')

    // Store token in sessionStorage so apiFetch can use it as a fallback
    if (token) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, token)
    }

    async function resolve() {
      try {
        setStatus('Verifying your account…')

        // Single bootstrap call — returns everything we need to route
        const bootstrap = await fetchBootstrap(token)

        if (!bootstrap.authenticated || !bootstrap.user) {
          setStatus('Sign-in failed. Returning to login…')
          setTimeout(() => router.replace('/login'), 1500)
          return
        }

        // Seed React Query cache so downstream hooks don't re-fetch immediately
        qc.setQueryData(['currentUser'], bootstrap.user)
        qc.setQueryData(['bootstrap', token ?? null], bootstrap)

        setStatus('Loading your workspace…')

        // Route deterministically from bootstrap payload
        router.replace(bootstrap.next_route)

      } catch (err) {
        console.error('Auth callback error:', err)
        setStatus('Something went wrong. Returning to login…')
        setTimeout(() => router.replace('/login'), 2000)
      }
    }

    resolve()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-muted-foreground text-sm">{status}</p>
      </div>
    </div>
  )
}
