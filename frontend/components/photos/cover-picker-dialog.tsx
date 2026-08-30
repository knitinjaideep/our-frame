'use client'
import { useEffect } from 'react'
import { X, RotateCcw } from 'lucide-react'
import { ThumbnailPicker, type ThumbnailPickerCandidate } from './thumbnail-picker'
import { IconButton } from '@/components/design-system/icon-button'

interface CoverPickerDialogProps {
  open: boolean
  onClose: () => void
  candidates: ThumbnailPickerCandidate[]
  selectedId?: string | null
  onSelect: (photoId: string) => void
  /** Present only when the album currently has a custom cover set. */
  onReset?: () => void
}

/**
 * CoverPickerDialog — a small owner-only overlay wrapping PR 2's
 * `ThumbnailPicker` scaffold with real album photos, opened from the
 * album header's "Change cover" affordance (`docs/mockups/
 * 05-lightbox-album-cover-selection.png`'s mobile panel: "an edit pencil in
 * the header" + a "Change cover" button overlaid on the cover image).
 *
 * This is the second of the two cover-selection surfaces PR 7's brief
 * allows ("the photo context/overflow menu, or a discreet ... action") —
 * the lightbox's overflow menu (`resilient-lightbox.tsx`) is the first.
 * Kept intentionally simple: no portal library, no focus trap beyond
 * Escape-to-close and a backdrop click, matching the restraint of the rest
 * of this app's chrome rather than adding a new dependency for one dialog.
 */
export function CoverPickerDialog({ open, onClose, candidates, selectedId, onSelect, onReset }: CoverPickerDialogProps) {
  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Choose album cover"
      className="fixed inset-0 flex items-center justify-center p-4 sm:p-6"
      style={{ zIndex: 9500, background: 'oklch(0.02 0 0 / 78%)' }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border p-5 shadow-2xl sm:p-7"
        style={{ background: 'oklch(0.09 0.008 46 / 98%)', borderColor: 'var(--border)' }}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-eyebrow-gold mb-1">Album Cover</p>
            <h2 className="text-display-sm font-serif text-foreground">Choose a cover photo</h2>
          </div>
          <IconButton variant="ghost" label="Close" onClick={onClose} icon={<X className="h-[18px] w-[18px]" aria-hidden />} />
        </div>

        {candidates.length === 0 ? (
          <p className="text-small text-muted-foreground">This album has no photos yet.</p>
        ) : (
          <ThumbnailPicker
            candidates={candidates}
            selectedId={selectedId}
            onSelect={(photoId) => {
              onSelect(photoId)
              onClose()
            }}
          />
        )}

        {onReset && (
          <button
            type="button"
            onClick={() => {
              onReset()
              onClose()
            }}
            className="mt-5 flex items-center gap-2 text-small text-muted-foreground transition-colors hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            Reset to automatic cover
          </button>
        )}
      </div>
    </div>
  )
}
