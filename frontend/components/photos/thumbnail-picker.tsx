'use client'
import { mediaUrl } from '@/lib/api-client'
import { cn } from '@/lib/utils'

export interface ThumbnailPickerCandidate {
  id: string
  thumbnailUrl: string | null
  alt: string
}

interface ThumbnailPickerProps {
  candidates: ThumbnailPickerCandidate[]
  selectedId?: string | null
  onSelect: (photoId: string) => void
  className?: string
}

/**
 * ThumbnailPicker — presentational scaffold for manual album/folder cover
 * selection (`docs/redesign-v2/MILESTONES.md` PR 7, "Metadata, Thumbnail
 * Selection, Image Quality").
 *
 * PR 2 (this component's origin) only builds the shared *architecture*
 * category/album pages will need; it deliberately does NOT wire this into
 * any live page yet, because `Album` has no cover-photo reference field to
 * select for until PR 7 adds one (see `docs/redesign-v2/STATE.md` for the
 * judgment call). Building the picker grid now means PR 7 only has to
 * supply real candidates + a save mutation, not invent this layout.
 */
export function ThumbnailPicker({ candidates, selectedId, onSelect, className }: ThumbnailPickerProps) {
  if (candidates.length === 0) return null

  return (
    <div className={cn('grid grid-cols-4 gap-3 sm:grid-cols-6', className)} role="listbox" aria-label="Choose album cover">
      {candidates.map((c) => {
        const isSelected = c.id === selectedId
        return (
          <button
            key={c.id}
            type="button"
            role="option"
            aria-selected={isSelected}
            onClick={() => onSelect(c.id)}
            className="relative aspect-square overflow-hidden rounded-lg transition-shadow"
            style={{
              boxShadow: isSelected ? 'inset 0 0 0 2px var(--amber)' : 'inset 0 0 0 1px var(--border)',
            }}
          >
            {c.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mediaUrl(c.thumbnailUrl)} alt={c.alt} loading="lazy" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-muted" />
            )}
          </button>
        )
      })}
    </div>
  )
}
