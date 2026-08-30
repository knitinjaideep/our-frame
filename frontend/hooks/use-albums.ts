'use client'
import { useMutation, useQuery, useQueries, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { Album, AlbumsListResponse, AlbumDetail } from '@/types'

export function useAlbums() {
  return useQuery({
    queryKey: queryKeys.albums.all,
    queryFn: () => apiClient.get<AlbumsListResponse>('/albums'),
    staleTime: 5 * 60 * 1000,
  })
}

export function useAlbumDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.albums.detail(id),
    queryFn: () => apiClient.get<AlbumDetail>(`/albums/${id}`),
    staleTime: 2 * 60 * 1000,
    enabled: !!id,
  })
}

/**
 * Fetches full album detail (photos + subfolders) for a set of album ids in
 * parallel. Used by Travel/Milestones/Life (PR 6): those three top-level
 * chapter buckets hold zero photos directly (everything lives one level
 * deeper, under real destination/milestone sub-albums — see
 * `docs/redesign/STATE.md` PR 6 notes), so their pages need each
 * sub-album's own photos, not just its summary/count, to build a real
 * featured card, date range, or timeline hero image.
 */
/**
 * PR 7 — manual album cover selection. Persists via the real backend
 * `POST /albums/{id}/cover` endpoint (`photo_id: null` resets to the
 * automatic/deterministic fallback). The mutation is idempotent server-side
 * (see `backend/services/album_service.py`), so calling it twice with the
 * same photo id is safe.
 *
 * On success: optimistically writes the updated `AlbumSummary` straight
 * into this album's own detail-query cache (so the header/lightbox reflect
 * the new cover with no page reload), then invalidates every `['albums',
 * ...]`-prefixed query — the root buckets list, the plain albums list, and
 * any other album's detail query that has this album cached as a subfolder
 * (its FolderCard) — so the new cover propagates everywhere it appears, per
 * `docs/OUR-FRAME-DESIGN-SYSTEM.md` §13's "both surfaces must reflect the
 * new cover" requirement, without having to know the parent chain here.
 */
export function useSetAlbumCover() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ albumId, photoId }: { albumId: string; photoId: string | null }) =>
      apiClient.post<Album>(`/albums/${albumId}/cover`, { photo_id: photoId }),
    onSuccess: (updatedAlbum, { albumId }) => {
      qc.setQueryData<AlbumDetail>(queryKeys.albums.detail(albumId), (prev) =>
        prev ? { ...prev, album: updatedAlbum } : prev,
      )
      qc.invalidateQueries({ queryKey: queryKeys.albums.all })
    },
  })
}

export function useAlbumDetails(ids: string[]) {
  return useQueries({
    queries: ids.map((id) => ({
      queryKey: queryKeys.albums.detail(id),
      queryFn: () => apiClient.get<AlbumDetail>(`/albums/${id}`),
      staleTime: 2 * 60 * 1000,
      enabled: !!id,
    })),
  })
}
