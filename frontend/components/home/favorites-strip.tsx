'use client'
import Link from 'next/link'
import { Heart, ArrowRight } from 'lucide-react'
import { mediaUrl } from '@/lib/api-client'
import type { Favorite } from '@/types'

interface FavoritesStripProps {
  favorites: Favorite[]
}

export function FavoritesStrip({ favorites }: FavoritesStripProps) {
  if (favorites.length === 0) return null

  const preview = favorites.slice(0, 12)

  return (
    <section className="space-y-5">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <p className="text-eyebrow" style={{ color: 'var(--amber)' }}>
            Saved Memories
          </p>
          <h2 className="text-section-heading">Favorites</h2>
        </div>
        <Link
          href="/favorites"
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          View all
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Horizontal scrollable strip */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none" style={{ scrollSnapType: 'x mandatory' }}>
        {preview.map((fav) => (
          <Link
            key={fav.photo_id}
            href="/favorites"
            className="group relative aspect-square w-28 shrink-0 overflow-hidden rounded-xl bg-muted transition-all duration-300 hover:-translate-y-0.5 md:w-32"
            style={{ scrollSnapAlign: 'start', boxShadow: 'var(--shadow-card)' }}
          >
            <img
              src={mediaUrl(fav.thumbnail_url)}
              alt={fav.photo_name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
            {/* Subtle heart mark */}
            <div className="absolute top-1.5 right-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
                <Heart className="h-2.5 w-2.5 fill-current text-white" />
              </div>
            </div>
          </Link>
        ))}

        {/* "View all" tile at the end */}
        <Link
          href="/favorites"
          className="flex aspect-square w-28 shrink-0 flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-card text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--amber-border)] md:w-32"
          style={{ scrollSnapAlign: 'start', boxShadow: 'var(--shadow-card)' }}
        >
          <Heart className="h-5 w-5" style={{ color: 'var(--amber)' }} />
          <p className="text-xs font-medium text-muted-foreground leading-tight">
            {favorites.length > 12 ? `+${favorites.length - 12} more` : 'View all'}
          </p>
        </Link>
      </div>
    </section>
  )
}
