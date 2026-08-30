/**
 * FolderGrid — the shared folder/album-tile grid used by every category
 * landing page and every album page's "sub-albums" section
 * (docs/OUR-FRAME-DESIGN-SYSTEM.md §8/§9): identical card width/height/
 * aspect ratio/radius/overlay/typography regardless of which category or
 * album it renders inside.
 *
 * Re-exports the existing `AlbumGrid`/`AlbumCard` primitives (already
 * reused consistently by the Photos overview, category pages, and album
 * sub-folder sections) under the domain name used in
 * docs/redesign-v2/PROMPTS.md — no logic duplicated. See
 * `components/albums/album-grid.tsx` / `album-card.tsx` for the
 * implementation.
 */
export { AlbumGrid as FolderGrid } from '@/components/albums/album-grid'
export { AlbumCard as FolderCard } from '@/components/albums/album-card'
