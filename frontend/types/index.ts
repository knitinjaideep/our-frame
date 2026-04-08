export interface Album {
  id: string
  name: string
  cover_photo_id: string | null
  photo_count: number | null
  child_count: number | null
  thumbnail_url: string | null
  // Phase 1 additions — may be absent from older cached responses
  excluded?: boolean
  section?: string | null
}

export interface Photo {
  id: string
  name: string
  mime_type: string
  created_time: string | null
  thumbnail_url: string | null
  preview_url: string
  is_favorite: boolean
  width: number | null
  height: number | null
}

export interface Favorite {
  photo_id: string
  photo_name: string
  folder_id: string | null
  favorited_at: string
  thumbnail_url: string | null
  preview_url: string
  mime_type: string
}

export interface MemoryStats {
  total_photos: number
  total_albums: number
  total_favorites: number
  oldest_year: number | null
  newest_year: number | null
}

export interface ThrowbackGroup {
  year: number
  label: string
  photos: Photo[]
}

export interface HomeFeed {
  hero_photos: Photo[]
  throwbacks: ThrowbackGroup[]
  stats: MemoryStats
}

export interface AlbumDetail {
  album: Album
  photos: Photo[]
  subfolders: Album[]
}

export interface AlbumsListResponse {
  albums: Album[]
  total: number
}

export interface FavoritesListResponse {
  favorites: Favorite[]
  total: number
}

export interface SectionsResponse {
  featured_child: Album[]
  travel: Album[]
  milestones: Album[]
  life: Album[]
  arjun_videos: Album[]
  family_travel_videos: Album[]
}

export interface VideoFilesResponse {
  videos: Photo[]
  total: number
}

export interface SectionMapping {
  id: number | null
  folder_id: string
  section_key: 'child' | 'travel' | 'milestones' | 'life'
  label: string | null
}
