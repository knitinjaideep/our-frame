'use client'

import { useRef } from 'react'
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

/** Deterministic id for the tabpanel a given tab controls — consumers use
 * this to give their panel a matching `id`/`aria-labelledby`. */
export function galleryTabPanelId(tabId: string): string {
  return `gallery-panel-${tabId}`
}

function galleryTabId(tabId: string): string {
  return `gallery-tab-${tabId}`
}

/**
 * GalleryTabs — elegant text tabs ("All / By Age / By Year / Albums") used
 * to switch a gallery's grouping without looking like ecommerce filter
 * chips. Restrained bronze underline on the active tab, matching the nav's
 * active-state treatment.
 *
 * Full ARIA tabs pattern: each tab exposes `aria-controls` pointing at the
 * panel id from `galleryTabPanelId`, only the active tab is in the tab
 * order (roving tabindex), and arrow/Home/End keys move focus + selection
 * between tabs per the WAI-ARIA authoring practices "automatic activation"
 * pattern.
 */
export function GalleryTabs({ tabs, activeId, onChange, className }: GalleryTabsProps) {
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  function focusAndActivate(id: string) {
    onChange(id)
    buttonRefs.current[id]?.focus()
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | null = null
    switch (event.key) {
      case 'ArrowRight':
        nextIndex = (index + 1) % tabs.length
        break
      case 'ArrowLeft':
        nextIndex = (index - 1 + tabs.length) % tabs.length
        break
      case 'Home':
        nextIndex = 0
        break
      case 'End':
        nextIndex = tabs.length - 1
        break
      default:
        return
    }
    event.preventDefault()
    focusAndActivate(tabs[nextIndex].id)
  }

  return (
    <div
      role="tablist"
      aria-label="Gallery navigation"
      className={cn('flex items-center gap-6 border-b border-border', className)}
    >
      {tabs.map((tab, index) => {
        const active = tab.id === activeId
        return (
          <button
            key={tab.id}
            ref={(el) => {
              buttonRefs.current[tab.id] = el
            }}
            id={galleryTabId(tab.id)}
            role="tab"
            type="button"
            aria-selected={active}
            // Consumers may mount only the active panel, so only the active
            // tab points at an element that actually exists in the DOM.
            aria-controls={active ? galleryTabPanelId(tab.id) : undefined}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
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
