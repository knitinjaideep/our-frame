'use client'

/**
 * useDriveSync — owns the resumable-sync state machine (syncing / progress /
 * error) for a workspace, on top of `runFullDriveSync` in `platform-api.ts`.
 *
 * Shared by `SyncButton` (both the setup-flow primary CTA and the quiet
 * gallery control) so there is exactly one place that drives the sync loop
 * and refreshes cached data afterward — no forked copies of this logic.
 */

import { useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { runFullDriveSync, type SyncProgress } from '@/lib/platform-api'

export interface UseDriveSyncResult {
  syncing: boolean
  progress: SyncProgress | null
  error: string | null
  sync: () => Promise<void>
}

export function useDriveSync(workspaceId: number | undefined): UseDriveSyncResult {
  const qc = useQueryClient()
  const [syncing, setSyncing] = useState(false)
  const [progress, setProgress] = useState<SyncProgress | null>(null)
  const [error, setError] = useState<string | null>(null)

  const sync = useCallback(async () => {
    if (!workspaceId || syncing) return
    setSyncing(true)
    setError(null)
    setProgress(null)
    try {
      await runFullDriveSync(workspaceId, setProgress)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sync failed')
    } finally {
      // A sync that stops early (an error, or hitting the iteration cap on a
      // very large library) still persisted everything it found, so refresh
      // either way — a partial archive should become browsable rather than
      // silently sitting behind stale cached counts.
      await qc.invalidateQueries({ queryKey: ['bootstrap'] })
      await qc.invalidateQueries({ queryKey: ['albums'] })
      setSyncing(false)
    }
  }, [workspaceId, syncing, qc])

  return { syncing, progress, error, sync }
}
