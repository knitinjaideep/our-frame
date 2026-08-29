import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EditorialEyebrow } from './editorial-eyebrow'

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
}: ChapterCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        'card-lift group relative block overflow-hidden rounded-2xl border border-border bg-card',
        className,
      )}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted sm:aspect-[4/3]">
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
        {/* Gentle overlay for text legibility only — never a strong filter */}
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-[var(--motion-standard)] group-hover:opacity-90"
          style={{
            background: 'linear-gradient(to top, oklch(0.05 0.006 46 / 82%) 0%, oklch(0.05 0.006 46 / 15%) 55%, transparent 100%)',
          }}
        />
        <div className="absolute inset-x-0 bottom-0 p-5">
          {icon && <span className="mb-2 inline-flex text-amber">{icon}</span>}
          {eyebrow && <EditorialEyebrow className="mb-1">{eyebrow}</EditorialEyebrow>}
          <h3 className="font-serif text-2xl italic font-medium text-foreground">{title}</h3>
          <div className="mt-1 flex items-center gap-2">
            {meta && <span className="text-small">{meta}</span>}
          </div>
          {description && (
            <p className="mt-1.5 text-small text-muted-foreground/90 max-w-[26rem]">{description}</p>
          )}
        </div>
        <ArrowUpRight className="absolute right-4 top-4 h-4 w-4 text-foreground/70 opacity-0 transition-all duration-[var(--motion-fast)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
      </div>
    </Link>
  )
}
