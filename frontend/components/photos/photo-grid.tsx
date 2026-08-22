'use client'
import { useState } from 'react'
import { PhotoCard } from './photo-card'
import { ResilientLightbox, type LightboxSlide } from './resilient-lightbox'
import { mediaUrl, downloadUrl, videoStreamUrl } from '@/lib/api-client'
import type { Photo } from '@/types'

interface PhotoGridProps {
  photos: Photo[]
  folderId?: string
}

export function PhotoGrid({ photos, folderId }: PhotoGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState(-1)

  const slides: LightboxSlide[] = photos.map((p) => {
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
  })

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-[#141416] py-16 text-center">
        <p className="text-sm font-medium text-[#F5F0EB]">No photos in this album yet</p>
        <p className="mt-1 text-xs text-[#5A5751]">Add photos to this Drive folder to see them here</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {photos.map((photo, idx) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            folderId={folderId}
            priority={idx < 6}
            onClick={() => setLightboxIndex(idx)}
          />
        ))}
      </div>

      <ResilientLightbox
        open={lightboxIndex >= 0}
        index={lightboxIndex}
        slides={slides}
        onClose={() => setLightboxIndex(-1)}
      />
    </>
  )
}
