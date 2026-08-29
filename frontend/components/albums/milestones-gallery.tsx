'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { CalendarHeart } from 'lucide-react'
import { EditorialEyebrow, EmptyState, TimelineEntry } from '@/components/design-system'
import { SectionReveal } from '@/components/ui/section-reveal'
import { useAlbumDetails } from '@/hooks/use-albums'
import { mediaUrl } from '@/lib/api-client'
import { gridThumbnail } from '@/lib/media'
import { dateRangeLabel, earliestDate } from '@/lib/photo-age'
import type { AlbumDetail, Photo } from '@/types'

interface MilestonesGalleryProps {
  data?: AlbumDetail
  isLoading: boolean
  error: Error | null
}

function photoTime(p: Photo): number {
  return p.created_time ? new Date(p.created_time).getTime() : 0
}

/**
 * Milestones is an organizational Drive bucket with zero photos of its own
 * — each real milestone (Engagement, Marriage, a graduation, ...) is a real
 * sub-album, not an invented structure. See `docs/redesign/STATE.md` PR 6
 * notes. Dates shown are derived from real `created_time` values on that
 * milestone's own photos (never fabricated); milestones with no dated
 * photos simply show no date rather than a guessed one. Descriptions are
 * intentionally left blank — there is no caption/story field in the data
 * model, and inventing "The day our world became bigger."-style prose for
 * real family events would misrepresent real data as fact.
 */
export function MilestonesGallery({ data, isLoading, error }: MilestonesGalleryProps) {
  const milestoneSummaries = useMemo(() => data?.subfolders ?? [], [data?.subfolders])
  const milestoneIds = useMemo(() => milestoneSummaries.map((m) => m.id), [milestoneSummaries])
  const milestoneQueries = useAlbumDetails(milestoneIds)

  const milestones = useMemo(() => {
    return milestoneSummaries.map((m, i) => {
      const photos = milestoneQueries[i]?.data?.photos ?? []
      const sorted = [...photos].sort((a, b) => photoTime(a) - photoTime(b))
      const hero = sorted[0]
      const supporting = sorted.slice(1, 4)
      return {
        id: m.id,
        name: m.name,
        thumbnailUrl: m.thumbnail_url,
        photoCount: m.photo_count ?? photos.length,
        childCount: m.child_count ?? 0,
        dateRange: dateRangeLabel(photos.map((p) => p.created_time)),
        sortKey: earliestDate(photos.map((p) => p.created_time))?.getTime() ?? 0,
        heroUrl: hero ? gridThumbnail(hero) : null,
        supporting: supporting
          .map((p) => ({ url: gridThumbnail(p), alt: p.name }))
          .filter((s): s is { url: string; alt: string } => Boolean(s.url)),
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [milestoneSummaries, milestoneQueries.map((q) => q.dataUpdatedAt).join(',')])

  // A milestone with no resolvable cover anywhere in its own or nested
  // sub-albums (rare — e.g. an entirely empty folder) has nothing honest to
  // show as a hero photo; skip it here rather than render a broken image.
  const chronological = useMemo(
    () =>
      [...milestones]
        .filter((m) => m.heroUrl || m.thumbnailUrl)
        .sort((a, b) => a.sortKey - b.sortKey),
    [milestones],
  )

  const subLoading = milestoneQueries.some((q) => q.isLoading)
  const hasMilestones = chronological.length > 0

  return (
    <div className="content-padding pb-24 pt-14 sm:pt-16">
      <div className="mx-auto max-w-[var(--container-max)]">
        <SectionReveal>
          <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-1.5 text-small">
            <Link href="/photos" className="text-muted-foreground transition-colors hover:text-foreground">
              Photos
            </Link>
            <span className="text-muted-foreground opacity-40">/</span>
            <span className="text-foreground">Milestones</span>
          </nav>

          <EditorialEyebrow className="mb-3">Anchor Memories</EditorialEyebrow>
          <h1 className="text-h1">Milestones</h1>
          <p className="mt-3 max-w-md text-body text-muted-foreground">
            The days that changed everything. Held forever.
          </p>
        </SectionReveal>

        {error && (
          <div className="mt-8 rounded-2xl border border-destructive/20 bg-destructive/5 px-5 py-4 text-sm text-destructive">
            Could not load Milestones. Check that your Google Drive is connected.
          </div>
        )}

        {isLoading || (milestoneSummaries.length > 0 && subLoading) ? (
          <div className="mt-16 space-y-16">
            <div className="aspect-[16/9] w-full rounded-2xl skeleton-shimmer" />
            <div className="aspect-[16/9] w-full rounded-2xl skeleton-shimmer" />
          </div>
        ) : !hasMilestones && !error ? (
          <div className="mt-14">
            <EmptyState
              icon={<CalendarHeart className="h-6 w-6" />}
              title="No milestones yet"
              description="Once milestone folders land in this Drive folder, they will appear here."
            />
          </div>
        ) : (
          <div className="relative mt-16">
            {/* Restrained timeline indicator — a single quiet vertical rule,
                not a corporate stepper with nodes/badges. */}
            <div
              className="pointer-events-none absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 lg:block"
              style={{ background: 'linear-gradient(to bottom, transparent, var(--border) 8%, var(--border) 92%, transparent)' }}
              aria-hidden
            />
            <div className="space-y-20 lg:space-y-28">
              {chronological.map((m, i) => {
                // Link into the milestone whenever there is more to see than
                // the hero + supporting photos already shown. `photoCount` is
                // the milestone folder's *direct* photo count, so a milestone
                // that only nests deeper (e.g. "Marriage" → Bride/Groom) has a
                // direct count of 0 while still holding real photos — without
                // the child-album check it would render as a dead end with no
                // way to reach its contents.
                const showFullStory = m.photoCount > 1 + m.supporting.length || m.childCount > 0
                return (
                  <SectionReveal key={m.id} delay={0.04}>
                    <div className="relative">
                      <span
                        className="absolute left-1/2 top-2 hidden h-2 w-2 -translate-x-1/2 rounded-full lg:block"
                        style={{ background: 'var(--amber)' }}
                        aria-hidden
                      />
                      <TimelineEntry
                        date={m.dateRange}
                        title={m.name}
                        imageUrl={mediaUrl(m.heroUrl ?? m.thumbnailUrl ?? '')}
                        imageAlt={m.name}
                        supportingImages={m.supporting.map((s) => ({ url: mediaUrl(s.url), alt: s.alt }))}
                        align={i % 2 === 0 ? 'left' : 'right'}
                        fullStoryHref={showFullStory ? `/albums/${m.id}` : undefined}
                      />
                    </div>
                  </SectionReveal>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
