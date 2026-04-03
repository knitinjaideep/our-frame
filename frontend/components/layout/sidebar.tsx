'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Images, Heart, Sparkles, Search, BookImage } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/theme-toggle'

const nav = [
  { href: '/',          label: 'Home',      icon: Home },
  { href: '/albums',    label: 'Albums',    icon: Images },
  { href: '/favorites', label: 'Favorites', icon: Heart },
  { href: '/memories',  label: 'Memories',  icon: Sparkles },
  { href: '/search',    label: 'Search',    icon: Search },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      {/* ── Logo mark ── */}
      <div className="flex items-center gap-3 px-6 pt-8 pb-8">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-xl"
          style={{ backgroundColor: 'var(--amber-muted)' }}
        >
          <BookImage className="h-4 w-4" style={{ color: 'var(--amber)' }} />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
            Our Frame
          </span>
          <span className="text-[10px] text-muted-foreground/70 tracking-wide">
            Family Archive
          </span>
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="mx-5 mb-5 border-t border-sidebar-border" />

      {/* ── Nav links ── */}
      <nav className="flex flex-col gap-0.5 px-3" aria-label="Main navigation">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-sidebar-accent text-sidebar-foreground'
                  : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground'
              )}
            >
              <Icon
                className={cn(
                  'h-4 w-4 shrink-0 transition-colors',
                  active
                    ? ''
                    : 'group-hover:text-sidebar-foreground'
                )}
                style={active ? { color: 'var(--amber)' } : undefined}
              />
              {label}
              {active && (
                <span
                  className="ml-auto h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: 'var(--amber)' }}
                />
              )}
            </Link>
          )
        })}
      </nav>

      {/* ── Footer ── */}
      <div className="mt-auto px-5 pb-6 flex flex-col gap-4">
        <div className="border-t border-sidebar-border pt-4 flex flex-col gap-3">
          <ThemeToggle />
          <p className="text-[10px] text-muted-foreground/50 tracking-widest uppercase">
            Family · Private · Yours
          </p>
        </div>
      </div>
    </aside>
  )
}
