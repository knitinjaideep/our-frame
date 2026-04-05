'use client'
import { useState } from 'react'
import Link from 'next/link'
import { mediaUrl } from '@/lib/api-client'
import type { Album } from '@/types'

interface PhotographySectionProps {
  albums: Album[]
}

export function PhotographySection({ albums }: PhotographySectionProps) {
  if (albums.length === 0) return null

  return (
    <section className="space-y-6 content-padding">
      {/* ── Section header — more portfolio feel, slightly more restrained ── */}
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <p
            className="font-sans text-[10px] font-semibold tracking-[0.22em] uppercase"
            style={{ color: 'var(--muted-foreground)', opacity: 0.7 }}
          >
            Portfolio
          </p>
          <h2
            className="font-serif leading-tight"
            style={{
              fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
              fontStyle: 'italic',
              fontWeight: 500,
              color: 'var(--foreground)',
            }}
          >
            Photography
          </h2>
        </div>
        <Link
          href="/albums"
          className="font-sans text-xs font-medium transition-colors duration-200 hover:opacity-100"
          style={{ color: 'var(--muted-foreground)', opacity: 0.65 }}
        >
          View all
        </Link>
      </div>

      {/* ── Clean editorial grid — uniform aspect ratio, precise spacing ── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {albums.map((album, i) => (
          <PhotographyCard key={album.id} album={album} tall={i === 0 || i === 3} />
        ))}
      </div>
    </section>
  )
}

function PhotographyCard({ album, tall }: { album: Album; tall: boolean }) {
  const [loaded, setLoaded] = useState(false)

  return (
    <Link
      href={`/albums/${album.id}`}
      className="group relative block overflow-hidden rounded-xl"
      style={{ aspectRatio: tall ? '3/4' : '4/5' }}
    >
      <div className="absolute inset-0" style={{ background: 'var(--muted)' }}>
        {!loaded && <div className="absolute inset-0 skeleton-shimmer" />}
        {album.thumbnail_url ? (
          <img
            src={mediaUrl(album.thumbnail_url)}
            alt={album.name}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            className={`h-full w-full object-cover transition-all duration-700 group-hover:scale-[1.03] ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ background: 'var(--muted)' }}
          >
            <div className="h-6 w-6 rounded-full" style={{ background: 'var(--border)' }} />
          </div>
        )}

        {/* Minimal hover overlay — dark wash, not a heavy gradient */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400"
          style={{ background: 'oklch(0 0 0 / 30%)' }}
        />

        {/* Title — fades in on hover, bottom of card */}
        <div
          className="absolute inset-x-0 bottom-0 p-3 translate-y-1 opacity-0
                     group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300"
        >
          <p
            className="font-sans text-xs font-medium text-white drop-shadow-md"
          >
            {album.name}
          </p>
        </div>
      </div>
    </Link>
  )
}
