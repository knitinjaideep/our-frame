'use client'
import { use, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { useAlbumDetail } from '@/hooks/use-albums'
import { useFavoriteIds, useToggleFavorite } from '@/hooks/use-favorites'
import { AlbumCard } from '@/components/albums/album-card'
import { PhotoGridSkeleton } from '@/components/photos/photo-grid-skeleton'
import { AlbumGridSkeleton } from '@/components/albums/album-grid-skeleton'
import { SectionReveal } from '@/components/ui/section-reveal'
import { ArjunGallery } from '@/components/albums/arjun-gallery'
import { TravelGallery } from '@/components/albums/travel-gallery'
import { MilestonesGallery } from '@/components/albums/milestones-gallery'
import { LifeGallery } from '@/components/albums/life-gallery'
import { MasonryGallery, PhotoLightbox, type MasonryGalleryItem, type LightboxSlide } from '@/components/design-system'
import { mediaUrl, downloadUrl, videoStreamUrl } from '@/lib/api-client'
import { gridThumbnail } from '@/lib/media'
import { shortDate } from '@/lib/photo-age'
import { BUCKETS } from '@/lib/buckets'
import type { Photo } from '@/types'

// The nav's Photos dropdown links each chapter straight to its Drive folder
// id (see components/layout/top-nav.tsx PHOTOS_ITEMS). Arjun, Travel,
// Milestones, and Life each get a dedicated premium chapter component (PR
// 4 / PR 6); every other album id (including real destination/milestone/
// life sub-albums nested under those chapters, and any legacy album) falls
// through to the shared generic detail template below — which PR 6 also
// upgraded from the old equal-size `PhotoGrid` to `MasonryGallery` +
// `PhotoLightbox`, so "destination detail" / "full story" views reuse the
// same gallery primitives rather than a separate one-off implementation.
const [ARJUN_ID, TRAVEL_ID, MILESTONES_ID, LIFE_ID] = BUCKETS.map((b) => b.id)

export default function AlbumDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data, isLoading, error } = useAlbumDetail(id)

  if (id === ARJUN_ID) {
    return <ArjunGallery data={data} isLoading={isLoading} error={error} folderId={id} />
  }
  if (id === TRAVEL_ID) {
    return <TravelGallery data={data} isLoading={isLoading} error={error} />
  }
  if (id === MILESTONES_ID) {
    return <MilestonesGallery data={data} isLoading={isLoading} error={error} />
  }
  if (id === LIFE_ID) {
    return <LifeGallery data={data} isLoading={isLoading} error={error} />
  }

  return <GenericAlbumDetail id={id} data={data} isLoading={isLoading} error={error} />
}

function GenericAlbumDetail({
  id,
  data,
  isLoading,
  error,
}: {
  id: string
  data: ReturnType<typeof useAlbumDetail>['data']
  isLoading: boolean
  error: Error | null
}) {
  const [lightboxIndex, setLightboxIndex] = useState(-1)
  const favoriteIds = useFavoriteIds()
  const { add, remove } = useToggleFavorite()

  const photos = data?.photos ?? []

  function isFav(p: Photo) {
    return favoriteIds.has(p.id) || p.is_favorite
  }
  function toggleFavorite(p: Photo) {
    if (isFav(p)) {
      remove.mutate(p.id)
    } else {
      add.mutate({ photo_id: p.id, photo_name: p.name, folder_id: id })
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
      onClick: () => {
        const idx = photos.findIndex((x) => x.id === p.id)
        if (idx >= 0) setLightboxIndex(idx)
      },
    }
  }
  const slides: LightboxSlide[] = photos.map((p) => {
    const isVideo = p.mime_type?.startsWith('video/')
    const meta = { date: shortDate(p.created_time), isFavorite: isFav(p), onToggleFavorite: () => toggleFavorite(p) }
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
  })

  const hasSubfolders = (data?.subfolders?.length ?? 0) > 0
  const hasPhotos = (data?.photos?.length ?? 0) > 0

  return (
    <div>
      {/* ── Page header — same structure as /photos ── */}
      <motion.div
        className="content-padding pt-12 pb-16"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs mb-5" aria-label="Breadcrumb">
          <Link
            href="/home"
            className="transition-colors"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Home
          </Link>
          <ChevronRight className="h-3 w-3 shrink-0" style={{ color: 'var(--muted-foreground)', opacity: 0.4 }} />
          <Link
            href="/photos"
            className="transition-colors"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Photos
          </Link>
          {data?.album && (
            <>
              <ChevronRight className="h-3 w-3 shrink-0" style={{ color: 'var(--muted-foreground)', opacity: 0.4 }} />
              <span style={{ color: 'var(--foreground)' }}>{data.album.name}</span>
            </>
          )}
        </nav>

        <p className="text-eyebrow-gold mb-3">Album</p>

        {isLoading ? (
          <div className="h-10 w-64 rounded skeleton-shimmer" />
        ) : (
          <h1 className="text-display-sm font-serif text-foreground">
            {data?.album.name ?? 'Album'}
          </h1>
        )}

        {!isLoading && hasPhotos && (
          <p className="mt-3 text-sm text-muted-foreground max-w-md leading-relaxed">
            {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
            {hasSubfolders && ` · ${data!.subfolders.length} ${data!.subfolders.length === 1 ? 'sub-album' : 'sub-albums'}`}
          </p>
        )}
      </motion.div>

      {error && (
        <div className="content-padding mb-8">
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-5 py-4 text-sm text-destructive">
            Failed to load this album.
          </div>
        </div>
      )}

      {/* ── Content sections — same rhythm as /photos ── */}
      <div className="pb-24">

        {/* Sub-albums section */}
        {isLoading ? (
          <SectionReveal>
            <section className="content-padding mb-20">
              <div className="mb-10 space-y-1.5">
                <div className="h-3 w-24 rounded skeleton-shimmer" />
                <div className="h-8 w-48 rounded skeleton-shimmer" />
              </div>
              <AlbumGridSkeleton count={4} />
            </section>
          </SectionReveal>
        ) : hasSubfolders && (
          <SectionReveal>
            <section className="content-padding mb-20">
              <div className="flex items-end justify-between mb-10">
                <div className="space-y-1.5">
                  <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--amber)' }}>
                    Inside this Album
                  </p>
                  <h2
                    className="font-serif leading-[0.95]"
                    style={{ fontSize: 'clamp(1.7rem, 3.2vw, 2.5rem)', fontStyle: 'italic', fontWeight: 500, color: 'var(--foreground)' }}
                  >
                    Sub-albums
                  </h2>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
                {data!.subfolders.map((album) => (
                  <AlbumCard key={album.id} album={album} />
                ))}
              </div>
            </section>
          </SectionReveal>
        )}

        {/* Photos section */}
        {isLoading ? (
          <SectionReveal delay={0.04}>
            <section className="content-padding mb-20">
              <div className="mb-10 space-y-1.5">
                <div className="h-3 w-24 rounded skeleton-shimmer" />
                <div className="h-8 w-40 rounded skeleton-shimmer" />
              </div>
              <PhotoGridSkeleton count={12} />
            </section>
          </SectionReveal>
        ) : hasPhotos && (
          <SectionReveal delay={hasSubfolders ? 0.04 : 0}>
            <section className="content-padding mb-20">
              <div className="flex items-end justify-between mb-10">
                <div className="space-y-1.5">
                  <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--amber)' }}>
                    Photos
                  </p>
                  <h2
                    className="font-serif leading-[0.95]"
                    style={{ fontSize: 'clamp(1.7rem, 3.2vw, 2.5rem)', fontStyle: 'italic', fontWeight: 500, color: 'var(--foreground)' }}
                  >
                    {data?.album.name}
                  </h2>
                </div>
              </div>
              <MasonryGallery items={photos.map(toMasonryItem)} />
            </section>
          </SectionReveal>
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
