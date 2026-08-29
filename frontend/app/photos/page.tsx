'use client'
import { useRootBuckets } from '@/hooks/use-root-buckets'
import { SectionReveal } from '@/components/ui/section-reveal'
import { ImageOff } from 'lucide-react'
import { PageIntro, ChapterCard, TextLink, EmptyState } from '@/components/design-system'
import { CHAPTER_COVER_ASPECT } from '@/components/design-system/chapter-card'
import { mediaUrl } from '@/lib/api-client'
import { BUCKETS } from '@/lib/buckets'
import { cn } from '@/lib/utils'

/**
 * Chapter labels + mosaic sizing, zipped onto `BUCKETS` by index (same
 * pattern as `HERO_CHAPTER_META` in `home-feed-view.tsx`). Drive folder ids
 * live once in `lib/buckets.ts` — not repeated here.
 *
 * `span`/`size` create the asymmetric editorial mosaic: Arjun and Life are
 * the two visually dominant chapters (wide + tall), Travel and Milestones
 * sit smaller beside them — not four identical tiles.
 */
const MOSAIC_META = [
  { label: 'Arjun', span: 'lg:col-span-7', size: 'lg' as const },
  { label: 'Travel', span: 'lg:col-span-5', size: 'md' as const },
  { label: 'Milestones', span: 'lg:col-span-5', size: 'md' as const },
  { label: 'Life', span: 'lg:col-span-7', size: 'lg' as const },
]

const CHAPTERS = BUCKETS.map((bucket, i) => ({ ...bucket, ...MOSAIC_META[i] }))

function ChapterMosaicSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
      {CHAPTERS.map((chapter) => (
        <div
          key={chapter.id}
          className={cn(
            'overflow-hidden rounded-2xl skeleton-shimmer',
            chapter.span,
            CHAPTER_COVER_ASPECT[chapter.size],
          )}
        />
      ))}
    </div>
  )
}

export default function PhotosPage() {
  const { data: bucketsData, isLoading: bucketsLoading, isError } = useRootBuckets()
  const allBuckets = bucketsData?.albums ?? []
  // Every chapter is a fixed Drive folder, so a chapter with no matching
  // album has no cover photograph and no count. Rendering four of those
  // would be four unexplained dark cards — show an honest state instead.
  const resolved = CHAPTERS.map((chapter) => ({
    chapter,
    album: allBuckets.find((a) => a.id === chapter.id) ?? null,
  }))
  const hasChapters = resolved.some((r) => r.album !== null)

  return (
    <div className="content-padding pb-24 pt-14 sm:pt-16">
      <div className="mx-auto max-w-[var(--container-max)]">
        {/* ── Page header ── */}
        <SectionReveal>
          <PageIntro
            eyebrow="Our Story in Frames"
            title="Photos"
            description="Four chapters. Every frame we have captured together."
            action={<TextLink href="#chapters">View all photos</TextLink>}
            className="mb-16 sm:mb-20"
          />
        </SectionReveal>

        {/* ── Asymmetric editorial chapter mosaic ── */}
        <div id="chapters" className="scroll-mt-24">
          {bucketsLoading ? (
            <ChapterMosaicSkeleton />
          ) : isError || !hasChapters ? (
            <EmptyState
              icon={<ImageOff className="h-6 w-6" />}
              title={isError ? 'We could not load your chapters' : 'No chapters yet'}
              description={
                isError
                  ? 'Something went wrong reaching your library. Try again in a moment.'
                  : 'Once your Drive folders finish syncing, your four chapters will appear here.'
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
              {resolved.map(({ chapter, album }, i) => {
                const imageUrl = album?.thumbnail_url ? mediaUrl(album.thumbnail_url) : undefined
                const meta =
                  album?.photo_count != null
                    ? `${album.photo_count.toLocaleString()} photo${album.photo_count === 1 ? '' : 's'}`
                    : undefined

                return (
                  <SectionReveal key={chapter.id} delay={i * 0.05} className={chapter.span}>
                    <ChapterCard
                      href={album ? `/albums/${album.id}` : '/photos'}
                      eyebrow={chapter.eyebrow}
                      title={chapter.label}
                      meta={meta}
                      description={chapter.description}
                      imageUrl={imageUrl}
                      // Decorative: the chapter label, title, count and
                      // description already sit inside this link, so an alt
                      // repeating "Arjun" would just double the link name.
                      imageAlt=""
                      size={chapter.size}
                    />
                  </SectionReveal>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
