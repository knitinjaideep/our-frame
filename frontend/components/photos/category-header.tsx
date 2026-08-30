'use client'
import { Breadcrumbs, type BreadcrumbItem } from './breadcrumbs'

export interface CategoryHeaderProps {
  breadcrumbs: BreadcrumbItem[]
  /** Small uppercase bronze eyebrow, e.g. "Growing Up, Frame by Frame". */
  eyebrow: string
  title: string
  /** One-line category description. Omitted, never rendered empty. */
  description?: string
  /** Pre-formatted folder/photo count, e.g. "12 folders · 842 photos". */
  countLabel?: string
  isLoading?: boolean
}

/**
 * CategoryHeader — the single, compact header for every category landing
 * page (Home → Photos → Arjun/Travel/Milestones/Life), per
 * `docs/redesign-v2/PROMPTS.md` PR 5 and `docs/OUR-FRAME-DESIGN-SYSTEM.md`
 * §9. Board 3 (`03-category-pages-shared-folder-system.png`) shows the same
 * compact anatomy on all four categories: breadcrumb → small bronze eyebrow
 * → serif title → one-line description → folder count, with the folder
 * grid beginning immediately below — no full-bleed hero image, no per-
 * category chrome.
 *
 * Deliberately a *separate* component from `AlbumHeader`
 * (`components/photos/album-header.tsx`), even though the two currently
 * render fairly similarly, because they answer different jobs: this is the
 * "table of contents" entry point into a category, not a specific album's
 * detail header. `docs/OUR-FRAME-DESIGN-SYSTEM.md` §10 requires the leaf-
 * album header to eventually sit on top of a full-bleed cover photo with a
 * gradient scrim (PR 6's job) — `CategoryHeader` must not inherit that once
 * it's built, so the two headers are kept independent now rather than one
 * component with a hidden mode switch that PR 6 would have to thread
 * around. `AlbumHeader` also carries a `location`/`dateRange` metadata row
 * that only applies to a specific album (§10), not a category. §17 lists
 * `CategoryHeader` and `AlbumHeader` as two distinct shared components, so
 * this is the documented architecture, not an ad-hoc split. The one part
 * that genuinely is identical in both — the breadcrumb trail — is shared
 * via `./breadcrumbs.tsx` rather than copy-pasted.
 *
 * Compact per the brief: the caller wraps this in ~48–64px of vertical
 * margin (not a giant hero) — see `AlbumDetailTemplate`'s
 * `pt-14 pb-14` category wrapper.
 */
export function CategoryHeader({ breadcrumbs, eyebrow, title, description, countLabel, isLoading }: CategoryHeaderProps) {
  return (
    <div>
      <Breadcrumbs items={breadcrumbs} />

      <p className="text-eyebrow-gold mb-3">{eyebrow}</p>

      {isLoading ? (
        <div className="h-9 w-56 rounded skeleton-shimmer" />
      ) : (
        <h1 className="text-display-sm font-serif text-foreground">{title}</h1>
      )}

      {!isLoading && description && (
        <p className="mt-3 max-w-md text-body text-muted-foreground leading-relaxed">{description}</p>
      )}

      {!isLoading && countLabel && (
        <p className="mt-3 text-small text-muted-foreground opacity-70">{countLabel}</p>
      )}
    </div>
  )
}
