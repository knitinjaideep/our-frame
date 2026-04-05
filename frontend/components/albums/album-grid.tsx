import { AlbumCard } from './album-card'
import type { Album } from '@/types'

interface AlbumGridProps {
  albums: Album[]
}

export function AlbumGrid({ albums }: AlbumGridProps) {
  if (albums.length === 0) {
    return null
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {albums.map((album) => (
        <AlbumCard key={album.id} album={album} />
      ))}
    </div>
  )
}
