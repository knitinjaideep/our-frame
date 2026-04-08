'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { Play } from 'lucide-react'
import { useSections } from '@/hooks/use-sections'
import { mediaUrl } from '@/lib/api-client'

const VIDEO_BUCKETS = [
  {
    href: '/videos/arjun',
    sectionKey: 'arjun_videos' as const,
    eyebrow: 'Growing Up',
    title: 'Arjun',
    description: 'Every laugh, every first. His story in motion.',
    accentColor: 'oklch(0.70 0.145 58)',
    gradient: 'linear-gradient(135deg, oklch(0.13 0.018 48) 0%, oklch(0.20 0.025 55) 60%, oklch(0.16 0.022 52) 100%)',
  },
  {
    href: '/videos/family-travel',
    sectionKey: 'family_travel_videos' as const,
    eyebrow: 'On the Road',
    title: 'Family Travel',
    description: 'Places we have been. Moments that moved us.',
    accentColor: 'oklch(0.65 0.130 200)',
    gradient: 'linear-gradient(135deg, oklch(0.12 0.015 210) 0%, oklch(0.19 0.022 200) 60%, oklch(0.14 0.018 205) 100%)',
  },
] as const

function VideoBucketCard({
  bucket,
  thumbnailUrl,
  index,
}: {
  bucket: (typeof VIDEO_BUCKETS)[number]
  thumbnailUrl: string | null
  index: number
}) {
  const [hovered, setHovered] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        href={bucket.href}
        className="world-card"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          '--card-accent': bucket.accentColor,
          '--card-gradient': bucket.gradient,
          transform: hovered ? 'translateY(-8px) scale(1.012)' : 'translateY(0) scale(1)',
          boxShadow: hovered
            ? `0 28px 60px oklch(0 0 0 / 55%), 0 6px 20px oklch(0 0 0 / 35%), 0 0 0 1px ${bucket.accentColor.replace(')', ' / 18%)')}`
            : '0 4px 16px oklch(0 0 0 / 30%), 0 1px 4px oklch(0 0 0 / 20%)',
          transition: 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
        } as React.CSSProperties}
      >
        {/* Background: real thumbnail or gradient fallback */}
        {thumbnailUrl ? (
          <>
            <img
              src={mediaUrl(thumbnailUrl)}
              alt=""
              aria-hidden="true"
              onLoad={() => setImgLoaded(true)}
              className="absolute inset-0 h-full w-full object-cover"
              style={{
                opacity: imgLoaded ? (hovered ? 0.55 : 0.4) : 0,
                transition: 'opacity 0.5s ease',
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to top, oklch(0.06 0.008 48 / 90%) 0%, oklch(0.06 0.008 48 / 40%) 55%, transparent 100%)`,
              }}
            />
          </>
        ) : (
          <div className="world-card__bg" style={{ background: bucket.gradient }} />
        )}

        {/* Glow on hover */}
        <div
          className="world-card__glow"
          style={{
            background: `radial-gradient(ellipse 80% 60% at 50% 110%, ${bucket.accentColor.replace(')', ' / 22%)')} 0%, transparent 70%)`,
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.45s ease',
          }}
        />
        <div className="world-card__noise" />

        {/* Play button — centre */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full backdrop-blur-sm"
            style={{
              background: `${bucket.accentColor.replace(')', ' / 14%)')}`,
              border: `1px solid ${bucket.accentColor.replace(')', ' / 35%)')}`,
              boxShadow: `0 0 28px ${bucket.accentColor.replace(')', ' / 22%)')}`,
              transform: hovered ? 'scale(1.12)' : 'scale(1)',
              transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <Play
              className="h-5 w-5"
              style={{ color: bucket.accentColor, fill: bucket.accentColor, marginLeft: '2px' }}
            />
          </div>
        </div>

        {/* Text content */}
        <div className="world-card__content">
          <p className="world-card__eyebrow" style={{ color: bucket.accentColor }}>
            {bucket.eyebrow}
          </p>
          <h2 className="world-card__title font-serif">{bucket.title}</h2>
          <p
            className="world-card__desc"
            style={{
              opacity: hovered ? 0.85 : 0.55,
              transform: hovered ? 'translateY(0)' : 'translateY(4px)',
              transition: 'opacity 0.35s ease, transform 0.35s ease',
            }}
          >
            {bucket.description}
          </p>
        </div>

        <div
          className="world-card__accent-line"
          style={{
            background: `linear-gradient(to right, transparent, ${bucket.accentColor}, transparent)`,
            opacity: hovered ? 0.7 : 0.15,
            transition: 'opacity 0.35s ease',
          }}
        />
        <div
          className="world-card__arrow"
          style={{
            opacity: hovered ? 1 : 0,
            transform: hovered ? 'translateX(0)' : 'translateX(-6px)',
            color: bucket.accentColor,
            transition: 'opacity 0.3s ease, transform 0.3s ease',
          }}
        >
          →
        </div>
      </Link>
    </motion.div>
  )
}

export default function VideosPage() {
  const { data } = useSections()

  // Video buckets use gradient backgrounds (no section thumbnail needed)
  const getThumbnail = (_key: (typeof VIDEO_BUCKETS)[number]['sectionKey']) => null

  return (
    <div className="content-padding py-12 pb-24 max-w-6xl">
      <motion.div
        className="mb-12"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <p className="text-eyebrow-gold mb-3">Stories in Motion</p>
        <h1 className="text-display-sm font-serif text-foreground">Videos</h1>
        <p className="mt-3 text-sm text-muted-foreground max-w-md leading-relaxed">
          Every film we have made together — growing up and on the road.
        </p>
      </motion.div>

      <div className="worlds-grid">
        {VIDEO_BUCKETS.map((bucket, i) => (
          <VideoBucketCard
            key={bucket.href}
            bucket={bucket}
            thumbnailUrl={getThumbnail(bucket.sectionKey)}
            index={i}
          />
        ))}
      </div>
    </div>
  )
}
