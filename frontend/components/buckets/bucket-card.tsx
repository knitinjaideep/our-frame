'use client'
import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { mediaUrl } from '@/lib/api-client'
import type { BucketDef } from '@/lib/buckets'
import type { Album } from '@/types'

export type BucketCardProps = BucketDef & { album: Album | null; index: number }

export function BucketCard({ album, index, eyebrow, description, accentColor, gradient }: BucketCardProps) {
  const [hovered, setHovered] = useState(false)
  const href = album ? `/albums/${album.id}` : '#'
  const title = album?.name ?? '…'
  const thumbUrl = album?.thumbnail_url ? mediaUrl(album.thumbnail_url) : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        href={href}
        className="world-card"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          '--card-accent': accentColor,
          '--card-gradient': gradient,
          transform: hovered ? 'translateY(-8px) scale(1.012)' : 'translateY(0) scale(1)',
          boxShadow: hovered
            ? `0 28px 60px oklch(0 0 0 / 55%), 0 6px 20px oklch(0 0 0 / 35%), 0 0 0 1px ${accentColor.replace(')', ' / 18%)')}, 0 0 48px ${accentColor.replace(')', ' / 10%)')}`
            : '0 4px 16px oklch(0 0 0 / 30%), 0 1px 4px oklch(0 0 0 / 20%)',
          transition: 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
        } as React.CSSProperties}
      >
        {/* Drive thumbnail as background, falling back to gradient */}
        {thumbUrl ? (
          <img
            src={thumbUrl}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ opacity: hovered ? 0.45 : 0.3, transition: 'opacity 0.45s ease' }}
          />
        ) : (
          <div className="world-card__bg" style={{ background: gradient }} />
        )}

        {/* Gradient overlay for text legibility */}
        <div
          className="absolute inset-0"
          style={{ background: gradient, opacity: thumbUrl ? 0.75 : 1 }}
        />

        <div
          className="world-card__glow"
          style={{
            background: `radial-gradient(ellipse 80% 60% at 50% 110%, ${accentColor.replace(')', ' / 22%)')} 0%, transparent 70%)`,
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.45s ease',
          }}
        />
        <div className="world-card__noise" />

        <div className="world-card__content">
          <p className="world-card__eyebrow" style={{ color: accentColor }}>
            {eyebrow}
          </p>
          <h2 className="world-card__title font-serif">{title}</h2>
          <p
            className="world-card__desc"
            style={{
              opacity: hovered ? 0.85 : 0.55,
              transform: hovered ? 'translateY(0)' : 'translateY(4px)',
              transition: 'opacity 0.35s ease, transform 0.35s ease',
            }}
          >
            {description}
          </p>
        </div>

        <div
          className="world-card__accent-line"
          style={{
            background: `linear-gradient(to right, transparent, ${accentColor}, transparent)`,
            opacity: hovered ? 0.7 : 0.15,
            transition: 'opacity 0.35s ease',
          }}
        />
        <div
          className="world-card__arrow"
          style={{
            opacity: hovered ? 1 : 0,
            transform: hovered ? 'translateX(0)' : 'translateX(-6px)',
            color: accentColor,
            transition: 'opacity 0.3s ease, transform 0.3s ease',
          }}
        >
          →
        </div>
      </Link>
    </motion.div>
  )
}
