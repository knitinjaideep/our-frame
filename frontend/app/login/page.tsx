import { Metadata } from 'next'
import { LoginView } from '@/components/auth/login-view'

export const metadata: Metadata = {
  title: 'Sign In — Our Frame',
  description: 'Your private family memory vault.',
}

export default function LoginPage() {
  return <LoginView />
}
