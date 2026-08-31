'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { mediaUrl, previewUrl } from '@/lib/api-client'
import type { Photo } from '@/types'

interface HeroSlideshowProps {
  photos: Photo[]
}

export function HeroSlideshow({ photos }: HeroSlideshowProps) {
  const [index, setIndex] = useState(0)
  const [prev, setPrev] = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const reduce = useReducedMotion()

  const advance = useCallback((dir: 1 | -1) => {
    setIndex((current) => {
      if (photos.length === 0) return 0
      const next = (current + dir + photos.length) % photos.length
      setPrev(current)
      return next
    })
  }, [photos.length])

  useEffect(() => {
    if (prev === null) return
    const timeout = setTimeout(() => setPrev(null), 900)
    return () => clearTimeout(timeout)
  }, [prev])

  useEffect(() => {
    if (photos.length < 2 || reduce) return
    timerRef.current = setInterval(() => advance(1), 9000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [advance, photos.length, reduce])

  useEffect(() => {
    if (photos.length === 0) return
    const next = photos[(index + 1) % photos.length]
    if (!next) return
    const img = new window.Image()
    img.src = next.preview_url ? mediaUrl(next.preview_url) : previewUrl(next.id)
  }, [index, photos])

  if (photos.length === 0) {
    return (
      <section className="relative min-h-[28rem] overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] sm:min-h-[32rem]">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,oklch(0.18_0.018_48),oklch(0.09_0.008_46))]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,oklch(0.70_0.145_58_/_18%),transparent_62%)]" />
        <HeroCopy />
      </section>
    )
  }

  const slideStack = prev !== null && prev !== index && photos[prev] ? [index, prev] : [index]

  return (
    <section className="relative min-h-[28rem] overflow-hidden rounded-2xl border border-border bg-black shadow-[var(--shadow-card)] sm:min-h-[32rem]">
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

      <div
        className="absolute inset-0 z-20 pointer-events-none"
        style={{
          background:
            'linear-gradient(to top, oklch(0.04 0.006 46 / 92%) 0%, oklch(0.04 0.006 46 / 58%) 42%, oklch(0.04 0.006 46 / 16%) 100%), linear-gradient(to right, oklch(0.04 0.006 46 / 55%) 0%, transparent 62%)',
        }}
      />

      <HeroCopy />

      {photos.length > 1 && (
        <>
          <div className="absolute bottom-5 right-5 z-30 flex items-center gap-2">
            <button
              onClick={() => advance(-1)}
              aria-label="Previous photo"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/25 text-white/70 backdrop-blur transition hover:bg-black/40 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => advance(1)}
              aria-label="Next photo"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/25 text-white/70 backdrop-blur transition hover:bg-black/40 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="absolute bottom-6 left-6 z-30 hidden items-center gap-2 sm:flex">
            {photos.slice(0, 8).map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setPrev(index)
                  setIndex(i)
                }}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
                className="flex h-5 w-5 items-center justify-center rounded-full"
              >
                <span
                  className="h-1 rounded-full transition-all duration-300"
                  style={{
                    width: i === index ? '1.25rem' : '0.25rem',
                    backgroundColor: i === index ? 'var(--amber)' : 'oklch(1 0 0 / 34%)',
                  }}
                />
              </button>
            ))}
            <span className="ml-2 text-[10px] font-medium uppercase tracking-[0.16em] text-white/45">
              {String(index + 1).padStart(2, '0')} / {String(Math.min(photos.length, 8)).padStart(2, '0')}
            </span>
          </div>
        </>
      )}
    </section>
  )
}

function HeroCopy() {
  return (
    <motion.div
      className="absolute inset-x-0 bottom-0 z-30 max-w-2xl p-6 pb-16 sm:p-8 sm:pb-20 lg:p-10 lg:pb-20"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      <p className="text-eyebrow-gold drop-shadow">Welcome Home</p>
      <h1 className="mt-3 max-w-xl font-serif text-5xl font-semibold italic leading-[0.95] text-white drop-shadow-2xl sm:text-6xl lg:text-7xl">
        Every frame holds a story.
      </h1>
      <p className="mt-4 max-w-lg text-body text-white/82 drop-shadow">
        A place for favorite people, big milestones, family films, and the little moments in between.
      </p>
      <Link
        href="/memories"
        className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        Explore memories
        <ArrowRight className="h-4 w-4" />
      </Link>
    </motion.div>
  )
}

interface SlideImageProps {
  src: string
  alt: string
  active: boolean
  reduce: boolean
}

function SlideImage({ src, alt, active, reduce }: SlideImageProps) {
  return (
    <div
      className="absolute inset-0 transition-opacity duration-[900ms] ease-in-out"
      style={{ opacity: active ? 1 : 0, zIndex: active ? 0 : 1 }}
      aria-hidden={!active}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ filter: 'blur(34px) brightness(0.55) saturate(1.05)', transform: 'scale(1.22)' }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="absolute inset-0 h-full w-full object-contain"
        style={{
          animation: reduce ? 'none' : 'kenBurns 9s ease-out forwards',
        }}
      />
      <div className="absolute right-5 top-5 z-10 hidden items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-[11px] font-medium text-white/70 backdrop-blur sm:flex">
        <ImageIcon className="h-3.5 w-3.5 text-amber" />
        Slideshow
      </div>
    </div>
  )
}
