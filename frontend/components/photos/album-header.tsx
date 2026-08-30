'use client'
import { Calendar, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
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
  /** Optional date/date-range line, e.g. "May 10 – May 17, 2024" (derived today from photo capture dates via `lib/photo-age.ts`'s `dateRangeLabel`; PR 7 may add a real album-level field). */
  dateRange?: string
  /** Pre-formatted count line, e.g. "113 photos" or "12 folders · 842 photos". */
  countLabel?: string
  isLoading?: boolean
  /**
   * The album's own cover photo (`Album.thumbnail_url`, resolved via
   * `mediaUrl`), rendered full-bleed behind the header text with a dark
   * left-to-right gradient scrim, per
   * `docs/OUR-FRAME-DESIGN-SYSTEM.md` §10. Omitted gracefully (falls back to
   * the plain flat header) when the album has no cover yet — never a black
   * placeholder card.
   */
  coverImageUrl?: string | null
}

/**
 * AlbumHeader — the shared header for an individual album / leaf sub-album
 * (docs/OUR-FRAME-DESIGN-SYSTEM.md §10): breadcrumb → eyebrow → title →
 * optional location/date → optional description → optional count, sitting
 * on top of the album's full-bleed cover photo with a dark gradient scrim
 * when one is available. Absent optional fields are omitted entirely, never
 * rendered as empty placeholders.
 *
 * Category *landing* pages use `CategoryHeader` (`./category-header.tsx`)
 * instead — §17 names both as distinct shared components, and §10 reserves
 * the full-bleed cover-photo treatment for a specific album's own header,
 * which a category page must not inherit (it has no single cover photo of
 * its own — it fans out to many folders). The parts that genuinely are the
 * same in both — the breadcrumb trail, the `text-eyebrow-gold` /
 * `text-display-sm` / `text-body` / `text-small` type scale — are shared
 * rather than duplicated (see `./breadcrumbs.tsx`).
 *
 * The negative-margin trick (`-mx-5 md:-mx-8 lg:-mx-10 xl:-mx-12
 * 2xl:-mx-14`) exactly cancels `.content-padding`'s own breakpoint values
 * (1.25/2/2.5/3/3.5rem) so the cover photo bleeds to the edges of the
 * shared `max-w-[var(--container-max)]` content column the rest of the page
 * uses, while the text overlay re-applies `content-padding` so it lines up
 * with the breadcrumb/gallery below rather than sitting flush with the
 * image edge.
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
  coverImageUrl,
}: AlbumHeaderProps) {
  const hasCover = Boolean(coverImageUrl)

  const textBlock = (
    <>
      <Breadcrumbs items={breadcrumbs} light={hasCover} />

      {eyebrow && <p className="text-eyebrow-gold mb-3">{eyebrow}</p>}

      {isLoading ? (
        <div className="h-10 w-64 rounded skeleton-shimmer" />
      ) : (
        <h1
          className={cn(
            'text-display-sm font-serif',
            // Album titles are real Drive folder names and can be long. The
            // scrim below is only ~72% opaque at 32% of the band's width and
            // fades to ~18% by 62%, so an unconstrained title would run out
            // of the dark zone and sit as white-on-bright over the photo.
            // Capping it keeps every line inside the legible region and
            // matches board 4's left-third composition.
            hasCover ? 'max-w-2xl text-white' : 'text-foreground',
          )}
        >
          {title}
        </h1>
      )}

      {!isLoading && (location || dateRange) && (
        <p
          className={cn(
            'mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-small',
            hasCover ? 'text-white/85' : 'text-muted-foreground',
          )}
        >
          {location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--amber)' }} aria-hidden />
              {location}
            </span>
          )}
          {dateRange && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--amber)' }} aria-hidden />
              {dateRange}
            </span>
          )}
        </p>
      )}

      {!isLoading && description && (
        <p
          className={cn(
            'mt-3 max-w-md text-body leading-relaxed',
            hasCover ? 'text-white/80' : 'text-muted-foreground',
          )}
        >
          {description}
        </p>
      )}

      {!isLoading && countLabel && (
        <p
          className={cn(
            'mt-4 text-small opacity-70',
            hasCover ? 'text-white' : 'text-muted-foreground',
          )}
        >
          {countLabel}
        </p>
      )}
    </>
  )

  if (!hasCover) return <div>{textBlock}</div>

  return (
    <div className="relative -mx-5 overflow-hidden rounded-2xl md:-mx-8 lg:-mx-10 xl:-mx-12 2xl:-mx-14">
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={coverImageUrl!} alt="" className="h-full w-full object-cover" />
        {/* Dark left-to-right gradient scrim, per §10, so the copy on the
            left stays legible over the photo; a light bottom scrim keeps
            the lowest line (count) readable regardless of image content. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to right, oklch(0.04 0.004 48 / 92%) 0%, oklch(0.04 0.004 48 / 72%) 32%, oklch(0.04 0.004 48 / 18%) 62%, oklch(0.04 0.004 48 / 4%) 100%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              // Carries most of the legibility load on narrow screens, where
              // a left-to-right scrim has almost no horizontal room to fade
              // and the (bottom-anchored) copy spans the full width.
              'linear-gradient(to top, oklch(0.04 0.004 48 / 68%) 0%, oklch(0.04 0.004 48 / 22%) 42%, transparent 68%)',
          }}
        />
      </div>
      <div
        className="content-padding relative flex min-h-[20rem] flex-col justify-end py-10 sm:min-h-[24rem] sm:py-12 lg:min-h-[28rem] lg:py-16"
        // A gradient scrim alone cannot guarantee contrast over an arbitrary
        // photograph (a blown-out sky behind the title is ~3:1 at best), so
        // every line in the band also carries the same kind of text shadow
        // `AlbumCard` uses over its thumbnails. Belt-and-braces, and it costs
        // the photo nothing visually.
        style={{ textShadow: '0 1px 2px oklch(0 0 0 / 45%), 0 2px 18px oklch(0 0 0 / 55%)' }}
      >
        {textBlock}
      </div>
    </div>
  )
}
