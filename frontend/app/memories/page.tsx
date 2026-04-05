'use client'
import { useHomeFeed } from '@/hooks/use-home-feed'
import { PhotoGrid } from '@/components/photos/photo-grid'
import { PhotoGridSkeleton } from '@/components/photos/photo-grid-skeleton'
import { PageHeader } from '@/components/ui/section-header'
import { Clock, Sparkles } from 'lucide-react'

export default function MemoriesPage() {
  const { data, isLoading } = useHomeFeed()
  const throwbacks = data?.throwbacks ?? []

  return (
    <div className="content-padding py-8 space-y-10 pb-16 max-w-7xl">
      <PageHeader
        title="Moments That Stay"
        description="Photos from this day in past years"
        icon={<Sparkles className="h-5 w-5" />}
      />

      {isLoading && <PhotoGridSkeleton count={6} />}

      {!isLoading && throwbacks.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-card py-24 text-center shadow-warm">
          <div
            className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ backgroundColor: 'var(--amber-muted)' }}
          >
            <Sparkles className="h-7 w-7" style={{ color: 'var(--amber)' }} />
          </div>
          <p className="text-lg font-semibold text-foreground">No throwbacks today</p>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground leading-relaxed">
            As your library grows, memories from this day in past years will surface here.
          </p>
        </div>
      )}

      {throwbacks.map((group) => (
        <section key={group.year} className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--amber)' }} />
            <p className="text-sm font-semibold tracking-wide" style={{ color: 'var(--amber)' }}>
              {group.label}
            </p>
            <div className="flex-1 border-t border-border" />
          </div>
          <PhotoGrid photos={group.photos} />
        </section>
      ))}
    </div>
  )
}
