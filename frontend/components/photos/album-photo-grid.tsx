'use client'
import { useMemo, useState } from 'react'
import { MasonryGallery, PhotoLightbox, type MasonryGalleryItem, type LightboxSlide } from '@/components/design-system'
import { useFavoriteIds, useToggleFavorite } from '@/hooks/use-favorites'
import { mediaUrl, downloadUrl, videoStreamUrl } from '@/lib/api-client'
import { gridThumbnail } from '@/lib/media'
import { shortDate } from '@/lib/photo-age'
import type { Photo } from '@/types'

interface AlbumPhotoGridProps {
  photos: Photo[]
  /** Drive folder id photos in this grid belong to — needed for the favorite mutation. */
  folderId: string
  /** Album/chapter name, surfaced in the lightbox's discreet metadata. */
  albumName?: string
  density?: 'default' | 'tight'
  /**
   * Optional per-photo caption (e.g. Arjun's "6th month" age label). Content,
   * not layout — supplied by the page so every album keeps one gallery
   * component while chapters that have a meaningful caption can show it.
   */
  captionFor?: (photo: Photo) => string | undefined
  /**
   * Show the quiet Filter/Sort control row above the gallery
   * (`docs/OUR-FRAME-DESIGN-SYSTEM.md` §10/§11). Defaults to on for any
   * gallery with more than one photo.
   */
  showControls?: boolean
}

type FilterValue = 'all' | 'favorites'
type SortValue = 'newest' | 'oldest'

function photoTime(p: Photo): number {
  return p.created_time ? new Date(p.created_time).getTime() : 0
}

/**
 * AlbumPhotoGrid — the single shared "photo grid + lightbox" building block
 * for every album/category page (docs/OUR-FRAME-DESIGN-SYSTEM.md §11):
 * natural aspect ratios via `MasonryGallery`, consistent gutters, cached
 * thumbnails only (never a full `preview_url` in the grid), and one
 * `PhotoLightbox` wired to the same favorite state the grid tiles show.
 *
 * Consolidates masonry-item/lightbox-slide building that was previously
 * duplicated across the generic album template, `arjun-gallery.tsx`, and
 * `life-gallery.tsx` (docs/redesign-v2 PR 2), including the favorite/sort
 * controls and caption support those per-category components used to own —
 * kept here so every album gets them from one place rather than losing them
 * to the consolidation.
 */
export function AlbumPhotoGrid({
  photos,
  folderId,
  albumName,
  density,
  captionFor,
  showControls,
}: AlbumPhotoGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState(-1)
  const [filter, setFilter] = useState<FilterValue>('all')
  const [sort, setSort] = useState<SortValue>('newest')
  const favoriteIds = useFavoriteIds()
  const { add, remove } = useToggleFavorite()

  function isFav(p: Photo) {
    return favoriteIds.has(p.id) || p.is_favorite
  }
  function toggleFavorite(p: Photo) {
    if (isFav(p)) {
      remove.mutate(p.id)
    } else {
      add.mutate({ photo_id: p.id, photo_name: p.name, folder_id: folderId })
    }
  }

  const controlsVisible = showControls ?? photos.length > 1

  // The single ordered list backing both the masonry order and lightbox
  // prev/next, so opening a tile always lands on the photo the user clicked
  // and navigation matches what sits next to it on screen.
  const visiblePhotos = useMemo(() => {
    const list = controlsVisible && filter === 'favorites' ? photos.filter(isFav) : [...photos]
    if (controlsVisible) {
      list.sort((a, b) => (sort === 'newest' ? photoTime(b) - photoTime(a) : photoTime(a) - photoTime(b)))
    }
    return list
    // isFav is derived from favoriteIds, which is already a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos, filter, sort, controlsVisible, favoriteIds])

  function toMasonryItem(p: Photo): MasonryGalleryItem {
    const isVideo = p.mime_type?.startsWith('video/')
    const thumb = gridThumbnail(p)
    return {
      id: p.id,
      // Grid tiles only ever use cached thumbnails/posters — never
      // `preview_url`, which is a full-size, per-request derivative.
      imageUrl: thumb ? mediaUrl(thumb) : null,
      isVideo,
      statusLabel: p.processing_status === 'failed' ? 'Unavailable' : 'Processing',
      alt: p.name,
      width: p.width,
      height: p.height,
      caption: captionFor?.(p),
      date: shortDate(p.created_time),
      isFavorite: isFav(p),
      onToggleFavorite: () => toggleFavorite(p),
      onClick: () => {
        const idx = visiblePhotos.findIndex((x) => x.id === p.id)
        if (idx >= 0) setLightboxIndex(idx)
      },
    }
  }

  const slides: LightboxSlide[] = useMemo(
    () =>
      visiblePhotos.map((p) => {
        const isVideo = p.mime_type?.startsWith('video/')
        const meta = {
          date: shortDate(p.created_time),
          caption: captionFor?.(p),
          album: albumName,
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
    // same pattern as the former arjun-gallery.tsx/life-gallery.tsx.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visiblePhotos, favoriteIds, albumName, captionFor],
  )

  return (
    <>
      {controlsVisible && (
        <div className="mb-8 flex items-center gap-5 text-small text-muted-foreground">
          <GalleryControl
            label="Filter"
            value={filter}
            options={[
              { value: 'all', label: 'All' },
              { value: 'favorites', label: 'Favorites' },
            ]}
            onChange={(v) => {
              setFilter(v as FilterValue)
              setLightboxIndex(-1)
            }}
          />
          <GalleryControl
            label="Sort"
            value={sort}
            options={[
              { value: 'newest', label: 'Newest' },
              { value: 'oldest', label: 'Oldest' },
            ]}
            onChange={(v) => {
              setSort(v as SortValue)
              setLightboxIndex(-1)
            }}
          />
        </div>
      )}

      {visiblePhotos.length === 0 ? (
        <p className="text-small text-muted-foreground opacity-70">
          No favorites in this album yet.
        </p>
      ) : (
        <MasonryGallery density={density} items={visiblePhotos.map(toMasonryItem)} />
      )}

      <PhotoLightbox
        open={lightboxIndex >= 0}
        index={lightboxIndex}
        slides={slides}
        onClose={() => setLightboxIndex(-1)}
      />
    </>
  )
}

/**
 * Quiet Filter/Sort control, shared by every album gallery so the chrome
 * stays subordinate to the photography (design system §10/§11). Restored
 * from the removed `arjun-gallery.tsx` into the shared component.
 */
function GalleryControl({
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
            // -my-2 offsets the added py-2 so the visual row height is
            // unchanged while the tap target grows past 24px on touch.
            className={
              'inline-block -my-2 py-2 ' +
              (value === opt.value
                ? 'font-medium text-foreground'
                : 'text-muted-foreground transition-colors hover:text-foreground')
            }
          >
            {opt.label}
          </button>
        </span>
      ))}
    </div>
  )
}
