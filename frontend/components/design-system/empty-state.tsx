import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

/**
 * EmptyState — centered editorial empty state. Extracted from the pattern
 * already used in `app/favorites/page.tsx` / `app/memories/page.tsx` so
 * later PRs (8, 9) can reuse one component instead of re-inlining markup.
 *
 * Per the redesign brief, empty states should never be one giant blank
 * rectangle — pair this with a secondary "keep the page alive" section
 * (e.g. "Recently captured") at the call site.
 */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-20 text-center',
        className,
      )}
    >
      <div
        className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ backgroundColor: 'var(--amber-muted)' }}
      >
        <span style={{ color: 'var(--amber)' }}>{icon}</span>
      </div>
      <p className="text-h3">{title}</p>
      {description && (
        <p className="mt-2 max-w-xs text-body text-muted-foreground leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
