'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ImageOff } from 'lucide-react'
import { ageCaption, dateRangeLabel, earliestDate, explicitDateRangeLabel } from '@/lib/photo-age'
import { albumCoverUrl } from '@/lib/api-client'
import { AlbumHeader, type BreadcrumbItem } from './album-header'
import { CategoryHeader } from './category-header'
import { FolderGrid } from './folder-grid'
import { AlbumPhotoGrid } from './album-photo-grid'
import { CoverPickerDialog } from './cover-picker-dialog'
import { useSetAlbumCover } from '@/hooks/use-albums'
import { useCurrentUser } from '@/hooks/use-auth'
import { AlbumGridSkeleton } from '@/components/albums/album-grid-skeleton'
import { PhotoGridSkeleton } from '@/components/photos/photo-grid-skeleton'
import { SectionReveal } from '@/components/ui/section-reveal'
import { ConfirmationToast, EmptyState } from '@/components/design-system'
import type { AlbumDetail } from '@/types'

export interface AlbumDetailTemplateMeta {
  /** Category eyebrow, e.g. "Growing Up, Frame by Frame". Defaults to "Album". */
  eyebrow?: string
  /** One-line category/album description. Omitted when absent. */
  description?: string
  /** Shown only when this id has neither subfolders nor photos. */
  emptyMessage?: string
  /**
   * Caption each photo with its estimated age relative to the earliest
   * dated photo in this set (Arjun's "6th month" labels). Content-level
   * opt-in, not a separate layout — see `lib/photo-age.ts` for the
   * judgment call behind the estimate (no birth-date field exists).
   */
  ageCaptions?: boolean
  /**
   * True only for the four top-level chapter buckets (Arjun/Travel/
   * Milestones/Life). Switches the header to the compact `CategoryHeader`
   * (instead of `AlbumHeader`), the folder grid to the 3/2/1-column
   * `category` variant (instead of 4/3/2), and drops the "Inside this
   * Album" section label so the grid begins directly under the header, per
   * `docs/redesign-v2/PROMPTS.md` PR 5 / `docs/OUR-FRAME-DESIGN-SYSTEM.md`
   * §9 (board 3 shows no such label). Leaf albums/sub-albums keep the
   * existing `AlbumHeader` + default grid unchanged — that's PR 6's scope.
   */
  isCategory?: boolean
}

interface AlbumDetailTemplateProps {
  id: string
  data?: AlbumDetail
  isLoading: boolean
  error: Error | null
  meta?: AlbumDetailTemplateMeta
}

/**
 * AlbumDetailTemplate — the single shared page used at every
 * `/albums/[id]` destination, whether `id` is one of the four top-level
 * chapters (Arjun/Travel/Milestones/Life) or a real leaf album/sub-album
 * nested under one of them (docs/redesign-v2 PR 2; see
 * `docs/OUR-FRAME-DESIGN-SYSTEM.md` §6, §9, §10).
 *
 * Content, not code, decides what renders: a `FolderGrid` section when the
 * id has subfolders, an `AlbumPhotoGrid` section when it has its own
 * photos, both when it has both (e.g. Arjun, which — unlike Travel/
 * Milestones/Life — holds real photos directly as well as sub-albums), and
 * an honest empty state when it has neither. This replaces four bespoke,
 * mutually-divergent per-category components (`arjun-gallery.tsx`,
 * `travel-gallery.tsx`, `milestones-gallery.tsx`, `life-gallery.tsx`) that
 * each built its own folder-card system, header, and gallery layout — see
 * `docs/redesign-v2/STATE.md` for the judgment call behind removing them.
 */
export function AlbumDetailTemplate({ id, data, isLoading, error, meta }: AlbumDetailTemplateProps) {
  const photos = useMemo(() => data?.photos ?? [], [data?.photos])
  const subfolders = data?.subfolders ?? []
  const hasSubfolders = subfolders.length > 0
  const hasPhotos = photos.length > 0
  const title = data?.album.name ?? 'Album'

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', href: '/home' },
    { label: 'Photos', href: '/photos' },
  ]
  if (data?.album) breadcrumbs.push({ label: data.album.name })

  // PR 7 — header "Change cover" affordance, opening `CoverPickerDialog`
  // (the second of the two cover-selection surfaces the brief allows,
  // alongside the lightbox's overflow menu owned by `AlbumPhotoGrid`).
  // Legacy `/albums` routes aren't workspace-scoped (see the auth-scope
  // note in `backend/api/albums/routes.py`), so "authenticated" is the
  // meaningful "owner" signal here, same as `AlbumPhotoGrid`.
  const { data: currentUser } = useCurrentUser()
  const setCover = useSetAlbumCover()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  // Clear the pending timer on unmount — otherwise navigating away mid-toast
  // fires setState on an unmounted component.
  useEffect(() => () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
  }, [])
  function showToast(message: string, tone: 'success' | 'error' = 'success') {
    setToast({ message, tone })
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast(null), tone === 'error' ? 4000 : 2600)
  }

  const isCategory = meta?.isCategory ?? false
  const canEditCover = Boolean(currentUser) && !isCategory && Boolean(data?.album)
  // Category pages use "folder(s)" per docs/OUR-FRAME-DESIGN-SYSTEM.md §9
  // ("113 folders", "42 folders" ...); leaf albums keep "album(s)" for
  // their own sub-albums section.
  const folderWord = isCategory ? (subfolders.length === 1 ? 'folder' : 'folders') : subfolders.length === 1 ? 'album' : 'albums'
  const countParts: string[] = []
  if (hasSubfolders) countParts.push(`${subfolders.length.toLocaleString()} ${folderWord}`)
  if (hasPhotos) countParts.push(`${photos.length.toLocaleString()} ${photos.length === 1 ? 'photo' : 'photos'}`)
  const countLabel = !isLoading && countParts.length > 0 ? countParts.join(' · ') : undefined

  // Reference "start" date for age captions — earliest dated photo in this
  // set, so captions stay stable while the gallery is filtered/sorted.
  const ageStart = useMemo(
    () => (meta?.ageCaptions ? earliestDate(photos.map((p) => p.created_time)) : null),
    [meta?.ageCaptions, photos],
  )
  const captionFor = useMemo(() => {
    if (!ageStart) return undefined
    return (p: { created_time?: string | null }) =>
      p.created_time ? ageCaption(new Date(p.created_time), ageStart).label : undefined
  }, [ageStart])

  // A specific album's date range. Prefers the real, day-precision
  // `start_date`/`end_date` metadata fields (PR 7) when set; falls back to
  // a range derived from the photos' own capture dates (coarser, month-
  // precision) when no explicit dates have been set for this album, so
  // existing albums keep behaving exactly as before PR 7. Category landing
  // pages don't get a date range; they fan out to many folders, not one
  // dated set.
  const dateRange = useMemo(() => {
    if (isCategory) return undefined
    return (
      explicitDateRangeLabel(data?.album.start_date, data?.album.end_date) ??
      dateRangeLabel(photos.map((p) => p.created_time))
    )
  }, [isCategory, data?.album.start_date, data?.album.end_date, photos])
  // Real album location (PR 7 metadata field) — omitted gracefully when
  // absent, never a placeholder. Category landing pages don't show a
  // location row (see `CategoryHeader`'s doc comment — that row is
  // reserved for a specific album's header, §10).
  const location = !isCategory ? data?.album.location ?? undefined : undefined
  // A curated per-chapter description (`meta.description`, only set for the
  // four top-level category buckets) still wins when present; otherwise a
  // real leaf album's own `description` field (PR 7) is used instead of
  // always being blank.
  const description = meta?.description ?? (!isCategory ? data?.album.description ?? undefined : undefined)
  // Rendered ~1400px wide in the header band, so it asks for the larger
  // cached derivative rather than the 400px card thumbnail — see
  // `albumCoverUrl`. Still the album's own real cover; never a placeholder.
  const coverImageUrl =
    !isCategory && data?.album.thumbnail_url ? albumCoverUrl(data.album.thumbnail_url) : undefined

  return (
    <div className="content-padding pb-24">
      <div className="mx-auto max-w-[var(--container-max)]">
        {/* ── Header — CategoryHeader (compact, 48–64px margin) for the four
            chapter buckets; AlbumHeader (full-bleed cover photo + gradient
            scrim when one exists, §10) for every leaf album/sub-album ── */}
        <div className={isCategory ? 'pt-14 pb-14' : 'pt-10 pb-14 sm:pt-12 sm:pb-16'}>
          {isCategory ? (
            <CategoryHeader
              breadcrumbs={breadcrumbs}
              eyebrow={meta?.eyebrow ?? 'Photos'}
              title={title}
              description={meta?.description}
              countLabel={countLabel}
              isLoading={isLoading}
            />
          ) : (
            <AlbumHeader
              breadcrumbs={breadcrumbs}
              eyebrow={meta?.eyebrow ?? 'Album'}
              title={title}
              description={description}
              location={location}
              dateRange={dateRange}
              countLabel={countLabel}
              isLoading={isLoading}
              coverImageUrl={coverImageUrl}
              onChangeCover={canEditCover ? () => setPickerOpen(true) : undefined}
            />
          )}
        </div>

        {error && (
          <div className="mb-8">
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-5 py-4 text-sm text-destructive">
              Failed to load this album.
            </div>
          </div>
        )}

        {isLoading ? (
          <>
            <SectionReveal>
              <section className="mb-20">
                {!isCategory && <SkeletonHeading />}
                <AlbumGridSkeleton count={isCategory ? 6 : 4} variant={isCategory ? 'category' : 'default'} />
              </section>
            </SectionReveal>
            <SectionReveal delay={0.04}>
              <section className="mb-20">
                <SkeletonHeading />
                <PhotoGridSkeleton count={12} />
              </section>
            </SectionReveal>
          </>
        ) : !hasSubfolders && !hasPhotos && !error ? (
          <EmptyState
            icon={<ImageOff className="h-6 w-6" />}
            title="Nothing here yet"
            description={meta?.emptyMessage ?? 'Once photos land in this Drive folder, they will appear here.'}
          />
        ) : (
          <>
            {hasSubfolders && (
              <SectionReveal>
                <section className="mb-20">
                  {/* Category landing pages: the folder grid begins right
                      under the header, no section label — board 3 shows no
                      "Inside this Album" heading on a category page. Leaf
                      albums keep the label to introduce their sub-albums. */}
                  {!isCategory && <SectionLabel eyebrow="Inside this Album" heading="Albums" />}
                  <FolderGrid albums={subfolders} variant={isCategory ? 'category' : 'default'} />
                </section>
              </SectionReveal>
            )}

            {hasPhotos && (
              <SectionReveal delay={hasSubfolders ? 0.04 : 0}>
                <section className="mb-20">
                  {/* The album title already appears once in the header —
                      design system §10 forbids repeating it here, so this
                      label only exists to separate the two sections when
                      sub-albums are also on the page. */}
                  {hasSubfolders && <SectionLabel eyebrow="Also in here" heading="Photos" />}
                  <AlbumPhotoGrid
                    photos={photos}
                    folderId={id}
                    albumName={title}
                    captionFor={captionFor}
                    hasCustomCover={Boolean(data?.album.has_custom_cover)}
                    // Category landing pages (isCategory) have no cover
                    // slot in their header (`CategoryHeader` doesn't render
                    // one — see its doc comment), so cover selection is
                    // only offered on a real leaf album's own photos.
                    enableCoverSelection={!isCategory}
                  />
                </section>
              </SectionReveal>
            )}
          </>
        )}
      </div>

      {canEditCover && (
        <CoverPickerDialog
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          candidates={photos.map((p) => ({
            id: p.id,
            thumbnailUrl: p.thumbnail_url,
            alt: p.name,
          }))}
          selectedId={data?.album.cover_photo_id}
          onSelect={(photoId) => {
            setCover.mutate(
              { albumId: id, photoId },
              {
                onSuccess: () => showToast('Album cover updated'),
                onError: () => showToast("Couldn't update the album cover", 'error'),
              },
            )
          }}
          onReset={
            data?.album.has_custom_cover
              ? () =>
                  setCover.mutate(
                    { albumId: id, photoId: null },
                    {
                      onSuccess: () => showToast('Album cover reset'),
                      onError: () => showToast("Couldn't reset the album cover", 'error'),
                    },
                  )
              : undefined
          }
        />
      )}
      <ConfirmationToast message={toast?.message ?? null} tone={toast?.tone} />
    </div>
  )
}

function SectionLabel({ eyebrow, heading }: { eyebrow: string; heading: string }) {
  return (
    <div className="flex items-end justify-between mb-10">
      <div className="space-y-1.5">
        <p
          style={{
            fontSize: '0.65rem',
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--amber)',
          }}
        >
          {eyebrow}
        </p>
        <h2
          className="font-serif leading-[0.95]"
          style={{ fontSize: 'clamp(1.7rem, 3.2vw, 2.5rem)', fontStyle: 'italic', fontWeight: 500, color: 'var(--foreground)' }}
        >
          {heading}
        </h2>
      </div>
    </div>
  )
}

function SkeletonHeading() {
  return (
    <div className="mb-10 space-y-1.5">
      <div className="h-3 w-24 rounded skeleton-shimmer" />
      <div className="h-8 w-48 rounded skeleton-shimmer" />
    </div>
  )
}
