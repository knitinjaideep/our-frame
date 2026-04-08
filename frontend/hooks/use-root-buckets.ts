'use client'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { AlbumsListResponse } from '@/types'

/**
 * Fetches the actual top-level Drive folders as navigation buckets.
 * These are the source of truth — no hardcoded section assumptions.
 */
export function useRootBuckets() {
  return useQuery({
    queryKey: queryKeys.albums.buckets,
    queryFn: () => apiClient.get<AlbumsListResponse>('/albums/buckets'),
    staleTime: 5 * 60 * 1000,
  })
}
