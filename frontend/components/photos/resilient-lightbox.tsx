'use client'
/**
 * ResilientLightbox
 *
 * Wraps yet-another-react-lightbox with a custom image slide renderer that:
 *  1. Shows a spinner while the image loads
 *  2. On first failure: retries the same URL once (in case of transient network glitch)
 *  3. On second failure: retries with a cache-busting query param (stale cache eviction)
 *  4. On third failure: falls back to the content endpoint (raw bytes, no processing)
 *  5. On fourth failure: falls back to a large thumbnail URL (re-encoded JPEG, different path)
 *  6. Shows a clean error state with a manual retry button only after all fallbacks fail
 *
 * Each fallback attempt is logged to the console so failing file IDs are easy to trace.
 *
 * Navigation to a new slide always remounts this component (key={photoId}).
 */

import { useState, useCallback } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import Download from 'yet-another-react-lightbox/plugins/download'
import Video from 'yet-another-react-lightbox/plugins/video'
import 'yet-another-react-lightbox/styles.css'
import type { RenderSlideProps, SlideImage } from 'yet-another-react-lightbox'
import { thumbnailUrl, contentUrl } from '@/lib/api-client'

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function cacheBust(url: string): string {
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}_cb=${Date.now()}`
}

/** Returns the ordered list of URLs to try for a given photo. */
function buildFallbackChain(originalSrc: string, photoId?: string): string[] {
  const chain = [
    originalSrc,            // 1. normal preview
    originalSrc,            // 2. retry same (transient network glitch)
    cacheBust(originalSrc), // 3. cache-busted preview (evict stale cached 4xx/5xx)
  ]
  if (photoId) {
    // 4. content endpoint — raw bytes, no server-side image processing
    chain.push(contentUrl(photoId))
    // 5. large thumbnail — re-encoded JPEG via different code path
    chain.push(thumbnailUrl(photoId, 1600))
  }
  return chain
}

const FALLBACK_LABELS = [
  'preview (attempt 1)',
  'preview (attempt 2)',
  'preview cache-busted',
  'content endpoint',
  'large thumbnail',
]

// ─────────────────────────────────────────────
// Single image slide with retry logic
//
// KEY DESIGN: this component is given key={photoId ?? originalSrc} by the
// parent renderer, so React fully unmounts/remounts it on every navigation.
// This guarantees zero state leakage between photos.
// ─────────────────────────────────────────────

interface ImageSlideRendererProps {
  slide: SlideImage
  offset: number
  photoId?: string
}

function ImageSlideRenderer({ slide, offset, photoId }: ImageSlideRendererProps) {
  const originalSrc = slide.src ?? ''
  const chain = buildFallbackChain(originalSrc, photoId)

  const [attemptIndex, setAttemptIndex] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  const currentSrc = chain[Math.min(attemptIndex, chain.length - 1)]
  const isRetrying = attemptIndex > 0 && !loaded && !failed

  const handleLoad = useCallback(() => {
    if (attemptIndex > 0) {
      console.info(
        `[lightbox] ✓ file_id=${photoId ?? '?'} loaded via fallback: ${FALLBACK_LABELS[attemptIndex] ?? attemptIndex}`,
      )
    }
    setLoaded(true)
    setFailed(false)
  }, [attemptIndex, photoId])

  const handleError = useCallback(() => {
    const label = FALLBACK_LABELS[attemptIndex] ?? `attempt ${attemptIndex}`
    console.warn(
      `[lightbox] ✗ file_id=${photoId ?? '?'} failed: ${label} | url=${currentSrc}`,
    )

    setAttemptIndex((prev) => {
      const next = prev + 1
      if (next >= chain.length) {
        console.error(
          `[lightbox] ✗✗ file_id=${photoId ?? '?'} ALL fallbacks exhausted after ${chain.length} attempts`,
        )
        setFailed(true)
        return prev
      }
      console.info(
        `[lightbox] → file_id=${photoId ?? '?'} trying fallback: ${FALLBACK_LABELS[next] ?? next}`,
      )
      return next
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chain.length, attemptIndex, currentSrc, photoId])

  const handleManualRetry = useCallback(() => {
    console.info(`[lightbox] manual retry triggered for file_id=${photoId ?? '?'}`)
    setAttemptIndex(0)
    setLoaded(false)
    setFailed(false)
  }, [photoId])

  // Don't render image element for slides far off screen
  if (Math.abs(offset) > 1) return null

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Spinner — shown while loading or retrying */}
      {!loaded && !failed && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            zIndex: 10,
            pointerEvents: 'none',
          }}
        >
          <div className="lightbox-spinner" />
          {isRetrying && (
            <p
              style={{
                fontSize: '0.75rem',
                color: 'oklch(0.70 0.145 58 / 80%)',
                letterSpacing: '0.04em',
                textAlign: 'center',
              }}
            >
              Having trouble loading this photo. Retrying…
            </p>
          )}
        </div>
      )}

      {/* Final error state */}
      {failed && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '3rem',
              height: '3rem',
              borderRadius: '50%',
              background: 'oklch(0.70 0.145 58 / 10%)',
              border: '1px solid oklch(0.70 0.145 58 / 25%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              color: 'oklch(0.70 0.145 58)',
            }}
          >
            ⚠
          </div>
          <p
            style={{
              fontSize: '0.875rem',
              color: 'oklch(0.948 0.012 72 / 60%)',
              maxWidth: '20rem',
              lineHeight: 1.5,
            }}
          >
            This photo couldn&rsquo;t be loaded.
          </p>
          <button
            onClick={handleManualRetry}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '0.5rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              background: 'oklch(0.70 0.145 58 / 15%)',
              border: '1px solid oklch(0.70 0.145 58 / 35%)',
              color: 'oklch(0.70 0.145 58)',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      )}

      {/* The actual image — key changes on each attempt to force a fresh load */}
      {!failed && currentSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`${photoId ?? originalSrc}::${attemptIndex}`}
          src={currentSrc}
          alt={slide.alt ?? ''}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.35s ease',
            display: 'block',
          }}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Exported types and component
// ─────────────────────────────────────────────

export interface ResilientImageSlide {
  src: string
  download?: string
  alt?: string
  width?: number
  height?: number
  /** Google Drive file ID — used for content + thumbnail fallbacks */
  photoId?: string
}

export type VideoSlide = {
  type: 'video'
  sources: { src: string; type?: string }[]
  download?: string
  poster?: string
  alt?: string
  width?: number
  height?: number
}

export type LightboxSlide = ResilientImageSlide | VideoSlide

interface ResilientLightboxProps {
  open: boolean
  index: number
  slides: LightboxSlide[]
  onClose: () => void
}

export function ResilientLightbox({ open, index, slides, onClose }: ResilientLightboxProps) {
  const renderSlide = useCallback(
    ({ slide, offset }: RenderSlideProps) => {
      // Let the Video plugin handle video slides — return undefined to defer
      if ('type' in slide && (slide as { type: string }).type === 'video') return undefined

      const imageSlide = slide as SlideImage
      const matchingSlide = slides.find(
        (s): s is ResilientImageSlide =>
          !('type' in s) && s.src === imageSlide.src,
      )

      // KEY = photoId (or src as fallback) so React remounts on every navigation,
      // preventing stale loaded/failed state from leaking between photos.
      const stableKey = matchingSlide?.photoId ?? imageSlide.src ?? String(offset)

      return (
        <ImageSlideRenderer
          key={stableKey}
          slide={imageSlide}
          offset={offset}
          photoId={matchingSlide?.photoId}
        />
      )
    },
    [slides],
  )

  return (
    <>
      <style>{`
        .lightbox-spinner {
          width: 2.25rem;
          height: 2.25rem;
          border-radius: 50%;
          border: 2px solid oklch(1 0 0 / 10%);
          border-top-color: oklch(0.70 0.145 58);
          animation: lightbox-spin 0.75s linear infinite;
        }
        @keyframes lightbox-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <Lightbox
        open={open}
        index={index}
        close={onClose}
        slides={slides as Parameters<typeof Lightbox>[0]['slides']}
        plugins={[Download, Video]}
        render={{ slide: renderSlide }}
        styles={{ container: { backgroundColor: 'rgba(0,0,0,0.96)' } }}
      />
    </>
  )
}
