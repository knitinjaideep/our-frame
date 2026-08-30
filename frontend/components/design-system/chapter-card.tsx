import Link from 'next/link'
import { ArrowUpRight, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EditorialEyebrow } from './editorial-eyebrow'

/**
 * Cover-tile aspect ratio for the 'cover' variant, exported so the Photos
 * overview skeleton renders the exact same shape as the loaded cards (no
 * layout shift, and no second copy of this string to drift).
 *
 * Every 'cover' tile uses this single ratio — per
 * docs/OUR-FRAME-DESIGN-SYSTEM.md's Photos Overview rules, all four
 * category cards must share identical width/height/aspect ratio/radius/
 * padding/text placement. There is no per-card size variant any more (see
 * git history prior to redesign-v2 PR 4 for the removed asymmetric
 * lg/md mosaic).
 *
 * 4:3 is measured from board 2 itself (its desktop cards are 381x283px,
 * i.e. 1.346) and is one of the two ratios PR 4's brief names. It is also
 * held across every breakpoint, because `MILESTONES.md` PR 4 requires
 * "mobile single column, same ratio preserved" — an earlier
 * `aspect-[4/5] sm:aspect-[16/10] lg:aspect-[16/11]` chain used three
 * different ratios and made mobile cards portrait/taller than the phone
 * viewport is worth.
 */
export const CHAPTER_COVER_ASPECT = 'aspect-[4/3]'

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
   * grid. Every 'cover' card is now identical (no size variant).
   * 'rail' — compact translucent glass tile used by the Home hero's
   * floating chapter rail: icon + title + subtitle in a slim row.
   */
  variant?: 'cover' | 'rail'
}

/**
 * ChapterCard — the editorial "chapter" tile reused by the Home floating
 * chapter rail and the Photos overview uniform 2x2 folder grid: Arjun,
 * Travel, Milestones, Life.
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
          CHAPTER_COVER_ASPECT,
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
            Every 'cover' tile uses the same scrim now that all four
            category cards are identical (no more lg/md distinction). */}
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-[var(--motion-standard)] group-hover:opacity-90"
          style={{
            background:
              'linear-gradient(to top, oklch(0.05 0.006 46 / 84%) 0%, oklch(0.05 0.006 46 / 34%) 42%, transparent 78%)',
          }}
        />
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7">
          {icon && <span className="mb-2 inline-flex text-amber">{icon}</span>}
          {eyebrow && <EditorialEyebrow className="mb-1.5">{eyebrow}</EditorialEyebrow>}
          <h3 className="font-serif italic font-medium text-foreground text-3xl sm:text-4xl">
            {title}
          </h3>
          {description && (
            // The description slot is a fixed two-line box (2 x 13px x 1.5
            // line-height = 2.4375rem) and clamps at two lines. Without a
            // reserved height, a description that wraps on a narrow card
            // pushes that card's eyebrow/title higher than its neighbours'
            // — measured at 375px and 768px, Milestones' single-line copy
            // sat 20px lower than the other three — which breaks the
            // "identical text placement" rule these four cards exist to
            // satisfy.
            <p className="mt-1.5 line-clamp-2 min-h-[2.4375rem] max-w-[26rem] text-small text-muted-foreground/90">
              {description}
            </p>
          )}
          {meta && (
            <div className="mt-1.5 flex items-center gap-1.5 text-small text-muted-foreground/85">
              <span>{meta}</span>
              <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
          )}
        </div>
        {/* Keyboard parity: the arrow affordance must also appear on focus,
            not only on hover. */}
        <ArrowUpRight className="absolute right-4 top-4 h-4 w-4 text-foreground/70 opacity-0 transition-all duration-[var(--motion-fast)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100 group-focus-visible:translate-x-0.5 group-focus-visible:-translate-y-0.5 group-focus-visible:opacity-100" />
      </div>
    </Link>
  )
}
