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
 * ThumbnailPicker — presentational grid for manual album/folder cover
 * selection (`docs/redesign-v2/MILESTONES.md` PR 7, "Metadata, Thumbnail
 * Selection, Image Quality").
 *
 * Built as an unwired scaffold in PR 2 (see `docs/redesign-v2/STATE.md` for
 * that judgment call — `Album` had no cover-photo reference field yet).
 * PR 7 wires it up: `components/photos/cover-picker-dialog.tsx` supplies
 * real per-album photo candidates and calls the real `POST /albums/{id}
 * /cover` mutation (`useSetAlbumCover`) on selection, opened from the
 * album header's "Change cover" affordance. Left presentational-only here
 * (no data fetching, no mutation) so it stays reusable if another surface
 * ever needs the same picker grid.
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
