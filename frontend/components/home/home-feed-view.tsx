'use client'

import Link from 'next/link'
import {
  ArrowRight,
  Baby,
  CalendarDays,
  CheckCircle2,
  Film,
  ImageIcon,
  Landmark,
  Loader2,
  Plane,
  RefreshCw,
  Users,
} from 'lucide-react'
import { useHomeFeed } from '@/hooks/use-home-feed'
import { useRootBuckets } from '@/hooks/use-root-buckets'
import { useSlideshow } from '@/hooks/use-slideshow'
import { useVideoFiles } from '@/hooks/use-video-files'
import { useWorkspace } from '@/hooks/use-workspace'
import { useDriveSync } from '@/hooks/use-drive-sync'
import { HeroSlideshow } from '@/components/home/hero-slideshow'
import { PhotoGrid } from '@/components/photos/photo-grid'
import { ChapterCard } from '@/components/design-system/chapter-card'
import { SectionReveal } from '@/components/ui/section-reveal'
import { BUCKETS } from '@/lib/buckets'
import { mediaUrl } from '@/lib/api-client'
import type { Album, Photo } from '@/types'

const PHOTO_CHAPTER_META = [
  { label: 'Arjun', subtitle: 'Growing up', icon: <Baby className="h-5 w-5" /> },
  { label: 'Travel', subtitle: 'Places we love', icon: <Plane className="h-5 w-5" /> },
  { label: 'Milestones', subtitle: 'Big moments', icon: <Landmark className="h-5 w-5" /> },
  { label: 'Life', subtitle: 'People & Moments', icon: <Users className="h-5 w-5" /> },
] as const

const PHOTO_CHAPTERS = BUCKETS.map((bucket, i) => ({
  id: bucket.id,
  description: bucket.description,
  eyebrow: bucket.overviewEyebrow,
  ...PHOTO_CHAPTER_META[i],
}))

const VIDEO_COLLECTIONS = [
  {
    key: 'arjun_videos' as const,
    title: 'Arjun Films',
    eyebrow: 'Growing Up',
    description: 'Every laugh, every first. His story in motion.',
    href: '/videos/arjun',
  },
  {
    key: 'family_travel_videos' as const,
    title: 'Family Travel',
    eyebrow: 'On the Road',
    description: 'Places we have been. Moments that moved us.',
    href: '/videos/family-travel',
  },
]

function countLabel(count: number | null | undefined, singular: string, plural: string): string {
  const safeCount = count ?? 0
  return `${safeCount.toLocaleString()} ${safeCount === 1 ? singular : plural}`
}

function posterFor(video: Photo | undefined): string | null {
  return video?.poster_url ?? video?.thumbnail_url ?? null
}

function SectionHead({
  eyebrow,
  title,
  href,
  linkLabel,
}: {
  eyebrow: string
  title: string
  href: string
  linkLabel: string
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-5 sm:mb-6">
      <div className="min-w-0">
        <p className="text-eyebrow-gold">{eyebrow}</p>
        <h2 className="mt-2 text-h2">{title}</h2>
      </div>
      <Link
        href={href}
        className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
      >
        {linkLabel}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  )
}

function SyncPanel({
  workspaceId,
  totalPhotos,
  totalAlbums,
  totalVideos,
}: {
  workspaceId: number | undefined
  totalPhotos: number
  totalAlbums: number
  totalVideos: number
}) {
  const { syncing, progress, error, sync } = useDriveSync(workspaceId)

  return (
    <aside className="rounded-2xl border border-border bg-card/72 p-4 shadow-[var(--shadow-card)] backdrop-blur-md sm:p-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(13rem,0.8fr)_minmax(22rem,1.2fr)_minmax(13rem,0.8fr)] lg:items-center">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-muted text-amber">
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          </span>
          <div className="min-w-0">
            <p className="text-eyebrow-gold">Library Status</p>
            <h2 className="mt-1 text-lg font-semibold text-foreground">Ready to browse</h2>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Photos', value: totalPhotos },
            { label: 'Videos', value: totalVideos },
            { label: 'Albums', value: totalAlbums },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-border bg-background/35 px-3 py-3">
              <p className="text-lg font-semibold tabular-nums text-foreground">{item.value.toLocaleString()}</p>
              <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                {item.label}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 lg:items-end">
          <button
            onClick={sync}
            disabled={!workspaceId || syncing}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60 lg:max-w-[14rem]"
            aria-label="Sync library from Google Drive"
          >
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {syncing ? 'Syncing library' : 'Sync library'}
          </button>

          <p className="text-small lg:max-w-[18rem] lg:text-right">
            {syncing
              ? progress
                ? `${progress.totalPhotos.toLocaleString()} item${progress.totalPhotos === 1 ? '' : 's'} found so far`
                : 'Scanning Google Drive'
              : 'Refresh photos and videos from Google Drive.'}
          </p>
        </div>
      </div>

      {error && <p className="mt-3 text-small text-destructive">{error}</p>}
    </aside>
  )
}

function VideoCollectionCard({
  title,
  eyebrow,
  description,
  href,
  count,
  poster,
  loading,
}: {
  title: string
  eyebrow: string
  description: string
  href: string
  count: number
  poster: string | null
  loading: boolean
}) {
  return (
    <Link
      href={href}
      className="card-lift group relative flex min-h-[13rem] overflow-hidden rounded-2xl border border-border bg-card"
    >
      {poster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mediaUrl(poster)}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-55 transition-transform duration-[var(--motion-slow)] group-hover:scale-[1.02]"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 bg-[linear-gradient(135deg,oklch(0.16_0.018_48),oklch(0.10_0.010_46))]" />
      )}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, oklch(0.04 0.006 46 / 92%) 0%, oklch(0.04 0.006 46 / 56%) 48%, oklch(0.04 0.006 46 / 18%) 100%)',
        }}
      />
      <div className="relative z-10 flex w-full flex-col justify-between p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-muted text-amber backdrop-blur">
            <Film className="h-4 w-4" />
          </span>
          <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur">
            {loading ? 'Loading' : countLabel(count, 'video', 'videos')}
          </span>
        </div>

        <div>
          <p className="text-eyebrow-gold">{eyebrow}</p>
          <h3 className="mt-2 font-serif text-3xl font-medium italic leading-none text-foreground">{title}</h3>
          <p className="mt-3 max-w-sm text-small text-muted-foreground/90">{description}</p>
        </div>
      </div>
    </Link>
  )
}

function ErrorBanner({ error }: { error: unknown }) {
  return (
    <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-5 py-4">
      <p className="text-sm text-destructive">
        Could not load your memories.{' '}
        {(error as Error).message?.includes('auth') ? (
          <a href={`${process.env.NEXT_PUBLIC_API_BASE}/auth/start`} className="underline underline-offset-2">
            Sign in with Google
          </a>
        ) : (
          <button onClick={() => window.location.reload()} className="underline underline-offset-2">
            Try again
          </button>
        )}
      </p>
    </div>
  )
}

export function HomeFeedView() {
  const { data, error } = useHomeFeed()
  const { data: slideshowPhotos } = useSlideshow()
  const { data: bucketsData } = useRootBuckets()
  const arjunVideos = useVideoFiles('arjun_videos')
  const familyTravelVideos = useVideoFiles('family_travel_videos')
  const { workspace } = useWorkspace()

  const allBuckets = bucketsData?.albums ?? []
  const hasThrowbacks = (data?.throwbacks ?? []).length > 0
  const totalPhotos = data?.stats.total_photos ?? 0
  const totalAlbums = data?.stats.total_albums ?? allBuckets.length
  const totalVideos = (arjunVideos.data?.total ?? 0) + (familyTravelVideos.data?.total ?? 0)

  const videoData = {
    arjun_videos: arjunVideos,
    family_travel_videos: familyTravelVideos,
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="content-padding pb-24 pt-[calc(var(--topbar-height)+1.5rem)] sm:pt-[calc(var(--topbar-height)+2rem)]">
        <div className="mx-auto max-w-[var(--container-max)]">
          {error && (
            <div className="mb-6">
              <ErrorBanner error={error} />
            </div>
          )}

          <SectionReveal>
            <section className="space-y-4">
              <HeroSlideshow photos={slideshowPhotos ?? []} />
              <SyncPanel
                workspaceId={workspace?.id}
                totalPhotos={totalPhotos}
                totalAlbums={totalAlbums}
                totalVideos={totalVideos}
              />
            </section>
          </SectionReveal>

          <SectionReveal delay={0.04}>
            <section className="mt-10 sm:mt-12">
              <SectionHead eyebrow="Photo Albums" title="Browse by chapter" href="/photos" linkLabel="All photos" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {PHOTO_CHAPTERS.map((chapter) => {
                  const album: Album | null = allBuckets.find((a) => a.id === chapter.id) ?? null
                  const imageUrl = album?.thumbnail_url ? mediaUrl(album.thumbnail_url) : undefined
                  return (
                    <ChapterCard
                      key={chapter.id}
                      href={album ? `/albums/${album.id}` : '/photos'}
                      title={chapter.label}
                      eyebrow={chapter.eyebrow}
                      meta={album ? countLabel(album.photo_count, 'photo', 'photos') : chapter.subtitle}
                      description={chapter.description}
                      imageUrl={imageUrl}
                      imageAlt={chapter.label}
                      icon={chapter.icon}
                    />
                  )
                })}
              </div>
            </section>
          </SectionReveal>

          <SectionReveal delay={0.08}>
            <section className="mt-12 sm:mt-16">
              <SectionHead eyebrow="Video Collections" title="Stories in motion" href="/videos" linkLabel="All videos" />
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {VIDEO_COLLECTIONS.map((collection) => {
                  const query = videoData[collection.key]
                  const videos = query.data?.videos ?? []
                  return (
                    <VideoCollectionCard
                      key={collection.key}
                      title={collection.title}
                      eyebrow={collection.eyebrow}
                      description={collection.description}
                      href={collection.href}
                      count={query.data?.total ?? 0}
                      poster={posterFor(videos[0])}
                      loading={query.isLoading}
                    />
                  )
                })}
              </div>
            </section>
          </SectionReveal>

          {hasThrowbacks && (
            <SectionReveal delay={0.12}>
              <section className="mt-16 sm:mt-20">
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-eyebrow-gold">Moments That Stay</p>
                    <h2 className="mt-2 text-h2">On this day</h2>
                    <p className="mt-3 max-w-xl text-body text-muted-foreground">
                      A look back through the years from your photo library.
                    </p>
                  </div>
                  <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1.5 text-small">
                    <CalendarDays className="h-3.5 w-3.5 text-amber" />
                    {data!.throwbacks.length} {data!.throwbacks.length === 1 ? 'year' : 'years'}
                  </span>
                </div>

                <div className="space-y-12">
                  {data!.throwbacks.map((group, i) => (
                    <SectionReveal key={group.year} delay={i * 0.04}>
                      <div className="space-y-5">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2.5">
                            <ImageIcon className="h-3.5 w-3.5 shrink-0 text-amber" />
                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber">
                              {group.label}
                            </p>
                          </div>
                          <div className="h-px flex-1 bg-[linear-gradient(to_right,var(--border),transparent)]" />
                          <span className="text-[10px] tabular-nums text-muted-foreground/60">{group.year}</span>
                        </div>
                        <PhotoGrid photos={group.photos} />
                      </div>
                    </SectionReveal>
                  ))}
                </div>
              </section>
            </SectionReveal>
          )}
        </div>
      </div>
    </div>
  )
}
