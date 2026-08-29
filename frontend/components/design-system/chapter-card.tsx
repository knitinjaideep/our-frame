import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EditorialEyebrow } from './editorial-eyebrow'

/**
 * Cover-tile aspect ratios per mosaic size, exported so the Photos overview
 * skeleton renders the exact same shapes as the loaded cards (no layout
 * shift, and no second copy of these strings to drift).
 *
 * The `lg` tile must stay both wider AND taller than `md` at the breakpoint
 * where the mosaic actually becomes multi-column (`lg:`), otherwise a
 * narrower-but-portrait tile ends up visually heavier than the "dominant"
 * one. Below `lg:` the mosaic is a single column, so both sizes use the same
 * landscape ratio — a portrait ratio at full tablet width produces a card
 * taller than the viewport.
 */
export const CHAPTER_COVER_ASPECT = {
  lg: 'aspect-[4/5] sm:aspect-[16/10] lg:aspect-[16/11]',
  md: 'aspect-[4/5] sm:aspect-[16/10] lg:aspect-[4/3]',
} as const

interface ChapterCardProps {
  href: string
  /** Small uppercase label, e.g. "GROWING UP, FRAME BY FRAME". */
  eyebrow?: string
  /** Large serif title, e.g. "Arjun". */
  title: string
  /** e.g. "655 photos". */
  meta?: string
  /** One short poetic description, e.g. "Every milestone, every laugh." */
  description?: string
  /** Cover photograph URL — the chapter photography is the primary visual. */
  imageUrl?: string | null
  imageAlt?: string
  /** Optional line icon shown alongside the label (used on the Home rail). */
  icon?: React.ReactNode
  className?: string
  /**
   * 'cover' (default) — large photo-led tile used by the Photos overview
   * mosaic (PR 3).
   * 'rail' — compact translucent glass tile used by the Home hero's
   * floating chapter rail (PR 2): icon + title + subtitle in a slim row.
   */
  variant?: 'cover' | 'rail'
  /**
   * Only applies to the 'cover' variant. Lets the Photos overview mosaic
   * (PR 3) make one or two chapters visually dominant instead of four
   * identical tiles — 'lg' (default) is a taller, larger-type tile; 'md' is
   * a shorter, quieter tile.
   */
  size?: 'lg' | 'md'
}

/**
 * ChapterCard — the editorial "chapter" tile reused by the Home floating
 * chapter rail (PR 2) and the Photos overview mosaic (PR 3): Arjun, Travel,
 * Milestones, Life.
 *
 * Photography is the dominant visual; the card itself stays quiet (thin
 * border, restrained radius, no heavy shadow, a few-px hover lift).
 */
export function ChapterCard({
  href,
  eyebrow,
  title,
  meta,
  description,
  imageUrl,
  imageAlt,
  icon,
  className,
  variant = 'cover',
  size = 'lg',
}: ChapterCardProps) {
  if (variant === 'rail') {
    return (
      <Link
        href={href}
        className={cn(
          // `border-amber-border` is not a Tailwind token in this project
          // (only the plain `.border-amber` CSS class exists), so the hover
          // border must reference the CSS variable directly.
          'card-lift group relative flex items-center gap-3 overflow-hidden rounded-xl border border-white/10 bg-card/60 px-4 py-3.5 backdrop-blur-md transition-colors duration-[var(--motion-standard)] hover:border-[var(--amber-border)] hover:bg-card/75',
          className,
        )}
      >
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover opacity-[0.16] transition-opacity duration-[var(--motion-slow)] group-hover:opacity-25"
            loading="lazy"
          />
        )}
        {icon && (
          <span className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-muted text-amber">
            {icon}
          </span>
        )}
        <div className="relative z-10 min-w-0 flex-1">
          <h3 className="truncate font-serif text-base italic font-medium text-foreground">{title}</h3>
          {(description ?? eyebrow) && (
            <p className="truncate text-small text-muted-foreground/85">{description ?? eyebrow}</p>
          )}
        </div>
        <ArrowUpRight className="relative z-10 h-3.5 w-3.5 shrink-0 text-foreground/50 opacity-0 transition-all duration-[var(--motion-fast)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100 group-focus-visible:-translate-y-0.5 group-focus-visible:translate-x-0.5 group-focus-visible:opacity-100" />
      </Link>
    )
  }

  return (
    <Link
      href={href}
      className={cn(
        'card-lift group relative block overflow-hidden rounded-2xl border border-border bg-card',
        className,
      )}
    >
      <div
        className={cn(
          'relative w-full overflow-hidden bg-muted',
          CHAPTER_COVER_ASPECT[size],
        )}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={imageAlt ?? title}
            className="h-full w-full object-cover transition-transform duration-[var(--motion-slow)] ease-[var(--ease-standard)] group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            {icon && <span className="text-muted-foreground/50">{icon}</span>}
          </div>
        )}
        {/* Gentle overlay for text legibility only — never a strong filter.
            The `lg` tile carries a taller text block (bigger serif title +
            description), so its scrim reaches a little higher; the top half
            of the photograph stays untouched in both sizes. */}
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-[var(--motion-standard)] group-hover:opacity-90"
          style={{
            background:
              size === 'lg'
                ? 'linear-gradient(to top, oklch(0.05 0.006 46 / 84%) 0%, oklch(0.05 0.006 46 / 34%) 42%, transparent 78%)'
                : 'linear-gradient(to top, oklch(0.05 0.006 46 / 82%) 0%, oklch(0.05 0.006 46 / 15%) 55%, transparent 100%)',
          }}
        />
        <div className={cn('absolute inset-x-0 bottom-0', size === 'lg' ? 'p-6 sm:p-7' : 'p-5')}>
          {icon && <span className="mb-2 inline-flex text-amber">{icon}</span>}
          {eyebrow && <EditorialEyebrow className="mb-1.5">{eyebrow}</EditorialEyebrow>}
          <h3
            className={cn(
              'font-serif italic font-medium text-foreground',
              size === 'lg' ? 'text-3xl sm:text-4xl' : 'text-2xl',
            )}
          >
            {title}
          </h3>
          <div className="mt-1.5 flex items-center gap-2">
            {meta && <span className="text-small">{meta}</span>}
          </div>
          {description && (
            <p className="mt-1.5 text-small text-muted-foreground/90 max-w-[26rem]">{description}</p>
          )}
        </div>
        {/* Keyboard parity: the arrow affordance must also appear on focus,
            not only on hover. */}
        <ArrowUpRight className="absolute right-4 top-4 h-4 w-4 text-foreground/70 opacity-0 transition-all duration-[var(--motion-fast)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100 group-focus-visible:translate-x-0.5 group-focus-visible:-translate-y-0.5 group-focus-visible:opacity-100" />
      </div>
    </Link>
  )
}
