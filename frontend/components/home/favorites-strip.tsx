'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Heart, ArrowRight } from 'lucide-react'
import { mediaUrl } from '@/lib/api-client'
import type { Favorite } from '@/types'

interface FavoritesStripProps {
  favorites: Favorite[]
}

function FavTile({ fav }: { fav: Favorite }) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link
      href="/favorites"
      className="relative aspect-square w-28 shrink-0 overflow-hidden rounded-xl bg-muted md:w-32"
      style={{
        scrollSnapAlign: 'start',
        boxShadow: hovered
          ? '0 10px 32px oklch(0 0 0 / 50%), 0 3px 10px oklch(0 0 0 / 30%)'
          : '0 2px 8px oklch(0 0 0 / 28%), 0 1px 3px oklch(0 0 0 / 18%)',
        transform: hovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
        transition: 'transform 0.32s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img
        src={mediaUrl(fav.thumbnail_url ?? '')}
        alt={fav.photo_name}
        loading="lazy"
        className="h-full w-full object-cover"
        style={{
          transform: hovered ? 'scale(1.07)' : 'scale(1)',
          transition: 'transform 0.55s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />
      {/* Warm overlay on hover */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, oklch(0 0 0 / 55%) 0%, transparent 55%)',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      />
      {/* Heart mark */}
      <div
        className="absolute top-1.5 right-1.5"
        style={{
          opacity: hovered ? 1 : 0,
          transform: hovered ? 'scale(1) translateY(0)' : 'scale(0.7) translateY(-3px)',
          transition: 'opacity 0.25s ease, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
          <Heart className="h-2.5 w-2.5 fill-current text-white" />
        </div>
      </div>
    </Link>
  )
}

export function FavoritesStrip({ favorites }: FavoritesStripProps) {
  if (favorites.length === 0) return null

  const preview = favorites.slice(0, 12)

  return (
    <section className="space-y-6">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-eyebrow-gold">The Ones We Love</p>
          <h2
            className="font-serif leading-tight"
            style={{
              fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
              fontStyle: 'italic',
              fontWeight: 500,
              color: 'var(--foreground)',
            }}
          >
            Favorites
          </h2>
        </div>
        <Link
          href="/favorites"
          className="flex items-center gap-1.5 text-sm transition-colors hover:text-foreground"
          style={{ color: 'var(--muted-foreground)' }}
        >
          View all
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Horizontal scrollable strip */}
      <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none" style={{ scrollSnapType: 'x mandatory' }}>
        {preview.map((fav) => (
          <FavTile key={fav.photo_id} fav={fav} />
        ))}

        {/* "View all" tile at the end */}
        <Link
          href="/favorites"
          className="flex aspect-square w-28 shrink-0 flex-col items-center justify-center gap-2 rounded-xl border text-center md:w-32"
          style={{
            scrollSnapAlign: 'start',
            background: 'var(--card)',
            borderColor: 'var(--border)',
            boxShadow: '0 2px 8px oklch(0 0 0 / 20%)',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--amber-border)'
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border)'
          }}
        >
          <Heart className="h-5 w-5" style={{ color: 'var(--amber)' }} />
          <p className="text-xs font-medium leading-tight" style={{ color: 'var(--muted-foreground)' }}>
            {favorites.length > 12 ? `+${favorites.length - 12} more` : 'View all'}
          </p>
        </Link>
      </div>
    </section>
  )
}
