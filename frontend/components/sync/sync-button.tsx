'use client'

/**
 * SyncButton — the one reachable "Sync photos" control, in two looks:
 *
 *   variant="primary" — the prominent CTA shown in the setup flow's
 *     NoMediaPanel when a workspace has zero photos yet.
 *   variant="quiet"    — a small maintenance control for the normal gallery
 *     header, once a workspace already has photos (`deriveSetupState`
 *     returns 'ready' the moment `has_media` is true, so that's the only
 *     place left for a user to trigger another sync).
 *
 * Both variants share `useDriveSync` — there is no forked sync logic here,
 * only presentation.
 */

import { Loader2, RefreshCw } from 'lucide-react'
import { useDriveSync } from '@/hooks/use-drive-sync'

interface SyncButtonProps {
  workspaceId: number
  variant?: 'primary' | 'quiet'
}

function progressLabel(progress: { totalPhotos: number } | null, idlePrefix: string): string {
  if (!progress) return idlePrefix
  return `${progress.totalPhotos} photo${progress.totalPhotos === 1 ? '' : 's'} found so far`
}

export function SyncButton({ workspaceId, variant = 'quiet' }: SyncButtonProps) {
  const { syncing, progress, error, sync } = useDriveSync(workspaceId)

  if (variant === 'primary') {
    return (
      <>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={sync}
            disabled={syncing}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {syncing ? 'Syncing…' : 'Sync now'}
          </button>
        </div>

        {syncing && (
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }} aria-live="polite">
            {progressLabel(progress, 'Scanning your Drive… this first pass can take up to a minute')}
          </p>
        )}

        {error && (
          <p className="text-xs text-destructive text-center">{error}</p>
        )}
      </>
    )
  }

  return (
    <div className="inline-flex flex-col items-end gap-1.5">
      <button
        onClick={sync}
        disabled={syncing}
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          color: 'var(--muted-foreground)',
        }}
        aria-label="Sync photos from Google Drive"
      >
        {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
        {syncing ? 'Syncing…' : 'Sync photos'}
      </button>

      {syncing && (
        <p
          className="text-[11px] text-right max-w-[16rem]"
          style={{ color: 'var(--muted-foreground)' }}
          aria-live="polite"
        >
          {progressLabel(progress, 'Scanning your Drive…')}
        </p>
      )}

      {error && (
        <p className="text-[11px] text-destructive text-right max-w-[16rem]">{error}</p>
      )}
    </div>
  )
}
