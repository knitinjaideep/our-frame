'use client'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function LandingPage() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: 'var(--background)' }}
    >
      {/* Logo / wordmark */}
      <div className="mb-12 text-center">
        <h1
          className="font-serif text-5xl sm:text-6xl font-semibold italic leading-tight"
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
        </h1>
        <p
          className="mt-4 font-sans text-base sm:text-lg"
          style={{ color: 'var(--muted-foreground)', maxWidth: '30rem', margin: '1rem auto 0' }}
        >
          A private archive for the memories that matter most — backed by your own Google Drive.
        </p>
      </div>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <a
          href={`${process.env.NEXT_PUBLIC_API_BASE}/auth/start`}
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-medium text-sm transition-opacity hover:opacity-90"
          style={{
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
          }}
        >
          Sign in with Google
          <ArrowRight className="h-4 w-4" />
        </a>
        <Link
          href="/login"
          className="text-sm font-medium transition-colors hover:text-foreground"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Learn more
        </Link>
      </div>

      {/* Fine print */}
      <p
        className="mt-16 text-xs text-center"
        style={{ color: 'var(--muted-foreground)', opacity: 0.45, maxWidth: '22rem' }}
      >
        Your photos stay in your Google Drive. We never store originals.
      </p>
    </main>
  )
}
