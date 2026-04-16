'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Lock, Image as ImageIcon, Heart } from 'lucide-react'
import { getLoginUrl } from '@/lib/platform-api'
import { useCurrentUser, useWorkspaces } from '@/hooks/use-auth'

const FEATURES = [
  {
    icon: ImageIcon,
    title: 'Your photos, your Drive',
    description: 'Originals stay in your Google Drive. We never copy or store them.',
  },
  {
    icon: Lock,
    title: 'Private by default',
    description: 'Your workspace is completely private until you decide otherwise.',
  },
  {
    icon: Heart,
    title: 'Built for families',
    description: 'A warm, editorial space for the moments that matter most.',
  },
]

export function LoginView() {
  const router = useRouter()
  const { data: user, isLoading: userLoading } = useCurrentUser()
  const { data: workspaces, isLoading: wsLoading } = useWorkspaces()

  // If the user is already authenticated, route them to the right place
  useEffect(() => {
    if (userLoading || !user) return
    if (wsLoading) return
    if (!workspaces || workspaces.length === 0) {
      router.replace('/onboarding')
      return
    }
    if (!workspaces[0].onboarding_complete) {
      router.replace('/onboarding')
      return
    }
    router.replace('/')
  }, [user, userLoading, workspaces, wsLoading, router])

  // Show nothing while checking auth (avoids flashing the login form)
  if (userLoading) return null

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-8 py-6 flex items-center gap-3">
        <span className="font-serif text-xl text-primary">Our Frame</span>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-sans">
                Your family memory vault
              </p>
              <h1 className="font-serif text-4xl lg:text-5xl leading-tight text-foreground">
                Every moment,{' '}
                <em className="text-primary not-italic">beautifully kept</em>
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
                A private, warm space to browse, revisit, and cherish your family photos —
                powered by your own Google Drive.
              </p>
            </div>

            <ul className="space-y-5">
              {FEATURES.map(({ icon: Icon, title, description }) => (
                <li key={title} className="flex gap-4 items-start">
                  <span className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-primary" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="bg-card border border-border rounded-2xl p-8 lg:p-10 space-y-7 shadow-lg">
              <div className="space-y-2">
                <h2 className="font-serif text-2xl text-foreground">Welcome back</h2>
                <p className="text-sm text-muted-foreground">
                  Sign in with the Google account that owns your photo Drive.
                </p>
              </div>

              <a
                href={getLoginUrl()}
                className="flex items-center justify-center gap-3 w-full px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm transition-opacity hover:opacity-90 active:opacity-75"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                  <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.96l3.007 2.333C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </a>

              <p className="text-xs text-muted-foreground text-center leading-relaxed">
                By continuing, you agree that your photos remain in your own Google Drive.
                Our Frame never stores originals.
              </p>

              <div className="border-t border-border pt-5 text-xs text-muted-foreground space-y-1.5">
                <p>🔒 Read-only Drive access only</p>
                <p>🏠 All media served directly from your Drive</p>
                <p>🚫 No photo uploads to our servers</p>
              </div>
            </div>
          </motion.div>

        </div>
      </main>
    </div>
  )
}
