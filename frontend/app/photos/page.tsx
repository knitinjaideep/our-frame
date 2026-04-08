'use client'
import { useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useRootBuckets } from '@/hooks/use-root-buckets'
import { useAlbumDetail } from '@/hooks/use-albums'
import { AlbumCard } from '@/components/albums/album-card'
import { AlbumGridSkeleton } from '@/components/albums/album-grid-skeleton'
import { BUCKETS } from '@/lib/buckets'
import type { Album } from '@/types'

function SectionReveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px 0px' })
  const reduce = useReducedMotion()
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: reduce ? 0 : 22 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

/** Albums strip for one bucket — loads subfolders from the album detail endpoint */
function BucketAlbums({ bucketId, accentColor }: { bucketId: string; accentColor: string }) {
  const { data, isLoading } = useAlbumDetail(bucketId)
  const subfolders: Album[] = data?.subfolders ?? []

  if (isLoading) return <AlbumGridSkeleton count={4} />

  if (subfolders.length === 0) {
    return (
      <p className="text-sm italic" style={{ color: 'var(--muted-foreground)' }}>
        No albums found in this folder yet.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
      {subfolders.map((album) => (
        <AlbumCard key={album.id} album={album} />
      ))}
    </div>
  )
}

export default function PhotosPage() {
  const { data: bucketsData, isLoading: bucketsLoading } = useRootBuckets()

  const allBuckets = bucketsData?.albums ?? []
  const buckets = BUCKETS.map(meta => ({
    ...meta,
    album: allBuckets.find(a => a.id === meta.id) ?? null,
  }))

  return (
    <div>
      {/* ── Page header ── */}
      <motion.div
        className="content-padding pt-12 pb-16"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <p className="text-eyebrow-gold mb-3">Our Story in Frames</p>
        <h1 className="text-display-sm font-serif text-foreground">Photos</h1>
        <p className="mt-3 text-sm text-muted-foreground max-w-md leading-relaxed">
          Four chapters. Every frame we have captured together.
        </p>
      </motion.div>

      {/* ── Albums per section ── */}
      <div className="pb-24">
        {buckets.map((bucket, i) => (
          <SectionReveal key={bucket.id} delay={i * 0.04}>
            <section className="content-padding mb-20">
              {/* Section header */}
              <div className="flex items-end justify-between mb-10">
                <div className="space-y-1.5">
                  <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: bucket.accentColor }}>
                    {bucket.eyebrow}
                  </p>
                  <h2
                    className="font-serif leading-[0.95]"
                    style={{ fontSize: 'clamp(1.7rem, 3.2vw, 2.5rem)', fontStyle: 'italic', fontWeight: 500, color: 'var(--foreground)' }}
                  >
                    {bucket.album?.name ?? '…'}
                  </h2>
                </div>
                {bucket.album && (
                  <Link
                    href={`/albums/${bucket.album.id}`}
                    className="flex items-center gap-1.5 text-xs font-medium tracking-[0.12em] uppercase transition-colors hover:text-foreground shrink-0"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    View all
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>

              {/* Albums grid for this bucket */}
              {bucket.album ? (
                <BucketAlbums bucketId={bucket.album.id} accentColor={bucket.accentColor} />
              ) : (
                <AlbumGridSkeleton count={4} />
              )}
            </section>
          </SectionReveal>
        ))}
      </div>
    </div>
  )
}
