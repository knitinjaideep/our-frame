'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { LayoutPreset, ThemePreset } from '@/types/platform'

/* Theme token preview: each theme has a mini colour palette swatch */
const THEMES: {
  value: ThemePreset
  label: string
  description: string
  swatches: string[]  // [background, card, primary]
}[] = [
  {
    value: 'warm_dark',
    label: 'Warm Dark',
    description: 'Deep espresso tones with bronze-gold accents. Cinematic and intimate.',
    swatches: ['oklch(0.118 0.010 46)', 'oklch(0.155 0.012 48)', 'oklch(0.70 0.145 58)'],
  },
  {
    value: 'cool_dark',
    label: 'Cool Dark',
    description: 'Slate blue-charcoal with bright azure highlights. Modern and editorial.',
    swatches: ['oklch(0.115 0.015 240)', 'oklch(0.150 0.016 238)', 'oklch(0.70 0.140 220)'],
  },
  {
    value: 'soft_light',
    label: 'Soft Light',
    description: 'Warm cream and parchment with terracotta accents. Airy and warm.',
    swatches: ['oklch(0.975 0.006 72)', 'oklch(1 0 0)', 'oklch(0.55 0.140 50)'],
  },
]

const LAYOUTS: {
  value: LayoutPreset
  label: string
  description: string
  icon: React.ReactNode
}[] = [
  {
    value: 'editorial',
    label: 'Editorial',
    description: 'Cinematic hero with curated sections. Best for storytelling.',
    icon: (
      <svg viewBox="0 0 48 32" fill="none" className="w-10 h-7">
        <rect x="0" y="0" width="48" height="20" rx="2" fill="currentColor" opacity="0.2" />
        <rect x="0" y="22" width="22" height="10" rx="1.5" fill="currentColor" opacity="0.15" />
        <rect x="25" y="22" width="23" height="10" rx="1.5" fill="currentColor" opacity="0.15" />
        <rect x="4" y="5" width="20" height="2" rx="1" fill="currentColor" opacity="0.5" />
        <rect x="4" y="10" width="14" height="1.5" rx="0.75" fill="currentColor" opacity="0.3" />
      </svg>
    ),
  },
  {
    value: 'grid',
    label: 'Grid',
    description: 'Clean photo grid. Let the images speak.',
    icon: (
      <svg viewBox="0 0 48 32" fill="none" className="w-10 h-7">
        {[0,1,2,3,4,5].map((i) => (
          <rect
            key={i}
            x={(i % 3) * 17 + 1}
            y={Math.floor(i / 3) * 17 + 1}
            width="15" height="14"
            rx="1.5"
            fill="currentColor"
            opacity={0.2 + (i * 0.05)}
          />
        ))}
      </svg>
    ),
  },
  {
    value: 'timeline',
    label: 'Timeline',
    description: 'Chronological journey through your memories.',
    icon: (
      <svg viewBox="0 0 48 32" fill="none" className="w-10 h-7">
        <line x1="6" y1="4" x2="6" y2="28" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
        {[4, 13, 22].map((y, i) => (
          <g key={i}>
            <circle cx="6" cy={y + 3} r="2.5" fill="currentColor" opacity="0.5" />
            <rect x="12" y={y} width="32" height="6" rx="1.5" fill="currentColor" opacity="0.15 + i * 0.05" />
            <rect x="12" y={y + 1} width="18" height="2" rx="1" fill="currentColor" opacity="0.35" />
          </g>
        ))}
      </svg>
    ),
  },
]

interface Props {
  onNext: (layout: LayoutPreset, theme: ThemePreset) => void
  defaultLayout?: LayoutPreset
  defaultTheme?: ThemePreset
}

export function StepLayout({ onNext, defaultLayout = 'editorial', defaultTheme = 'warm_dark' }: Props) {
  const [layout, setLayout] = useState<LayoutPreset>(defaultLayout)
  const [theme, setTheme]   = useState<ThemePreset>(defaultTheme)

  // Apply theme preview live on the document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'var(--primary)' }}>
          Step 2 of 6
        </p>
        <h2 className="font-serif text-3xl text-foreground">Look &amp; feel</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Choose the theme and layout that feels right. Changes are reflected immediately.
          You can update these any time in Settings.
        </p>
      </div>

      {/* Theme selection */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">Colour theme</p>
        <div className="space-y-2">
          {THEMES.map((t) => {
            const isSelected = theme === t.value
            return (
              <button
                key={t.value}
                onClick={() => setTheme(t.value)}
                className="w-full text-left rounded-xl px-4 py-3.5 transition-all duration-200"
                style={{
                  background: isSelected ? 'var(--amber-subtle)' : 'var(--card)',
                  border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                  boxShadow: isSelected ? '0 0 0 3px var(--amber-subtle)' : 'none',
                }}
              >
                <div className="flex items-center gap-3">
                  {/* Colour swatches */}
                  <div className="flex gap-1 flex-shrink-0">
                    {t.swatches.map((swatch, i) => (
                      <span
                        key={i}
                        className="block rounded-full"
                        style={{
                          width: i === 2 ? '14px' : '10px',
                          height: i === 2 ? '14px' : '10px',
                          background: swatch,
                          border: '1px solid oklch(1 0 0 / 10%)',
                          marginTop: i === 2 ? '-2px' : '2px',
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground flex items-center gap-2">
                      {t.label}
                      {isSelected && (
                        <motion.span
                          layoutId="theme-check"
                          className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                          style={{ background: 'var(--amber-muted)', color: 'var(--primary)' }}
                        >
                          Active
                        </motion.span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{t.description}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Layout selection */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">Layout style</p>
        <div className="space-y-2">
          {LAYOUTS.map((l) => {
            const isSelected = layout === l.value
            return (
              <button
                key={l.value}
                onClick={() => setLayout(l.value)}
                className="w-full text-left rounded-xl px-4 py-3.5 transition-all duration-200"
                style={{
                  background: isSelected ? 'var(--amber-subtle)' : 'var(--card)',
                  border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                }}
              >
                <div className="flex items-center gap-3.5">
                  <span style={{ color: 'var(--primary)' }} className="flex-shrink-0">
                    {l.icon}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{l.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{l.description}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <button
        onClick={() => onNext(layout, theme)}
        className="w-full px-6 py-3.5 rounded-xl font-medium text-sm transition-opacity hover:opacity-90"
        style={{
          background: 'var(--primary)',
          color: 'var(--primary-foreground)',
        }}
      >
        Continue
      </button>
    </div>
  )
}
