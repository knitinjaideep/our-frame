// Barrel export for the PR1 design-system primitives.
// PhotoGrid, EmptyState-in-context (favorites/memories), etc. that predate
// this folder are intentionally not re-exported here — import them from
// their existing locations (e.g. `@/components/photos/photo-grid`).

export { PageIntro } from './page-intro'
export { EditorialEyebrow } from './editorial-eyebrow'
export { ChapterCard } from './chapter-card'
export { MasonryGallery, type MasonryGalleryItem } from './masonry-gallery'
export { GalleryTabs, galleryTabPanelId, type GalleryTab } from './gallery-tabs'
export { PhotoLightbox, type LightboxSlide } from './photo-lightbox'
export { PhotoContextMenu, type PhotoContextMenuAction } from './photo-context-menu'
export { EmptyState } from './empty-state'
export { TextLink } from './text-link'
export { IconButton } from './icon-button'
export { FeaturedStory } from './featured-story'
export { TimelineEntry } from './timeline-entry'
export { SectionHeading, SectionHeader, PageHeader } from '@/components/ui/section-header'
