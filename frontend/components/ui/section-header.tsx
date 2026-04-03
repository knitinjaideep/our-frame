import { cn } from '@/lib/utils'

interface SectionHeaderProps {
  /** Main section title */
  title: string
  /** Small label shown above the title (optional) */
  eyebrow?: string
  /** Right-side action slot (button, link, etc.) */
  action?: React.ReactNode
  /** Sub-label or count shown below the title */
  subtitle?: string
  className?: string
}

/**
 * SectionHeader — Warm Memory Book editorial section label.
 *
 * Usage:
 *   <SectionHeader title="Albums" eyebrow="Your Collection" action={<RefreshButton />} />
 *   <SectionHeader title="On This Day" subtitle="3 years ago" />
 */
export function SectionHeader({
  title,
  eyebrow,
  action,
  subtitle,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('flex items-end justify-between gap-4', className)}>
      <div className="space-y-1">
        {eyebrow && (
          <p className="text-eyebrow" style={{ color: 'var(--amber)' }}>
            {eyebrow}
          </p>
        )}
        <h2 className="text-section-heading">{title}</h2>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {action && (
        <div className="shrink-0 pb-0.5">{action}</div>
      )}
    </div>
  )
}

/**
 * PageHeader — Top-of-page hero header with optional icon and description.
 *
 * Usage:
 *   <PageHeader title="Albums" description="Your Google Drive folders" icon={<Images />} />
 */
interface PageHeaderProps {
  title: string
  description?: string
  icon?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, icon, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-start gap-4', className)}>
      {icon && (
        <div
          className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: 'var(--amber-muted)' }}
        >
          <span style={{ color: 'var(--amber)' }}>{icon}</span>
        </div>
      )}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  )
}
