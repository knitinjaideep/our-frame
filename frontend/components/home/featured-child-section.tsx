'use client'
import { useState } from 'react'
import Link from 'next/link'
import { mediaUrl } from '@/lib/api-client'
import type { Album } from '@/types'

interface FeaturedChildSectionProps {
  albums: Album[]
  /** Eyebrow label above the heading e.g. "Growing Up" */
  eyebrow?: string
  /** Section heading e.g. "Arjun" */
  heading?: string
}

export function FeaturedChildSection({
  albums,
  eyebrow = 'Growing Up',
  heading = 'Little Moments',
}: FeaturedChildSectionProps) {
  if (albums.length === 0) return null

  return (
    <section className="space-y-6">
      {/* ── Section header ── */}
      <div className="flex items-end justify-between content-padding">
        <div className="space-y-2">
          <p
            className="font-sans text-[10px] font-semibold tracking-[0.22em] uppercase"
            style={{ color: 'var(--amber)' }}
          >
            {eyebrow}
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
            {heading}
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

      {/* ── Horizontal scroll strip — taller portrait cards ── */}
      <div
        className="flex gap-3 overflow-x-auto pb-3 content-padding snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none' }}
      >
        {albums.map((album, i) => (
          <ChildCard key={album.id} album={album} featured={i === 0} />
        ))}
      </div>
    </section>
  )
}

function ChildCard({ album, featured }: { album: Album; featured: boolean }) {
  const [loaded, setLoaded] = useState(false)

  return (
    <Link
      href={`/albums/${album.id}`}
      className="group relative shrink-0 snap-start overflow-hidden rounded-2xl"
      style={{
        width: featured ? '18rem' : '13rem',
        aspectRatio: '3/4',
      }}
    >
      {/* Cover image */}
      <div className="absolute inset-0" style={{ background: 'var(--muted)' }}>
        {!loaded && <div className="absolute inset-0 skeleton-shimmer" />}
        {album.thumbnail_url && (
          <img
            src={mediaUrl(album.thumbnail_url)}
            alt={album.name}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            className={`h-full w-full object-cover transition-all duration-700 group-hover:scale-[1.04] ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}
      </div>

      {/* Warm gradient — deeper at bottom, slight warmth */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, oklch(0.06 0.008 48 / 88%) 0%, oklch(0.06 0.008 48 / 35%) 45%, transparent 70%)',
        }}
      />

      {/* Warm amber accent line at bottom edge */}
      <div
        className="absolute bottom-0 inset-x-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: 'var(--amber)' }}
      />

      {/* Label */}
      <div className="absolute inset-x-0 bottom-0 p-4">
        <p
          className="font-serif text-sm leading-snug text-white drop-shadow"
          style={{ fontStyle: 'italic', fontWeight: 500 }}
        >
          {album.name}
        </p>
        {album.photo_count != null && (
          <p
            className="mt-1 font-sans text-[10px] tracking-wide"
            style={{ color: 'oklch(1 0 0 / 45%)' }}
          >
            {album.photo_count} {album.photo_count === 1 ? 'memory' : 'memories'}
          </p>
        )}
      </div>
    </Link>
  )
}
