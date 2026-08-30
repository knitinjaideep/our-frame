'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Folder } from 'lucide-react'
import { albumCoverUrl } from '@/lib/api-client'
import { AlbumCoverFallback } from './album-cover-fallback'
import type { Album } from '@/types'

/**
 * Count line under a folder's name: a folder's own photo count when it has
 * one, else its child-album count, else omitted entirely.
 */
function folderCountLabel(album: Album): string | undefined {
  if (album.photo_count != null && album.photo_count > 0) {
    return `${album.photo_count.toLocaleString()} ${album.photo_count === 1 ? 'item' : 'items'}`
  }
  if (album.child_count != null && album.child_count > 0) {
    return `${album.child_count.toLocaleString()} ${album.child_count === 1 ? 'album' : 'albums'}`
  }
  return undefined
}

/**
 * Secondary metadata line under a folder's name, per PR 7's brief:
 * "location OR short description, photo count". `docs/
 * OUR-FRAME-DESIGN-SYSTEM.md` §9 previously described one metadata slot
 * (written before PR 7's real fields existed, when only a count was
 * available); real location/description now takes that slot, with the
 * count rendered as its own line below (see `AlbumCard`'s overlay JSX).
 * Location wins over description when both are set — it is the more
 * concrete, scannable fact for a folder tile. Omitted entirely when
 * neither is set, never a placeholder.
 */
function folderMetaLine(album: Album): string | undefined {
  return album.location || album.description || undefined
}

export function AlbumCard({ album }: { album: Album }) {
  const countLabel = folderCountLabel(album)
  const metaLine = folderMetaLine(album)
  const [loaded, setLoaded] = useState(false)
  const [hovered, setHovered] = useState(false)

  return (
    /* Outer wrapper catches the glow — needs overflow:visible */
    <div
      className="album-card-wrap"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Golden glow orb — sits behind the card */}
      <div
        className="album-card-glow"
        style={{
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }}
      />

      <Link
        href={`/albums/${album.id}`}
        className="album-card"
        style={{
          border: `1px solid ${hovered ? 'oklch(0.70 0.145 58 / 35%)' : 'oklch(1 0 0 / 7%)'}`,
          boxShadow: hovered
            ? '0 24px 64px oklch(0 0 0 / 65%), 0 8px 24px oklch(0 0 0 / 40%), 0 0 0 1px oklch(0.84 0.135 70 / 18%), 0 0 32px oklch(0.70 0.145 58 / 12%)'
            : '0 2px 8px oklch(0 0 0 / 28%), 0 1px 3px oklch(0 0 0 / 18%)',
          transform: hovered ? 'translateY(-7px) scale(1.008)' : 'translateY(0) scale(1)',
          transition: 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.45s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease',
        }}
        tabIndex={0}
      >
        {/* ── Cover image ── */}
        <div className="album-card__img-wrap">
          {!loaded && !album.thumbnail_url && null}
          {!loaded && album.thumbnail_url && (
            <div className="absolute inset-0 skeleton-shimmer" />
          )}

          {album.thumbnail_url ? (
            <img
              // Folder/category thumbnails render fairly large (up to a full
              // 2x2 Photos-overview tile), so this asks for the cached
              // `grid` derivative (900px) instead of the 400px card
              // thumbnail the API returns by default — same upgrade PR 6's
              // review already applied to the album header, per PR 7's
              // "same class of bug" note. See `albumCoverUrl` for why this
              // never falls back to a full-original download.
              src={albumCoverUrl(album.thumbnail_url)}
              alt={album.name}
              loading="lazy"
              onLoad={() => setLoaded(true)}
              className={`h-full w-full object-cover ${loaded ? 'opacity-100' : 'opacity-0'}`}
              style={{
                transform: hovered ? 'scale(1.07)' : 'scale(1)',
                transition: 'transform 0.65s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease',
              }}
            />
          ) : (
            <AlbumCoverFallback name={album.name} />
          )}

          {/* Cinematic gradient overlay — always present, intensifies on hover */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(to top, oklch(0.06 0.008 48 / 80%) 0%, oklch(0.06 0.008 48 / 20%) 45%, transparent 100%)',
              opacity: hovered ? 1 : 0.75,
              transition: 'opacity 0.4s ease',
            }}
          />

          {/* Gold shimmer edge at bottom on hover */}
          <div
            className="absolute inset-x-0 bottom-0 h-px pointer-events-none"
            style={{
              background: 'linear-gradient(to right, transparent, oklch(0.84 0.135 70 / 70%), transparent)',
              opacity: hovered ? 1 : 0,
              transition: 'opacity 0.4s ease',
            }}
          />

          {/* Gold shimmer frame overlay — all four edges glow on hover */}
          <div
            className="absolute inset-0 pointer-events-none rounded-[1.25rem]"
            style={{
              opacity: hovered ? 1 : 0,
              transition: 'opacity 0.45s ease',
              boxShadow: 'inset 0 0 0 1px oklch(0.84 0.135 70 / 32%), inset 0 1px 0 oklch(0.90 0.120 72 / 55%)',
            }}
          />

          {/* Folder glyph + name + optional count overlaid on image — ivory, editorial */}
          <div
            className="album-card__overlay-title"
            /* Name and count line move/fade together as one block — animating
               only the name would slide it relative to the count on hover. */
            style={{
              transform: hovered ? 'translateY(0)' : 'translateY(3px)',
              transition: 'transform 0.35s ease, opacity 0.35s ease',
              opacity: hovered ? 1 : 0.85,
            }}
          >
            <p className="album-card__name font-serif flex items-baseline gap-1.5">
              <Folder
                className="h-3 w-3 shrink-0 translate-y-[0.1em]"
                style={{ color: 'var(--amber)' }}
                aria-hidden
              />
              <span className="min-w-0">{album.name}</span>
            </p>
            {/* Location OR short description (PR 7 metadata) — a single
                quiet line, omitted entirely when neither field is set. */}
            {metaLine && (
              <p
                className="mt-0.5 font-sans text-xs truncate"
                style={{
                  color: 'oklch(0.97 0.010 72 / 72%)',
                  textShadow: '0 1px 8px oklch(0 0 0 / 60%)',
                }}
              >
                {metaLine}
              </p>
            )}
            {countLabel && (
              <p
                className="mt-0.5 font-sans text-xs"
                style={{
                  color: 'oklch(0.97 0.010 72 / 72%)',
                  /* Same shadow as `.album-card__name` — the scrim alone is
                     not enough over a bright thumbnail. */
                  textShadow: '0 1px 8px oklch(0 0 0 / 60%)',
                }}
              >
                {countLabel}
              </p>
            )}
          </div>
        </div>
      </Link>
    </div>
  )
}
