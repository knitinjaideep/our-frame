'use client'
import { use } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { useAlbumDetail } from '@/hooks/use-albums'
import { AlbumCard } from '@/components/albums/album-card'
import { PhotoGrid } from '@/components/photos/photo-grid'
import { PhotoGridSkeleton } from '@/components/photos/photo-grid-skeleton'
import { AlbumGridSkeleton } from '@/components/albums/album-grid-skeleton'
import { SectionReveal } from '@/components/ui/section-reveal'

export default function AlbumDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data, isLoading, error } = useAlbumDetail(id)

  const hasSubfolders = (data?.subfolders?.length ?? 0) > 0
  const hasPhotos = (data?.photos?.length ?? 0) > 0

  return (
    <div>
      {/* ── Page header — same structure as /photos ── */}
      <motion.div
        className="content-padding pt-12 pb-16"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs mb-5" aria-label="Breadcrumb">
          <Link
            href="/"
            className="transition-colors"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Home
          </Link>
          <ChevronRight className="h-3 w-3 shrink-0" style={{ color: 'var(--muted-foreground)', opacity: 0.4 }} />
          <Link
            href="/photos"
            className="transition-colors"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Photos
          </Link>
          {data?.album && (
            <>
              <ChevronRight className="h-3 w-3 shrink-0" style={{ color: 'var(--muted-foreground)', opacity: 0.4 }} />
              <span style={{ color: 'var(--foreground)' }}>{data.album.name}</span>
            </>
          )}
        </nav>

        <p className="text-eyebrow-gold mb-3">Album</p>

        {isLoading ? (
          <div className="h-10 w-64 rounded skeleton-shimmer" />
        ) : (
          <h1 className="text-display-sm font-serif text-foreground">
            {data?.album.name ?? 'Album'}
          </h1>
        )}

        {!isLoading && hasPhotos && (
          <p className="mt-3 text-sm text-muted-foreground max-w-md leading-relaxed">
            {data!.photos.length} {data!.photos.length === 1 ? 'photo' : 'photos'}
            {hasSubfolders && ` · ${data!.subfolders.length} ${data!.subfolders.length === 1 ? 'sub-album' : 'sub-albums'}`}
          </p>
        )}
      </motion.div>

      {error && (
        <div className="content-padding mb-8">
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-5 py-4 text-sm text-destructive">
            Failed to load this album.
          </div>
        </div>
      )}

      {/* ── Content sections — same rhythm as /photos ── */}
      <div className="pb-24">

        {/* Sub-albums section */}
        {isLoading ? (
          <SectionReveal>
            <section className="content-padding mb-20">
              <div className="mb-10 space-y-1.5">
                <div className="h-3 w-24 rounded skeleton-shimmer" />
                <div className="h-8 w-48 rounded skeleton-shimmer" />
              </div>
              <AlbumGridSkeleton count={4} />
            </section>
          </SectionReveal>
        ) : hasSubfolders && (
          <SectionReveal>
            <section className="content-padding mb-20">
              <div className="flex items-end justify-between mb-10">
                <div className="space-y-1.5">
                  <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--amber)' }}>
                    Inside this Album
                  </p>
                  <h2
                    className="font-serif leading-[0.95]"
                    style={{ fontSize: 'clamp(1.7rem, 3.2vw, 2.5rem)', fontStyle: 'italic', fontWeight: 500, color: 'var(--foreground)' }}
                  >
                    Sub-albums
                  </h2>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
                {data!.subfolders.map((album) => (
                  <AlbumCard key={album.id} album={album} />
                ))}
              </div>
            </section>
          </SectionReveal>
        )}

        {/* Photos section */}
        {isLoading ? (
          <SectionReveal delay={0.04}>
            <section className="content-padding mb-20">
              <div className="mb-10 space-y-1.5">
                <div className="h-3 w-24 rounded skeleton-shimmer" />
                <div className="h-8 w-40 rounded skeleton-shimmer" />
              </div>
              <PhotoGridSkeleton count={12} />
            </section>
          </SectionReveal>
        ) : hasPhotos && (
          <SectionReveal delay={hasSubfolders ? 0.04 : 0}>
            <section className="content-padding mb-20">
              <div className="flex items-end justify-between mb-10">
                <div className="space-y-1.5">
                  <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--amber)' }}>
                    Photos
                  </p>
                  <h2
                    className="font-serif leading-[0.95]"
                    style={{ fontSize: 'clamp(1.7rem, 3.2vw, 2.5rem)', fontStyle: 'italic', fontWeight: 500, color: 'var(--foreground)' }}
                  >
                    {data?.album.name}
                  </h2>
                </div>
              </div>
              <PhotoGrid photos={data!.photos} folderId={id} />
            </section>
          </SectionReveal>
        )}

      </div>
    </div>
  )
}
