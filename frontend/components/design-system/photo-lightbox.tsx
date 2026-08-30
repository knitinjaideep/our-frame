'use client'

import {
  ResilientLightbox,
  type LightboxSlide,
} from '@/components/photos/resilient-lightbox'

export type { LightboxSlide }

interface PhotoLightboxProps {
  open: boolean
  index: number
  slides: LightboxSlide[]
  onClose: () => void
  /** PR 7 — whether the viewer may see owner-only actions (album cover selection). */
  isOwner?: boolean
}

/**
 * PhotoLightbox — the design-system name for the full-screen photo/video
 * viewer described in `docs/redesign/PROMPTS.md` (PR 5).
 *
 * PR 1 scope: expose a stable, minimal prop contract (open/index/slides/
 * onClose) that later pages can adopt, while delegating to the existing
 * `ResilientLightbox` implementation — which already provides the
 * near-black full-screen background, image-load retry/fallback chain, and
 * keyboard/swipe navigation via `yet-another-react-lightbox`.
 *
 * PR 5 will redesign the *visual language* in place (restrained translucent
 * controls, discreet metadata drawer, restrained favorite animation) inside
 * `ResilientLightbox` without needing to change this contract.
 */
export function PhotoLightbox({ open, index, slides, onClose, isOwner }: PhotoLightboxProps) {
  return (
    <ResilientLightbox open={open} index={index} slides={slides} onClose={onClose} isOwner={isOwner} />
  )
}
