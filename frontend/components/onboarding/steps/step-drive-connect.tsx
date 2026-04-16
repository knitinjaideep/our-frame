'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getDriveStatus, getDriveConnectUrl } from '@/lib/platform-api'
import { HardDrive, CheckCircle2, Loader2 } from 'lucide-react'

interface Props {
  workspaceId: number
  onConnected: () => void
  onSkip: () => void
}

export function StepDriveConnect({ workspaceId, onConnected, onSkip }: Props) {
  const { data: status, isLoading } = useQuery({
    queryKey: ['driveStatus', workspaceId],
    queryFn: () => getDriveStatus(workspaceId),
    refetchInterval: 3000,
    staleTime: 0,
  })

  useEffect(() => {
    if (status?.status === 'active') {
      onConnected()
    }
  }, [status?.status, onConnected])

  const isConnected = status?.status === 'active'

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Step 4 of 4</p>
        <h2 className="font-serif text-3xl text-foreground">Connect Google Drive</h2>
        <p className="text-muted-foreground leading-relaxed">
          Connect the Google Drive that holds your family photos. We'll only ever read them —
          never copy, modify, or store originals.
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            {isLoading ? (
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            ) : isConnected ? (
              <CheckCircle2 className="w-5 h-5 text-primary" />
            ) : (
              <HardDrive className="w-5 h-5 text-primary" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {isConnected ? 'Drive connected' : 'Google Drive'}
            </p>
            <p className="text-xs text-muted-foreground">
              {isConnected
                ? status?.google_account_email ?? 'Connected successfully'
                : 'Read-only access to your photos'}
            </p>
          </div>
        </div>

        {!isConnected && (
          <ul className="text-xs text-muted-foreground space-y-1.5 border-t border-border pt-4">
            <li className="flex gap-2"><span className="text-primary">✓</span> Read-only Drive access (photos and videos only)</li>
            <li className="flex gap-2"><span className="text-primary">✓</span> Originals stay in your Drive</li>
            <li className="flex gap-2"><span className="text-primary">✓</span> Revoke access from Google any time</li>
          </ul>
        )}
      </div>

      {!isConnected && (
        <div className="space-y-3">
          <a
            href={getDriveConnectUrl(workspaceId)}
            className="flex items-center justify-center gap-2 w-full px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm transition-opacity hover:opacity-90"
          >
            <HardDrive className="w-4 h-4" />
            Connect Google Drive
          </a>
          <button
            onClick={onSkip}
            className="w-full px-6 py-3 rounded-xl text-muted-foreground text-sm hover:text-foreground transition-colors"
          >
            Skip for now — I'll connect later
          </button>
        </div>
      )}

      {isConnected && (
        <div className="text-center">
          <Loader2 className="w-5 h-5 text-primary animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground mt-2">Moving to the next step…</p>
        </div>
      )}
    </div>
  )
}
