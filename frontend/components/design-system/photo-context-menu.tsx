'use client'
import { useEffect, useRef, useState } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { IconButton } from './icon-button'
import { cn } from '@/lib/utils'

export interface PhotoContextMenuAction {
  key: string
  label: string
  icon?: React.ReactNode
  /** Set for a download-style action; renders as an `<a download>` instead of a button. */
  href?: string
  onSelect?: () => void
  destructive?: boolean
  /** Gated to the workspace owner — hidden entirely (not disabled) for everyone else (PR 7). */
  ownerOnly?: boolean
}

interface PhotoContextMenuProps {
  actions: PhotoContextMenuAction[]
  /** Whether the current viewer is the workspace owner — controls `ownerOnly` visibility. */
  isOwner?: boolean
  label?: string
  variant?: 'ghost' | 'translucent'
  className?: string
}

/**
 * PhotoContextMenu — the shared overflow ("…") action menu for a photo,
 * used from the lightbox (and, from PR 7 on, folder/photo hover chrome) per
 * `docs/OUR-FRAME-DESIGN-SYSTEM.md` §13/§17. Renders nothing when every
 * action is owner-gated and the viewer isn't the owner.
 *
 * PR 2 wires this into the lightbox's existing "Download original" action;
 * PR 7 adds "Set as album cover" / "Set as thumbnail" (owner-only) and a
 * destructive "Delete photo" entry to the same `actions` list — no new menu
 * component needed.
 */
export function PhotoContextMenu({
  actions,
  isOwner = false,
  label = 'More actions',
  variant = 'translucent',
  className,
}: PhotoContextMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDocPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onDocPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onDocPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const visible = actions.filter((a) => !a.ownerOnly || isOwner)
  if (visible.length === 0) return null

  const itemClass = (destructive?: boolean) =>
    cn(
      'flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-small transition-colors',
      destructive ? 'text-destructive hover:bg-destructive/10' : 'text-foreground hover:bg-white/5',
    )

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <IconButton
        variant={variant}
        label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        icon={<MoreHorizontal className="h-[18px] w-[18px]" aria-hidden />}
      />
      {open && (
        <div
          role="menu"
          aria-label={label}
          className="absolute right-0 z-10 mt-2 w-56 overflow-hidden rounded-xl border py-1 shadow-2xl"
          style={{ background: 'oklch(0.10 0.01 48 / 97%)', borderColor: 'var(--border)', backdropFilter: 'blur(16px)' }}
        >
          {visible.map((a) =>
            a.href ? (
              <a
                key={a.key}
                role="menuitem"
                href={a.href}
                download
                onClick={() => setOpen(false)}
                className={itemClass(a.destructive)}
              >
                {a.icon}
                <span>{a.label}</span>
                {a.ownerOnly && (
                  <span className="ml-auto text-[0.6rem] font-semibold tracking-[0.14em] text-amber-500/80">OWNER</span>
                )}
              </a>
            ) : (
              <button
                key={a.key}
                type="button"
                role="menuitem"
                onClick={() => {
                  a.onSelect?.()
                  setOpen(false)
                }}
                className={itemClass(a.destructive)}
              >
                {a.icon}
                <span>{a.label}</span>
                {a.ownerOnly && (
                  <span className="ml-auto text-[0.6rem] font-semibold tracking-[0.14em] text-amber-500/80">OWNER</span>
                )}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  )
}
