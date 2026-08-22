import { Metadata } from 'next'
import { Suspense } from 'react'
import { AuthCallbackView } from '@/components/auth/auth-callback-view'

export const metadata: Metadata = { title: 'Signing in… — Our Frame' }

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AuthCallbackView />
    </Suspense>
  )
}
