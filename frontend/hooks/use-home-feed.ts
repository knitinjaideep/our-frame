'use client'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { HomeFeed } from '@/types'

export function useHomeFeed() {
  return useQuery({
    queryKey: queryKeys.homeFeed.all,
    queryFn: () => apiClient.get<HomeFeed>('/home/feed'),
    staleTime: 5 * 60 * 1000,
  })
}
