'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface Props {
  onNext: (name: string, slug: string, subtitle: string) => void
  defaultName?: string
  defaultSubtitle?: string
}

function toSlug(s: string) {
  return s
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

/* ── Mini preview of how the brand name will look in the top nav ── */
function BrandPreview({ name, subtitle }: { name: string; subtitle: string }) {
  const displayName = name.trim() || 'Your Archive'
  const displaySub  = subtitle.trim() || null

  return (
    <motion.div
      key={displayName + displaySub}
      initial={{ opacity: 0.6 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl px-4 py-3 flex items-center gap-3"
      style={{
        background: 'oklch(0.10 0.006 48 / 82%)',
        border: '1px solid oklch(1 0 0 / 6%)',
        boxShadow: '0 1px 0 var(--amber-border), 0 4px 16px oklch(0 0 0 / 20%)',
      }}
    >
      <div className="flex flex-col gap-0.5">
        <span
          className="font-serif text-sm italic font-semibold"
          style={{
            background: 'linear-gradient(105deg, var(--gold-shadow) 0%, var(--gold-mid) 40%, var(--gold-highlight) 55%, var(--gold-mid) 70%, var(--gold-shadow) 100%)',
            backgroundSize: '250% auto',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {displayName}
        </span>
        {displaySub && (
          <span
            className="text-[9px] font-medium tracking-widest uppercase"
            style={{ color: 'oklch(0.70 0.145 58 / 55%)' }}
          >
            {displaySub}
          </span>
        )}
      </div>
      <span className="text-[10px] text-muted-foreground ml-auto opacity-50 font-sans">
        Top nav preview
      </span>
    </motion.div>
  )
}

export function StepName({ onNext, defaultName = '', defaultSubtitle = '' }: Props) {
  const [name, setName]             = useState(defaultName)
  const [subtitle, setSubtitle]     = useState(defaultSubtitle)
  const [slug, setSlug]             = useState(() => toSlug(defaultName))
  const [slugTouched, setSlugTouched] = useState(false)

  const handleNameChange = (v: string) => {
    setName(v)
    if (!slugTouched) setSlug(toSlug(v))
  }

  const handleSlugChange = (v: string) => {
    setSlugTouched(true)
    setSlug(toSlug(v))
  }

  const canContinue = name.trim().length >= 2

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'var(--primary)' }}>
          Step 1 of 6
        </p>
        <h2 className="font-serif text-3xl text-foreground">Name your space</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          This is your family&apos;s private archive. Give it a name that feels like home.
          It will appear in the navigation and across your whole experience.
        </p>
      </div>

      {/* Live preview */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Live preview</p>
        <BrandPreview name={name} subtitle={subtitle} />
      </div>

      {/* Form */}
      <div className="space-y-5">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground" htmlFor="ws-name">
            Archive name <span className="text-destructive">*</span>
          </label>
          <input
            id="ws-name"
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="The Kotcherlakota Family"
            className="w-full rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground text-sm outline-none transition-colors"
            style={{
              background: 'var(--card)',
              border: name.trim().length >= 2 ? '1px solid var(--primary)' : '1px solid var(--border)',
            }}
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground" htmlFor="ws-subtitle">
            Tagline{' '}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <input
            id="ws-subtitle"
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="Memories, moments, and milestones"
            className="w-full rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground text-sm outline-none transition-colors"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
            }}
          />
          <p className="text-xs text-muted-foreground">
            Shown beneath your archive name in the top nav.
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground" htmlFor="ws-slug">
            URL identifier
          </label>
          <div className="flex items-center">
            <span
              className="rounded-l-xl px-3 py-3 text-muted-foreground text-sm border border-r-0"
              style={{ background: 'var(--muted)', border: '1px solid var(--border)', borderRight: 'none' }}
            >
              ourframe.app/
            </span>
            <input
              id="ws-slug"
              type="text"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="kotcherlakota"
              className="flex-1 rounded-r-xl px-4 py-3 text-foreground placeholder:text-muted-foreground text-sm outline-none transition-colors"
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Lowercase letters, numbers, and hyphens only. You can change this later.
          </p>
        </div>
      </div>

      <button
        onClick={() => onNext(name.trim(), slug || toSlug(name), subtitle.trim())}
        disabled={!canContinue}
        className="w-full px-6 py-3.5 rounded-xl font-medium text-sm transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
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
