'use client'
import Link from 'next/link'
import { ArrowRight, Clock, Play } from 'lucide-react'
import { useHomeFeed } from '@/hooks/use-home-feed'
import { useRootBuckets } from '@/hooks/use-root-buckets'
import { useSlideshow } from '@/hooks/use-slideshow'
import { HeroSlideshow } from '@/components/home/hero-slideshow'
import { PhotoGrid } from '@/components/photos/photo-grid'
import { AlbumGridSkeleton } from '@/components/albums/album-grid-skeleton'
import { BucketCard } from '@/components/buckets/bucket-card'
import { SectionReveal } from '@/components/ui/section-reveal'
import { BUCKETS } from '@/lib/buckets'

/* ── Section divider ── */
function Divider() {
  return (
    <div className="content-padding my-20" aria-hidden="true">
      <div
        className="h-px"
        style={{
          background:
            'linear-gradient(to right, transparent, var(--border) 20%, var(--border) 80%, transparent)',
        }}
      />
    </div>
  )
}

/* ── Editorial section header ── */
function SectionHead({
  eyebrow,
  title,
  href,
  linkLabel = 'View all',
}: {
  eyebrow: string
  title: string
  href: string
  linkLabel?: string
}) {
  return (
    <div className="flex items-end justify-between mb-10">
      <div className="space-y-1.5">
        <p className="text-eyebrow-gold">{eyebrow}</p>
        <h2
          className="font-serif leading-[0.95]"
          style={{
            fontSize: 'clamp(1.7rem, 3.2vw, 2.5rem)',
            fontStyle: 'italic',
            fontWeight: 500,
            color: 'var(--foreground)',
          }}
        >
          {title}
        </h2>
      </div>
      <Link
        href={href}
        className="flex items-center gap-1.5 text-xs font-medium tracking-[0.12em] uppercase transition-colors hover:text-foreground shrink-0"
        style={{ color: 'var(--muted-foreground)' }}
      >
        {linkLabel}
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  )
}

export default function HomePage() {
  const { data, error } = useHomeFeed()
  const { data: slideshowPhotos } = useSlideshow()
  const { data: bucketsData, isLoading: bucketsLoading } = useRootBuckets()

  const hasThrowbacks = (data?.throwbacks ?? []).length > 0

  // Merge Drive data (name, thumbnail) with per-bucket display metadata
  const allBuckets = bucketsData?.albums ?? []
  const buckets = BUCKETS.map(meta => ({
    ...meta,
    album: allBuckets.find(a => a.id === meta.id) ?? null,
  }))
  const hasBuckets = !bucketsLoading && buckets.some(b => b.album !== null)

  return (
    <div>
      {/* ── 1. Hero ── */}
      <HeroSlideshow
        photos={slideshowPhotos ?? []}
        familyName="Kotcherlakota"
      />

      {/* ── Below-fold ── */}
      <div className="pt-28 pb-48">

        {/* Auth / error banner */}
        {error && (
          <div className="content-padding mb-16">
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
                  <button
                    onClick={() => window.location.reload()}
                    className="underline underline-offset-2"
                  >
                    Try again
                  </button>
                )}
              </p>
            </div>
          </div>
        )}

        {/* ── 2. Photo buckets from Drive ── */}
        {(hasBuckets || bucketsLoading) && (
          <SectionReveal>
            <section className="content-padding">
              <SectionHead
                eyebrow="Our Story in Frames"
                title="Photos"
                href="/photos"
                linkLabel="Browse all"
              />
              {bucketsLoading ? (
                <AlbumGridSkeleton count={4} />
              ) : (
                <div className="worlds-grid">
                  {buckets.map((bucket, i) => (
                    <BucketCard key={bucket.id} {...bucket} index={i} />
                  ))}
                </div>
              )}
            </section>
          </SectionReveal>
        )}

        <Divider />

        {/* ── 6. Stories in Motion — Videos ── */}
        <SectionReveal delay={0.04}>
          <section className="content-padding">
            <SectionHead
              eyebrow="Stories in Motion"
              title="Family Films"
              href="/videos"
              linkLabel="All videos"
            />
            {/* Video tiles — cinematic placeholder cards when no videos are present */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
              {[
                { label: 'Arjun',           eyebrow: 'Growing Up',   href: '/videos/arjun'          },
                { label: 'Family Travel',   eyebrow: 'On the Road',  href: '/videos/family-travel'  },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group relative flex flex-col justify-end overflow-hidden rounded-2xl"
                  style={{
                    aspectRatio: '16 / 9',
                    background: 'linear-gradient(145deg, oklch(0.14 0.015 50) 0%, oklch(0.09 0.008 46) 100%)',
                    border: '1px solid oklch(1 0 0 / 7%)',
                    transition: 'border-color 0.3s ease, box-shadow 0.4s ease',
                    boxShadow: '0 2px 12px oklch(0 0 0 / 30%)',
                  }}
                >
                  {/* Ambient gold glow on hover */}
                  <div
                    className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100"
                    style={{
                      transition: 'opacity 0.4s ease',
                      background: 'radial-gradient(ellipse 70% 60% at 50% 100%, oklch(0.70 0.145 58 / 18%) 0%, transparent 70%)',
                    }}
                  />
                  {/* Gold shimmer border on hover */}
                  <div
                    className="absolute inset-0 pointer-events-none rounded-2xl opacity-0 group-hover:opacity-100"
                    style={{
                      transition: 'opacity 0.35s ease',
                      boxShadow: '0 0 0 1px oklch(0.70 0.145 58 / 28%), 0 8px 32px oklch(0 0 0 / 40%)',
                    }}
                  />
                  {/* Play button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-full backdrop-blur-sm transition-all duration-300 group-hover:scale-110"
                      style={{
                        background: 'oklch(0.70 0.145 58 / 14%)',
                        border: '1px solid oklch(0.70 0.145 58 / 30%)',
                        boxShadow: '0 0 24px oklch(0.70 0.145 58 / 20%)',
                      }}
                    >
                      <Play
                        className="h-5 w-5"
                        style={{ color: 'var(--amber)', fill: 'var(--amber)', marginLeft: '2px' }}
                      />
                    </div>
                  </div>
                  {/* Bottom label */}
                  <div
                    className="relative z-10 p-5"
                    style={{
                      background: 'linear-gradient(to top, oklch(0.06 0.006 48 / 85%) 0%, transparent 100%)',
                    }}
                  >
                    <p className="text-eyebrow-gold mb-1">{item.eyebrow}</p>
                    <p
                      className="font-serif font-medium"
                      style={{ fontSize: '1.05rem', fontStyle: 'italic', color: 'oklch(0.97 0.010 72)' }}
                    >
                      {item.label}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </SectionReveal>

        <Divider />

        {/* ── 7. Memories — On This Day ── */}
        {hasThrowbacks && (
          <SectionReveal delay={0.05}>
            <section className="content-padding">
              <div className="space-y-2 mb-14">
                <p className="text-eyebrow-gold">Moments That Stay</p>
                <h2
                  className="font-serif leading-[0.95]"
                  style={{
                    fontSize: 'clamp(2rem, 4vw, 3rem)',
                    fontStyle: 'italic',
                    fontWeight: 500,
                    color: 'var(--foreground)',
                  }}
                >
                  On This Day
                </h2>
                <p className="font-sans text-sm" style={{ color: 'var(--muted-foreground)', maxWidth: '32rem' }}>
                  A look back through the years — moments that happened on this day.
                </p>
              </div>

              <div className="space-y-20">
                {data!.throwbacks.map((group, i) => (
                  <SectionReveal key={group.year} delay={i * 0.06}>
                    <div className="space-y-8">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2.5">
                          <Clock className="h-3 w-3 shrink-0" style={{ color: 'var(--amber)', opacity: 0.7 }} />
                          <p
                            className="font-sans text-[11px] font-semibold tracking-[0.22em] uppercase"
                            style={{ color: 'var(--amber)' }}
                          >
                            {group.label}
                          </p>
                        </div>
                        <div
                          className="flex-1 h-px"
                          style={{ background: 'linear-gradient(to right, var(--border), transparent)' }}
                          aria-hidden="true"
                        />
                        <span
                          className="font-sans text-[10px] tabular-nums"
                          style={{ color: 'var(--muted-foreground)', opacity: 0.45 }}
                        >
                          {group.year}
                        </span>
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
  )
}
