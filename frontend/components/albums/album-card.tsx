'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Images } from 'lucide-react'
import { mediaUrl } from '@/lib/api-client'
import type { Album } from '@/types'

export function AlbumCard({ album }: { album: Album }) {
  const [loaded, setLoaded] = useState(false)

  return (
    <Link
      href={`/albums/${album.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 shadow-warm hover:shadow-warm-hover"
      style={
        {
          '--hover-border': 'var(--amber-border)',
        } as React.CSSProperties
      }
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--amber-border)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = ''
      }}
    >
      {/* ── Cover image ── */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {!loaded && (
          <div className="absolute inset-0 skeleton-shimmer" />
        )}

        {album.thumbnail_url ? (
          <img
            src={mediaUrl(album.thumbnail_url)}
            alt={album.name}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            className={`h-full w-full object-cover transition-all duration-500 group-hover:scale-[1.04] ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Images className="h-10 w-10 text-muted-foreground/25" />
          </div>
        )}

        {/* Bottom gradient — warm cinematic overlay */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      {/* ── Info ── */}
      <div className="flex items-start justify-between gap-2 px-4 py-3.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-card-foreground leading-snug">
            {album.name}
          </p>
          {album.photo_count != null && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {album.photo_count.toLocaleString()} {album.photo_count === 1 ? 'photo' : 'photos'}
            </p>
          )}
        </div>
        {/* Amber accent dot — shows on hover */}
        <div
          className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          style={{ backgroundColor: 'var(--amber)' }}
        />
      </div>
    </Link>
  )
}
