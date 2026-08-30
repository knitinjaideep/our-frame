'use client'
import { useMemo } from 'react'
import { ImageOff } from 'lucide-react'
import { ageCaption, earliestDate } from '@/lib/photo-age'
import { AlbumHeader, type BreadcrumbItem } from './album-header'
import { CategoryHeader } from './category-header'
import { FolderGrid } from './folder-grid'
import { AlbumPhotoGrid } from './album-photo-grid'
import { AlbumGridSkeleton } from '@/components/albums/album-grid-skeleton'
import { PhotoGridSkeleton } from '@/components/photos/photo-grid-skeleton'
import { SectionReveal } from '@/components/ui/section-reveal'
import { EmptyState } from '@/components/design-system'
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

  const isCategory = meta?.isCategory ?? false
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

  return (
    <div>
      {/* ── Header — CategoryHeader (compact, 48–64px margin) for the four
          chapter buckets; AlbumHeader for every leaf album/sub-album ── */}
      <div className={isCategory ? 'content-padding pt-14 pb-14' : 'content-padding pt-12 pb-16'}>
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
            description={meta?.description}
            countLabel={countLabel}
            isLoading={isLoading}
          />
        )}
      </div>

      {error && (
        <div className="content-padding mb-8">
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-5 py-4 text-sm text-destructive">
            Failed to load this album.
          </div>
        </div>
      )}

      <div className="pb-24">
        {isLoading ? (
          <>
            <SectionReveal>
              <section className="content-padding mb-20">
                {!isCategory && <SkeletonHeading />}
                <AlbumGridSkeleton count={isCategory ? 6 : 4} variant={isCategory ? 'category' : 'default'} />
              </section>
            </SectionReveal>
            <SectionReveal delay={0.04}>
              <section className="content-padding mb-20">
                <SkeletonHeading />
                <PhotoGridSkeleton count={12} />
              </section>
            </SectionReveal>
          </>
        ) : !hasSubfolders && !hasPhotos && !error ? (
          <div className="content-padding">
            <EmptyState
              icon={<ImageOff className="h-6 w-6" />}
              title="Nothing here yet"
              description={meta?.emptyMessage ?? 'Once photos land in this Drive folder, they will appear here.'}
            />
          </div>
        ) : (
          <>
            {hasSubfolders && (
              <SectionReveal>
                <section className="content-padding mb-20">
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
                <section className="content-padding mb-20">
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
                  />
                </section>
              </SectionReveal>
            )}
          </>
        )}
      </div>
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
