'use client'
import { useQuery, useQueries } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { AlbumsListResponse, AlbumDetail } from '@/types'

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
