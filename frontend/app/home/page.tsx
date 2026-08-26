'use client'

import { Suspense } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchBootstrap } from '@/lib/platform-api'
import { HomeSetupView } from '@/components/home/home-setup-view'
import { HomeFeedView } from '@/components/home/home-feed-view'

// ── Derive setup state from bootstrap payload ─────────────────────────────────

type SetupState =
  | 'no_workspace'
  | 'no_drive'
  | 'no_root_folder'
  | 'no_structure'
  | 'no_media'
  | 'ready'

function deriveSetupState(bootstrap: {
  has_workspace: boolean
  has_drive_connection: boolean
  has_root_folder: boolean
  onboarding_complete: boolean
  has_media: boolean
}): SetupState {
  if (!bootstrap.has_workspace)         return 'no_workspace'
  if (!bootstrap.has_drive_connection)  return 'no_drive'
  if (!bootstrap.has_root_folder)       return 'no_root_folder'
  if (!bootstrap.onboarding_complete)   return 'no_structure'
  if (!bootstrap.has_media)             return 'no_media'
  return 'ready'
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomPage() {
  const { data: bootstrap, isLoading } = useQuery({
    queryKey: ['bootstrap'],
    queryFn: () => fetchBootstrap(),
    staleTime: 0,
    gcTime: 30_000,
    retry: false,
  })

  if (isLoading || !bootstrap) {
    // Minimal skeleton — same background, no flash
    return (
      <div
        className="min-h-screen"
        style={{ background: 'var(--background)' }}
      />
    )
  }

  const setupState = deriveSetupState(bootstrap)

  if (setupState !== 'ready') {
    return (
      <Suspense>
        <HomeSetupView
          setupState={setupState}
          workspaceId={bootstrap.workspace?.id}
          workspaceName={bootstrap.workspace?.name}
          userName={bootstrap.user?.display_name}
        />
      </Suspense>
    )
  }

  return <HomeFeedView />
}
