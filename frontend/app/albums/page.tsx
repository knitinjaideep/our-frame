'use client'
import { useAlbums } from '@/hooks/use-albums'
import { AlbumGrid } from '@/components/albums/album-grid'
import { AlbumGridSkeleton } from '@/components/albums/album-grid-skeleton'
import { PageHeader } from '@/components/ui/section-header'
import { Images } from 'lucide-react'

export default function AlbumsPage() {
  const { data, isLoading, error } = useAlbums()

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 md:px-10 lg:px-14 space-y-8 pb-16">
      <PageHeader
        title="Albums"
        description={
          data
            ? `${data.total} album${data.total !== 1 ? 's' : ''} from Google Drive`
            : 'Your Google Drive folders'
        }
        icon={<Images className="h-5 w-5" />}
      />

      {error && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-5 py-4 text-sm text-destructive">
          Failed to load albums. Check that your Google Drive is connected.
        </div>
      )}

      {isLoading ? <AlbumGridSkeleton count={8} /> : <AlbumGrid albums={data?.albums ?? []} />}
    </div>
  )
}
