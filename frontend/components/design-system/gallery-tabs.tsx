'use client'

import { cn } from '@/lib/utils'

export interface GalleryTab {
  id: string
  label: string
}

interface GalleryTabsProps {
  tabs: GalleryTab[]
  activeId: string
  onChange: (id: string) => void
  className?: string
}

/**
 * GalleryTabs — elegant text tabs ("All / By Age / By Year / Albums") used
 * to switch a gallery's grouping without looking like ecommerce filter
 * chips. Restrained bronze underline on the active tab, matching the nav's
 * active-state treatment.
 */
export function GalleryTabs({ tabs, activeId, onChange, className }: GalleryTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Gallery navigation"
      className={cn('flex items-center gap-6 border-b border-border', className)}
    >
      {tabs.map((tab) => {
        const active = tab.id === activeId
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative -mb-px py-3 text-small font-medium tracking-wide transition-colors duration-[var(--motion-fast)]',
              active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
            {active && (
              <span
                className="absolute inset-x-0 -bottom-px h-[1.5px] rounded-full"
                style={{ background: 'var(--amber)', opacity: 0.8 }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
