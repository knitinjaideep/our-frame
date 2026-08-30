'use client'

import { useMemo, useState } from 'react'
import { Film, Play } from 'lucide-react'
import { useVideoFiles } from '@/hooks/use-video-files'
import { useFavoriteIds, useToggleFavorite } from '@/hooks/use-favorites'
import { EmptyState, EditorialEyebrow, PhotoLightbox, type LightboxSlide } from '@/components/design-system'
import { SectionReveal } from '@/components/ui/section-reveal'
import { mediaUrl, downloadUrl, videoStreamUrl } from '@/lib/api-client'
import { shortDate } from '@/lib/photo-age'
import { cn } from '@/lib/utils'
import type { Photo } from '@/types'

/**
 * Family Films (PR 7) — the "All Videos" landing page reached via the nav's
 * "Videos" > "All Videos" link. Aggregates both video sections the backend
 * already exposes (`/sections/videos/arjun_videos` and
 * `/sections/videos/family_travel_videos`) into one cinematic library, per
 * `docs/redesign/PROMPTS.md` PR 7. The per-chapter subpages
 * (`/videos/arjun`, `/videos/family-travel`) are intentionally untouched —
 * this PR's suggested structure (one featured film + grouped "More Family
 * Films") is built for a single aggregate page, not per-chapter pages.
 *
 * Data-reachability note (see `docs/redesign/STATE.md`): the pre-existing
 * `_flatten_subfolders()` bug that drops Arjun's 36 direct "Videos" files in
 * album-detail views does NOT affect this page — `get_video_files()` in
 * `backend/services/sections_service.py` queries `photo_repo.get_by_folder`
 * directly against each "Videos" folder, bypassing that flattening path
 * entirely. Confirmed against the live dev database: 51 total video files
 * exist (36 in `Arjun/Videos`, 15 in a nested `Arjun/Photos/Pregnancy
 * period/Videos`), all reachable via `arjun_videos`; `family_travel_videos`
 * is currently empty (no video files under any Travel/Milestones/Life
 * "Videos" folder yet) — expected, not a bug.
 */

type ChapterKey = 'arjun_videos' | 'family_travel_videos'

const CHAPTER_LABEL: Record<ChapterKey, string> = {
  arjun_videos: 'Arjun',
  family_travel_videos: 'Family Travel',
}

interface ChapterVideo extends Photo {
  chapter: ChapterKey
}

function videoTime(v: Photo): number {
  return v.created_time ? new Date(v.created_time).getTime() : 0
}

/** Cached poster only — never falls back to a full-size derivative per tile. */
function posterFor(v: Photo): string | null {
  return v.poster_url ?? v.thumbnail_url ?? null
}

function titleFor(v: Photo): string {
  return v.name.replace(/\.[^/.]+$/, '')
}

/**
 * Tile label. When no cached poster exists the tile renders an honest
 * processing/unavailable state, so the label says so too rather than
 * promising a screen-reader user a film that may not play yet.
 */
function tileLabel(v: Photo, pending: boolean): string {
  if (!pending) return `Play ${titleFor(v)}`
  return v.processing_status === 'failed'
    ? `${titleFor(v)} — unavailable`
    : `${titleFor(v)} — still processing`
}

function metaLine(v: ChapterVideo): string {
  return [CHAPTER_LABEL[v.chapter], shortDate(v.created_time)].filter(Boolean).join(' · ')
}

export default function VideosPage() {
  const arjun = useVideoFiles('arjun_videos')
  const travel = useVideoFiles('family_travel_videos')

  const isLoading = arjun.isLoading || travel.isLoading
  const hasError = Boolean(arjun.error || travel.error)

  const favoriteIds = useFavoriteIds()
  const { add, remove } = useToggleFavorite()

  const [lightboxIndex, setLightboxIndex] = useState(-1)

  // Chronological (newest first) across both sections — this both drives the
  // featured pick and the lightbox's prev/next order.
  const allVideos = useMemo<ChapterVideo[]>(() => {
    const arjunVideos: ChapterVideo[] = (arjun.data?.videos ?? []).map((v) => ({ ...v, chapter: 'arjun_videos' }))
    const travelVideos: ChapterVideo[] = (travel.data?.videos ?? []).map((v) => ({ ...v, chapter: 'family_travel_videos' }))
    return [...arjunVideos, ...travelVideos].sort((a, b) => videoTime(b) - videoTime(a))
  }, [arjun.data, travel.data])

  function isFav(v: Photo) {
    return favoriteIds.has(v.id) || v.is_favorite
  }

  function toggleFavorite(v: ChapterVideo) {
    if (isFav(v)) {
      remove.mutate(v.id)
    } else {
      add.mutate({ photo_id: v.id, photo_name: v.name })
    }
  }

  // A featured film needs a real poster — never headline the page with a
  // processing placeholder. Falls back to the most recent video outright
  // (rendered as its own honest processing tile) if nothing is ready yet.
  const featured = useMemo(
    () => allVideos.find((v) => posterFor(v)) ?? allVideos[0],
    [allVideos],
  )

  const rest = useMemo(
    () => allVideos.filter((v) => v.id !== featured?.id),
    [allVideos, featured],
  )

  const groups = useMemo(() => {
    const map = new Map<ChapterKey, ChapterVideo[]>()
    for (const v of rest) {
      if (!map.has(v.chapter)) map.set(v.chapter, [])
      map.get(v.chapter)!.push(v)
    }
    return [...map.entries()]
  }, [rest])

  const slides: LightboxSlide[] = useMemo(() => allVideos.map((v) => {
    const videoSrc = v.playback_url ? mediaUrl(v.playback_url) : videoStreamUrl(v.id)
    const poster = posterFor(v)
    return {
      type: 'video' as const,
      sources: [{ src: videoSrc, type: v.playback_url ? 'video/mp4' : undefined }],
      download: downloadUrl(v.id),
      poster: poster ? mediaUrl(poster) : undefined,
      alt: v.name,
      width: v.width ?? undefined,
      height: v.height ?? undefined,
      controls: true,
      playsInline: true,
      date: shortDate(v.created_time),
      album: CHAPTER_LABEL[v.chapter],
      isFavorite: isFav(v),
      onToggleFavorite: () => toggleFavorite(v),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [allVideos, favoriteIds])

  function openVideo(v: ChapterVideo) {
    const idx = allVideos.findIndex((x) => x.id === v.id)
    if (idx >= 0) setLightboxIndex(idx)
  }

  const hasVideos = allVideos.length > 0

  return (
    <div className="content-padding pb-24 pt-14 sm:pt-16">
      <div className="mx-auto max-w-[var(--container-max)]">
        <SectionReveal>
          <EditorialEyebrow>Stories in Motion</EditorialEyebrow>
          <h1 className="mt-3 text-h1">Family Films</h1>
          <p className="mt-3 max-w-md text-body text-muted-foreground">
            The moments that deserved more than a single frame.
          </p>
        </SectionReveal>

        {hasError && (
          <div className="mt-8 rounded-2xl border border-destructive/20 bg-destructive/5 px-5 py-4 text-sm text-destructive">
            Could not load videos. Check that your Google Drive is connected.
          </div>
        )}

        {isLoading ? (
          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="aspect-[16/9] rounded-2xl skeleton-shimmer sm:col-span-2 sm:aspect-[21/9]" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-video rounded-2xl skeleton-shimmer" />
            ))}
          </div>
        ) : !hasVideos && !hasError ? (
          <div className="mt-14">
            <EmptyState
              icon={<Film className="h-6 w-6" />}
              title="No family films yet"
              description="Once videos land in a Videos folder inside Arjun or Travel in Google Drive, they will appear here."
            />
          </div>
        ) : (
          <>
            {featured && (
              <SectionReveal delay={0.04}>
                <section className="mt-12">
                  <FeaturedFilmTile video={featured} onOpen={() => openVideo(featured)} />
                </section>
              </SectionReveal>
            )}

            {groups.length > 0 && (
              <SectionReveal delay={0.08}>
                <section className="mt-16">
                  <p className="mb-6 text-eyebrow-gold">More Family Films</p>
                  <div className="space-y-12">
                    {groups.map(([chapter, videos]) => (
                      <div key={chapter}>
                        {groups.length > 1 && (
                          <p className="mb-4 text-small font-medium text-muted-foreground">
                            {CHAPTER_LABEL[chapter]}
                          </p>
                        )}
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                          {videos.map((v, i) => (
                            <FilmTile
                              key={v.id}
                              video={v}
                              wide={i === 0 && videos.length > 1}
                              onOpen={() => openVideo(v)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </SectionReveal>
            )}
          </>
        )}
      </div>

      {/* Pass the raw index (-1 while closed), exactly as the gallery pages
          do: `ResilientLightbox` only re-seeds its live view index when the
          `index` prop actually changes, so clamping this to 0 would make
          reopening the *first* film land on whichever slide the previous
          viewing session was left on. */}
      <PhotoLightbox
        open={lightboxIndex >= 0}
        index={lightboxIndex}
        slides={slides}
        onClose={() => setLightboxIndex(-1)}
      />
    </div>
  )
}

/** Understated translucent play badge — same visual language as
 * `IconButton`'s `translucent` variant, but rendered as a non-interactive
 * `<span>` (the whole tile is already one `<button>`; a nested `<button>`
 * would be invalid HTML/ARIA). */
function PlayBadge({ size = 'md', hovered }: { size?: 'md' | 'lg'; hovered: boolean }) {
  const dims = size === 'lg' ? 'h-16 w-16' : 'h-11 w-11'
  const icon = size === 'lg' ? 'h-6 w-6' : 'h-4 w-4'
  return (
    <span
      className={cn(
        'flex items-center justify-center rounded-full border border-white/15 bg-black/30 text-white/85 backdrop-blur-md transition-transform duration-[var(--motion-standard)] ease-[var(--ease-standard)]',
        dims,
      )}
      style={{ transform: hovered ? 'scale(1.08)' : 'scale(1)' }}
      aria-hidden
    >
      <Play className={cn('ml-[2px]', icon)} style={{ fill: 'currentColor' }} />
    </span>
  )
}

function ProcessingPlaceholder({ video, iconSize = 'sm' }: { video: Photo; iconSize?: 'sm' | 'md' }) {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-2"
      style={{ background: 'linear-gradient(135deg, oklch(0.11 0.012 48) 0%, oklch(0.08 0.006 46) 100%)' }}
    >
      <Film className={cn('text-muted-foreground', iconSize === 'md' ? 'h-6 w-6' : 'h-5 w-5')} aria-hidden />
      <span className="text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
        {video.processing_status === 'failed' ? 'Unavailable' : 'Processing'}
      </span>
    </div>
  )
}

function FeaturedFilmTile({ video, onOpen }: { video: ChapterVideo; onOpen: () => void }) {
  const [hovered, setHovered] = useState(false)
  const poster = posterFor(video)
  const pending = !poster

  return (
    <div>
      <button
        type="button"
        onClick={onOpen}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        aria-label={tileLabel(video, pending)}
        className="group relative block w-full overflow-hidden rounded-2xl bg-muted text-left focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--amber)]"
      >
        <div className="relative aspect-[16/9] w-full sm:aspect-[21/9]">
          {pending ? (
            <ProcessingPlaceholder video={video} iconSize="md" />
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaUrl(poster!)}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover transition-[transform,filter] duration-[var(--motion-slow)] ease-[var(--ease-standard)] group-hover:scale-[1.015] group-hover:brightness-105"
              />
              <div
                className="pointer-events-none absolute inset-0"
                style={{ background: 'linear-gradient(to top, oklch(0.04 0.004 48 / 45%) 0%, transparent 45%)' }}
              />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <PlayBadge size="lg" hovered={hovered} />
              </div>
            </>
          )}
        </div>
      </button>
      <div className="mt-5 max-w-xl">
        <p className="text-eyebrow-gold">Featured Film</p>
        <h2 className="mt-2 font-serif text-2xl text-foreground sm:text-3xl">{titleFor(video)}</h2>
        {metaLine(video) && <p className="mt-2 text-small text-muted-foreground">{metaLine(video)}</p>}
      </div>
    </div>
  )
}

function FilmTile({ video, wide, onOpen }: { video: ChapterVideo; wide?: boolean; onOpen: () => void }) {
  const [hovered, setHovered] = useState(false)
  const poster = posterFor(video)
  const pending = !poster

  return (
    <button
      type="button"
      onClick={onOpen}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      aria-label={tileLabel(video, pending)}
      className={cn(
        'group relative overflow-hidden rounded-2xl bg-muted text-left focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--amber)]',
        wide ? 'aspect-[2/1] sm:col-span-2' : 'aspect-video',
      )}
    >
      {pending ? (
        <ProcessingPlaceholder video={video} />
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mediaUrl(poster!)}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-[transform,filter] duration-[var(--motion-slow)] ease-[var(--ease-standard)] group-hover:scale-[1.02] group-hover:brightness-105"
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'linear-gradient(to top, oklch(0.04 0.004 48 / 78%) 0%, oklch(0.04 0.004 48 / 15%) 55%, transparent 100%)',
            }}
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <PlayBadge hovered={hovered} />
          </div>
        </>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-0.5 px-4 py-3.5">
        <span className="line-clamp-1 text-small font-medium text-white/90">{titleFor(video)}</span>
        {metaLine(video) && <span className="text-[0.7rem] text-white/60">{metaLine(video)}</span>}
      </div>
    </button>
  )
}
