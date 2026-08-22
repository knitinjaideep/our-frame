'use client'

import { useState } from 'react'
import { Lock, Users, Globe, ShieldCheck, HardDrive, Database, Eye } from 'lucide-react'
import type { PrivacyMode } from '@/types/platform'

const MODES: {
  value: PrivacyMode
  label: string
  description: string
  badge: string
  icon: React.ReactNode
  color: string
  disabled: boolean
}[] = [
  {
    value: 'private',
    label: 'Private',
    description: 'Only you can access this archive. Nothing is visible to anyone else — ever.',
    badge: 'Recommended',
    icon: <Lock className="w-4 h-4" />,
    color: 'oklch(0.70 0.145 58)',
    disabled: false,
  },
  {
    value: 'invite_only',
    label: 'Invite Only',
    description: 'You choose exactly who can view. Share with family by sending a private invite link.',
    badge: '',
    icon: <Users className="w-4 h-4" />,
    color: 'oklch(0.70 0.140 220)',
    disabled: false,
  },
  {
    value: 'public',
    label: 'Public',
    description: 'Anyone with the link can browse your space.',
    badge: 'Coming soon',
    icon: <Globe className="w-4 h-4" />,
    color: 'oklch(0.68 0.130 150)',
    disabled: true,
  },
]

const DATA_TRANSPARENCY = [
  {
    icon: <HardDrive className="w-3.5 h-3.5" />,
    label: 'What stays in your Drive',
    detail: 'All original photos and videos — we never touch them.',
    stays: true,
  },
  {
    icon: <Database className="w-3.5 h-3.5" />,
    label: 'What we store',
    detail: 'Folder names, file IDs, and metadata like dates. Never the images themselves.',
    stays: false,
  },
  {
    icon: <Eye className="w-3.5 h-3.5" />,
    label: 'Who can see anything',
    detail: 'Nobody — unless you explicitly invite them.',
    stays: true,
  },
  {
    icon: <ShieldCheck className="w-3.5 h-3.5" />,
    label: 'Google access',
    detail: 'Read-only. We can only list and read files — never write, delete, or share.',
    stays: true,
  },
]

interface Props {
  onNext: (mode: PrivacyMode) => void
  loading?: boolean
  error?: string
}

export function StepPrivacy({ onNext, loading, error }: Props) {
  const [mode, setMode] = useState<PrivacyMode>('private')
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'var(--primary)' }}>
          Step 3 of 6
        </p>
        <h2 className="font-serif text-3xl text-foreground">Privacy first</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Your archive is private by default. Choose how — or whether — to share it.
          You can change this any time in Settings.
        </p>
      </div>

      {/* Mode selection */}
      <div className="space-y-2">
        {MODES.map((m) => {
          const isSelected = mode === m.value
          return (
            <button
              key={m.value}
              onClick={() => !m.disabled && setMode(m.value)}
              disabled={m.disabled}
              className="w-full text-left rounded-xl px-4 py-4 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: isSelected ? `${m.color}12` : 'var(--card)',
                border: `1px solid ${isSelected ? m.color : 'var(--border)'}`,
              }}
            >
              <div className="flex items-start gap-3">
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{
                    background: isSelected ? `${m.color}20` : 'var(--muted)',
                    color: isSelected ? m.color : 'var(--muted-foreground)',
                  }}
                >
                  {m.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-foreground">{m.label}</p>
                    {m.badge && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                        style={{
                          background: m.disabled ? 'var(--muted)' : `${m.color}18`,
                          color: m.disabled ? 'var(--muted-foreground)' : m.color,
                        }}
                      >
                        {m.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{m.description}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Data transparency card */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid var(--border)' }}
      >
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/40"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" style={{ color: 'var(--primary)' }} />
            <span className="text-sm font-medium text-foreground">What we store vs. what stays in Drive</span>
          </div>
          <span
            className="text-xs text-muted-foreground transition-transform duration-200"
            style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
          >
            ▾
          </span>
        </button>

        {expanded && (
          <div style={{ borderTop: '1px solid var(--border)' }}>
            {DATA_TRANSPARENCY.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 px-4 py-3"
                style={{
                  borderBottom: i < DATA_TRANSPARENCY.length - 1 ? '1px solid var(--border)' : 'none',
                  background: 'var(--card)',
                }}
              >
                <span
                  className="flex-shrink-0 mt-0.5"
                  style={{ color: item.stays ? 'oklch(0.68 0.130 150)' : 'var(--muted-foreground)' }}
                >
                  {item.icon}
                </span>
                <div>
                  <p className="text-xs font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.detail}</p>
                </div>
                <span
                  className="ml-auto flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: item.stays ? 'oklch(0.68 0.130 150 / 15%)' : 'var(--muted)',
                    color: item.stays ? 'oklch(0.68 0.130 150)' : 'var(--muted-foreground)',
                  }}
                >
                  {item.stays ? 'Yours' : 'Ours'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm rounded-xl px-4 py-3" style={{ color: 'var(--destructive)', background: 'oklch(from var(--destructive) l c h / 10%)' }}>
          {error}
        </p>
      )}

      <div className="space-y-3">
        <button
          onClick={() => onNext(mode)}
          disabled={loading}
          className="w-full px-6 py-3.5 rounded-xl font-medium text-sm transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
          }}
        >
          {loading ? 'Creating your archive…' : 'Create archive'}
        </button>
        <p className="text-xs text-muted-foreground text-center">
          You can change your privacy settings at any time.
        </p>
      </div>
    </div>
  )
}
