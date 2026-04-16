'use client'

import { useState } from 'react'
import type { LayoutPreset, PrivacyMode, FolderTemplate } from '@/types/platform'

const LAYOUTS: { value: LayoutPreset; label: string; description: string }[] = [
  { value: 'editorial', label: 'Editorial', description: 'Cinematic hero with curated sections. Best for storytelling.' },
  { value: 'grid', label: 'Grid', description: 'Clean photo grid. Let the images speak.' },
  { value: 'timeline', label: 'Timeline', description: 'Chronological journey through your memories.' },
]

const TEMPLATES: { value: FolderTemplate; label: string; description: string }[] = [
  { value: 'family', label: 'Family', description: 'By person, event, and year.' },
  { value: 'events', label: 'Events', description: 'Organized around birthdays, holidays, trips.' },
  { value: 'travel', label: 'Travel', description: 'By destination and adventure.' },
  { value: 'custom', label: 'Custom', description: 'Use your own Drive folder structure as-is.' },
]

interface Props {
  onNext: (layout: LayoutPreset, privacy: PrivacyMode, template: FolderTemplate) => void
}

export function StepLayout({ onNext }: Props) {
  const [layout, setLayout] = useState<LayoutPreset>('editorial')
  const [template, setTemplate] = useState<FolderTemplate>('family')

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Step 2 of 4</p>
        <h2 className="font-serif text-3xl text-foreground">Choose your look</h2>
        <p className="text-muted-foreground">
          Pick the layout that feels right. You can change it any time.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Layout style</p>
          <div className="space-y-2">
            {LAYOUTS.map((l) => (
              <button
                key={l.value}
                onClick={() => setLayout(l.value)}
                className="w-full text-left px-4 py-3.5 rounded-xl border transition-colors"
                style={{
                  background: layout === l.value ? 'oklch(0.70 0.145 58 / 10%)' : 'var(--card)',
                  borderColor: layout === l.value ? 'var(--primary)' : 'var(--border)',
                }}
              >
                <p className="text-sm font-medium text-foreground">{l.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{l.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Folder structure</p>
          <div className="grid grid-cols-2 gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.value}
                onClick={() => setTemplate(t.value)}
                className="text-left px-3 py-3 rounded-xl border transition-colors"
                style={{
                  background: template === t.value ? 'oklch(0.70 0.145 58 / 10%)' : 'var(--card)',
                  borderColor: template === t.value ? 'var(--primary)' : 'var(--border)',
                }}
              >
                <p className="text-sm font-medium text-foreground">{t.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={() => onNext(layout, 'private', template)}
        className="w-full px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm transition-opacity hover:opacity-90"
      >
        Continue
      </button>
    </div>
  )
}
