'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowRight, Image as ImageIcon, ShieldCheck, Sparkles, Star } from 'lucide-react'
import { getLoginUrl } from '@/lib/platform-api'
import { useCurrentUser } from '@/hooks/use-auth'

const FEATURES = [
  {
    icon: ShieldCheck,
    title: 'Private by default',
    description: 'Your access remains yours.',
  },
  {
    icon: ImageIcon,
    title: 'Media stays in Google Drive',
    description: 'We never move or store your original files.',
  },
  {
    icon: Star,
    title: 'Built to last',
    description: 'Organized, elegant, and made for life.',
  },
]

const GOOGLE_ICON = (
  <svg width="22" height="22" viewBox="0 0 18 18" fill="none" aria-hidden>
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
    <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.96l3.007 2.333C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
)

export function LoginView() {
  const router = useRouter()
  const { data: user, isLoading: userLoading } = useCurrentUser()
  const loginUrl = getLoginUrl()

  // Already authenticated — go straight to home (setup state handled there)
  useEffect(() => {
    if (userLoading || !user) return
    router.replace('/home')
  }, [user, userLoading, router])

  // Show nothing while checking auth (avoids flashing the login form)
  if (userLoading) return null

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050403] text-white">
      <div
        aria-hidden
        className="absolute inset-0 bg-[url('/landing/memory-collage.png')] bg-cover bg-[position:32%_50%] opacity-95 max-md:h-[42rem] max-md:bg-[position:63%_0%]"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_62%_20%,rgba(219,144,55,0.16),transparent_34%),linear-gradient(90deg,rgba(3,3,2,0.98)_0%,rgba(5,4,3,0.92)_34%,rgba(5,4,3,0.52)_57%,rgba(5,4,3,0.16)_100%)] max-md:bg-[linear-gradient(180deg,rgba(3,3,2,0.2)_0%,rgba(4,4,3,0.52)_23rem,rgba(4,4,3,0.96)_39rem,rgba(4,4,3,1)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#050403] to-transparent" />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10 lg:px-16">
        <Link href="/" className="group inline-flex items-center">
          <span
            className="font-serif text-3xl font-semibold italic leading-none"
            style={{
              background:
                'linear-gradient(105deg, var(--gold-shadow) 0%, var(--gold-mid) 40%, var(--gold-highlight) 55%, var(--gold-mid) 70%, var(--gold-shadow) 100%)',
              backgroundSize: '250% auto',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Our Frame
          </span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-white/66 sm:flex">
          <a href="#about" className="transition-colors hover:text-[#f8c160]">About</a>
          <a href="#privacy" className="transition-colors hover:text-[#f8c160]">Privacy</a>
          <a href="mailto:help@ourframe.app" className="transition-colors hover:text-[#f8c160]">Help</a>
          <a href="#google-sign-in" className="transition-colors hover:text-[#f8c160]">Sign in</a>
        </nav>
      </header>

      <main className="relative z-10 flex min-h-[calc(100vh-4.5rem)] items-center justify-start px-6 pb-12 pt-8 sm:px-10 lg:px-16 lg:py-10">
        <motion.section
          id="about"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto w-full max-w-[43rem] space-y-10 text-center max-md:mt-[22rem] max-sm:mt-[18rem] lg:mx-0 lg:ml-[clamp(2rem,6vw,7rem)] lg:text-left"
        >
          <div className="space-y-6">
            <p className="font-sans text-[0.72rem] font-medium uppercase tracking-[0.42em] text-[#f6b44d]">
              Your personal photo vault
            </p>
            <h1 className="mx-auto max-w-[41rem] font-serif text-[clamp(4rem,6vw,6rem)] leading-[0.9] text-[#fbfaf7] lg:mx-0">
              Your memories,
              <br />
              <em className="bg-gradient-to-r from-[#ffc75f] via-[#ffe2a0] to-[#f29b32] bg-clip-text font-normal italic text-transparent">
                beautifully kept.
              </em>
            </h1>
            <div className="mx-auto max-w-[38rem] space-y-4 text-balance lg:mx-0">
              <p className="text-xl leading-relaxed text-white/88 sm:text-2xl">
                A private home for your photos and videos - browse, revisit, and organize the people, places, and moments that matter most.
              </p>
              <p className="mx-auto max-w-[32rem] text-base leading-7 text-white/58 sm:text-lg lg:mx-0">
                Your original media stays in Google Drive. Our Frame helps you view and organize it beautifully.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <a
              id="google-sign-in"
              href={loginUrl}
              className="inline-flex w-full max-w-[33rem] items-center justify-center gap-5 rounded-xl bg-gradient-to-r from-[#ffd66f] via-[#ffbd4c] to-[#f19a34] px-8 py-5 text-lg font-semibold text-[#120b04] shadow-[0_20px_58px_rgba(242,153,52,0.22)] transition duration-300 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0"
            >
              {GOOGLE_ICON}
              Continue with Google
            </a>
            <div>
              <a
                href="/onboarding"
                className="group inline-flex items-center gap-3 border-b border-[#f8c160]/70 pb-1 text-lg text-[#f8c160] transition-colors hover:text-[#ffdc91]"
              >
                <Sparkles className="h-5 w-5" aria-hidden />
                New here? Connect Google Drive
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden />
              </a>
            </div>
            <p className="mx-auto max-w-[34rem] text-sm leading-6 text-white/48 lg:mx-0">
              Sign in if you already use Our Frame, or connect Google Drive to create your private vault.
            </p>
          </div>

          <ul id="privacy" className="mx-auto grid max-w-[43rem] grid-cols-1 gap-6 pt-6 sm:grid-cols-3 sm:gap-0 lg:mx-0">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <li
                key={title}
                className="flex justify-center gap-4 text-left sm:block sm:px-8 sm:text-left sm:first:pl-0 sm:[&:not(:last-child)]:border-r sm:[&:not(:last-child)]:border-white/14"
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-[#f8c160]/42 bg-[#f8c160]/8 text-[#f8c160] shadow-[0_0_24px_rgba(248,193,96,0.08)] sm:mb-4">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="text-base font-medium text-white">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-white/58">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </motion.section>

      </main>
    </div>
  )
}
