'use client'

import { useState } from 'react'
import type { PrivacyMode } from '@/types/platform'

const MODES: { value: PrivacyMode; label: string; description: string; badge: string }[] = [
  {
    value: 'private',
    label: 'Private',
    description: 'Only you can see this workspace. Nothing is visible to anyone else.',
    badge: 'Recommended',
  },
  {
    value: 'invite_only',
    label: 'Invite Only',
    description: 'You control who can view. Share with family members by invite.',
    badge: '',
  },
  {
    value: 'public',
    label: 'Public',
    description: 'Anyone with the link can view your workspace.',
    badge: 'Coming soon',
  },
]

interface Props {
  onNext: (mode: PrivacyMode) => void
  loading?: boolean
  error?: string
}

export function StepPrivacy({ onNext, loading, error }: Props) {
  const [mode, setMode] = useState<PrivacyMode>('private')

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Step 3 of 4</p>
        <h2 className="font-serif text-3xl text-foreground">Privacy settings</h2>
        <p className="text-muted-foreground">
          Who can see your family photos? This is private by default — and stays that way
          until you change it.
        </p>
      </div>

      <div className="space-y-2">
        {MODES.map((m) => (
          <button
            key={m.value}
            onClick={() => m.value !== 'public' && setMode(m.value)}
            disabled={m.value === 'public'}
            className="w-full text-left px-4 py-4 rounded-xl border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: mode === m.value ? 'oklch(0.70 0.145 58 / 10%)' : 'var(--card)',
              borderColor: mode === m.value ? 'var(--primary)' : 'var(--border)',
            }}
          >
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground">{m.label}</p>
              {m.badge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  {m.badge}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{m.description}</p>
          </button>
        ))}
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-xl">
          {error}
        </p>
      )}

      <div className="space-y-3">
        <button
          onClick={() => onNext(mode)}
          disabled={loading}
          className="w-full px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading ? 'Creating your workspace…' : 'Create workspace'}
        </button>
        <p className="text-xs text-muted-foreground text-center">
          You can change your privacy settings at any time.
        </p>
      </div>
    </div>
  )
}
