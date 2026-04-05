'use client'
import { useFavorites } from '@/hooks/use-favorites'
import { PhotoGrid } from '@/components/photos/photo-grid'
import { PhotoGridSkeleton } from '@/components/photos/photo-grid-skeleton'
import { PageHeader } from '@/components/ui/section-header'
import { Heart } from 'lucide-react'
import type { Photo } from '@/types'

export default function FavoritesPage() {
  const { data, isLoading, error } = useFavorites()

  // Convert Favorite → Photo shape for PhotoGrid
  const photos: Photo[] = (data?.favorites ?? []).map((f) => ({
    id: f.photo_id,
    name: f.photo_name,
    mime_type: 'image/jpeg',
    created_time: f.favorited_at,
    thumbnail_url: f.thumbnail_url,
    preview_url: f.preview_url,
    is_favorite: true,
    width: null,
    height: null,
  }))

  return (
    <div className="content-padding py-8 space-y-8 pb-16 max-w-7xl">
      <PageHeader
        title="The Ones We Love"
        description={
          data
            ? `${data.total} saved photo${data.total !== 1 ? 's' : ''}`
            : 'Your saved photos'
        }
        icon={<Heart className="h-5 w-5" />}
      />

      {error && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-5 py-4 text-sm text-destructive">
          Failed to load favorites.
        </div>
      )}

      {isLoading ? (
        <PhotoGridSkeleton count={12} />
      ) : photos.length === 0 ? (
        /* ── Warm empty state ── */
        <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-card py-24 text-center shadow-warm">
          <div
            className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ backgroundColor: 'var(--amber-muted)' }}
          >
            <Heart className="h-7 w-7" style={{ color: 'var(--amber)' }} />
          </div>
          <p className="text-lg font-semibold text-foreground">No favorites yet</p>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground leading-relaxed">
            Hover over any photo and tap the heart to save your most treasured memories here.
          </p>
        </div>
      ) : (
        <PhotoGrid photos={photos} />
      )}
    </div>
  )
}
