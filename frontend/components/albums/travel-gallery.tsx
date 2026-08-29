'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { EditorialEyebrow, EmptyState, TextLink } from '@/components/design-system'
import { SectionReveal } from '@/components/ui/section-reveal'
import { useAlbumDetails } from '@/hooks/use-albums'
import { mediaUrl } from '@/lib/api-client'
import { gridThumbnail } from '@/lib/media'
import { dateRangeLabel, latestDate } from '@/lib/photo-age'
import type { AlbumDetail, Album, Photo } from '@/types'

interface TravelGalleryProps {
  data?: AlbumDetail
  isLoading: boolean
  error: Error | null
}

/**
 * Travel is an organizational Drive bucket with zero photos of its own —
 * every real photo lives one level deeper, under destination sub-albums
 * (Colorado, Hawaii, Maine, Maldives, Paris — real folder names, not
 * invented). See `docs/redesign/STATE.md` PR 6 notes: there is no separate
 * "trips" concept (no country/dates/story fields) in the data model, so
 * "journeys" are represented honestly as those destination sub-albums.
 * Country and one-line "memory" copy from the prompt's example are
 * deliberately NOT fabricated per destination — only real folder names,
 * real photo counts, and date ranges derived from real `created_time`
 * values are shown.
 */
export function TravelGallery({ data, isLoading, error }: TravelGalleryProps) {
  const destinations = useMemo(() => data?.subfolders ?? [], [data?.subfolders])
  const destinationIds = useMemo(() => destinations.map((d) => d.id), [destinations])
  const destinationQueries = useAlbumDetails(destinationIds)

  const enriched = useMemo(() => {
    return destinations.map((dest, i) => {
      const photos = destinationQueries[i]?.data?.photos ?? []
      const dates = photos.map((p) => p.created_time)
      return {
        ...dest,
        photos,
        dateRange: dateRangeLabel(dates),
        latest: latestDate(dates),
      }
    })
    // `destinationQueries` is a fresh array identity every render (useQueries),
    // so depend on a stable primitive derived from it instead — each query's
    // `dataUpdatedAt` — so this only recomputes when a destination's photos
    // actually finish loading.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destinations, destinationQueries.map((q) => q.dataUpdatedAt).join(',')])

  const totalPhotos = destinations.reduce((sum, d) => sum + (d.photo_count ?? 0), 0)

  // Featured journey: the destination with the most recently captured photo
  // (falls back to photo count when no destination has dated photos yet).
  const featured = useMemo(() => {
    if (enriched.length === 0) return undefined
    const dated = enriched.filter((d) => d.latest)
    if (dated.length > 0) {
      return dated.reduce((a, b) => ((a.latest as Date) > (b.latest as Date) ? a : b))
    }
    return enriched.reduce((a, b) => ((a.photo_count ?? 0) > (b.photo_count ?? 0) ? a : b))
  }, [enriched])

  const journal = enriched.filter((d) => d.id !== featured?.id)

  const hasDestinations = destinations.length > 0
  // The featured journey is chosen by most-recent capture date, which is only
  // knowable once each destination's photos have loaded. Rendering before then
  // would show a count-based guess and then visibly swap the hero card out from
  // under the reader, so hold the skeleton (which already matches the final
  // hero + journal shape) until the parallel sub-album queries settle.
  const destinationsLoading = destinationQueries.some((q) => q.isLoading)
  const showLoading = isLoading || (hasDestinations && destinationsLoading)

  return (
    <div className="content-padding pb-24 pt-14 sm:pt-16">
      <div className="mx-auto max-w-[var(--container-max)]">
        <SectionReveal>
          <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-1.5 text-small">
            <Link href="/photos" className="text-muted-foreground transition-colors hover:text-foreground">
              Photos
            </Link>
            <span className="text-muted-foreground opacity-40">/</span>
            <span className="text-foreground">Travel</span>
          </nav>

          <EditorialEyebrow className="mb-3">Stories From Everywhere</EditorialEyebrow>
          <h1 className="text-h1">Travel</h1>
          <p className="mt-3 max-w-md text-body text-muted-foreground">
            Roads taken, cities explored, memories carried home.
          </p>
          {!isLoading && hasDestinations && (
            <p className="mt-4 text-small text-muted-foreground opacity-70">
              {destinations.length} {destinations.length === 1 ? 'journey' : 'journeys'} ·{' '}
              {totalPhotos.toLocaleString()} photos
            </p>
          )}
        </SectionReveal>

        {error && (
          <div className="mt-8 rounded-2xl border border-destructive/20 bg-destructive/5 px-5 py-4 text-sm text-destructive">
            Could not load Travel. Check that your Google Drive is connected.
          </div>
        )}

        {showLoading ? (
          <div className="mt-14 space-y-6">
            <div className="aspect-[16/9] w-full rounded-2xl skeleton-shimmer sm:aspect-[21/9]" />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="aspect-[4/3] rounded-2xl skeleton-shimmer" />
              <div className="aspect-[4/3] rounded-2xl skeleton-shimmer" />
            </div>
          </div>
        ) : !hasDestinations && !error ? (
          <div className="mt-14">
            <EmptyState
              icon={<MapPin className="h-6 w-6" />}
              title="No journeys yet"
              description="Once destination folders land in this Drive folder, they will appear here."
            />
          </div>
        ) : (
          <>
            {featured && (
              <SectionReveal delay={0.05}>
                <section className="mt-14">
                  <FeaturedJourney destination={featured} />
                </section>
              </SectionReveal>
            )}

            {journal.length > 0 && (
              <SectionReveal delay={0.09}>
                <section className="mt-16">
                  <EditorialEyebrow className="mb-8">Previous Journeys</EditorialEyebrow>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {journal.map((dest, i) => (
                      <JourneyCard key={dest.id} destination={dest} size={JOURNAL_PATTERN[i % JOURNAL_PATTERN.length]} />
                    ))}
                  </div>
                </section>
              </SectionReveal>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// Mix of large / medium / occasional full-width cards — deliberately not a
// uniform grid, per the Travel prompt ("do not use identical cards").
const JOURNAL_PATTERN: Array<'lg' | 'md' | 'full'> = ['lg', 'md', 'md', 'full', 'lg', 'md']

type Destination = Album & { photos: Photo[]; dateRange?: string }

function FeaturedJourney({ destination }: { destination: Destination }) {
  // The featured hero is the one dominant image on this page, so source it at
  // preview resolution (the same derivative the home hero and lightbox use)
  // rather than the 400px album-cover thumbnail, which visibly upscales at
  // 21:9 full width. Bounded at exactly one preview request per page load —
  // grid/journal tiles below still use cached thumbnails only (PR 4 finding).
  const heroPhoto = destination.photos.find((p) => !p.mime_type?.startsWith('video/') && gridThumbnail(p))
  const thumb = heroPhoto?.preview_url ?? destination.thumbnail_url
  return (
    <div className="overflow-hidden rounded-2xl bg-muted">
      <div className="relative aspect-[16/9] w-full sm:aspect-[21/9]">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrl(thumb)} alt={destination.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-muted" />
        )}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, oklch(0.04 0.004 48 / 88%) 0%, oklch(0.04 0.004 48 / 20%) 45%, transparent 75%)',
          }}
        />
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-6 sm:p-10">
          <p className="text-[0.7rem] uppercase tracking-[0.2em] text-white/70">
            {destination.dateRange ?? 'Featured Journey'}
          </p>
          <h2 className="font-serif text-3xl italic text-white sm:text-5xl">{destination.name}</h2>
          <p className="text-small text-white/70">
            {(destination.photo_count ?? destination.photos.length).toLocaleString()} photos
          </p>
          <div className="pt-2">
            <TextLink href={`/albums/${destination.id}`} className="text-white/85 hover:text-white">
              View journey
            </TextLink>
          </div>
        </div>
      </div>
    </div>
  )
}

const SIZE_CLASSES: Record<'lg' | 'md' | 'full', string> = {
  lg: 'sm:col-span-1 lg:col-span-2 aspect-[4/3]',
  md: 'aspect-[3/4] sm:aspect-[4/5]',
  full: 'sm:col-span-2 lg:col-span-3 aspect-[16/7]',
}

function JourneyCard({ destination, size }: { destination: Destination; size: 'lg' | 'md' | 'full' }) {
  const thumb = destination.thumbnail_url
  return (
    <Link
      href={`/albums/${destination.id}`}
      className={`group relative block overflow-hidden rounded-2xl bg-muted focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--amber)] ${SIZE_CLASSES[size]}`}
    >
      {thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mediaUrl(thumb)}
          alt={destination.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-[var(--motion-slow)] ease-[var(--ease-standard)] group-hover:scale-[1.02]"
        />
      ) : (
        <div className="h-full w-full bg-muted" />
      )}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, oklch(0.04 0.004 48 / 82%) 0%, oklch(0.04 0.004 48 / 10%) 50%, transparent 80%)',
        }}
      />
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-0.5 p-4 sm:p-5">
        <h3 className="font-serif text-xl italic text-white sm:text-2xl">{destination.name}</h3>
        <p className="text-[0.75rem] text-white/70">
          {destination.dateRange ? `${destination.dateRange} · ` : ''}
          {(destination.photo_count ?? destination.photos.length).toLocaleString()} photos
        </p>
      </div>
    </Link>
  )
}
