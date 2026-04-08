'use client'
import { useState } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import Download from 'yet-another-react-lightbox/plugins/download'
import Video from 'yet-another-react-lightbox/plugins/video'
import 'yet-another-react-lightbox/styles.css'
import { PhotoCard } from './photo-card'
import { mediaUrl, downloadUrl, previewUrl, videoStreamUrl } from '@/lib/api-client'
import type { Photo } from '@/types'

interface PhotoGridProps {
  photos: Photo[]
  folderId?: string
}

export function PhotoGrid({ photos, folderId }: PhotoGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState(-1)

  const slides = photos.map((p) => {
    const isVideo = p.mime_type?.startsWith('video/')
    if (isVideo) {
      return {
        type: 'video' as const,
        sources: [{ src: videoStreamUrl(p.id), type: p.mime_type }],
        download: downloadUrl(p.id),
        poster: p.thumbnail_url ? mediaUrl(p.thumbnail_url) : undefined,
        alt: p.name,
        width: p.width ?? undefined,
        height: p.height ?? undefined,
      }
    }
    return {
      src: mediaUrl(previewUrl(p.id)),
      download: downloadUrl(p.id),
      alt: p.name,
      width: p.width ?? undefined,
      height: p.height ?? undefined,
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

      <Lightbox
        open={lightboxIndex >= 0}
        index={lightboxIndex}
        close={() => setLightboxIndex(-1)}
        slides={slides}
        plugins={[Download, Video]}
        styles={{ container: { backgroundColor: 'rgba(0,0,0,0.96)' } }}
      />
    </>
  )
}
