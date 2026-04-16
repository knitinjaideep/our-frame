'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchCurrentUser, fetchBootstrap, listWorkspaces, logout as logoutApi } from '@/lib/platform-api'
import type { BootstrapPayload } from '@/lib/platform-api'
import type { CurrentUser, Workspace } from '@/types/platform'

export function useBootstrap(token?: string | null) {
  return useQuery<BootstrapPayload>({
    queryKey: ['bootstrap', token ?? null],
    queryFn: () => fetchBootstrap(token),
    staleTime: 0,
    retry: false,
  })
}

export function useCurrentUser() {
  return useQuery<CurrentUser | null>({
    queryKey: ['currentUser'],
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}

export function useWorkspaces() {
  const { data: user } = useCurrentUser()
  return useQuery<Workspace[]>({
    queryKey: ['workspaces'],
    queryFn: listWorkspaces,
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  })
}

export function useLogout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: logoutApi,
    onSuccess: () => {
      qc.clear()
      window.location.href = '/login'
    },
  })
}
