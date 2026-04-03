'use client'
import { useHomeFeed } from '@/hooks/use-home-feed'
import { useFavorites } from '@/hooks/use-favorites'
import { HeroSlideshow } from '@/components/home/hero-slideshow'
import { AlbumGrid } from '@/components/albums/album-grid'
import { AlbumGridSkeleton } from '@/components/albums/album-grid-skeleton'
import { MemoryStrip } from '@/components/home/memory-strip'
import { FavoritesStrip } from '@/components/home/favorites-strip'
import { PhotoGrid } from '@/components/photos/photo-grid'
import { SectionHeader } from '@/components/ui/section-header'
import { Clock } from 'lucide-react'

export default function HomePage() {
  const { data, isLoading, error } = useHomeFeed()
  const { data: favData } = useFavorites()

  const hasFavorites = (favData?.total ?? 0) > 0
  const hasThrowbacks = (data?.throwbacks ?? []).length > 0

  return (
    <div>
      {/* ── Hero — full-bleed, touches sidebar edge ── */}
      <HeroSlideshow
        photos={data?.hero_photos ?? []}
        familyName="Kotcherlakota"
      />

      {/* ── Padded content below the fold ── */}
      <div className="mx-auto max-w-7xl px-5 py-12 md:px-10 lg:px-14 space-y-16 pb-24">

        {/* ── Auth / error banner ── */}
        {error && (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-5 py-4">
            <p className="text-sm text-destructive">
              Could not load your memories.{' '}
              {(error as Error).message?.includes('auth') ? (
                <a
                  href={`${process.env.NEXT_PUBLIC_API_BASE}/auth/start`}
                  className="underline underline-offset-2"
                >
                  Sign in with Google
                </a>
              ) : (
                <button onClick={() => window.location.reload()} className="underline underline-offset-2">
                  Try again
                </button>
              )}
            </p>
          </div>
        )}

        {/* ── Memory strip — slim stats bar ── */}
        {data?.stats && <MemoryStrip stats={data.stats} />}

        {/* ── Featured Albums ── */}
        <section className="space-y-6">
          <SectionHeader
            title="Albums"
            eyebrow="Your Collection"
          />
          {isLoading ? (
            <AlbumGridSkeleton count={8} />
          ) : (
            <AlbumGrid albums={data?.featured_albums ?? []} />
          )}
        </section>

        {/* ── Favorites — only renders if there are any ── */}
        {hasFavorites && (
          <FavoritesStrip favorites={favData!.favorites} />
        )}

        {/* ── On This Day ── */}
        {hasThrowbacks && (
          <section className="space-y-8">
            <SectionHeader
              title="On This Day"
              eyebrow="From the Archives"
              subtitle="A look back through the years"
            />
            <div className="space-y-10">
              {data!.throwbacks.map((group) => (
                <div key={group.year} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--amber)' }} />
                    <p
                      className="text-sm font-semibold tracking-wide"
                      style={{ color: 'var(--amber)' }}
                    >
                      {group.label}
                    </p>
                    <div className="flex-1 border-t border-border" />
                  </div>
                  <PhotoGrid photos={group.photos} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
