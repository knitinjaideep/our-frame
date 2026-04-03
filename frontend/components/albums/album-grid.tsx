import { AlbumCard } from './album-card'
import type { Album } from '@/types'

interface AlbumGridProps {
  albums: Album[]
}

export function AlbumGrid({ albums }: AlbumGridProps) {
  if (albums.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-[#141416] py-16 text-center">
        <p className="text-sm font-medium text-[#F5F0EB]">No albums found</p>
        <p className="mt-1 text-xs text-[#5A5751]">
          Create folders in your Google Drive root folder, then refresh
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {albums.map((album) => (
        <AlbumCard key={album.id} album={album} />
      ))}
    </div>
  )
}
