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

import { useState, useCallback, useEffect, useRef, type MutableRefObject } from 'react'
import Lightbox, { useController, useLightboxState } from 'yet-another-react-lightbox'
import Video from 'yet-another-react-lightbox/plugins/video'
import 'yet-another-react-lightbox/styles.css'
import type { RenderSlideProps, SlideImage } from 'yet-another-react-lightbox'
import { X, ChevronLeft, ChevronRight, Heart, Download as DownloadIcon, Info } from 'lucide-react'
import { thumbnailUrl, contentUrl } from '@/lib/api-client'
import { IconButton } from '@/components/design-system/icon-button'
import { PhotoContextMenu } from '@/components/design-system/photo-context-menu'
import { cn } from '@/lib/utils'

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
  /** Fired on a genuine tap/click on the slide (never on a swipe or drag). */
  onTap?: () => void
}

/** A pointer down/up pair only counts as a "tap" if the pointer barely moved
 * and was not held — otherwise a horizontal swipe (which the library turns
 * into slide navigation) would also toggle the controls. */
const TAP_MAX_MOVE_PX = 10
const TAP_MAX_DURATION_MS = 500

function ImageSlideRenderer({ slide, offset, photoId, onTap }: ImageSlideRendererProps) {
  const originalSrc = slide.src ?? ''
  const chain = buildFallbackChain(originalSrc, photoId)

  const [attemptIndex, setAttemptIndex] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const tapStartRef = useRef<{ x: number; y: number; t: number } | null>(null)

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
      onPointerDown={(e) => {
        tapStartRef.current = { x: e.clientX, y: e.clientY, t: Date.now() }
      }}
      onPointerUp={(e) => {
        const start = tapStartRef.current
        tapStartRef.current = null
        if (!start || offset !== 0) return
        if (
          Math.abs(e.clientX - start.x) > TAP_MAX_MOVE_PX ||
          Math.abs(e.clientY - start.y) > TAP_MAX_MOVE_PX ||
          Date.now() - start.t > TAP_MAX_DURATION_MS
        ) {
          return
        }
        onTap?.()
      }}
      onPointerCancel={() => {
        tapStartRef.current = null
      }}
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

/**
 * Discreet viewer metadata — additive to both slide types. Every field is
 * optional: pages only pass what they actually have (see PR 5 in
 * `docs/redesign/PROMPTS.md` — date/location/album/caption/people, shown
 * underneath the photo or in a details drawer, never overlaid on it).
 */
interface LightboxSlideMeta {
  /** Human-readable capture date, e.g. "Jun 14, 2026". */
  date?: string
  /** Free-text caption/note. */
  caption?: string
  /** Chapter/album name, e.g. "Arjun". */
  album?: string
  /** Location string, when available. */
  location?: string
  /** Named people in the photo, when available. */
  people?: string[]
  /** Current favorite state — renders the heart control when defined. */
  isFavorite?: boolean
  /** Favorite toggle handler for the currently displayed slide. */
  onToggleFavorite?: () => void
}

export interface ResilientImageSlide extends LightboxSlideMeta {
  src: string
  download?: string
  alt?: string
  width?: number
  height?: number
  /** Google Drive file ID — used for content + thumbnail fallbacks */
  photoId?: string
}

export type VideoSlide = LightboxSlideMeta & {
  type: 'video'
  sources: { src: string; type?: string }[]
  download?: string
  poster?: string
  alt?: string
  width?: number
  height?: number
  controls?: boolean
  playsInline?: boolean
}

export type LightboxSlide = ResilientImageSlide | VideoSlide

// ─────────────────────────────────────────────
// Controls — near-invisible translucent overlay
//
// Rendered via `render.controls`, which mounts inside the lightbox's own
// module tree, so `useController`/`useLightboxState` have the right
// context. Everything here is absolutely positioned over the slide;
// non-interactive regions stay `pointer-events-none` so native swipe/pinch
// on the photo underneath is never blocked.
// ─────────────────────────────────────────────

/**
 * Controls stay fully visible briefly, then fade to a low, still-reachable
 * opacity after a period of no mouse/keyboard activity — this is the
 * desktop-oriented "auto-hide" behavior.
 *
 * On touch devices there is no ambient "mouse moved" signal, so visibility
 * there is driven by an explicit tap on the slide (detected in
 * `ImageSlideRenderer`, which ignores pointer sequences that moved far enough
 * or lasted long enough to be a swipe/drag, so this never fights swipe
 * navigation): tap once reveals controls (and restarts the auto-hide timer so
 * a photo left open doesn't stay lit forever), tap again hides them
 * immediately.
 */
function useAutoHideControls(active: boolean) {
  const [visible, setVisible] = useState(true)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  // Mirrors `visible` so the stable `toggle` callback can read the latest
  // value without being re-created. Written in an effect, never during
  // render (a discarded concurrent render must not mutate this).
  const visibleRef = useRef(visible)
  useEffect(() => {
    visibleRef.current = visible
  }, [visible])

  const restartTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setVisible(false), 3000)
  }, [])

  const reveal = useCallback(() => {
    setVisible(true)
    restartTimer()
  }, [restartTimer])

  // Explicit tap toggle — used for touch, where there's no hover signal.
  const toggle = useCallback(() => {
    if (visibleRef.current) {
      if (timerRef.current) clearTimeout(timerRef.current)
      setVisible(false)
    } else {
      reveal()
    }
  }, [reveal])

  useEffect(() => {
    if (!active) return
    reveal()
    window.addEventListener('mousemove', reveal)
    window.addEventListener('keydown', reveal)
    window.addEventListener('focusin', reveal)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      window.removeEventListener('mousemove', reveal)
      window.removeEventListener('keydown', reveal)
      window.removeEventListener('focusin', reveal)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  return { visible, toggle }
}

const DETAILS_PANEL_ID = 'lightbox-details-panel'

function LightboxControls({ onToggleRef }: { onToggleRef: MutableRefObject<(() => void) | null> }) {
  const { close, prev, next } = useController()
  const { currentSlide } = useLightboxState()
  const { visible, toggle } = useAutoHideControls(true)
  useEffect(() => {
    onToggleRef.current = toggle
    return () => {
      onToggleRef.current = null
    }
  }, [onToggleRef, toggle])
  const [justFavorited, setJustFavorited] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const meta = (currentSlide ?? undefined) as (Partial<LightboxSlideMeta> & { download?: string }) | undefined

  // Slide-type-aware nav labels: "Previous/Next photo" reads wrong on a
  // video slide (PR 7 follow-up from PR 5 — see `docs/redesign/STATE.md`).
  const isVideoSlide = Boolean(
    currentSlide && 'type' in currentSlide && (currentSlide as { type?: string }).type === 'video',
  )
  const mediaNoun = isVideoSlide ? 'video' : 'photo'

  // Reset the details drawer whenever the active slide changes, so it never
  // leaks open across navigation. Adjusting state during render (rather
  // than in an effect) per https://react.dev/learn/you-might-not-need-an-effect.
  const activeKey = ('photoId' in (currentSlide ?? {}) ? (currentSlide as ResilientImageSlide).photoId : undefined)
    ?? (currentSlide as { src?: string } | undefined)?.src
    ?? (currentSlide as { sources?: { src: string }[] } | undefined)?.sources?.[0]?.src
  const lastKeyRef = useRef(activeKey)
  if (lastKeyRef.current !== activeKey) {
    lastKeyRef.current = activeKey
    if (detailsOpen) setDetailsOpen(false)
  }
  const { date, caption, album, location, people, isFavorite, onToggleFavorite, download } = meta ?? {}
  const hasMeta = Boolean(date || caption || album || location || (people && people.length > 0))

  function handleFavoriteClick() {
    onToggleFavorite?.()
    setJustFavorited(true)
    window.setTimeout(() => setJustFavorited(false), 260)
  }

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[1] flex flex-col justify-between transition-opacity duration-[var(--motion-standard)] ease-[var(--ease-standard)]"
      style={{ opacity: visible ? 1 : 0.4 }}
    >
      {/* Top-right cluster: favorite / download / details / close.
          The band itself stays `pointer-events-none` so it never swallows
          taps meant for the media underneath (e.g. native video controls
          on a full-height video); only the buttons are interactive. */}
      <div className="pointer-events-none flex items-start justify-end gap-2 p-3 sm:p-5">
        {onToggleFavorite && (
          <IconButton
            variant="translucent"
            className="pointer-events-auto"
            aria-pressed={Boolean(isFavorite)}
            label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            onClick={handleFavoriteClick}
            icon={
              <Heart
                className={cn('h-[18px] w-[18px] transition-transform duration-200', justFavorited && 'scale-110')}
                style={{
                  color: isFavorite ? 'var(--amber)' : 'currentColor',
                  fill: isFavorite ? 'var(--amber)' : 'none',
                  transition: 'fill 200ms ease, color 200ms ease',
                }}
                aria-hidden
              />
            }
          />
        )}
        {download && (
          <PhotoContextMenu
            className="pointer-events-auto"
            label="More actions"
            actions={[
              {
                key: 'download',
                label: 'Download original',
                href: download,
                icon: <DownloadIcon className="h-4 w-4" aria-hidden />,
              },
            ]}
          />
        )}
        {hasMeta && (
          <IconButton
            variant="translucent"
            className="pointer-events-auto"
            aria-expanded={detailsOpen}
            aria-controls={DETAILS_PANEL_ID}
            label={detailsOpen ? 'Hide details' : 'Photo details'}
            onClick={() => setDetailsOpen((v) => !v)}
            icon={<Info className="h-[18px] w-[18px]" aria-hidden />}
          />
        )}
        <IconButton
          variant="translucent"
          className="pointer-events-auto"
          label="Close"
          onClick={() => close()}
          icon={<X className="h-[18px] w-[18px]" aria-hidden />}
        />
      </div>

      {/* Prev / next — near the left/right edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2 sm:px-4">
        <IconButton
          variant="translucent"
          label={`Previous ${mediaNoun}`}
          onClick={() => prev()}
          className="pointer-events-auto h-11 w-11"
          icon={<ChevronLeft className="h-5 w-5" aria-hidden />}
        />
        <IconButton
          variant="translucent"
          label={`Next ${mediaNoun}`}
          onClick={() => next()}
          className="pointer-events-auto h-11 w-11"
          icon={<ChevronRight className="h-5 w-5" aria-hidden />}
        />
      </div>

      {/* Discreet metadata — underneath the photo, never overlaid on it.
          The band stays `pointer-events-none` so it never covers native
          video controls at the bottom of a full-height video slide; only
          the caption trigger and the panel itself accept pointer input. */}
      {hasMeta && (
        <div className="pointer-events-none flex flex-col items-center gap-1 px-6 pb-6 pt-10 text-center sm:pb-8">
          {!detailsOpen ? (
            (date || caption) && (
              <button
                type="button"
                aria-expanded={false}
                aria-controls={DETAILS_PANEL_ID}
                onClick={() => setDetailsOpen(true)}
                className="pointer-events-auto text-small text-white/55 transition-colors duration-[var(--motion-fast)] hover:text-white/85"
              >
                {caption ? `“${caption}”` : date}
              </button>
            )
          ) : (
            <div
              id={DETAILS_PANEL_ID}
              className="pointer-events-auto max-w-md space-y-1.5 rounded-2xl px-5 py-4"
              style={{ background: 'oklch(0.04 0.004 48 / 70%)' }}
            >
              {date && <p className="text-small font-medium text-white/85">{date}</p>}
              {(location || album) && (
                <p className="text-small text-white/60">{[location, album].filter(Boolean).join(' · ')}</p>
              )}
              {caption && <p className="text-small italic text-white/75">&ldquo;{caption}&rdquo;</p>}
              {people && people.length > 0 && (
                <p className="text-[0.7rem] uppercase tracking-[0.14em] text-white/45">{people.join(', ')}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface ResilientLightboxProps {
  open: boolean
  index: number
  slides: LightboxSlide[]
  onClose: () => void
}

export function ResilientLightbox({ open, index, slides, onClose }: ResilientLightboxProps) {
  // The library re-seeds its internal index from the `index` prop whenever
  // the `slides` array identity changes (see `LightboxStateProvider` ->
  // `reducer` "update" in yet-another-react-lightbox). Consumers rebuild
  // `slides` whenever favorite state changes — including when the heart is
  // pressed *inside* the viewer — so without tracking the live index here,
  // favoriting photo #7 would snap the viewer back to whichever photo it
  // was opened at. Mirror the current index and feed it back in.
  const [viewIndex, setViewIndex] = useState(index)
  const [seedIndex, setSeedIndex] = useState(index)
  if (seedIndex !== index) {
    setSeedIndex(index)
    setViewIndex(index)
  }

  // Bridges a tap on the slide to the controls-visibility toggle living
  // inside `LightboxControls` — see `useAutoHideControls` above for why touch
  // needs an explicit toggle instead of the desktop hover-based auto-reveal.
  //
  // NOTE: the library's own `on.click` prop is NOT usable here. It is wired
  // only inside the library's built-in `ImageSlide` component (see
  // `CarouselSlide` in yet-another-react-lightbox), and `CarouselSlide`
  // short-circuits that component entirely whenever `render.slide` returns a
  // node — which this lightbox always does for image slides. So the tap
  // detection lives in `ImageSlideRenderer` instead.
  const controlsToggleRef = useRef<(() => void) | null>(null)

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
          onTap={() => controlsToggleRef.current?.()}
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
        index={viewIndex}
        close={onClose}
        on={{ view: ({ index: i }) => setViewIndex(i) }}
        slides={slides as Parameters<typeof Lightbox>[0]['slides']}
        plugins={[Video]}
        toolbar={{ buttons: [] }}
        render={{
          slide: renderSlide,
          controls: () => <LightboxControls onToggleRef={controlsToggleRef} />,
          buttonPrev: () => null,
          buttonNext: () => null,
          buttonClose: () => null,
        }}
        // Near-black, not pure black — see `.yarl__root` in globals.css for
        // the shared backdrop token; a full-screen custom overlay
        // (`LightboxControls`) replaces the default toolbar/navigation.
      />
    </>
  )
}
