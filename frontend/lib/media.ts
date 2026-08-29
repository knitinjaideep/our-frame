import type { Photo } from '@/types'

/**
 * Cached thumbnail (or video poster) for a grid tile, or `null` when no
 * derivative exists yet. Never falls back to `preview_url` (the full-size
 * lightbox/original derivative) — that would make every un-synced grid tile
 * download a full derivative per request. See the PR 4 review finding
 * recorded in `docs/redesign/STATE.md` for why this matters; `arjun-gallery.tsx`
 * has the same helper inline (kept there rather than refactored, to avoid
 * touching that file for this PR).
 */
export function gridThumbnail(p: Photo): string | null {
  const isVideo = p.mime_type?.startsWith('video/')
  return (isVideo ? (p.poster_url ?? p.thumbnail_url) : p.thumbnail_url) ?? null
}
