export function AlbumGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="aspect-[4/3] skeleton-shimmer" />
          <div className="p-4 space-y-2">
            <div className="h-4 w-2/3 rounded skeleton-shimmer" />
            <div className="h-3 w-1/3 rounded skeleton-shimmer" />
          </div>
        </div>
      ))}
    </div>
  )
}
