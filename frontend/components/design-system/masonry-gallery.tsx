import { cn } from '@/lib/utils'

export interface MasonryGalleryItem {
  id: string
  imageUrl: string
  alt: string
  /** Original width/height, used to preserve aspect ratio in the column flow. */
  width?: number | null
  height?: number | null
  caption?: string
  onClick?: () => void
}

interface MasonryGalleryProps {
  items: MasonryGalleryItem[]
  /**
   * Named density preset. Tailwind requires literal class names to appear
   * in source for its scanner, so presets are static class strings rather
   * than a dynamically-templated breakpoint map.
   */
  density?: 'default' | 'tight'
  className?: string
}

const DENSITY_CLASSES: Record<NonNullable<MasonryGalleryProps['density']>, string> = {
  // 2 cols mobile -> 3 tablet -> 4 desktop
  default: 'columns-2 sm:columns-2 md:columns-3 lg:columns-4',
  // slightly denser rhythm for candid/relaxed galleries (e.g. Life, PR 6)
  tight: 'columns-2 sm:columns-3 md:columns-4 lg:columns-5',
}

/**
 * MasonryGallery — CSS-columns based masonry primitive for curated,
 * mixed-aspect-ratio photo galleries (Arjun/Travel/Milestones/Life in PR
 * 4/6). Real image proportions are preserved (no forced square crop);
 * gutters stay generous and consistent.
 *
 * PR 1 ships this as a visual primitive with a stable prop contract; later
 * PRs wire it up with real album data and open `PhotoLightbox` on click.
 */
export function MasonryGallery({
  items,
  density = 'default',
  className,
}: MasonryGalleryProps) {
  if (items.length === 0) return null

  return (
    <div className={cn(DENSITY_CLASSES[density], 'gap-4 [column-fill:balance]', className)}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={item.onClick}
          className="group mb-4 block w-full break-inside-avoid overflow-hidden rounded-xl bg-muted text-left transition-transform duration-[var(--motion-standard)] ease-[var(--ease-standard)]"
          style={
            item.width && item.height
              ? { aspectRatio: `${item.width} / ${item.height}` }
              : undefined
          }
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.imageUrl}
            alt={item.alt}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-[var(--motion-slow)] ease-[var(--ease-standard)] group-hover:scale-[1.02]"
          />
          {item.caption && (
            <span className="sr-only">{item.caption}</span>
          )}
        </button>
      ))}
    </div>
  )
}
