import { cn } from '@/lib/utils'
import { EditorialEyebrow } from './editorial-eyebrow'

interface PageIntroProps {
  eyebrow?: string
  /** Large serif page title, e.g. "Photos", "Travel", "Milestones". */
  title: string
  /** One or two sentences of supporting copy. */
  description?: string
  /** Quiet secondary action, e.g. "View all photos →". */
  action?: React.ReactNode
  className?: string
}

/**
 * PageIntro — the top-of-page editorial header used across interior pages:
 * eyebrow + serif H1 + supporting copy + optional quiet action, with
 * generous vertical spacing below the nav.
 *
 * Usage:
 *   <PageIntro eyebrow="OUR STORY IN FRAMES" title="Photos"
 *     description="Four chapters. Every frame we have captured together."
 *     action={<TextLink href="/photos/all">View all photos</TextLink>} />
 */
export function PageIntro({ eyebrow, title, description, action, className }: PageIntroProps) {
  return (
    <div className={cn('flex flex-col gap-4 md:flex-row md:items-end md:justify-between', className)}>
      <div className="max-w-2xl space-y-4">
        {eyebrow && <EditorialEyebrow>{eyebrow}</EditorialEyebrow>}
        <h1 className="text-h1">{title}</h1>
        {description && <p className="text-body max-w-xl text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
