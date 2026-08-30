'use client'
import { Breadcrumbs, type BreadcrumbItem } from './breadcrumbs'

export type { BreadcrumbItem }

export interface AlbumHeaderProps {
  breadcrumbs: BreadcrumbItem[]
  /** Small uppercase eyebrow, e.g. "Album" or a category eyebrow like "Growing Up, Frame by Frame". */
  eyebrow?: string
  title: string
  /** One-line description/statement. Optional — omitted, never an empty placeholder. */
  description?: string
  /** Optional location line, e.g. "Bar Harbor, Maine" (PR 7 metadata). */
  location?: string
  /** Optional date/date-range line, e.g. "May 10 – May 17, 2024" (PR 7 metadata). */
  dateRange?: string
  /** Pre-formatted count line, e.g. "113 photos" or "12 folders · 842 photos". */
  countLabel?: string
  isLoading?: boolean
}

/**
 * AlbumHeader — the shared header for an individual album / leaf sub-album
 * (docs/OUR-FRAME-DESIGN-SYSTEM.md §10): breadcrumb → eyebrow → title →
 * optional location/date → optional description → optional count. Absent
 * optional fields are omitted entirely, never rendered as empty
 * placeholders.
 *
 * Category *landing* pages use `CategoryHeader` (`./category-header.tsx`)
 * instead — §17 names both as distinct shared components, and §10 requires
 * this album header to eventually sit on top of a full-bleed cover photo
 * with a gradient scrim (PR 6), which a category page must not inherit.
 * The parts that genuinely are the same in both — the breadcrumb trail, the
 * `text-eyebrow-gold` / `text-display-sm` / `text-body` / `text-small`
 * type scale — are shared rather than duplicated (see `./breadcrumbs.tsx`).
 */
export function AlbumHeader({
  breadcrumbs,
  eyebrow,
  title,
  description,
  location,
  dateRange,
  countLabel,
  isLoading,
}: AlbumHeaderProps) {
  return (
    <div>
      <Breadcrumbs items={breadcrumbs} />

      {eyebrow && <p className="text-eyebrow-gold mb-3">{eyebrow}</p>}

      {isLoading ? (
        <div className="h-10 w-64 rounded skeleton-shimmer" />
      ) : (
        <h1 className="text-display-sm font-serif text-foreground">{title}</h1>
      )}

      {!isLoading && (location || dateRange) && (
        <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-small text-muted-foreground">
          {location && <span>{location}</span>}
          {dateRange && <span>{dateRange}</span>}
        </p>
      )}

      {!isLoading && description && (
        <p className="mt-3 max-w-md text-body text-muted-foreground leading-relaxed">{description}</p>
      )}

      {!isLoading && countLabel && (
        <p className="mt-4 text-small text-muted-foreground opacity-70">{countLabel}</p>
      )}
    </div>
  )
}
