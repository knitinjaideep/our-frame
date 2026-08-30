'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Clock, Play, Sparkles } from 'lucide-react'
import {
  EditorialEyebrow,
  EmptyState,
  PhotoLightbox,
  type LightboxSlide,
} from '@/components/design-system'
import { PhotoGridSkeleton } from '@/components/photos/photo-grid-skeleton'
import { SectionReveal } from '@/components/ui/section-reveal'
import { useHomeFeed } from '@/hooks/use-home-feed'
import { useFavorites, useFavoriteIds, useToggleFavorite } from '@/hooks/use-favorites'
import { mediaUrl, downloadUrl, videoStreamUrl } from '@/lib/api-client'
import { gridThumbnail } from '@/lib/media'
import { fullDate, shortDate } from '@/lib/photo-age'
import type { Photo, ThrowbackGroup, Favorite } from '@/types'

/**
 * Memories / On This Day (PR 9) — a nostalgic "time capsule" page.
 *
 * Data-honesty note (see docs/redesign/STATE.md PR 8 finding): `useHomeFeed`
 * also returns `hero_photos`, a *quality*-scored pool (landscape/resolution)
 * that is NOT recency-ordered and must never be used where recency or a
 * specific date is implied. This page never touches `hero_photos` — every
 * section below is grounded in real `created_time` (throwbacks/month
 * memories, computed server-side directly from `DrivePhoto.created_time`)
 * or real `favorited_at` (recently favorited), exactly like the Milestones/
 * Travel/Favorites pages' "no fabricated structure" precedent.
 *
 * "Today" is computed server-side in UTC (`home_feed_service.py`, matching
 * the pre-existing `throwbacks` implementation) — this app has no
 * per-user/per-workspace timezone setting, so there is no more precise
 * notion of "today" available yet. Documented as a known limitation rather
 * than silently assumed.
 */

function photoTime(p: Photo): number {
  return p.created_time ? new Date(p.created_time).getTime() : 0
}

function isVideo(p: Photo): boolean {
  return Boolean(p.mime_type?.startsWith('video/'))
}

/**
 * Source for the one large hero image per year group.
 *
 * Stills use `preview_url` (a single large editorial image per year — the
 * same precedent PR 6 set for the Travel/Life heroes; grid tiles stay on
 * cached thumbnails via `gridThumbnail`).
 *
 * Videos must NOT use `preview_url`: for a video that URL is a still-image
 * route that cannot render a video frame (`media_response_service.py`), so it
 * would paint a broken hero — and for a video that has not been media-synced
 * yet it is the legacy Drive route, which downloads the full original. Videos
 * therefore use the cached poster, and fall back to an honest processing
 * state when no poster exists yet. Throwback groups are not filtered by MIME
 * type server-side, so a video really can be the hero of a year.
 */
function heroSource(p: Photo): string | null {
  if (isVideo(p)) return p.poster_url ?? p.thumbnail_url ?? null
  return p.preview_url ?? null
}

/** Honest accessible name: says "play"/"open", and says so when a derivative
 * is not ready instead of announcing a tile that will not display. */
function mediaLabel(p: Photo, ready: boolean): string {
  const when = fullDate(p.created_time)
  const subject = when ? `${p.name}, ${when}` : p.name
  if (!ready) {
    return p.processing_status === 'failed'
      ? `${subject} — unavailable`
      : `${subject} — still processing`
  }
  return isVideo(p) ? `Play ${subject}` : `Open ${subject}`
}

/** Non-interactive play affordance so video tiles do not read as stills.
 * A nested <button> inside the tile button would be invalid HTML/ARIA. */
function PlayBadge({ size = 'md' }: { size?: 'md' | 'lg' }) {
  return (
    <span
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
      aria-hidden
    >
      <span
        className={`flex items-center justify-center rounded-full border border-white/15 bg-black/30 text-white/85 backdrop-blur-md ${
          size === 'lg' ? 'h-14 w-14' : 'h-9 w-9'
        }`}
      >
        <Play className={size === 'lg' ? 'ml-[2px] h-5 w-5' : 'ml-[2px] h-3.5 w-3.5'} style={{ fill: 'currentColor' }} />
      </span>
    </span>
  )
}

function toPhotoSlide(p: Photo, opts: { isFavorite: boolean; onToggleFavorite: () => void }): LightboxSlide {
  const meta = {
    date: fullDate(p.created_time),
    isFavorite: opts.isFavorite,
    onToggleFavorite: opts.onToggleFavorite,
  }
  if (isVideo(p)) {
    const posterSrc = p.poster_url ?? p.thumbnail_url
    return {
      type: 'video' as const,
      sources: [{ src: p.playback_url ? mediaUrl(p.playback_url) : videoStreamUrl(p.id), type: p.playback_url ? 'video/mp4' : undefined }],
      download: downloadUrl(p.id),
      poster: posterSrc ? mediaUrl(posterSrc) : undefined,
      alt: p.name,
      controls: true,
      playsInline: true,
      ...meta,
    }
  }
  return {
    src: mediaUrl(p.preview_url),
    download: downloadUrl(p.id),
    alt: p.name,
    photoId: p.id,
    ...meta,
  }
}

interface OpenLightbox {
  slides: LightboxSlide[]
  index: number
}

export default function MemoriesPage() {
  const { data, isLoading, error } = useHomeFeed()
  const favoriteIds = useFavoriteIds()
  const { add, remove } = useToggleFavorite()

  const [viewer, setViewer] = useState<OpenLightbox | null>(null)

  const throwbacks = data?.throwbacks ?? []
  const monthMemories = data?.month_memories ?? []
  const hasThrowbacks = throwbacks.length > 0

  function toggleFavorite(p: Photo) {
    if (favoriteIds.has(p.id)) {
      remove.mutate(p.id)
    } else {
      add.mutate({ photo_id: p.id, photo_name: p.name })
    }
  }

  function openViewer(groupPhotos: Photo[], startPhoto: Photo) {
    const slides = groupPhotos.map((p) =>
      toPhotoSlide(p, { isFavorite: favoriteIds.has(p.id), onToggleFavorite: () => toggleFavorite(p) }),
    )
    const index = groupPhotos.findIndex((p) => p.id === startPhoto.id)
    setViewer({ slides, index: Math.max(index, 0) })
  }

  return (
    <div className="content-padding pb-24 pt-14 sm:pt-16">
      <div className="mx-auto max-w-[var(--container-max)]">
        <SectionReveal>
          <div className="flex items-center gap-2.5">
            <Clock className="h-5 w-5" style={{ color: 'var(--amber)' }} aria-hidden />
            <EditorialEyebrow>Memories</EditorialEyebrow>
          </div>
          <h1 className="mt-2 text-h1">Moments That Stay</h1>
          <p className="mt-3 max-w-md text-body text-muted-foreground">
            Photos from this day in past years.
          </p>
        </SectionReveal>

        {error && (
          <div className="mt-8 rounded-2xl border border-destructive/20 bg-destructive/5 px-5 py-4 text-sm text-destructive">
            Could not load your memories. Check that your Google Drive is connected.
          </div>
        )}

        {isLoading && !error && (
          <div className="mt-14">
            <PhotoGridSkeleton count={6} />
          </div>
        )}

        {!isLoading && !error && hasThrowbacks && (
          <TodaysMemories groups={throwbacks} onOpen={openViewer} />
        )}

        {!isLoading && !error && !hasThrowbacks && (
          <EmptyMemories monthMemories={monthMemories} onOpen={openViewer} />
        )}
      </div>

      <PhotoLightbox
        open={Boolean(viewer)}
        index={viewer?.index ?? -1}
        slides={viewer?.slides ?? []}
        onClose={() => setViewer(null)}
      />
    </div>
  )
}

/**
 * Today's memories — vertical narrative flow, most recent year first
 * ("moving backward through time"), one large hero photo per year plus a
 * small supporting pair. Each `ThrowbackGroup` is grounded in real
 * `created_time` data computed server-side (`home_feed_service.py`).
 */
function TodaysMemories({
  groups,
  onOpen,
}: {
  groups: ThrowbackGroup[]
  onOpen: (groupPhotos: Photo[], startPhoto: Photo) => void
}) {
  return (
    <div className="mt-16 space-y-20 sm:mt-20 sm:space-y-28">
      {groups.map((group, i) => {
        const sorted = [...group.photos].sort((a, b) => photoTime(a) - photoTime(b))
        const hero = sorted[0]
        const supporting = sorted.slice(1, 3)
        if (!hero) return null
        const heroSrc = heroSource(hero)

        return (
          <SectionReveal key={group.year} delay={i === 0 ? 0 : 0.04}>
            <section aria-label={`Memories from ${group.year}`}>
              <div className="mb-6 flex items-baseline gap-3">
                <span className="text-h1 tabular-nums" style={{ color: 'var(--foreground)' }}>
                  {group.year}
                </span>
                <span className="text-small tracking-wide text-muted-foreground opacity-70">
                  {group.label}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onOpen(sorted, hero)}
                aria-label={mediaLabel(hero, Boolean(heroSrc))}
                className="relative block w-full overflow-hidden rounded-2xl bg-muted text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)]"
              >
                {heroSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mediaUrl(heroSrc)}
                    alt=""
                    loading="lazy"
                    className="aspect-[4/3] max-h-[70vh] w-full object-cover sm:aspect-[16/10]"
                  />
                ) : (
                  <span className="flex aspect-[4/3] w-full items-center justify-center text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground sm:aspect-[16/10]">
                    {hero.processing_status === 'failed' ? 'Unavailable' : 'Processing'}
                  </span>
                )}
                {isVideo(hero) && heroSrc && <PlayBadge size="lg" />}
              </button>
              {hero.created_time && (
                <p className="mt-2 text-[0.7rem] tracking-wide text-muted-foreground opacity-60">
                  {fullDate(hero.created_time)}
                </p>
              )}

              {supporting.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {supporting.map((p) => {
                    const thumb = gridThumbnail(p)
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => onOpen(sorted, p)}
                        aria-label={mediaLabel(p, Boolean(thumb))}
                        className="group relative overflow-hidden rounded-xl bg-muted text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)]"
                      >
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={mediaUrl(thumb)}
                            alt=""
                            loading="lazy"
                            className="aspect-[4/5] w-full object-cover transition-transform duration-[var(--motion-slow)] ease-[var(--ease-standard)] group-hover:scale-[1.02]"
                          />
                        ) : (
                          <span className="flex aspect-[4/5] w-full items-center justify-center text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
                            {p.processing_status === 'failed' ? 'Unavailable' : 'Processing'}
                          </span>
                        )}
                        {isVideo(p) && thumb && <PlayBadge />}
                      </button>
                    )
                  })}
                </div>
              )}
            </section>
          </SectionReveal>
        )
      })}
    </div>
  )
}

/**
 * No throwbacks today — an elegant (non-blank) empty panel, followed by
 * real secondary sections instead of leaving most of the page empty.
 */
function EmptyMemories({
  monthMemories,
  onOpen,
}: {
  monthMemories: ThrowbackGroup[]
  onOpen: (groupPhotos: Photo[], startPhoto: Photo) => void
}) {
  return (
    <div className="mt-14">
      <EmptyState
        icon={<Sparkles className="h-6 w-6" />}
        title="No throwbacks today"
        description="As your library grows, memories from this day in past years will surface here."
        action={
          <Link
            href="/photos"
            className="text-small font-medium text-foreground underline decoration-[var(--amber)]/50 underline-offset-4 transition-colors hover:decoration-[var(--amber)]"
          >
            Wander the collection
          </Link>
        }
      />

      {monthMemories.length > 0 && (
        <SectionReveal delay={0.06}>
          <section className="mt-16">
            <EditorialEyebrow className="mb-1.5">This Month in Past Years</EditorialEyebrow>
            <p className="mb-8 text-small text-muted-foreground opacity-70">
              Other moments captured this month, through the years.
            </p>
            <div className="space-y-10">
              {monthMemories.map((group) => (
                <MonthMemoryRow key={group.year} group={group} onOpen={onOpen} />
              ))}
            </div>
          </section>
        </SectionReveal>
      )}

      <RecentlyFavorited />

      <OurTimeline monthMemories={monthMemories} />
    </div>
  )
}

function MonthMemoryRow({
  group,
  onOpen,
}: {
  group: ThrowbackGroup
  onOpen: (groupPhotos: Photo[], startPhoto: Photo) => void
}) {
  const sorted = [...group.photos].sort((a, b) => photoTime(a) - photoTime(b))
  return (
    <div>
      <div className="mb-3 flex items-baseline gap-2.5">
        <span className="text-h3">{group.year}</span>
        <span className="text-[0.7rem] tracking-wide text-muted-foreground opacity-60">{group.label}</span>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-1">
        {sorted.map((p) => {
          const thumb = gridThumbnail(p)
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onOpen(sorted, p)}
              aria-label={mediaLabel(p, Boolean(thumb))}
              className="relative h-40 w-40 shrink-0 overflow-hidden rounded-xl bg-muted sm:h-48 sm:w-48 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)]"
            >
              {thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mediaUrl(thumb)} alt="" loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                  {p.processing_status === 'failed' ? 'Unavailable' : 'Processing'}
                </span>
              )}
              {isVideo(p) && thumb && <PlayBadge />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * "Recently revisited" (prompt: "photos the user recently opened or
 * favorited"). No view/open-tracking exists anywhere in this app (checked
 * `frontend/hooks` and `backend/api` — there is no analytics/recently-viewed
 * table), so this section sources only the real half of that description:
 * recently *favorited* photos, via `/favorites` which is already ordered by
 * real `favorited_at` (see `backend/repositories/favorites_repo.py`). Labeled
 * "Recently Favorited" rather than the prompt's literal "Recently revisited"
 * so it never implies a viewing-history feature that does not exist — the
 * same honesty call PR 8 made for its "Recently Captured" row. Omitted
 * entirely (not a padded empty box) when there are no favorites yet.
 */
function RecentlyFavorited() {
  const { data } = useFavorites()
  const { remove } = useToggleFavorite()

  const recent = useMemo(() => {
    const list = data?.favorites ?? []
    return [...list]
      .sort((a, b) => new Date(b.favorited_at).getTime() - new Date(a.favorited_at).getTime())
      .slice(0, 8)
  }, [data?.favorites])

  const slides: LightboxSlide[] = useMemo(
    () =>
      recent.map((f) => {
        const video = f.mime_type?.startsWith('video/')
        const meta = {
          date: shortDate(f.favorited_at),
          isFavorite: true,
          onToggleFavorite: () => remove.mutate(f.photo_id),
        }
        if (video) {
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
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [recent],
  )

  const [index, setIndex] = useState(-1)

  if (recent.length === 0) return null

  function gridThumbFor(f: Favorite): string | null {
    const video = f.mime_type?.startsWith('video/')
    return (video ? (f.poster_url ?? f.thumbnail_url) : f.thumbnail_url) ?? null
  }

  function favLabel(f: Favorite, ready: boolean): string {
    if (!ready) {
      return f.processing_status === 'failed'
        ? `${f.photo_name} — unavailable`
        : `${f.photo_name} — still processing`
    }
    return f.mime_type?.startsWith('video/') ? `Play ${f.photo_name}` : `Open ${f.photo_name}`
  }

  return (
    <>
      <SectionReveal delay={0.1}>
        <section className="mt-16">
          <EditorialEyebrow className="mb-1.5">Recently Favorited</EditorialEyebrow>
          <p className="mb-6 text-small text-muted-foreground opacity-70">
            The moments you&apos;ve chosen to keep close.
          </p>
          <div className="flex gap-4 overflow-x-auto pb-1">
            {recent.map((f, i) => {
              const thumb = gridThumbFor(f)
              return (
                <button
                  key={f.photo_id}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={favLabel(f, Boolean(thumb))}
                  className="relative h-40 w-40 shrink-0 overflow-hidden rounded-xl bg-muted sm:h-48 sm:w-48 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)]"
                >
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mediaUrl(thumb)} alt="" loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                      {f.processing_status === 'failed' ? 'Unavailable' : 'Processing'}
                    </span>
                  )}
                  {f.mime_type?.startsWith('video/') && thumb && <PlayBadge />}
                </button>
              )
            })}
          </div>
        </section>
      </SectionReveal>

      <PhotoLightbox open={index >= 0} index={index} slides={slides} onClose={() => setIndex(-1)} />
    </>
  )
}

/**
 * "Our timeline" (optional per the prompt). Kept genuinely subtle and
 * cheap: a quiet row of the real years represented in "This month in past
 * years" — no extra network calls, no invented "major chapters" beyond what
 * Milestones (a separately redesigned page, PR 6) already covers in depth.
 * Renders nothing when there are fewer than 2 distinct years — a single
 * year is not a "timeline".
 */
function OurTimeline({ monthMemories }: { monthMemories: ThrowbackGroup[] }) {
  const years = useMemo(
    () => [...monthMemories.map((g) => g.year)].sort((a, b) => a - b),
    [monthMemories],
  )
  if (years.length < 2) return null

  return (
    <SectionReveal delay={0.14}>
      <section className="mt-16 border-t border-border pt-8">
        <EditorialEyebrow tone="muted" className="mb-1.5">Our Timeline</EditorialEyebrow>
        <p className="mb-3 text-[0.7rem] text-muted-foreground opacity-60">
          The years this month appears in, oldest first.
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {years.map((year, i) => (
            <span key={year} className="flex items-center gap-3">
              <span className="text-small tabular-nums text-muted-foreground">{year}</span>
              {i < years.length - 1 && (
                <span className="h-px w-6 bg-border" aria-hidden />
              )}
            </span>
          ))}
        </div>
      </section>
    </SectionReveal>
  )
}
