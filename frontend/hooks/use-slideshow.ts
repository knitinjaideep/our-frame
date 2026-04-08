'use client'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { Photo } from '@/types'

export function useSlideshow() {
  return useQuery({
    queryKey: queryKeys.slideshow.all,
    queryFn: () => apiClient.get<Photo[]>('/home/slideshow'),
    staleTime: 30 * 1000, // 30 seconds — reflects favorite changes quickly
  })
}
