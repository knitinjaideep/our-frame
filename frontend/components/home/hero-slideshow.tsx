'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { mediaUrl, previewUrl } from '@/lib/api-client'
import type { Photo } from '@/types'

interface HeroSlideshowProps {
  photos: Photo[]
  familyName?: string
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

export function HeroSlideshow({ photos, familyName = 'Our Frame' }: HeroSlideshowProps) {
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
        <div className="relative z-10 w-full pb-20 space-y-3 content-padding">
          <p className="text-[10px] font-semibold tracking-[0.30em] uppercase"
            style={{ color: 'var(--amber)', opacity: 0.75 }}>
            Our Frame
          </p>
          <h1 className="font-serif leading-[0.95] text-white"
            style={{ fontSize: 'clamp(3.5rem, 9vw, 7rem)', fontStyle: 'italic', fontWeight: 500 }}>
            Our Story
          </h1>
          <p className="font-sans text-[11px] font-semibold tracking-[0.28em] uppercase text-gold-shimmer mt-1">
            Kotcherlakota
          </p>
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
        onLoad={() => setLoaded((p) => ({ ...p, [index]: true }))}
      />

      {/* ── Cinematic gradient overlay ── */}
      <div
        className="absolute inset-0 z-20 pointer-events-none"
        style={{
          background: `
            linear-gradient(to top,    oklch(0.04 0.004 48 / 90%) 0%,  oklch(0.04 0.004 48 / 50%) 28%, transparent 55%),
            linear-gradient(to bottom, oklch(0.04 0.004 48 / 50%) 0%,  transparent 22%),
            linear-gradient(to right,  oklch(0.04 0.004 48 / 35%) 0%,  transparent 42%)
          `,
        }}
      />

      {/* ── Hero text — uses content-padding for consistent offset ── */}
      <motion.div
        className="absolute bottom-24 z-30 pointer-events-none max-w-xl content-padding"
        style={{ left: 0 }}
        initial={{ opacity: 0, y: reduce ? 0 : 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.1, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <p
          className="mb-3 font-sans text-[9px] font-semibold tracking-[0.30em] uppercase"
          style={{ color: 'var(--amber)', opacity: 0.80 }}
        >
          Our Frame
        </p>

        <h1
          className="font-serif leading-[0.92] text-white drop-shadow-2xl"
          style={{
            fontSize: 'clamp(3.25rem, 7vw, 6.5rem)',
            fontStyle: 'italic',
            fontWeight: 500,
            textShadow: '0 2px 40px oklch(0 0 0 / 50%)',
          }}
        >
          Our Story
        </h1>

        {/* Family name — gold shimmer, editorial */}
        <p
          className="mt-4 font-sans text-[13px] font-semibold tracking-[0.32em] uppercase text-gold-shimmer"
          style={{ letterSpacing: '0.32em' }}
        >
          {familyName || 'Kotcherlakota'}
        </p>

        <p
          className="mt-2 font-sans text-[10px] font-light tracking-[0.20em] uppercase"
          style={{ color: 'oklch(1 0 0 / 30%)' }}
        >
          Every moment, preserved
        </p>
      </motion.div>

      {/* ── Scroll indicator ── */}
      <div className="absolute bottom-8 left-1/2 z-30 -translate-x-1/2 flex flex-col items-center gap-1.5 pointer-events-none">
        <div
          className="h-8 w-px"
          style={{
            background: 'linear-gradient(to bottom, transparent, oklch(1 0 0 / 30%))',
          }}
        />
      </div>

      {/* ── Slide counter ── */}
      {photos.length > 1 && (
        <div className="absolute bottom-8 right-8 z-30 flex items-center gap-3 md:right-12 lg:right-16 xl:right-20">
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
  onLoad: () => void
}

function SlideImage({ src, alt, origin, active, onLoad }: SlideImageProps) {
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
          animation: active ? 'kenBurns 20s ease-out forwards' : 'none',
        }}
      />
    </div>
  )
}
