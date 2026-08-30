import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TextLinkProps {
  href: string
  children: React.ReactNode
  /** Show the trailing arrow (default true) — the "tertiary button" pattern. */
  showArrow?: boolean
  className?: string
  onClick?: () => void
}

/**
 * TextLink — the "tertiary button" from the design system: plain text +
 * arrow, no background, no border. Used for quiet secondary actions like
 * "View all photos →" or "View journey →".
 */
export function TextLink({ href, children, showArrow = true, className, onClick }: TextLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'group/textlink inline-flex items-center gap-1.5 text-small font-medium tracking-wide text-muted-foreground transition-colors duration-[var(--motion-fast)] hover:text-foreground',
        className,
      )}
    >
      <span>{children}</span>
      {showArrow && (
        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-[var(--motion-fast)] group-hover/textlink:translate-x-0.5" />
      )}
    </Link>
  )
}
