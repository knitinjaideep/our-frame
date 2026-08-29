import { cn } from '@/lib/utils'

interface EditorialEyebrowProps {
  children: React.ReactNode
  /** 'gold' (default) uses the restrained bronze accent; 'muted' for quiet contexts. */
  tone?: 'gold' | 'muted'
  className?: string
  as?: keyof React.JSX.IntrinsicElements
}

/**
 * EditorialEyebrow — small, tracked, uppercase label used above serif
 * headings ("WELCOME HOME", "OUR STORY IN FRAMES", "ANCHOR MEMORIES", ...).
 *
 * This is the one place uppercase styling is expected — per the design
 * system, avoid uppercase elsewhere.
 */
export function EditorialEyebrow({
  children,
  tone = 'gold',
  className,
  as: Tag = 'p',
}: EditorialEyebrowProps) {
  return (
    <Tag className={cn(tone === 'gold' ? 'text-eyebrow-gold' : 'text-eyebrow', className)}>
      {children}
    </Tag>
  )
}
