import { cn } from '@/lib/utils'
import { TextLink } from './text-link'

interface TimelineEntryProps {
  /**
   * e.g. "December 25, 2025" or "2024". Optional: some real milestone data
   * only has a title and cover photo (no literal date field in the data
   * model) — omit rather than fabricate a date.
   */
  date?: string
  title: string
  description?: string
  imageUrl: string
  imageAlt: string
  supportingImages?: { url: string; alt: string }[]
  /** Alternates left/right composition across a scrolling timeline. */
  align?: 'left' | 'right'
  fullStoryHref?: string
  className?: string
}

/**
 * TimelineEntry — one chronological chapter in the Milestones editorial
 * timeline (PR 6): date/title left or right of a hero photograph, with
 * optional supporting photos and a "View the full story" link. A restrained
 * vertical rule (not a corporate stepper) can be layered around these by
 * the page that composes them.
 *
 * PR 1 ships this as a visual primitive only — real milestone data and
 * scroll-reveal wiring happen in PR 6.
 */
export function TimelineEntry({
  date,
  title,
  description,
  imageUrl,
  imageAlt,
  supportingImages,
  align = 'left',
  fullStoryHref,
  className,
}: TimelineEntryProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-12',
        align === 'right' && 'lg:flex-row-reverse',
        className,
      )}
    >
      <div className="space-y-2 lg:w-1/3">
        {date && <p className="text-small tracking-wide text-amber">{date}</p>}
        <h3 className="text-h3">{title}</h3>
        {description && <p className="text-body text-muted-foreground">{description}</p>}
        {fullStoryHref && <TextLink href={fullStoryHref}>View the full story</TextLink>}
      </div>
      <div className="lg:w-2/3">
        <div className="overflow-hidden rounded-2xl bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={imageAlt} className="w-full object-cover" loading="lazy" />
        </div>
        {supportingImages && supportingImages.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {supportingImages.map((img) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={img.url}
                src={img.url}
                alt={img.alt}
                loading="lazy"
                className="aspect-square w-full rounded-xl object-cover bg-muted"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
