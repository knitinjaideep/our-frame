'use client'
import { useState } from 'react'
import Link from 'next/link'
import { mediaUrl } from '@/lib/api-client'
import { AlbumCoverFallback } from './album-cover-fallback'
import type { Album } from '@/types'

export function AlbumCard({ album }: { album: Album }) {
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
              src={mediaUrl(album.thumbnail_url)}
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

          {/* Album name overlaid on image — ivory, editorial */}
          <div className="album-card__overlay-title">
            <p
              className="album-card__name font-serif"
              style={{
                transform: hovered ? 'translateY(0)' : 'translateY(3px)',
                transition: 'transform 0.35s ease, opacity 0.35s ease',
                opacity: hovered ? 1 : 0.85,
              }}
            >
              {album.name}
            </p>
          </div>
        </div>
      </Link>
    </div>
  )
}
