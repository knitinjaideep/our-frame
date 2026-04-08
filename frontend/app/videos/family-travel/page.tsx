'use client'
import { motion } from 'framer-motion'
import { useVideoFiles } from '@/hooks/use-video-files'
import { PhotoGrid } from '@/components/photos/photo-grid'
import { PhotoGridSkeleton } from '@/components/photos/photo-grid-skeleton'

export default function VideosFamilyTravelPage() {
  const { data, isLoading, error } = useVideoFiles('family_travel_videos')

  return (
    <div className="min-h-screen">
      <div
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(to bottom, oklch(0.155 0.012 48) 0%, var(--background) 100%)',
          paddingTop: '3rem',
          paddingBottom: '4rem',
        }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 60% 0%, oklch(0.65 0.130 200 / 8%) 0%, transparent 65%)' }}
          aria-hidden="true"
        />
        <motion.div
          className="relative content-padding max-w-4xl"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-eyebrow mb-4" style={{ color: 'var(--amber)' }}>On the Road</p>
          <h1
            className="font-serif leading-[0.92] text-foreground"
            style={{ fontSize: 'clamp(3rem, 7vw, 6rem)', fontStyle: 'italic', fontWeight: 600, letterSpacing: '-0.015em' }}
          >
            Family Travel
          </h1>
          <p className="mt-4 max-w-md font-sans text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
            Places we have been. Moments that moved us.
          </p>
          {!isLoading && (data?.total ?? 0) > 0 && (
            <p className="mt-5 font-sans text-xs font-medium tracking-[0.16em] uppercase" style={{ color: 'var(--muted-foreground)', opacity: 0.6 }}>
              {data!.total} {data!.total === 1 ? 'video' : 'videos'}
            </p>
          )}
        </motion.div>
      </div>

      <div className="content-padding" aria-hidden="true">
        <div className="h-px" style={{ background: 'var(--border)' }} />
      </div>

      <div className="content-padding py-10 pb-24">
        {error && (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-5 py-4 text-sm text-destructive mb-8">
            Could not load videos.
          </div>
        )}
        {isLoading ? (
          <PhotoGridSkeleton count={12} />
        ) : (data?.videos.length ?? 0) === 0 && !error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <p className="max-w-sm font-sans text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
              No videos found. Add videos to a Family Travel folder inside Videos in Google Drive.
            </p>
          </div>
        ) : (
          <PhotoGrid photos={data?.videos ?? []} />
        )}
      </div>
    </div>
  )
}
