'use client'

import { useState } from 'react'

interface Props {
  onNext: (name: string, slug: string, subtitle: string) => void
}

function toSlug(s: string) {
  return s
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

export function StepName({ onNext }: Props) {
  const [name, setName] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [slug, setSlug] = useState('')
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
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Step 1 of 4</p>
        <h2 className="font-serif text-3xl text-foreground">Name your space</h2>
        <p className="text-muted-foreground">
          This is your family's archive. Give it a name that feels like home.
        </p>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground" htmlFor="ws-name">
            Workspace name
          </label>
          <input
            id="ws-name"
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="The Kotcherlakota Family"
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground text-sm outline-none focus:border-primary transition-colors"
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground" htmlFor="ws-subtitle">
            Subtitle <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <input
            id="ws-subtitle"
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="Memories, moments, and milestones"
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground text-sm outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground" htmlFor="ws-slug">
            URL slug
          </label>
          <div className="flex items-center gap-0">
            <span className="bg-muted border border-border border-r-0 rounded-l-xl px-3 py-3 text-muted-foreground text-sm">
              ourframe.app/
            </span>
            <input
              id="ws-slug"
              type="text"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="kotcherlakota"
              className="flex-1 bg-card border border-border rounded-r-xl px-4 py-3 text-foreground placeholder:text-muted-foreground text-sm outline-none focus:border-primary transition-colors"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            You can change this later. Only lowercase letters, numbers, and hyphens.
          </p>
        </div>
      </div>

      <button
        onClick={() => onNext(name.trim(), slug || toSlug(name), subtitle.trim())}
        disabled={!canContinue}
        className="w-full px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Continue
      </button>
    </div>
  )
}
