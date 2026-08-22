'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { getDriveStatus, getDriveConnectUrl } from '@/lib/platform-api'
import { HardDrive, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react'

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
      {/* Header */}
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'var(--primary)' }}>
          Step 4 of 6
        </p>
        <h2 className="font-serif text-3xl text-foreground">Connect Google Drive</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Connect the Google Drive that holds your photos and videos.
          We request read-only access — we'll never copy, modify, or delete anything.
        </p>
      </div>

      {/* Status card */}
      <div
        className="rounded-xl p-5 space-y-4"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-3.5">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--amber-subtle)' }}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--primary)' }} />
            ) : isConnected ? (
              <CheckCircle2 className="w-5 h-5" style={{ color: 'oklch(0.68 0.130 150)' }} />
            ) : (
              <HardDrive className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {isConnected ? 'Drive connected' : 'Google Drive'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isConnected
                ? (status?.google_account_email ?? 'Connected successfully')
                : 'Read-only access to your photos and videos'}
            </p>
          </div>
        </div>

        {!isConnected && (
          <ul
            className="space-y-2 pt-3"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            {[
              'Read-only — we can never write, edit, or delete files',
              'Original files always stay in your Drive',
              'You can revoke access from Google Account settings any time',
              'No photos are uploaded to our servers',
            ].map((line, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: 'oklch(0.68 0.130 150)' }} />
                {line}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Connecting spinner */}
      {isConnected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-2.5"
        >
          <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--primary)' }} />
          <p className="text-sm text-muted-foreground">Moving to folder selection…</p>
        </motion.div>
      )}

      {!isConnected && (
        <div className="space-y-2.5">
          <a
            href={getDriveConnectUrl(workspaceId)}
            className="flex items-center justify-center gap-2.5 w-full px-6 py-3.5 rounded-xl font-medium text-sm transition-opacity hover:opacity-90"
            style={{
              background: 'var(--primary)',
              color: 'var(--primary-foreground)',
            }}
          >
            <HardDrive className="w-4 h-4" />
            Connect Google Drive
          </a>
          <button
            onClick={onSkip}
            className="w-full px-6 py-3 rounded-xl text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Skip for now — I'll connect later
          </button>
        </div>
      )}
    </div>
  )
}
