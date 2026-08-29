'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ImageOff } from 'lucide-react'
import {
  MasonryGallery,
  GalleryTabs,
  PhotoLightbox,
  EmptyState,
  galleryTabPanelId,
  type MasonryGalleryItem,
  type LightboxSlide,
} from '@/components/design-system'
import { AlbumCard } from '@/components/albums/album-card'
import { PhotoGridSkeleton } from '@/components/photos/photo-grid-skeleton'
import { SectionReveal } from '@/components/ui/section-reveal'
import { useFavoriteIds, useToggleFavorite } from '@/hooks/use-favorites'
import { mediaUrl, downloadUrl, videoStreamUrl } from '@/lib/api-client'
import { ageCaption, earliestDate, shortDate } from '@/lib/photo-age'
import type { AlbumDetail, Photo } from '@/types'

type TabId = 'all' | 'age' | 'year' | 'albums'

const TABS: { id: TabId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'age', label: 'By Age' },
  { id: 'year', label: 'By Year' },
  { id: 'albums', label: 'Albums' },
]

interface ArjunGalleryProps {
  data?: AlbumDetail
  isLoading: boolean
  error: Error | null
  folderId: string
}

function photoTime(p: Photo): number {
  return p.created_time ? new Date(p.created_time).getTime() : 0
}

/**
 * Cached thumbnail (or video poster) for a grid tile, or null when no
 * derivative exists yet. Never falls back to `preview_url`: that route is a
 * full-size, per-request Drive download.
 */
function gridThumbnail(p: Photo): string | null {
  const isVideo = p.mime_type?.startsWith('video/')
  return (isVideo ? (p.poster_url ?? p.thumbnail_url) : p.thumbnail_url) ?? null
}

export function ArjunGallery({ data, isLoading, error, folderId }: ArjunGalleryProps) {
  const [activeTab, setActiveTab] = useState<TabId>('all')
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest')
  const [filter, setFilter] = useState<'all' | 'favorites'>('all')
  const [lightboxIndex, setLightboxIndex] = useState(-1)

  const favoriteIds = useFavoriteIds()
  const { add, remove } = useToggleFavorite()

  const photos = useMemo(() => data?.photos ?? [], [data?.photos])
  const subfolders = data?.subfolders ?? []

  function isFav(p: Photo) {
    return favoriteIds.has(p.id) || p.is_favorite
  }

  function toggleFavorite(p: Photo) {
    // Mirror the same predicate the heart is rendered from, so the action
    // always matches what the user sees (the favorites list can lag behind
    // the album payload's `is_favorite` on first paint).
    if (isFav(p)) {
      remove.mutate(p.id)
    } else {
      add.mutate({ photo_id: p.id, photo_name: p.name, folder_id: folderId })
    }
  }

  // Reference "start" date for age captions — earliest dated photo across
  // the whole chapter (not just the current filter), so captions stay
  // stable while filtering/sorting. See lib/photo-age.ts for the judgment
  // call this rests on (no birth-date field exists in the data model).
  const startDate = useMemo(
    () => earliestDate(photos.map((p) => p.created_time)),
    [photos],
  )

  const filteredPhotos = useMemo(
    () => (filter === 'favorites' ? photos.filter(isFav) : photos),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [photos, filter, favoriteIds],
  )

  const sortedPhotos = useMemo(() => {
    const list = [...filteredPhotos]
    list.sort((a, b) => (sort === 'newest' ? photoTime(b) - photoTime(a) : photoTime(a) - photoTime(b)))
    return list
  }, [filteredPhotos, sort])

  // The flat, chronologically-ordered list backing whichever tab is active
  // — used for both the masonry rendering order and lightbox prev/next, so
  // navigating the viewer always matches the photo physically next to it.
  const flattenedForTab = useMemo(() => {
    if (activeTab === 'age') {
      return [...filteredPhotos].sort((a, b) => photoTime(a) - photoTime(b))
    }
    if (activeTab === 'year') {
      return [...filteredPhotos].sort((a, b) => photoTime(b) - photoTime(a))
    }
    return sortedPhotos
  }, [activeTab, filteredPhotos, sortedPhotos])

  const ageGroups = useMemo(() => {
    if (!startDate) return []
    const buckets = new Map<number, { label: string; photos: Photo[] }>()
    const undated: Photo[] = []
    for (const p of flattenedForTab) {
      if (!p.created_time) {
        undated.push(p)
        continue
      }
      const { label, monthsElapsed } = ageCaption(new Date(p.created_time), startDate)
      if (!buckets.has(monthsElapsed)) buckets.set(monthsElapsed, { label, photos: [] })
      buckets.get(monthsElapsed)!.photos.push(p)
    }
    const groups = [...buckets.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => v)
    if (undated.length) groups.push({ label: 'Undated', photos: undated })
    return groups
  }, [flattenedForTab, startDate])

  const yearGroups = useMemo(() => {
    const buckets = new Map<number, Photo[]>()
    const undated: Photo[] = []
    for (const p of flattenedForTab) {
      if (!p.created_time) {
        undated.push(p)
        continue
      }
      const year = new Date(p.created_time).getFullYear()
      if (!buckets.has(year)) buckets.set(year, [])
      buckets.get(year)!.push(p)
    }
    const groups = [...buckets.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([year, ps]) => ({ label: String(year), photos: ps }))
    if (undated.length) groups.push({ label: 'Undated', photos: undated })
    return groups
  }, [flattenedForTab])

  // 2–4 standout photos: favorites first, falling back to the most recent
  // photos in the current filter when there aren't enough favorites yet.
  const featuredPhotos = useMemo(() => {
    // Only photos with a ready cached thumbnail can headline the strip —
    // a "featured memory" must never be a processing placeholder.
    const isStill = (p: Photo) => !p.mime_type?.startsWith('video/') && Boolean(gridThumbnail(p))
    const ready = filteredPhotos.filter(isStill)
    const favs = ready.filter(isFav)
    const pool = favs.length >= 2 ? favs : sortedPhotos.filter(isStill)
    return pool.slice(0, 4)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredPhotos, sortedPhotos, favoriteIds])

  function captionFor(p: Photo): string | undefined {
    if (!startDate || !p.created_time) return undefined
    return ageCaption(new Date(p.created_time), startDate).label
  }

  function toMasonryItem(p: Photo): MasonryGalleryItem {
    const isVideo = p.mime_type?.startsWith('video/')
    const thumb = gridThumbnail(p)
    return {
      id: p.id,
      // Grid tiles only ever use cached thumbnails/posters. Falling back to
      // `preview_url` here would make each un-synced tile download a full
      // original from Drive (and 500 outright for videos).
      imageUrl: thumb ? mediaUrl(thumb) : null,
      isVideo,
      statusLabel: p.processing_status === 'failed' ? 'Unavailable' : 'Processing',
      alt: p.name,
      width: p.width,
      height: p.height,
      caption: captionFor(p),
      date: shortDate(p.created_time),
      isFavorite: isFav(p),
      onToggleFavorite: () => toggleFavorite(p),
      onClick: () => openLightboxFor(p),
    }
  }

  function openLightboxFor(p: Photo) {
    const idx = flattenedForTab.findIndex((x) => x.id === p.id)
    if (idx >= 0) setLightboxIndex(idx)
  }

  const slides: LightboxSlide[] = useMemo(() => flattenedForTab.map((p) => {
    const isVideo = p.mime_type?.startsWith('video/')
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
      }
    }
    return {
      src: mediaUrl(p.preview_url),
      download: downloadUrl(p.id),
      alt: p.name,
      width: p.width ?? undefined,
      height: p.height ?? undefined,
      photoId: p.id,
    }
  }), [flattenedForTab])

  const hasPhotos = photos.length > 0

  return (
    <div className="content-padding pb-24 pt-14 sm:pt-16">
      <div className="mx-auto max-w-[var(--container-max)]">
        {/* ── Breadcrumb ── */}
        <SectionReveal>
          <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-1.5 text-small">
            <Link href="/photos" className="text-muted-foreground transition-colors hover:text-foreground">
              Photos
            </Link>
            <span className="text-muted-foreground opacity-40">/</span>
            <span className="text-foreground">Arjun</span>
          </nav>

          {/* ── Header ── */}
          <h1 className="text-h1">Arjun</h1>
          <p className="mt-3 max-w-md text-body text-muted-foreground">Growing up, frame by frame.</p>
          {!isLoading && (
            <p className="mt-4 text-small text-muted-foreground opacity-70">
              {photos.length.toLocaleString()} {photos.length === 1 ? 'photo' : 'photos'}
            </p>
          )}
        </SectionReveal>

        {error && (
          <div className="mt-8 rounded-2xl border border-destructive/20 bg-destructive/5 px-5 py-4 text-sm text-destructive">
            Could not load this album. Check that your Google Drive is connected.
          </div>
        )}

        {isLoading ? (
          <div className="mt-14">
            <PhotoGridSkeleton count={12} />
          </div>
        ) : !hasPhotos && !error ? (
          <div className="mt-14">
            <EmptyState
              icon={<ImageOff className="h-6 w-6" />}
              title="No photos yet"
              description="Once photos land in this Drive folder, they will appear here."
            />
          </div>
        ) : (
          <>
            {/* ── Gallery navigation + refined filter/sort controls ── */}
            <SectionReveal delay={0.04}>
              <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <GalleryTabs
                  tabs={TABS}
                  activeId={activeTab}
                  onChange={(id) => setActiveTab(id as TabId)}
                />
                <div className="flex items-center gap-5 pb-3 text-small text-muted-foreground sm:pb-0">
                  <FilterControl
                    label="Filter"
                    value={filter}
                    options={[
                      { value: 'all', label: 'All' },
                      { value: 'favorites', label: 'Favorites' },
                    ]}
                    onChange={(v) => setFilter(v as 'all' | 'favorites')}
                  />
                  <FilterControl
                    label="Sort"
                    value={sort}
                    options={[
                      { value: 'newest', label: 'Newest' },
                      { value: 'oldest', label: 'Oldest' },
                    ]}
                    onChange={(v) => setSort(v as 'newest' | 'oldest')}
                  />
                </div>
              </div>
            </SectionReveal>

            {/* ── Featured memories strip — editorial, optional ── */}
            {featuredPhotos.length >= 2 && (
              <SectionReveal delay={0.06}>
                <section className="mt-12">
                  <p className="mb-4 text-eyebrow-gold">Featured Memories</p>
                  <div className="flex gap-4 overflow-x-auto pb-1">
                    {featuredPhotos.map((p, i) => {
                      const thumb = gridThumbnail(p)
                      if (!thumb) return null
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => openLightboxFor(p)}
                          className={
                            'group relative shrink-0 overflow-hidden rounded-xl bg-muted text-left ' +
                            'focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--amber)] ' +
                            (i % 3 === 1 ? 'h-72 w-56' : 'h-60 w-48')
                          }
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={mediaUrl(thumb)}
                            alt={p.name}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-[var(--motion-slow)] ease-[var(--ease-standard)] group-hover:scale-[1.03]"
                          />
                          {captionFor(p) && (
                            <span
                              className="pointer-events-none absolute inset-x-0 bottom-0 px-3 py-2.5 text-small font-medium text-white/90 opacity-0 transition-opacity duration-[var(--motion-fast)] group-hover:opacity-100 group-focus-visible:opacity-100"
                              style={{
                                background:
                                  'linear-gradient(to top, oklch(0.04 0.004 48 / 78%) 0%, transparent 100%)',
                              }}
                            >
                              {captionFor(p)}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </section>
              </SectionReveal>
            )}

            {/* ── Tab panels ── */}
            <SectionReveal delay={0.08}>
              <div className="mt-14">
                {activeTab === 'all' && (
                  <div
                    id={galleryTabPanelId('all')}
                    role="tabpanel"
                    aria-labelledby="gallery-tab-all"
                    tabIndex={0}
                  >
                    <MasonryGallery items={flattenedForTab.map(toMasonryItem)} />
                  </div>
                )}

                {activeTab === 'age' && (
                  <div
                    id={galleryTabPanelId('age')}
                    role="tabpanel"
                    aria-labelledby="gallery-tab-age"
                    tabIndex={0}
                    className="space-y-14"
                  >
                    {ageGroups.length === 0 ? (
                      <EmptyState
                        icon={<ImageOff className="h-6 w-6" />}
                        title="No dated photos"
                        description="Photos need a capture date to be grouped by age."
                      />
                    ) : (
                      <>
                        <p className="text-small text-muted-foreground opacity-70">
                          Ages are estimated from the earliest photo in this chapter.
                        </p>
                        {ageGroups.map((group) => (
                          <div key={group.label}>
                            <p className="mb-5 text-eyebrow">{group.label}</p>
                            <MasonryGallery items={group.photos.map(toMasonryItem)} />
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}

                {activeTab === 'year' && (
                  <div
                    id={galleryTabPanelId('year')}
                    role="tabpanel"
                    aria-labelledby="gallery-tab-year"
                    tabIndex={0}
                    className="space-y-14"
                  >
                    {yearGroups.map((group) => (
                      <div key={group.label}>
                        <p className="mb-5 text-eyebrow">{group.label}</p>
                        <MasonryGallery items={group.photos.map(toMasonryItem)} />
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'albums' && (
                  <div
                    id={galleryTabPanelId('albums')}
                    role="tabpanel"
                    aria-labelledby="gallery-tab-albums"
                    tabIndex={0}
                  >
                    {subfolders.length === 0 ? (
                      <EmptyState
                        icon={<ImageOff className="h-6 w-6" />}
                        title="No sub-albums"
                        description="This chapter doesn't have any nested albums yet — browse everything in the All tab."
                      />
                    ) : (
                      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
                        {subfolders.map((album) => (
                          <AlbumCard key={album.id} album={album} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </SectionReveal>
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

function FilterControl({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="opacity-60">{label}</span>
      {options.map((opt, i) => (
        <span key={opt.value} className="flex items-center gap-1.5">
          {i > 0 && <span className="opacity-30">/</span>}
          <button
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={value === opt.value}
            className={
              value === opt.value
                ? 'font-medium text-foreground'
                : 'text-muted-foreground transition-colors hover:text-foreground'
            }
          >
            {opt.label}
          </button>
        </span>
      ))}
    </div>
  )
}
