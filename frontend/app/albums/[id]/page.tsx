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
    <div className="mx-auto max-w-7xl px-5 py-8 md:px-10 lg:px-14 space-y-8 pb-16">
      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
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
            <span className="text-foreground font-medium">{data.album.name}</span>
          </>
        )}
      </nav>

      {/* ── Page header ── */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {data?.album.name ?? (isLoading ? '' : 'Album')}
        </h1>
        {data && (
          <p className="mt-1 text-sm text-muted-foreground">
            {data.photos.length} {data.photos.length === 1 ? 'photo' : 'photos'}
            {data.subfolders.length > 0 && ` · ${data.subfolders.length} sub-album${data.subfolders.length !== 1 ? 's' : ''}`}
          </p>
        )}
        {isLoading && (
          <div className="mt-1 h-4 w-40 rounded skeleton-shimmer" />
        )}
      </div>

      {error && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-5 py-4 text-sm text-destructive">
          Failed to load this album.
        </div>
      )}

      {/* ── Sub-albums ── */}
      {isLoading ? (
        <AlbumGridSkeleton count={4} />
      ) : (
        data?.subfolders && data.subfolders.length > 0 && (
          <section className="space-y-4">
            <SectionHeader title="Sub-albums" eyebrow="Inside this album" />
            <AlbumGrid albums={data.subfolders} />
          </section>
        )
      )}

      {/* ── Photos ── */}
      {isLoading ? (
        <PhotoGridSkeleton count={12} />
      ) : (
        <PhotoGrid photos={data?.photos ?? []} folderId={id} />
      )}
    </div>
  )
}
