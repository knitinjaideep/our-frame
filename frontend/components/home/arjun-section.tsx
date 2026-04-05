'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import { mediaUrl } from '@/lib/api-client'
import type { Album } from '@/types'

interface ArjunSectionProps {
  albums: Album[]
}

export function ArjunSection({ albums }: ArjunSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  if (albums.length === 0) return null

  return (
    <section className="space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between px-5 md:px-10 lg:px-14">
        <div className="space-y-1">
          <p className="text-eyebrow" style={{ color: 'var(--amber)' }}>Growing Up</p>
          <h2 className="text-section-heading">Arjun</h2>
        </div>
        <Link
          href="/albums"
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          View all
        </Link>
      </div>

      {/* Horizontal scroll strip */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 px-5 md:px-10 lg:px-14 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none' }}
      >
        {albums.map((album) => (
          <ArjunCard key={album.id} album={album} />
        ))}
      </div>
    </section>
  )
}

function ArjunCard({ album }: { album: Album }) {
  const [loaded, setLoaded] = useState(false)

  return (
    <Link
      href={`/albums/${album.id}`}
      className="group relative shrink-0 w-52 snap-start overflow-hidden rounded-2xl"
      style={{ aspectRatio: '3/4' }}
    >
      {/* Background image */}
      <div className="absolute inset-0 bg-muted">
        {!loaded && <div className="absolute inset-0 skeleton-shimmer" />}
        {album.thumbnail_url && (
          <img
            src={mediaUrl(album.thumbnail_url)}
            alt={album.name}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            className={`h-full w-full object-cover transition-all duration-500 group-hover:scale-[1.05] ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

      {/* Label */}
      <div className="absolute inset-x-0 bottom-0 p-4">
        <p className="text-sm font-semibold text-white leading-snug drop-shadow">{album.name}</p>
        {album.photo_count != null && (
          <p className="mt-0.5 text-xs text-white/55">
            {album.photo_count} {album.photo_count === 1 ? 'photo' : 'photos'}
          </p>
        )}
      </div>
    </Link>
  )
}
