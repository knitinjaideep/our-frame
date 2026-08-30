import { cn } from '@/lib/utils'

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode
  label: string
  /**
   * 'ghost' (default) — quiet chrome control, e.g. nav toggle.
   * 'translucent' — minimal circular control over photography, e.g.
   *   lightbox prev/next/close/favorite (PR 5 reuses this).
   */
  variant?: 'ghost' | 'translucent'
}

/**
 * IconButton — restrained circular icon control. `label` is required and
 * used as the accessible name (`aria-label`) since these are icon-only.
 */
export function IconButton({ icon, label, variant = 'ghost', className, ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors duration-[var(--motion-fast)]',
        variant === 'ghost' &&
          'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground',
        variant === 'translucent' &&
          'border border-white/10 bg-black/30 text-white/80 backdrop-blur-md hover:bg-black/50 hover:text-white',
        className,
      )}
      {...props}
    >
      {icon}
    </button>
  )
}
