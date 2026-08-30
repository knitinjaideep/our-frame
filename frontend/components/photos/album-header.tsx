'use client'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  href?: string
}

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
 * AlbumHeader — the single shared header anatomy used by every category
 * landing page and every individual album page (docs/OUR-FRAME-DESIGN-
 * SYSTEM.md §7/§9/§10): breadcrumb → eyebrow → title → optional location/
 * date → optional description → optional count. Absent optional fields are
 * omitted entirely, never rendered as empty placeholders.
 *
 * Also exported as `PhotoSectionHeader` — category pages and album pages
 * share the exact same header shape per the design system, so this is
 * intentionally one component with two names rather than two near-identical
 * ones.
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
      <nav className="mb-5 flex flex-wrap items-center gap-1.5 text-xs" aria-label="Breadcrumb">
        {breadcrumbs.map((crumb, i) => (
          <span key={`${crumb.label}-${i}`} className="flex items-center gap-1.5">
            {i > 0 && (
              <ChevronRight
                className="h-3 w-3 shrink-0"
                style={{ color: 'var(--muted-foreground)', opacity: 0.4 }}
                aria-hidden
              />
            )}
            {crumb.href ? (
              <Link href={crumb.href} className="transition-colors" style={{ color: 'var(--muted-foreground)' }}>
                {crumb.label}
              </Link>
            ) : (
              <span style={{ color: 'var(--foreground)' }}>{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

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

export const PhotoSectionHeader = AlbumHeader
