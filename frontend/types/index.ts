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
  // redesign-v2 PR 7 — optional album metadata, additive backend fields.
  // Never rendered as an empty placeholder when absent (see AlbumHeader /
  // AlbumCard). No admin UI writes these yet — see docs/redesign-v2/STATE.md
  // for the scope decision.
  /**
   * True only when an owner manually chose a cover. `cover_photo_id` may
   * hold a deterministically auto-resolved id instead, so it can't be used
   * to decide whether "Reset album cover" is meaningful.
   */
  has_custom_cover?: boolean
  description?: string | null
  location?: string | null
  start_date?: string | null
  end_date?: string | null
}

export interface Photo {
  id: string
  name: string
  mime_type: string
  media_type?: 'image' | 'video' | 'unknown'
  created_time: string | null
  thumbnail_url: string | null
  poster_url?: string | null
  playback_url?: string | null
  preview_url: string
  processing_status?: 'queued' | 'processing' | 'ready' | 'failed' | null
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
  poster_url?: string | null
  playback_url?: string | null
  preview_url: string
  media_type?: 'image' | 'video' | 'unknown'
  processing_status?: 'queued' | 'processing' | 'ready' | 'failed' | null
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
  // Same calendar month, prior years, excluding exact-day matches (those
  // are already in `throwbacks`) — real created_time data.
  month_memories: ThrowbackGroup[]
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
