'use client'
import { use } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { useAlbumDetail } from '@/hooks/use-albums'
import { AlbumGrid } from '@/components/albums/album-grid'
import { PhotoGrid } from '@/components/photos/photo-grid'
import { PhotoGridSkeleton } from '@/components/photos/photo-grid-skeleton'
import { AlbumGridSkeleton } from '@/components/albums/album-grid-skeleton'
import { SectionHeader } from '@/components/ui/section-header'

export default function AlbumDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data, isLoading, error } = useAlbumDetail(id)

  return (
    <div className="content-padding py-8 pb-20 max-w-screen-2xl mx-auto">

      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-1.5 text-sm mb-6" aria-label="Breadcrumb">
        <Link
          href="/"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
        <Link
          href="/albums"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          Albums
        </Link>
        {data?.album && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
            <span
              className="font-medium"
              style={{ color: 'oklch(0.96 0.012 72)' }}
            >
              {data.album.name}
            </span>
          </>
        )}
      </nav>

      {/* ── Page header ── */}
      <div className="mb-10">
        {isLoading ? (
          <div className="h-8 w-56 rounded skeleton-shimmer" />
        ) : (
          <>
            <p className="text-eyebrow-gold mb-2">Album</p>
            <h1
              className="font-serif text-display-sm"
              style={{ color: 'oklch(0.96 0.012 72)' }}
            >
              {data?.album.name ?? 'Album'}
            </h1>
          </>
        )}
      </div>

      {error && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-5 py-4 text-sm text-destructive mb-8">
          Failed to load this album.
        </div>
      )}

      {/* ── Sub-albums ── */}
      {isLoading ? (
        <AlbumGridSkeleton count={4} />
      ) : (
        data?.subfolders && data.subfolders.length > 0 && (
          <section className="mb-12">
            <SectionHeader title="Inside this Album" eyebrow="Sub-albums" />
            <div className="mt-4">
              <AlbumGrid albums={data.subfolders} />
            </div>
          </section>
        )
      )}

      {/* ── Photos ── */}
      {isLoading ? (
        <PhotoGridSkeleton count={12} />
      ) : (
        data?.photos && data.photos.length > 0 && (
          <PhotoGrid photos={data.photos} folderId={id} />
        )
      )}

    </div>
  )
}
