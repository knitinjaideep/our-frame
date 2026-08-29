'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { mediaUrl, previewUrl } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { EditorialEyebrow } from '@/components/design-system/editorial-eyebrow'
import type { Photo } from '@/types'

interface HeroSlideshowProps {
  photos: Photo[]
}

const KB_ORIGINS = [
  'center center',
  'top left',
  'bottom right',
  'top right',
  'bottom left',
  'center top',
  'center bottom',
]

export function HeroSlideshow({ photos }: HeroSlideshowProps) {
  const [index, setIndex]   = useState(0)
  const [prev, setPrev]     = useState<number | null>(null)
  const [loaded, setLoaded] = useState<Record<number, boolean>>({})
  const timerRef            = useRef<ReturnType<typeof setInterval> | null>(null)
  const reduce              = useReducedMotion()

  const advance = useCallback((dir: 1 | -1) => {
    setIndex((i) => {
      const next = (i + dir + photos.length) % photos.length
      setPrev(i)
      return next
    })
  }, [photos.length])

  useEffect(() => {
    if (prev === null) return
    const t = setTimeout(() => setPrev(null), 1400)
    return () => clearTimeout(t)
  }, [prev])

  useEffect(() => {
    if (photos.length < 2) return
    timerRef.current = setInterval(() => advance(1), 10000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [advance, photos.length])

  useEffect(() => {
    if (photos.length === 0) return
    const nextIdx = (index + 1) % photos.length
    const next = photos[nextIdx]
    if (!next) return
    const img = new window.Image()
    // Preload the full-quality preview for the next slide
    img.src = next.preview_url ? mediaUrl(next.preview_url) : previewUrl(next.id)
  }, [index, photos])

  /* ── Empty state ── */
  if (photos.length === 0) {
    return (
      <section
        className="hero-slideshow relative flex items-end overflow-hidden"
        style={{ width: '100vw', minHeight: 540, background: 'oklch(0.10 0.006 50)' }}
      >
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `
              radial-gradient(ellipse at 60% 40%, oklch(0.72 0.105 62 / 18%) 0%, transparent 65%),
              radial-gradient(ellipse at 25% 75%, oklch(0.55 0.08 55 / 10%) 0%, transparent 55%)
            `,
          }}
        />
        <div className="relative z-10 w-full max-w-2xl space-y-5 pb-32 content-padding">
          <EditorialEyebrow style={{ color: 'var(--amber-bright)' }}>Welcome Home</EditorialEyebrow>
          <h1 className="text-display text-white drop-shadow-2xl">
            Every frame holds a story.
          </h1>
          <p className="max-w-md text-body" style={{ color: 'oklch(1 0 0 / 80%)' }}>
            A place for our favorite people, our biggest milestones, and the
            little moments in between.
          </p>
          <Link
            href="/photos"
            className={cn(buttonVariants({ size: 'lg' }), 'mt-2 h-11 gap-2 px-6 text-[0.9rem] tracking-wide')}
          >
            Explore Our Story
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    )
  }

  const currentPhoto = photos[index]

  return (
    <section
      className="hero-slideshow relative overflow-hidden bg-black"
      style={{ width: '100vw', minHeight: 540 }}
    >

      {/* ── Previous slide (fading out) ── */}
      {prev !== null && photos[prev] && (
        <SlideImage
          key={`prev-${prev}`}
          src={photos[prev].preview_url ? mediaUrl(photos[prev].preview_url) : previewUrl(photos[prev].id)}
          alt={photos[prev].name}
          origin={KB_ORIGINS[prev % KB_ORIGINS.length]}
          active={false}
          reduce={!!reduce}
          onLoad={() => {}}
        />
      )}

      {/* ── Active slide ── */}
      <SlideImage
        key={`slide-${index}`}
        src={currentPhoto.preview_url ? mediaUrl(currentPhoto.preview_url) : previewUrl(currentPhoto.id)}
        alt={currentPhoto.name}
        origin={KB_ORIGINS[index % KB_ORIGINS.length]}
        active={true}
        reduce={!!reduce}
        onLoad={() => setLoaded((p) => ({ ...p, [index]: true }))}
      />

      {/* ── Cinematic gradient overlay ── */}
      <div
        className="absolute inset-0 z-20 pointer-events-none"
        style={{
          // The editorial block (eyebrow → headline → copy → CTA) is tall and
          // left-aligned, so the bottom scrim has to stay meaningfully dark
          // well past the old 55% stop or the top of the headline lands on an
          // ungraded region of a bright photograph. Kept as a smooth ramp so
          // the photo still reads as a photo rather than a muddy overlay.
          background: `
            linear-gradient(to top,    oklch(0.04 0.004 48 / 90%) 0%,  oklch(0.04 0.004 48 / 62%) 34%, oklch(0.04 0.004 48 / 30%) 62%, transparent 88%),
            linear-gradient(to bottom, oklch(0.04 0.004 48 / 50%) 0%,  transparent 22%),
            linear-gradient(to right,  oklch(0.04 0.004 48 / 45%) 0%,  oklch(0.04 0.004 48 / 18%) 40%, transparent 62%)
          `,
        }}
      />

      {/* ── Hero text — uses content-padding for consistent offset ── */}
      <motion.div
        className="absolute bottom-32 z-30 max-w-2xl content-padding md:bottom-36"
        style={{ left: 0 }}
        initial={{ opacity: 0, y: reduce ? 0 : 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduce ? 0 : 1.1, delay: reduce ? 0 : 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Brighter bronze + a soft shadow: the base --amber is too dim to
            clear AA at this 10px size when it sits over photography. */}
        <EditorialEyebrow
          className="mb-3"
          style={{ color: 'var(--amber-bright)', textShadow: '0 1px 14px oklch(0 0 0 / 70%)' }}
        >
          Welcome Home
        </EditorialEyebrow>

        <h1
          className="text-display text-white"
          style={{ textShadow: '0 2px 40px oklch(0 0 0 / 50%)' }}
        >
          Every frame holds a story.
        </h1>

        <p
          className="mt-5 max-w-md text-body"
          style={{ color: 'oklch(1 0 0 / 80%)', textShadow: '0 1px 18px oklch(0 0 0 / 60%)' }}
        >
          A place for our favorite people, our biggest milestones, and the
          little moments in between.
        </p>

        <Link
          href="/photos"
          className={cn(buttonVariants({ size: 'lg' }), 'mt-7 h-11 gap-2 px-6 text-[0.9rem] tracking-wide')}
        >
          Explore Our Story
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </motion.div>

      {/* ── Scroll indicator ──
          Anchored in the clear band between the floating chapter rail (which
          is pulled up over the hero's bottom ~56px — see home-feed-view.tsx)
          and the editorial text block above (bottom-32/36). At the old
          bottom-8 it was smudged behind the rail's backdrop blur. */}
      <div className="absolute bottom-20 left-1/2 z-30 -translate-x-1/2 flex flex-col items-center gap-1.5 pointer-events-none">
        <div
          className="h-8 w-px"
          style={{
            background: 'linear-gradient(to bottom, transparent, oklch(1 0 0 / 30%))',
          }}
        />
      </div>

      {/* ── Slide counter ── */}
      {photos.length > 1 && (
        <div className="absolute bottom-20 right-8 z-30 flex items-center gap-3 md:right-12 lg:right-16 xl:right-20">
          <div className="flex items-center gap-1.5">
            {photos.slice(0, 12).map((_, i) => (
              <button
                key={i}
                onClick={() => { setPrev(index); setIndex(i) }}
                aria-label={`Go to slide ${i + 1}`}
                className="rounded-full transition-all duration-500"
                style={{
                  width:           i === index ? '1.75rem' : '0.25rem',
                  height:          '0.25rem',
                  backgroundColor: i === index ? 'var(--amber)' : 'oklch(1 0 0 / 28%)',
                }}
              />
            ))}
          </div>

          <span
            className="font-sans text-[9px] font-medium tracking-[0.2em] tabular-nums"
            style={{ color: 'oklch(1 0 0 / 28%)' }}
          >
            {String(index + 1).padStart(2, '0')} / {String(Math.min(photos.length, 12)).padStart(2, '0')}
          </span>
        </div>
      )}

      {/* ── Nav arrows ── */}
      {photos.length > 1 && (
        <div className="absolute right-5 top-1/2 z-30 -translate-y-1/2 flex flex-col gap-2 md:right-8">
          <button
            onClick={() => advance(-1)}
            aria-label="Previous photo"
            className="flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: 'oklch(1 0 0 / 8%)',
              color: 'oklch(1 0 0 / 55%)',
              border: '1px solid oklch(1 0 0 / 10%)',
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => advance(1)}
            aria-label="Next photo"
            className="flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: 'oklch(1 0 0 / 8%)',
              color: 'oklch(1 0 0 / 55%)',
              border: '1px solid oklch(1 0 0 / 10%)',
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </section>
  )
}

/* ── Individual slide ── */
interface SlideImageProps {
  src: string
  alt: string
  origin: string
  active: boolean
  reduce: boolean
  onLoad: () => void
}

function SlideImage({ src, alt, origin, active, reduce, onLoad }: SlideImageProps) {
  return (
    <div
      className="absolute inset-0 transition-opacity duration-[1400ms] ease-in-out"
      style={{ opacity: active ? 1 : 0 }}
      aria-hidden={!active}
    >
      <img
        src={src}
        alt={alt}
        onLoad={onLoad}
        className="absolute inset-0 h-full w-full object-cover"
        style={{
          transformOrigin: origin,
          // Gentle Ken Burns scale/parallax — skipped entirely for
          // prefers-reduced-motion (the global CSS rule collapses
          // transition durations, but a running @keyframes animation
          // isn't a transition, so it needs an explicit opt-out here).
          animation: active && !reduce ? 'kenBurns 20s ease-out forwards' : 'none',
        }}
      />
    </div>
  )
}
