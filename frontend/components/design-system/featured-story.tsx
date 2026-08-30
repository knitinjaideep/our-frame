import { cn } from '@/lib/utils'
import { EditorialEyebrow } from './editorial-eyebrow'

interface FeaturedStoryProps {
  eyebrow?: string
  /** Large candid photograph or cinematic story image. */
  imageUrl: string
  imageAlt: string
  /** Short editorial statement, e.g. "The little things were the big things." */
  statement: string
  /** Optional supporting copy underneath the statement. */
  description?: string
  action?: React.ReactNode
  /** 'image-first' stacks photo above text (default); 'side-by-side' pairs them on desktop. */
  layout?: 'image-first' | 'side-by-side'
  className?: string
}

/**
 * FeaturedStory — large single photograph paired with a short editorial
 * statement. Used to open the Life page (PR 6) and Travel's "Featured
 * Journey" (PR 6). PR 1 ships this as a visual primitive only; real content
 * and story data are wired up in later PRs.
 */
export function FeaturedStory({
  eyebrow,
  imageUrl,
  imageAlt,
  statement,
  description,
  action,
  layout = 'image-first',
  className,
}: FeaturedStoryProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-6',
        layout === 'side-by-side' && 'lg:flex-row lg:items-center lg:gap-12',
        className,
      )}
    >
      <div className={cn('overflow-hidden rounded-2xl bg-muted', layout === 'side-by-side' ? 'lg:w-3/5' : 'w-full')}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={imageAlt} className="aspect-[4/3] w-full object-cover lg:aspect-[16/10]" loading="lazy" />
      </div>
      <div className={cn('space-y-3', layout === 'side-by-side' && 'lg:w-2/5')}>
        {eyebrow && <EditorialEyebrow>{eyebrow}</EditorialEyebrow>}
        <p className="font-serif text-2xl italic font-medium text-foreground sm:text-3xl">{statement}</p>
        {description && <p className="text-body text-muted-foreground max-w-md">{description}</p>}
        {action && <div className="pt-1">{action}</div>}
      </div>
    </div>
  )
}
