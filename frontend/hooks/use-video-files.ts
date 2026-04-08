'use client'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { VideoFilesResponse } from '@/types'

export function useVideoFiles(sectionKey: 'arjun_videos' | 'family_travel_videos') {
  return useQuery({
    queryKey: queryKeys.sections.videos(sectionKey),
    queryFn: () => apiClient.get<VideoFilesResponse>(`/sections/videos/${sectionKey}`),
    staleTime: 5 * 60 * 1000,
  })
}
