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

export function HeroSlideshow({ photos }: HeroSlideshowProps) {
  const [index, setIndex]   = useState(0)
  const [prev, setPrev]     = useState<number | null>(null)
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
    // Autoplay is suppressed for prefers-reduced-motion: an unattended,
    // self-advancing full-bleed slideshow is exactly the moving content that
    // setting asks us to stop. The prev/next arrows and the dots still work,
    // so no content becomes unreachable.
    if (reduce) return
    timerRef.current = setInterval(() => advance(1), 10000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [advance, photos.length, reduce])

  useEffect(() => {
    if (photos.length === 0) return
    const nextIdx = (index + 1) % photos.length
    const next = photos[nextIdx]
    if (!next) return
    const img = new window.Image()
    // Preload the full-quality preview for the next slide
    img.src = next.preview_url ? mediaUrl(next.preview_url) : previewUrl(next.id)
  }, [index, photos])

  /* ── Empty state ──
     Height/min-height come from `.hero-slideshow` in globals.css only: an
     inline `minHeight` here (or on the real hero below) wins over the
     stylesheet and would undo the shorter 78dvh/26rem mobile hero. */
  if (photos.length === 0) {
    return (
      <section
        className="hero-slideshow relative flex w-full items-end overflow-hidden"
        style={{ background: 'oklch(0.10 0.006 50)' }}
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

  /* ── Slide stack ──
     Rendered as ONE keyed array rather than two separate JSX slots. With
     separate slots, changing `key={`slide-${index}`}` unmounted the outgoing
     node and mounted the incoming one already at `opacity: 1`, so neither
     side ever ran its 1400ms opacity transition and the "cross-fade" was in
     practice a hard cut. Keying by photo index inside a single array lets
     React preserve the outgoing node so it can actually animate out.

     Order matters: the incoming (active) slide is rendered FIRST, i.e.
     underneath, at full opacity, and the outgoing slide LAST, on top, fading
     1 → 0. That is a true dissolve — the alternative (fade the incoming in
     over black) dips to ~25% black mid-transition. */
  const slideStack =
    prev !== null && prev !== index && photos[prev] ? [index, prev] : [index]

  return (
    <section className="hero-slideshow relative w-full overflow-hidden bg-black">
      {slideStack.map((i) => {
        const photo = photos[i]
        return (
          <SlideImage
            key={i}
            src={photo.preview_url ? mediaUrl(photo.preview_url) : previewUrl(photo.id)}
            alt={photo.name}
            active={i === index}
            reduce={!!reduce}
          />
        )
      })}

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
          {/* Dot row is hidden below `sm`: giving each dot an accessible
              24x24 tap target widens the row from ~138px to ~310px, which
              (plus the counter and the right offset) no longer fits a 375px
              phone — it would overflow horizontally and collide with the
              centered scroll indicator. On phones the counter plus the
              always-present nav arrows carry the same affordance. */}
          <div className="hidden items-center gap-0.5 sm:flex">
            {photos.slice(0, 12).map((_, i) => (
              <button
                key={i}
                onClick={() => { setPrev(index); setIndex(i) }}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
                className="flex shrink-0 items-center justify-center rounded-full"
                style={{ width: '1.5rem', height: '1.5rem' }}
              >
                <span
                  className="rounded-full transition-all duration-500"
                  style={{
                    width:           i === index ? '1.75rem' : '0.25rem',
                    height:          '0.25rem',
                    backgroundColor: i === index ? 'var(--amber)' : 'oklch(1 0 0 / 28%)',
                  }}
                />
              </button>
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

/* ── Individual slide ──
   Every slide must start showing the COMPLETE photograph — no cropped
   faces/subjects at the first frame, per docs/OUR-FRAME-DESIGN-SYSTEM.md
   §7. The foreground image always uses object-fit: contain (never
   `cover`, which can crop a face on close-up portraits or group shots
   whose aspect ratio doesn't match the hero band). A blurred, darkened
   copy of the same photograph fills the letterboxed space behind it —
   this reads as an intentional cinematic frame rather than empty bars,
   and naturally disappears for landscape photos whose aspect ratio
   already fills the hero. Ken Burns (when enabled) only ever scales the
   contained image up a hair from its centered rest position, so any
   "crop" it introduces eats into the letterbox margin, never the
   subject itself. */
interface SlideImageProps {
  src: string
  alt: string
  active: boolean
  reduce: boolean
}

function SlideImage({ src, alt, active, reduce }: SlideImageProps) {
  return (
    <div
      className="absolute inset-0 transition-opacity duration-[1400ms] ease-in-out"
      // Stacking is set explicitly rather than left to DOM order: the
      // outgoing slide must sit ON TOP of the incoming one so it can dissolve
      // away over a fully-opaque new photograph. Both stay below the z-20
      // gradient scrim and the z-30 chrome.
      style={{ opacity: active ? 1 : 0, zIndex: active ? 0 : 1 }}
      aria-hidden={!active}
    >
      {/* Blurred/darkened backdrop — fills the frame behind letterboxed
          (typically portrait) photos instead of cropping/stretching them.
          Same `src` as the foreground, so this costs no extra network
          request — the browser serves the second <img> from cache.

          The overscale has to exceed the blur's reach (~3× the radius) or
          the blurred copy fades to transparent before it reaches the frame
          edge and the black section background shows through as a smoky
          band along the top/bottom. Verified in a headless-Chrome harness at
          the real 1440×738 hero size: blur(48px)/scale(1.15) bled visibly;
          blur(40px)/scale(1.45) covers cleanly. */}
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ filter: 'blur(40px) brightness(0.55) saturate(1.05)', transform: 'scale(1.45)' }}
      />

      {/* Full, uncropped photograph — always visible from the first frame. */}
      <img
        src={src}
        alt={alt}
        className="absolute inset-0 h-full w-full object-contain"
        style={{
          transformOrigin: 'center center',
          // Gentle Ken Burns scale — skipped entirely for
          // prefers-reduced-motion (the global CSS rule collapses
          // transition durations, but a running @keyframes animation
          // isn't a transition, so it needs an explicit opt-out here).
          // Starts at scale(1) (full image, nothing pre-zoomed) and caps
          // at scale(1.03), well inside the docs/OUR-FRAME-DESIGN-SYSTEM.md
          // §7 range of scale(1.02)–(1.04), over 10s (within the 8–12s
          // range) — no panning, center-anchored only.
          //
          // Deliberately NOT gated on `active`: a slide node is only ever
          // mounted while it is the active one, and gating on `active` would
          // reset `animation` to 'none' the instant it becomes the outgoing
          // slide, snapping it from scale(1.03) back to scale(1) in full view
          // during the 1400ms fade-out.
          animation: reduce ? 'none' : 'kenBurns 10s ease-out forwards',
        }}
      />
    </div>
  )
}
