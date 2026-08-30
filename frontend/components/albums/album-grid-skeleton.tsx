export function AlbumGridSkeleton({
  count = 8,
  variant = 'default',
}: {
  count?: number
  /** Mirrors `AlbumGrid`'s `variant` so the loading skeleton has the same
   *  column count as the grid it precedes — no layout shift. */
  variant?: 'default' | 'category'
}) {
  const gridClass =
    variant === 'category'
      ? 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'
      : 'grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4'
  return (
    <div className={gridClass}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-[1.25rem]">
          <div className="aspect-[4/3] skeleton-shimmer rounded-[1.25rem]" />
        </div>
      ))}
    </div>
  )
}
