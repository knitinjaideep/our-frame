'use client'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  href?: string
}

/**
 * Breadcrumbs — the single breadcrumb trail used by both header components
 * (`CategoryHeader` for category landing pages, `AlbumHeader` for leaf
 * albums), per `docs/OUR-FRAME-DESIGN-SYSTEM.md` §9/§10, which show the
 * identical `Home › Photos › <Category>` trail on both.
 *
 * The two headers are deliberately separate components (§17 names both;
 * §10 will give the album header a full-bleed cover-photo treatment in
 * PR 6 that a category page must not inherit), but the breadcrumb itself is
 * genuinely the same element in both — so it lives here once rather than
 * being copy-pasted into each.
 */
export interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  /**
   * Renders in white/ivory instead of the default muted/foreground tokens —
   * used by `AlbumHeader` when it sits on top of a full-bleed cover photo
   * (§10), where the default `--muted-foreground` value doesn't have enough
   * contrast against an arbitrary photograph.
   */
  light?: boolean
}

export function Breadcrumbs({ items, light }: BreadcrumbsProps) {
  return (
    <nav className="mb-5 flex flex-wrap items-center gap-1.5 text-xs" aria-label="Breadcrumb">
      {items.map((crumb, i) => (
        <span key={`${crumb.label}-${i}`} className="flex items-center gap-1.5">
          {i > 0 && (
            <ChevronRight
              className="h-3 w-3 shrink-0"
              style={{ color: light ? 'oklch(1 0 0 / 55%)' : 'var(--muted-foreground)', opacity: light ? 1 : 0.4 }}
              aria-hidden
            />
          )}
          {crumb.href ? (
            <Link
              href={crumb.href}
              className="transition-colors"
              style={{ color: light ? 'oklch(1 0 0 / 78%)' : 'var(--muted-foreground)' }}
            >
              {crumb.label}
            </Link>
          ) : (
            <span style={{ color: light ? 'oklch(1 0 0 / 96%)' : 'var(--foreground)' }}>{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
