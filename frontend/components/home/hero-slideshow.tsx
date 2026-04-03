'use client'
import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { mediaUrl } from '@/lib/api-client'
import type { Photo } from '@/types'

interface HeroSlideshowProps {
  photos: Photo[]
  familyName?: string
}

export function HeroSlideshow({ photos, familyName = 'Our Frame' }: HeroSlideshowProps) {
  const [index, setIndex] = useState(0)
  const [loaded, setLoaded] = useState<Record<number, boolean>>({})

  const next = useCallback(() => setIndex((i) => (i + 1) % photos.length), [photos.length])
  const prev = useCallback(
    () => setIndex((i) => (i - 1 + photos.length) % photos.length),
    [photos.length]
  )

  useEffect(() => {
    if (photos.length < 2) return
    const id = setInterval(next, 7000)
    return () => clearInterval(id)
  }, [next, photos.length])

  /* ── Empty / placeholder state ── */
  if (photos.length === 0) {
    return (
      <section className="relative flex h-screen min-h-[600px] items-center justify-center overflow-hidden bg-card">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `radial-gradient(ellipse at 55% 45%, var(--amber-muted) 0%, transparent 65%)`,
          }}
        />
        <div className="relative z-10 text-center px-8 space-y-4">
          <p className="text-eyebrow" style={{ color: 'var(--amber)' }}>
            Family Archive
          </p>
          <p className="font-serif text-5xl font-medium italic md:text-6xl lg:text-7xl text-foreground">
            The{' '}
            <span style={{ color: 'var(--amber)' }}>{familyName}</span>
            {' '}Family
          </p>
          <p className="text-sm text-muted-foreground">
            Your photos will appear here once Google Drive is synced
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="relative h-screen min-h-[600px] w-full overflow-hidden bg-black">
      {/* ── Slides ── */}
      {photos.map((photo, i) => {
        const active = i === index
        return (
          <div
            key={photo.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              active ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            aria-hidden={!active}
          >
            {/* Blurred ambient backdrop — fills the frame warmly */}
            <img
              src={mediaUrl(photo.thumbnail_url)}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full scale-110 object-cover blur-3xl opacity-25"
            />

            {/* Main photo — cinematic contain layout, never cropped */}
            <div className="relative z-10 flex h-full w-full items-center justify-center">
              <img
                src={mediaUrl(photo.thumbnail_url)}
                alt={photo.name}
                onLoad={() => setLoaded((prev) => ({ ...prev, [i]: true }))}
                className={`max-h-full max-w-full object-contain drop-shadow-2xl transition-transform duration-[8000ms] ease-out ${
                  active ? 'scale-[1.04]' : 'scale-100'
                } ${loaded[i] ? 'opacity-100' : 'opacity-0'}`}
                style={{ transition: active ? 'transform 8000ms ease-out, opacity 600ms ease' : 'opacity 600ms ease' }}
              />
            </div>
          </div>
        )
      })}

      {/* ── Cinematic vignette — bottom-heavy, edges softened ── */}
      <div
        className="absolute inset-0 z-20 pointer-events-none"
        style={{
          background: `
            linear-gradient(to top,    var(--hero-gradient-from) 0%, transparent 50%, var(--hero-gradient-to) 100%),
            linear-gradient(to right,  oklch(0 0 0 / 20%) 0%, transparent 30%),
            linear-gradient(to left,   oklch(0 0 0 / 20%) 0%, transparent 30%)
          `,
        }}
      />

      {/* ── Title overlay — bottom left, minimal, tasteful ── */}
      <div className="absolute inset-x-0 bottom-16 z-30 flex flex-col items-center text-center px-6 pointer-events-none">
        <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-white/45 mb-3">
          Family Archive
        </p>
        <h1 className="font-serif text-5xl font-medium italic leading-tight text-white drop-shadow-lg md:text-6xl lg:text-7xl">
          The{' '}
          <span style={{ color: 'var(--amber)' }}>{familyName}</span>
          {' '}Family
        </h1>
        <p className="mt-3 text-sm text-white/50 font-light tracking-widest uppercase">
          Every moment, preserved.
        </p>
      </div>

      {/* ── Prev / Next — subtle, not loud ── */}
      {photos.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous photo"
            className="absolute left-5 top-1/2 z-30 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-black/30 text-white/70 backdrop-blur-sm transition-all duration-200 hover:bg-black/50 hover:text-white hover:scale-105"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            aria-label="Next photo"
            className="absolute right-5 top-1/2 z-30 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-black/30 text-white/70 backdrop-blur-sm transition-all duration-200 hover:bg-black/50 hover:text-white hover:scale-105"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* ── Dot indicators — slim, amber accent ── */}
      {photos.length > 1 && (
        <div className="absolute bottom-5 left-1/2 z-30 flex -translate-x-1/2 gap-1.5">
          {photos.slice(0, 15).map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className="rounded-full transition-all duration-300"
              style={{
                width:           i === index ? '1.75rem' : '0.35rem',
                height:          '0.35rem',
                backgroundColor: i === index ? 'var(--amber)' : 'rgba(255,255,255,0.25)',
              }}
            />
          ))}
        </div>
      )}

      {/* ── Scroll hint — subtle downward chevron ── */}
      <div className="absolute bottom-5 right-6 z-30 pointer-events-none">
        <p className="text-[10px] tracking-widest uppercase text-white/30">
          {index + 1} / {Math.min(photos.length, 15)}
        </p>
      </div>
    </section>
  )
}
