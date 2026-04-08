'use client'
import { useState } from 'react'
import { Play } from 'lucide-react'
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
  const [hovered, setHovered] = useState(false)
  const isVideo = photo.mime_type?.startsWith('video/')

  return (
    <div
      className="group relative cursor-pointer overflow-hidden rounded-xl bg-muted"
      style={{
        aspectRatio: '4 / 5',
        boxShadow: hovered
          ? '0 16px 48px oklch(0 0 0 / 60%), 0 4px 16px oklch(0 0 0 / 38%), 0 0 0 1px oklch(0.70 0.145 58 / 22%)'
          : '0 2px 8px oklch(0 0 0 / 30%), 0 1px 3px oklch(0 0 0 / 20%)',
        transform: hovered ? 'translateY(-3px) scale(1.015)' : 'translateY(0) scale(1)',
        transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      {/* Skeleton shimmer for images while loading */}
      {!loaded && !isVideo && (
        <div className="absolute inset-0 skeleton-shimmer" />
      )}

      {/* Dark base for videos (no thumbnail) */}
      {isVideo && (
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, oklch(0.11 0.012 48) 0%, oklch(0.08 0.006 46) 100%)' }}
        />
      )}

      {photo.thumbnail_url && (
        <img
          src={mediaUrl(photo.thumbnail_url)}
          alt={photo.name}
          loading={priority ? 'eager' : 'lazy'}
          onLoad={() => setLoaded(true)}
          className={`h-full w-full object-cover ${loaded ? 'opacity-100' : 'opacity-0'}`}
          style={{
            transform: hovered ? 'scale(1.06)' : 'scale(1)',
            transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease',
          }}
        />
      )}

      {/* Warm cinematic hover overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: hovered
            ? 'linear-gradient(to top, oklch(0.04 0.004 48 / 65%) 0%, oklch(0.04 0.004 48 / 20%) 45%, transparent 75%)'
            : 'transparent',
          transition: 'background 0.35s ease',
        }}
      />

      {/* Play icon overlay for videos */}
      {isVideo && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-sm"
            style={{
              background: 'oklch(0.70 0.145 58 / 20%)',
              border: '1px solid oklch(0.70 0.145 58 / 45%)',
              boxShadow: '0 0 20px oklch(0.70 0.145 58 / 25%)',
              transform: hovered ? 'scale(1.15)' : 'scale(1)',
              transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <Play className="h-4 w-4" style={{ color: 'var(--amber)', fill: 'var(--amber)', marginLeft: '2px' }} />
          </div>
        </div>
      )}

      {/* Favorite button — top right, fades in on hover */}
      <div
        className="absolute right-2 top-2"
        style={{
          opacity: hovered ? 1 : 0,
          transform: hovered ? 'translateY(0)' : 'translateY(-4px)',
          transition: 'opacity 0.25s ease, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <FavoriteButton photoId={photo.id} photoName={photo.name} folderId={folderId} />
      </div>

      {/* Photo name — slides up from bottom on hover */}
      <div
        className="absolute inset-x-0 bottom-0 p-3"
        style={{
          background: 'linear-gradient(to top, oklch(0 0 0 / 85%) 0%, oklch(0 0 0 / 50%) 50%, transparent 100%)',
          transform: hovered ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <p className="truncate text-xs font-medium text-white/90 drop-shadow-sm">{photo.name}</p>
      </div>
    </div>
  )
}
