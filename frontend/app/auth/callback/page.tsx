import { Metadata } from 'next'
import { AuthCallbackView } from '@/components/auth/auth-callback-view'

export const metadata: Metadata = { title: 'Signing in… — Our Frame' }

export default function AuthCallbackPage() {
  return <AuthCallbackView />
}
