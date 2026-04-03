'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { FavoritesListResponse } from '@/types'

export function useFavorites() {
  return useQuery({
    queryKey: queryKeys.favorites.all,
    queryFn: () => apiClient.get<FavoritesListResponse>('/favorites'),
    staleTime: 30 * 1000,
  })
}

export function useFavoriteIds(): Set<string> {
  const { data } = useFavorites()
  return new Set(data?.favorites.map((f) => f.photo_id) ?? [])
}

export function useToggleFavorite() {
  const qc = useQueryClient()

  const add = useMutation({
    mutationFn: (vars: { photo_id: string; photo_name: string; folder_id?: string }) =>
      apiClient.post('/favorites', vars),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.favorites.all }),
  })

  const remove = useMutation({
    mutationFn: (photo_id: string) => apiClient.delete(`/favorites/${photo_id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.favorites.all }),
  })

  return { add, remove }
}
