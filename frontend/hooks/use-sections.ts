'use client'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { SectionsResponse } from '@/types'

export function useSections() {
  return useQuery({
    queryKey: queryKeys.sections.all,
    queryFn: () => apiClient.get<SectionsResponse>('/sections'),
    staleTime: 5 * 60 * 1000,
  })
}
