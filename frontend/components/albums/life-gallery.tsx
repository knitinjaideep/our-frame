'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ImageOff } from 'lucide-react'
import {
  MasonryGallery,
  PhotoLightbox,
  EditorialEyebrow,
  EmptyState,
  FeaturedStory,
  type MasonryGalleryItem,
  type LightboxSlide,
} from '@/components/design-system'
import { SectionReveal } from '@/components/ui/section-reveal'
import { useAlbumDetails } from '@/hooks/use-albums'
import { useFavoriteIds, useToggleFavorite } from '@/hooks/use-favorites'
import { mediaUrl, downloadUrl, videoStreamUrl } from '@/lib/api-client'
import { gridThumbnail } from '@/lib/media'
import { shortDate, dateRangeLabel } from '@/lib/photo-age'
import type { AlbumDetail, Photo } from '@/types'

// Deterministic shuffle (not `created_time` order) so each group reads as
// candid/spontaneous rather than a strict chronological filmstrip — per the
// Life prompt ("less chronological, more spontaneous"). Seeded on photo id
// so the order is stable across re-renders instead of reshuffling every
// render.
function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return h
}
function spontaneousOrder(photos: Photo[]): Photo[] {
  return [...photos].sort((a, b) => hash(a.id) - hash(b.id))
}

interface LifeGalleryProps {
  data?: AlbumDetail
  isLoading: boolean
  error: Error | null
}

/**
 * Life is an organizational Drive bucket with zero photos of its own —
 * real candid photos live under real sub-albums (e.g. "Boston",
 * "Clyde Reptiland" — real folder names). See `docs/redesign/STATE.md`
 * PR 6 notes.
 *
 * The prompt's optional Family/Friends/Home/Celebrations/Everyday filters
 * are deliberately NOT implemented: there is no tagging/category field
 * anywhere in the data model (`Photo` has no tags, and sub-album names here
 * are places, not people/occasion categories), so fabricating that
 * taxonomy would misrepresent real data as structured metadata that
 * doesn't exist. The "editorial interruptions" between photo groups use
 * only real sub-album names/date ranges, never invented captions.
 */
export function LifeGallery({ data, isLoading, error }: LifeGalleryProps) {
  const groupSummaries = useMemo(() => data?.subfolders ?? [], [data?.subfolders])
  const groupIds = useMemo(() => groupSummaries.map((g) => g.id), [groupSummaries])
  const groupQueries = useAlbumDetails(groupIds)

  const favoriteIds = useFavoriteIds()
  const { add, remove } = useToggleFavorite()

  const [lightboxIndex, setLightboxIndex] = useState(-1)

  const groups = useMemo(() => {
    return groupSummaries.map((g, i) => {
      const photos = groupQueries[i]?.data?.photos ?? []
      return {
        id: g.id,
        name: g.name,
        photos,
        dateRange: dateRangeLabel(photos.map((p) => p.created_time)),
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupSummaries, groupQueries.map((q) => q.dataUpdatedAt).join(',')])

  // Real, per-group photo lists (each group is a real sub-album — e.g.
  // "Boston" — so an editorial interruption naming that group is grounded,
  // never a caption invented for a mixed/unrelated set of photos).
  const orderedGroups = useMemo(
    () => groups.filter((g) => g.photos.length > 0).map((g) => ({ ...g, photos: spontaneousOrder(g.photos) })),
    [groups],
  )
  const interleaved = useMemo(() => orderedGroups.flatMap((g) => g.photos), [orderedGroups])

  function isFav(p: Photo) {
    return favoriteIds.has(p.id) || p.is_favorite
  }

  function toggleFavorite(p: Photo) {
    if (isFav(p)) {
      remove.mutate(p.id)
    } else {
      add.mutate({ photo_id: p.id, photo_name: p.name, folder_id: groups.find((g) => g.photos.some((x) => x.id === p.id))?.id })
    }
  }

  function toMasonryItem(p: Photo): MasonryGalleryItem {
    const isVideo = p.mime_type?.startsWith('video/')
    const thumb = gridThumbnail(p)
    return {
      id: p.id,
      imageUrl: thumb ? mediaUrl(thumb) : null,
      isVideo,
      statusLabel: p.processing_status === 'failed' ? 'Unavailable' : 'Processing',
      alt: p.name,
      width: p.width,
      height: p.height,
      date: shortDate(p.created_time),
      isFavorite: isFav(p),
      onToggleFavorite: () => toggleFavorite(p),
      onClick: () => openLightboxFor(p),
    }
  }

  function openLightboxFor(p: Photo) {
    const idx = interleaved.findIndex((x) => x.id === p.id)
    if (idx >= 0) setLightboxIndex(idx)
  }

  const slides: LightboxSlide[] = useMemo(
    () =>
      interleaved.map((p) => {
        const isVideo = p.mime_type?.startsWith('video/')
        const meta = {
          date: shortDate(p.created_time),
          isFavorite: isFav(p),
          onToggleFavorite: () => toggleFavorite(p),
        }
        if (isVideo) {
          const videoSrc = p.playback_url ? mediaUrl(p.playback_url) : videoStreamUrl(p.id)
          const posterSrc = p.poster_url ?? p.thumbnail_url
          return {
            type: 'video' as const,
            sources: [{ src: videoSrc, type: p.playback_url ? 'video/mp4' : undefined }],
            download: downloadUrl(p.id),
            poster: posterSrc ? mediaUrl(posterSrc) : undefined,
            alt: p.name,
            width: p.width ?? undefined,
            height: p.height ?? undefined,
            controls: true,
            playsInline: true,
            ...meta,
          }
        }
        return {
          src: mediaUrl(p.preview_url),
          download: downloadUrl(p.id),
          alt: p.name,
          width: p.width ?? undefined,
          height: p.height ?? undefined,
          photoId: p.id,
          ...meta,
        }
      }),
    // isFav/toggleFavorite are derived from favoriteIds (already a dep) —
    // same pattern as arjun-gallery.tsx.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [interleaved, favoriteIds],
  )

  // Featured candid: prefer an existing favorite, otherwise the first ready
  // still image encountered — real photo, no invented "best of" ranking.
  const featuredPhoto = useMemo(() => {
    const stills = interleaved.filter((p) => !p.mime_type?.startsWith('video/') && gridThumbnail(p))
    return stills.find(isFav) ?? stills[0]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interleaved, favoriteIds])

  const subLoading = groupQueries.some((q) => q.isLoading)
  const hasContent = groupSummaries.length > 0
  const showLoading = isLoading || (hasContent && subLoading && interleaved.length === 0)
  // Every photo on this page comes from the per-sub-album queries, so if those
  // all fail (or every sub-album is empty / nests deeper) there is nothing to
  // render below the header. Without this the page would be a bare title over
  // blank space rather than an honest state — see `.claude/rules/frontend.md`.
  const subError = groupQueries.some((q) => q.isError)
  const showNothingToRender = !showLoading && !error && hasContent && interleaved.length === 0

  // One masonry chunk per real sub-album, with a grounded editorial
  // interruption (real sub-album name + real derived date range) above each
  // — per the Life prompt's "interrupt with simple editorial text" pattern.
  // Never mixes photos from different groups under one group's label.
  const sections = orderedGroups
    .map((g) => ({ ...g, photos: g.photos.filter((p) => p.id !== featuredPhoto?.id) }))
    .filter((g) => g.photos.length > 0)

  return (
    <div className="content-padding pb-24 pt-14 sm:pt-16">
      <div className="mx-auto max-w-[var(--container-max)]">
        <SectionReveal>
          <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-1.5 text-small">
            <Link href="/photos" className="text-muted-foreground transition-colors hover:text-foreground">
              Photos
            </Link>
            <span className="text-muted-foreground opacity-40">/</span>
            <span className="text-foreground">Life</span>
          </nav>

          <EditorialEyebrow className="mb-3">People &amp; Moments</EditorialEyebrow>
          <h1 className="text-h1">Life</h1>
          <p className="mt-3 max-w-md text-body text-muted-foreground">
            Friends, family, ordinary days. Everything that makes us, us.
          </p>
        </SectionReveal>

        {error && (
          <div className="mt-8 rounded-2xl border border-destructive/20 bg-destructive/5 px-5 py-4 text-sm text-destructive">
            Could not load Life. Check that your Google Drive is connected.
          </div>
        )}

        {showLoading ? (
          <div className="mt-14 space-y-6">
            <div className="aspect-[4/3] w-full rounded-2xl skeleton-shimmer lg:aspect-[16/10]" />
            <div className="columns-2 gap-4 sm:columns-3 md:columns-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="mb-4 aspect-[4/5] w-full break-inside-avoid rounded-xl skeleton-shimmer" />
              ))}
            </div>
          </div>
        ) : (!hasContent && !error) || showNothingToRender ? (
          <div className="mt-14">
            <EmptyState
              icon={<ImageOff className="h-6 w-6" />}
              title={subError ? 'Could not load these photos' : 'No photos yet'}
              description={
                subError
                  ? 'These albums did not load. Check that your Google Drive is connected, then try again.'
                  : 'Once photos land in this Drive folder, they will appear here.'
              }
            />
          </div>
        ) : (
          <>
            {featuredPhoto && gridThumbnail(featuredPhoto) && (
              <SectionReveal delay={0.05}>
                <section className="mt-14">
                  <FeaturedStory
                    // One dominant photograph — source it at preview
                    // resolution (same derivative the home hero and lightbox
                    // use) rather than the 400px grid thumbnail, which visibly
                    // upscales at full container width. Exactly one preview
                    // request per page load; every masonry tile below still
                    // uses cached thumbnails only (PR 4 finding).
                    imageUrl={mediaUrl(featuredPhoto.preview_url ?? gridThumbnail(featuredPhoto)!)}
                    imageAlt={featuredPhoto.name}
                    statement="The little things were the big things."
                    description="Sunday mornings. Dinner tables. Small laughs. The moments we never planned to photograph."
                  />
                </section>
              </SectionReveal>
            )}

            <div className="mt-16 space-y-14">
              {sections.map((section) => (
                <div key={section.id}>
                  <SectionReveal>
                    <p className="mb-6 font-serif text-2xl italic text-foreground/90">
                      {section.name}
                      {section.dateRange && (
                        <span className="ml-2 text-small font-sans not-italic text-muted-foreground">
                          {section.dateRange}
                        </span>
                      )}
                    </p>
                  </SectionReveal>
                  <SectionReveal delay={0.04}>
                    <MasonryGallery density="tight" items={section.photos.map(toMasonryItem)} />
                  </SectionReveal>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <PhotoLightbox
        open={lightboxIndex >= 0}
        index={lightboxIndex}
        slides={slides}
        onClose={() => setLightboxIndex(-1)}
      />
    </div>
  )
}
