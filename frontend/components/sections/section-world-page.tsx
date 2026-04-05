'use client'
import { useRef } from 'react'
import Link from 'next/link'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { AlbumGrid } from '@/components/albums/album-grid'
import { AlbumGridSkeleton } from '@/components/albums/album-grid-skeleton'
import type { Album } from '@/types'

interface SectionWorldPageProps {
  albums: Album[]
  isLoading: boolean
  error: Error | null
  eyebrow: string
  heading: string
  description: string
  emptyMessage: string
  /** 'amber' gives gold eyebrow, 'muted' gives greyed portfolio feel */
  accentColor?: 'amber' | 'muted'
}

export function SectionWorldPage({
  albums,
  isLoading,
  error,
  eyebrow,
  heading,
  description,
  emptyMessage,
  accentColor = 'amber',
}: SectionWorldPageProps) {
  const headerRef = useRef<HTMLDivElement>(null)
  const inView     = useInView(headerRef, { once: true, margin: '-40px 0px' })
  const reduce     = useReducedMotion()

  const eyebrowColor = accentColor === 'amber' ? 'var(--amber)' : 'var(--muted-foreground)'

  return (
    <div className="min-h-screen">
      {/* ── Section hero header ── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(to bottom, oklch(0.155 0.012 48) 0%, var(--background) 100%)',
          paddingTop: '3rem',
          paddingBottom: '4rem',
        }}
      >
        {/* Subtle ambient glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              accentColor === 'amber'
                ? 'radial-gradient(ellipse at 60% 0%, oklch(0.70 0.145 58 / 8%) 0%, transparent 65%)'
                : 'radial-gradient(ellipse at 60% 0%, oklch(1 0 0 / 3%) 0%, transparent 65%)',
          }}
          aria-hidden="true"
        />

        <motion.div
          ref={headerRef}
          className="relative content-padding max-w-4xl"
          initial={{ opacity: 0, y: reduce ? 0 : 18 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <p
            className="text-eyebrow mb-4"
            style={{ color: eyebrowColor }}
          >
            {eyebrow}
          </p>
          <h1
            className="font-serif leading-[0.92] text-foreground"
            style={{
              fontSize: 'clamp(3rem, 7vw, 6rem)',
              fontStyle: 'italic',
              fontWeight: 600,
              letterSpacing: '-0.015em',
            }}
          >
            {heading}
          </h1>
          <p
            className="mt-4 max-w-md font-sans text-sm leading-relaxed"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {description}
          </p>

          {/* Album count pill */}
          {!isLoading && albums.length > 0 && (
            <p
              className="mt-5 font-sans text-xs font-medium tracking-[0.16em] uppercase"
              style={{ color: 'var(--muted-foreground)', opacity: 0.6 }}
            >
              {albums.length} {albums.length === 1 ? 'album' : 'albums'}
            </p>
          )}
        </motion.div>
      </div>

      {/* ── Divider ── */}
      <div
        className="content-padding"
        aria-hidden="true"
      >
        <div
          className="h-px"
          style={{ background: 'var(--border)' }}
        />
      </div>

      {/* ── Album grid ── */}
      <div className="content-padding py-10 pb-24">
        {error && (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-5 py-4 text-sm text-destructive mb-8">
            Could not load albums.{' '}
            {(error as Error).message?.includes('auth') ? (
              <a
                href={`${process.env.NEXT_PUBLIC_API_BASE}/auth/start`}
                className="underline underline-offset-2"
              >
                Sign in with Google
              </a>
            ) : (
              'Check that your Google Drive is connected.'
            )}
          </div>
        )}

        {isLoading ? (
          <AlbumGridSkeleton count={8} />
        ) : albums.length === 0 && !error ? (
          <EmptySection message={emptyMessage} />
        ) : (
          <AlbumGrid albums={albums} />
        )}
      </div>
    </div>
  )
}

function EmptySection({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
      >
        <span
          className="font-serif text-2xl"
          style={{ fontStyle: 'italic', color: 'var(--amber)', opacity: 0.6 }}
        >
          —
        </span>
      </div>
      <p
        className="max-w-sm font-sans text-sm leading-relaxed"
        style={{ color: 'var(--muted-foreground)' }}
      >
        {message}
      </p>
      <Link
        href="/photos"
        className="mt-2 font-sans text-xs font-semibold tracking-[0.18em] uppercase transition-opacity hover:opacity-100"
        style={{ color: 'var(--amber)', opacity: 0.75 }}
      >
        Browse all photos →
      </Link>
    </div>
  )
}
