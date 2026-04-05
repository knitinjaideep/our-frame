'use client'
import { useState } from 'react'
import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { mediaUrl } from '@/lib/api-client'
import type { Album } from '@/types'

interface TravelSectionProps {
  albums: Album[]
}

export function TravelSection({ albums }: TravelSectionProps) {
  if (albums.length === 0) return null

  // First album is the featured hero card; rest fill the secondary row
  const [hero, ...rest] = albums

  return (
    <section className="space-y-6 content-padding">
      {/* ── Section header ── */}
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <p
            className="font-sans text-[10px] font-semibold tracking-[0.22em] uppercase"
            style={{ color: 'var(--amber)' }}
          >
            Adventures Together
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
            Family Travel
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

      {/* ── Editorial layout: large hero + secondary grid ── */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-12">

        {/* Hero card — spans 7/12 columns on md+ */}
        <div className="md:col-span-7">
          <TravelCard album={hero} size="hero" />
        </div>

        {/* Secondary grid — spans 5/12 columns on md+ */}
        {rest.length > 0 && (
          <div className="md:col-span-5 grid grid-cols-2 gap-3">
            {rest.slice(0, 4).map((album) => (
              <TravelCard key={album.id} album={album} size="small" />
            ))}
          </div>
        )}
      </div>

      {/* ── Overflow strip for remaining albums (if >5 total) ── */}
      {rest.length > 4 && (
        <div
          className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none' }}
        >
          {rest.slice(4).map((album) => (
            <div key={album.id} className="shrink-0 w-52 snap-start">
              <TravelCard album={album} size="strip" />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

type CardSize = 'hero' | 'small' | 'strip'

function TravelCard({ album, size }: { album: Album; size: CardSize }) {
  const [loaded, setLoaded] = useState(false)

  // Extract year from album name if present (e.g. "Japan 2023")
  const yearMatch  = album.name.match(/\b(20\d{2}|19\d{2})\b/)
  const year       = yearMatch?.[0]
  const displayName = year ? album.name.replace(year, '').trim() || album.name : album.name

  const aspectRatio =
    size === 'hero'  ? '16/10' :
    size === 'small' ? '4/3'   :
    /* strip */        '3/4'

  const titleSize =
    size === 'hero'  ? 'text-2xl md:text-3xl' :
    size === 'small' ? 'text-sm'              :
    /* strip */        'text-sm'

  return (
    <Link
      href={`/albums/${album.id}`}
      className="group relative block overflow-hidden rounded-2xl"
      style={{ aspectRatio }}
    >
      {/* Cover image */}
      <div className="absolute inset-0" style={{ background: 'var(--muted)' }}>
        {!loaded && <div className="absolute inset-0 skeleton-shimmer" />}
        {album.thumbnail_url ? (
          <img
            src={mediaUrl(album.thumbnail_url)}
            alt={album.name}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            className={`h-full w-full object-cover transition-all duration-700 group-hover:scale-[1.04] ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <MapPin className="h-8 w-8" style={{ color: 'var(--muted-foreground)', opacity: 0.2 }} />
          </div>
        )}
      </div>

      {/* Cinematic gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, oklch(0.05 0.006 48 / 85%) 0%, oklch(0.05 0.006 48 / 25%) 40%, transparent 65%)',
        }}
      />

      {/* Amber hover accent */}
      <div
        className="absolute bottom-0 inset-x-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: 'var(--amber)' }}
      />

      {/* Info */}
      <div className="absolute inset-x-0 bottom-0 p-4">
        {year && (
          <p
            className="mb-1 font-sans text-[9px] font-semibold tracking-[0.28em] uppercase"
            style={{ color: 'oklch(1 0 0 / 45%)' }}
          >
            {year}
          </p>
        )}
        <p
          className={`font-serif text-white leading-tight drop-shadow ${titleSize}`}
          style={{ fontStyle: 'italic', fontWeight: 500 }}
        >
          {displayName}
        </p>
        {album.photo_count != null && size !== 'small' && (
          <p
            className="mt-1 font-sans text-[10px] tracking-wide"
            style={{ color: 'oklch(1 0 0 / 38%)' }}
          >
            {album.photo_count} {album.photo_count === 1 ? 'photo' : 'photos'}
          </p>
        )}
      </div>
    </Link>
  )
}
