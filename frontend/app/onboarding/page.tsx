'use client'

import Link from 'next/link'
import { ArrowRight, Check, Folder, Lock, ShieldCheck } from 'lucide-react'
import { getLoginUrl } from '@/lib/platform-api'

const GOOGLE_ICON = (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
    <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.96l3.007 2.333C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
)

const FOLDERS = [
  { label: 'Family', count: '1,243 items', checked: true },
  { label: 'Travel', count: '892 items', checked: true },
  { label: 'Milestones', count: '612 items', checked: true },
  { label: 'Life', count: '431 items', checked: false },
]

export default function OnboardingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050403] px-6 py-6 text-white sm:px-10 lg:px-16">
      <div
        aria-hidden
        className="absolute inset-0 bg-[url('/landing/memory-collage.png')] bg-cover bg-[position:68%_50%] opacity-70"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,3,2,0.95)_0%,rgba(5,4,3,0.78)_48%,rgba(5,4,3,0.34)_100%)]" />

      <header className="relative z-10 flex items-center justify-between">
        <Link href="/" className="font-serif text-3xl font-semibold italic leading-none">
          <span
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
        <Link href="/login" className="text-sm text-white/64 transition-colors hover:text-[#f8c160]">
          Sign in
        </Link>
      </header>

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center justify-center py-14">
        <div className="grid w-full gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="mx-auto max-w-xl space-y-7 text-center lg:text-left">
            <p className="font-sans text-[0.72rem] font-medium uppercase tracking-[0.42em] text-[#f6b44d]">
              First time setup
            </p>
            <h1 className="font-serif text-5xl leading-[0.95] text-[#fbfaf7] sm:text-6xl">
              Connect your
              <br />
              <em className="bg-gradient-to-r from-[#ffc75f] via-[#ffe2a0] to-[#f29b32] bg-clip-text font-normal not-italic text-transparent">
                Google Drive
              </em>
            </h1>
            <p className="mx-auto max-w-md text-lg leading-8 text-white/72 lg:mx-0">
              Your memories stay safely in Google Drive. We will help you choose what to import and organize in Our Frame.
            </p>
            <div className="mx-auto max-w-sm rounded-2xl border border-[#f8c160]/24 bg-black/24 p-5 text-left shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-md lg:mx-0">
              <div className="flex items-start gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#f8c160]/36 text-[#f8c160]">
                  <ShieldCheck className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="font-medium text-[#f8c160]">Private by design</p>
                  <p className="mt-1 text-sm leading-6 text-white/62">
                    We save setup preferences and lightweight metadata. Your original photos and videos remain in Google Drive.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-xl rounded-3xl border border-[#f8c160]/24 bg-black/42 p-6 shadow-[0_28px_90px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-8">
            <div className="mb-8 grid grid-cols-3 gap-3 text-center text-xs text-white/46">
              {['Connect account', 'Choose folders', 'Finish setup'].map((step, index) => (
                <div key={step} className={index === 0 ? 'text-[#f8c160]' : ''}>
                  <span className="mx-auto mb-2 grid h-7 w-7 place-items-center rounded-full bg-white/10 text-xs">
                    {index + 1}
                  </span>
                  {step}
                </div>
              ))}
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <h2 className="font-serif text-3xl text-white">
                  1. Connect your Google Drive
                </h2>
                <p className="text-sm leading-6 text-white/58">
                  Securely connect to see your photos and videos.
                </p>
                <a
                  href={getLoginUrl()}
                  className="inline-flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#ffd66f] via-[#ffbd4c] to-[#f19a34] px-6 py-4 font-semibold text-[#120b04] transition duration-300 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0"
                >
                  {GOOGLE_ICON}
                  Connect Google Drive
                </a>
                <p className="flex items-center justify-center gap-2 text-xs text-white/46">
                  <Lock className="h-3.5 w-3.5 text-[#f8c160]" aria-hidden />
                  We use Google&apos;s secure OAuth to connect.
                </p>
              </div>

              <div className="h-px bg-white/12" />

              <div className="space-y-3">
                <h2 className="font-serif text-2xl text-white">
                  2. Choose folders to import
                </h2>
                <p className="text-sm leading-6 text-white/58">
                  Pick the albums and folders you would like to bring into Our Frame. You can change this later.
                </p>
                <div className="space-y-2">
                  {FOLDERS.map((folder) => (
                    <div
                      key={folder.label}
                      className="grid grid-cols-[1.5rem_1fr_auto_auto] items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm"
                    >
                      <span className="grid h-5 w-5 place-items-center rounded border border-[#f8c160]/48 text-[#120b04]">
                        {folder.checked && <Check className="h-4 w-4 rounded-sm bg-[#f8c160] p-0.5" aria-hidden />}
                      </span>
                      <span className="flex items-center gap-2 text-white/86">
                        <Folder className="h-4 w-4 text-[#f8c160]/78" aria-hidden />
                        {folder.label}
                      </span>
                      <span className="text-white/46">{folder.count}</span>
                      <ArrowRight className="h-4 w-4 text-white/36" aria-hidden />
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                disabled
                className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-xl bg-white/10 px-6 py-4 font-medium text-white/36"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
