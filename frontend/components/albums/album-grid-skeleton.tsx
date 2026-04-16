export function AlbumGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-[1.25rem]">
          <div className="aspect-[4/3] skeleton-shimmer rounded-[1.25rem]" />
        </div>
      ))}
    </div>
  )
}
