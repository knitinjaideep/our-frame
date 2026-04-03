'use client'
import { useState } from 'react'
import { mediaUrl } from '@/lib/api-client'
import { FavoriteButton } from './favorite-button'
import type { Photo } from '@/types'

interface PhotoCardProps {
  photo: Photo
  folderId?: string
  priority?: boolean
  onClick?: () => void
}

export function PhotoCard({ photo, folderId, priority = false, onClick }: PhotoCardProps) {
  const [loaded, setLoaded] = useState(false)

  return (
    <div
      className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl bg-muted transition-all duration-300 hover:-translate-y-0.5"
      style={
        {
          boxShadow: 'var(--shadow-card)',
        } as React.CSSProperties
      }
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-photo)'
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-card)'
      }}
      onClick={onClick}
    >
      {/* Skeleton shimmer */}
      {!loaded && (
        <div className="absolute inset-0 skeleton-shimmer" />
      )}

      <img
        src={mediaUrl(photo.thumbnail_url)}
        alt={photo.name}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={() => setLoaded(true)}
        className={`h-full w-full object-cover transition-all duration-400 group-hover:scale-[1.04] ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Warm cinematic hover overlay — not harsh black */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/0 to-black/0 transition-all duration-300 group-hover:from-black/40 group-hover:to-black/10" />

      {/* Favorite button — top right, on hover */}
      <div className="absolute right-2 top-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <FavoriteButton photoId={photo.id} photoName={photo.name} folderId={folderId} />
      </div>

      {/* Photo name — slides up from bottom on hover */}
      <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 transition-transform duration-300 ease-out group-hover:translate-y-0">
        <p className="truncate text-xs font-medium text-white/90 drop-shadow-sm">{photo.name}</p>
      </div>
    </div>
  )
}
