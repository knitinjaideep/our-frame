'use client'
import { useQuery } from '@tanstack/react-query'
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
