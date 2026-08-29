'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import {
  MasonryGallery,
  PhotoLightbox,
  EmptyState,
  type MasonryGalleryItem,
  type LightboxSlide,
} from '@/components/design-system'
import { PhotoGridSkeleton } from '@/components/photos/photo-grid-skeleton'
import { SectionReveal } from '@/components/ui/section-reveal'
import { useFavorites, useFavoriteIds, useToggleFavorite } from '@/hooks/use-favorites'
import { useSlideshow } from '@/hooks/use-slideshow'
import { mediaUrl, downloadUrl, videoStreamUrl } from '@/lib/api-client'
import { shortDate } from '@/lib/photo-age'
import type { Favorite, Photo } from '@/types'

/**
 * The Ones We Love (PR 8) — replaces the legacy warm-light Favorites page
 * with the cinematic editorial gallery + a real (non-empty) empty state,
 * per `docs/redesign/PROMPTS.md` PR 8.
 *
 * Reuses the exact favorite-state/thumbnail-sourcing pattern every other
 * redesigned gallery page (PR 4/6/7) already established:
 * `useFavoriteIds`/`useToggleFavorite`, cached-thumbnail-only grid tiles
 * (never `preview_url`), `MasonryGallery` + `PhotoLightbox`.
 */

function favoriteTime(f: Favorite): number {
  // `favorited_at` (when it was saved), not `created_time` — this page is
  // "the ones we love", ordered by when they were chosen.
  return f.favorited_at ? new Date(f.favorited_at).getTime() : 0
}

/** Cached thumbnail (or video poster) only — never falls back to
 * `preview_url`, which is a full-size, per-request Drive download. */
function gridThumbnail(f: Favorite): string | null {
  const isVideo = f.mime_type?.startsWith('video/')
  return (isVideo ? (f.poster_url ?? f.thumbnail_url) : f.thumbnail_url) ?? null
}

export default function FavoritesPage() {
  const { data, isLoading, error } = useFavorites()
  const favoriteIds = useFavoriteIds()
  const { remove } = useToggleFavorite()

  const [lightboxIndex, setLightboxIndex] = useState(-1)
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [removing, setRemoving] = useState(false)
  const [removeError, setRemoveError] = useState<string | null>(null)

  const favorites = useMemo(() => {
    const list = data?.favorites ?? []
    return [...list].sort((a, b) => favoriteTime(b) - favoriteTime(a))
  }, [data?.favorites])

  const hasFavorites = favorites.length > 0

  function toggleSelected(id: string) {
    setRemoveError(null)
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function exitSelectMode() {
    setSelectMode(false)
    setSelected(new Set())
    setRemoveError(null)
  }

  // No bulk-unfavorite endpoint exists on the backend (only single-item
  // POST/DELETE `/favorites/{photo_id}`) — this loops the existing toggle
  // mutation per selected id rather than inventing a new endpoint, per the
  // PR 8 scope note. Each call is independently idempotent/retryable, so a
  // partial failure is recoverable: `allSettled` (not `all`) lets every
  // request finish, the ones that failed stay selected, and the user is
  // told what actually happened instead of the UI silently pretending the
  // whole batch succeeded.
  async function removeSelected() {
    const ids = [...selected]
    if (ids.length === 0) return
    setRemoving(true)
    setRemoveError(null)
    const results = await Promise.allSettled(ids.map((id) => remove.mutateAsync(id)))
    const failed = ids.filter((_, i) => results[i].status === 'rejected')
    setRemoving(false)

    if (failed.length === 0) {
      exitSelectMode()
      return
    }
    setSelected(new Set(failed))
    setRemoveError(
      failed.length === ids.length
        ? `Couldn't remove ${failed.length === 1 ? 'that photo' : 'those photos'}. Try again.`
        : `Removed ${ids.length - failed.length} of ${ids.length}. ${failed.length} could not be removed — try again.`,
    )
  }

  const slides: LightboxSlide[] = useMemo(() => favorites.map((f) => {
    const isVideo = f.mime_type?.startsWith('video/')
    const meta = {
      date: shortDate(f.favorited_at),
      caption: undefined,
      isFavorite: true,
      onToggleFavorite: () => remove.mutate(f.photo_id),
    }
    if (isVideo) {
      const posterSrc = f.poster_url ?? f.thumbnail_url
      return {
        type: 'video' as const,
        sources: [{ src: f.playback_url ? mediaUrl(f.playback_url) : videoStreamUrl(f.photo_id), type: f.playback_url ? 'video/mp4' : undefined }],
        download: downloadUrl(f.photo_id),
        poster: posterSrc ? mediaUrl(posterSrc) : undefined,
        alt: f.photo_name,
        controls: true,
        playsInline: true,
        ...meta,
      }
    }
    return {
      src: mediaUrl(f.preview_url),
      download: downloadUrl(f.photo_id),
      alt: f.photo_name,
      photoId: f.photo_id,
      ...meta,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [favorites])

  // Unfavoriting from inside the viewer shrinks `slides` underneath it. Keep
  // the index in range so the viewer lands on a real neighbouring photo
  // instead of an empty (black) slide, and close it outright once the last
  // favorite is gone.
  const lightboxOpen = !selectMode && lightboxIndex >= 0 && slides.length > 0
  const safeLightboxIndex = lightboxOpen
    ? Math.min(lightboxIndex, slides.length - 1)
    : lightboxIndex

  useEffect(() => {
    if (lightboxIndex >= 0 && favorites.length === 0) setLightboxIndex(-1)
  }, [lightboxIndex, favorites.length])

  function openLightboxFor(f: Favorite) {
    const idx = favorites.findIndex((x) => x.photo_id === f.photo_id)
    if (idx >= 0) setLightboxIndex(idx)
  }

  function toMasonryItem(f: Favorite): MasonryGalleryItem {
    const isVideo = f.mime_type?.startsWith('video/')
    const thumb = gridThumbnail(f)
    return {
      id: f.photo_id,
      imageUrl: thumb ? mediaUrl(thumb) : null,
      isVideo,
      statusLabel: f.processing_status === 'failed' ? 'Unavailable' : 'Processing',
      alt: f.photo_name,
      date: shortDate(f.favorited_at),
      isFavorite: favoriteIds.has(f.photo_id),
      onToggleFavorite: () => remove.mutate(f.photo_id),
      selected: selectMode ? selected.has(f.photo_id) : undefined,
      onToggleSelect: selectMode ? () => toggleSelected(f.photo_id) : undefined,
      onClick: selectMode ? () => toggleSelected(f.photo_id) : () => openLightboxFor(f),
    }
  }

  return (
    <div className="content-padding pb-24 pt-14 sm:pt-16">
      <div className="mx-auto max-w-[var(--container-max)]">
        <SectionReveal>
          <div className="flex items-center gap-2.5">
            <Heart className="h-5 w-5" style={{ color: 'var(--amber)', fill: 'var(--amber)' }} aria-hidden />
            <h1 className="text-h1">The Ones We Love</h1>
          </div>
          {!isLoading && !error && (
            <p className="mt-4 text-small text-muted-foreground opacity-70">
              {favorites.length.toLocaleString()} saved {favorites.length === 1 ? 'photo' : 'photos'}
            </p>
          )}
          <p className="mt-3 max-w-md text-body text-muted-foreground">
            A place for the moments that matter most.
          </p>
        </SectionReveal>

        {error && (
          <div className="mt-8 rounded-2xl border border-destructive/20 bg-destructive/5 px-5 py-4 text-sm text-destructive">
            Failed to load favorites.
          </div>
        )}

        {isLoading ? (
          <div className="mt-14">
            <PhotoGridSkeleton count={12} />
          </div>
        ) : error ? null : !hasFavorites ? (
          <FavoritesEmptyState />
        ) : (
          <>
            <SectionReveal delay={0.04}>
              <div className="mt-10 flex flex-wrap items-center justify-end gap-x-4 gap-y-2 text-small">
                {selectMode ? (
                  <>
                    <span className="text-muted-foreground opacity-70">
                      {selected.size} selected
                    </span>
                    <button
                      type="button"
                      onClick={removeSelected}
                      disabled={selected.size === 0 || removing}
                      className="text-foreground transition-colors hover:text-muted-foreground disabled:opacity-40"
                    >
                      {removing ? 'Removing…' : 'Remove from favorites'}
                    </button>
                    <button
                      type="button"
                      onClick={exitSelectMode}
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectMode(true)}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Select
                  </button>
                )}
              </div>
              {removeError && (
                <p
                  role="status"
                  className="mt-2 text-right text-small text-destructive"
                >
                  {removeError}
                </p>
              )}
            </SectionReveal>

            <SectionReveal delay={0.08}>
              <div className="mt-6">
                <MasonryGallery items={favorites.map(toMasonryItem)} density="tight" />
              </div>
            </SectionReveal>
          </>
        )}
      </div>

      <PhotoLightbox
        open={lightboxOpen}
        index={safeLightboxIndex}
        slides={slides}
        onClose={() => setLightboxIndex(-1)}
      />
    </div>
  )
}

/**
 * Empty state: a centered editorial panel (never one giant blank rectangle)
 * plus a small discovery row so the page still feels alive.
 *
 * Honesty note (PR 8 review): `docs/redesign/PROMPTS.md` asks for a
 * "Recently captured" row, but no endpoint in this app returns photos by
 * recency. Every candidate source is *quality*-ranked, not date-ranked:
 * `/home/feed` `hero_photos` is scored by landscape-ness/resolution and,
 * against the real database, yields only 4 photos — all from a single root
 * album, all from 2023, while the newest photo in the library is from 2026.
 * `/home/slideshow` (which, with zero favorites — i.e. exactly this state —
 * falls back to a library-wide pool) is a strict superset and far less
 * likely to leave this section empty, but it is still score-ranked.
 *
 * So: source from `/home/slideshow`, order the returned set newest-first,
 * and label the section for what it truthfully is ("From the collection")
 * rather than claiming a recency this data cannot support. A literal
 * "Recently captured" row needs a real recent-photos endpoint — recorded as
 * a follow-up in `docs/redesign/STATE.md`, not faked here.
 */
function FavoritesEmptyState() {
  const { data } = useSlideshow()

  const recent = useMemo(() => {
    const photos = data ?? []
    return [...photos]
      .filter((p) => Boolean(p.thumbnail_url))
      .sort((a, b) => {
        const at = a.created_time ? new Date(a.created_time).getTime() : 0
        const bt = b.created_time ? new Date(b.created_time).getTime() : 0
        return bt - at
      })
      .slice(0, 6)
  }, [data])

  return (
    <div className="mt-14">
      <EmptyState
        icon={<Heart className="h-6 w-6" style={{ fill: 'var(--amber)' }} />}
        title="Your favorites will live here"
        description="Tap the heart on any photo to save it. The moments you love most deserve a special place."
        action={
          <Link
            href="/photos"
            className="text-small font-medium text-foreground underline decoration-[var(--amber)]/50 underline-offset-4 transition-colors hover:decoration-[var(--amber)]"
          >
            Start saving moments
          </Link>
        }
      />

      {recent.length > 0 && (
        <SectionReveal delay={0.06}>
          <section className="mt-16">
            <p className="mb-1.5 text-eyebrow-gold">From The Collection</p>
            <p className="mb-6 text-small text-muted-foreground opacity-70">
              Keep saving the little moments. They become everything.
            </p>
            <div className="flex gap-4 overflow-x-auto pb-1">
              {recent.map((p: Photo) => (
                <div
                  key={p.id}
                  className="h-40 w-40 shrink-0 overflow-hidden rounded-xl bg-muted sm:h-48 sm:w-48"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mediaUrl(p.thumbnail_url!)}
                    alt={p.name}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          </section>
        </SectionReveal>
      )}
    </div>
  )
}
