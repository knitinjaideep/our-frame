import { AlbumCard } from './album-card'
import type { Album } from '@/types'

interface AlbumGridProps {
  albums: Album[]
  /**
   * 'default' (2/3/4 across) is the pre-existing layout, still used by a
   * leaf album's "sub-albums" section and the legacy Videos
   * `SectionWorldPage`. 'category' (1/2/3 across) is required specifically
   * for category landing pages per `docs/redesign-v2/PROMPTS.md` PR 5
   * ("desktop 3 columns, tablet 2, mobile 1") — see
   * `docs/OUR-FRAME-DESIGN-SYSTEM.md` §9's "Known deviation" note (the
   * written brief overrides board 3's 4-across framing).
   */
  variant?: 'default' | 'category'
}

export function AlbumGrid({ albums, variant = 'default' }: AlbumGridProps) {
  if (albums.length === 0) {
    return null
  }

  const gridClass =
    variant === 'category'
      ? 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'
      : 'grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4'

  return (
    <div className={gridClass}>
      {albums.map((album) => (
        <AlbumCard key={album.id} album={album} />
      ))}
    </div>
  )
}
