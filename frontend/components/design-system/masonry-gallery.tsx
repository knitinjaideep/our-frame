import { Check, Film, Heart, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface MasonryGalleryItem {
  id: string
  /**
   * Cached thumbnail/poster URL. Pass `null`/`undefined` when no derivative
   * exists yet — the gallery then renders an honest processing tile rather
   * than a broken image or a full-size original download.
   */
  imageUrl: string | null
  alt: string
  /** Original width/height, used to preserve aspect ratio in the column flow. */
  width?: number | null
  height?: number | null
  /** Subtle caption shown on hover, e.g. "6th month" or an album/event name. */
  caption?: string
  /** Quiet secondary line shown on hover alongside the caption, e.g. "Jun 2019". */
  date?: string
  /** Current favorite state — renders a small heart affordance on hover when defined. */
  isFavorite?: boolean
  /** Favorite toggle handler. Receives the click event so it can stop propagation. */
  onToggleFavorite?: (event: React.MouseEvent) => void
  /** Renders a quiet play affordance so videos are distinguishable from stills. */
  isVideo?: boolean
  /** Label for the processing tile shown when `imageUrl` is absent. */
  statusLabel?: string
  onClick?: () => void
  /**
   * Bulk-selection state (Favorites page "Select" mode, PR 8). When
   * `onToggleSelect` is defined, a quiet selection mark renders in the
   * opposite corner from the favorite heart. The caller decides what the
   * tile's main `onClick` does while selection mode is active (toggle
   * selection vs. open the lightbox) — this primitive only renders the
   * affordance.
   */
  selected?: boolean
  onToggleSelect?: (event: React.MouseEvent) => void
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
      {items.map((item) => {
        const hasMeta = Boolean(item.caption || item.date)
        const knownRatio = Boolean(item.width && item.height)
        // No cached thumbnail/poster yet — never fall back to a full-size
        // preview here (that would download an original per grid tile);
        // show an honest processing tile instead.
        const pending = !item.imageUrl

        return (
          <div
            key={item.id}
            className="group relative mb-4 break-inside-avoid overflow-hidden rounded-xl bg-muted"
            style={knownRatio ? { aspectRatio: `${item.width} / ${item.height}` } : undefined}
          >
            <button
              type="button"
              onClick={item.onClick}
              className={cn(
                'block w-full text-left',
                // The wrapper clips overflow, so the global outlined focus
                // ring would be invisible here — use an inset ring instead.
                'focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--amber)]',
                knownRatio ? 'h-full' : undefined,
                pending && !knownRatio ? 'aspect-[4/5]' : undefined,
              )}
            >
              {pending ? (
                <span
                  className="flex h-full w-full flex-col items-center justify-center gap-2"
                  style={{
                    background:
                      'linear-gradient(135deg, oklch(0.11 0.012 48) 0%, oklch(0.08 0.006 46) 100%)',
                  }}
                >
                  <Film className="h-5 w-5 text-muted-foreground" aria-hidden />
                  <span className="text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
                    {item.statusLabel ?? 'Processing'}
                  </span>
                  <span className="sr-only">{item.alt}</span>
                </span>
              ) : (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl!}
                    alt={item.alt}
                    loading="lazy"
                    className={cn(
                      'w-full object-cover transition-transform duration-[var(--motion-slow)] ease-[var(--ease-standard)] group-hover:scale-[1.02]',
                      knownRatio ? 'h-full' : 'h-auto',
                    )}
                  />
                  {item.isVideo && (
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <span
                        className="flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-sm transition-transform duration-[var(--motion-standard)] group-hover:scale-110"
                        style={{
                          background: 'oklch(0.70 0.145 58 / 20%)',
                          border: '1px solid oklch(0.70 0.145 58 / 45%)',
                        }}
                      >
                        <Play
                          className="ml-[2px] h-4 w-4"
                          style={{ color: 'var(--amber)', fill: 'var(--amber)' }}
                          aria-hidden
                        />
                      </span>
                    </span>
                  )}
                </>
              )}

              {/* Subtle caption/date overlay — hover/focus only, no large scrim */}
              {hasMeta && (
                <span
                  className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-0.5 px-3 py-2.5 opacity-0 transition-opacity duration-[var(--motion-fast)] group-hover:opacity-100 group-focus-within:opacity-100"
                  style={{
                    background:
                      'linear-gradient(to top, oklch(0.04 0.004 48 / 78%) 0%, oklch(0.04 0.004 48 / 25%) 55%, transparent 100%)',
                  }}
                >
                  {item.caption && (
                    <span className="text-small font-medium text-white/90">{item.caption}</span>
                  )}
                  {item.date && <span className="text-[0.7rem] text-white/75">{item.date}</span>}
                </span>
              )}

              {!hasMeta && item.caption && <span className="sr-only">{item.caption}</span>}
            </button>

            {/* Favorite affordance — a real focusable button (sibling of the
                photo button, so it is keyboard-reachable and never nests
                interactive elements). Revealed on hover or keyboard focus. */}
            {item.onToggleFavorite && (
              <button
                type="button"
                aria-pressed={Boolean(item.isFavorite)}
                aria-label={
                  item.isFavorite
                    ? `Remove ${item.alt} from favorites`
                    : `Add ${item.alt} to favorites`
                }
                onClick={(e) => {
                  e.stopPropagation()
                  item.onToggleFavorite?.(e)
                }}
                className={cn(
                  'absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm transition-opacity duration-[var(--motion-fast)]',
                  'focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)]',
                  // On touch devices there's no hover to reveal this, so it
                  // stays visible below the `md` breakpoint (where the
                  // hamburger nav also takes over) — hover-reveal is kept
                  // for mouse/desktop to preserve the quiet-chrome intent.
                  item.isFavorite
                    ? 'opacity-100'
                    : 'opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100',
                )}
                style={{ background: 'oklch(0.04 0.004 48 / 55%)' }}
              >
                <Heart
                  className="h-3.5 w-3.5"
                  style={{
                    color: item.isFavorite ? 'var(--amber)' : 'oklch(1 0 0 / 80%)',
                    fill: item.isFavorite ? 'var(--amber)' : 'none',
                  }}
                  aria-hidden
                />
              </button>
            )}

            {/* Selection mark (Favorites "Select" mode, PR 8) — mirrors the
                favorite button's pattern in the opposite corner. */}
            {item.onToggleSelect && (
              <button
                type="button"
                aria-pressed={Boolean(item.selected)}
                aria-label={item.selected ? `Deselect ${item.alt}` : `Select ${item.alt}`}
                onClick={(e) => {
                  e.stopPropagation()
                  item.onToggleSelect?.(e)
                }}
                className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border backdrop-blur-sm transition-colors duration-[var(--motion-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)]"
                style={{
                  background: item.selected ? 'var(--amber)' : 'oklch(0.04 0.004 48 / 55%)',
                  borderColor: item.selected ? 'var(--amber)' : 'oklch(1 0 0 / 25%)',
                }}
              >
                {item.selected && <Check className="h-3.5 w-3.5" style={{ color: 'oklch(0.08 0.006 46)' }} aria-hidden />}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
