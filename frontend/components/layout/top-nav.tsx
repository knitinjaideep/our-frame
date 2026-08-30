'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  Menu, X, ChevronDown, Settings, LogOut, ShieldCheck,
  HardDrive, Lock, Users, Globe, CheckCircle2, AlertCircle,
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useCurrentUser, useLogout } from '@/hooks/use-auth'
import { useWorkspace } from '@/hooks/use-workspace'
import { useQuery } from '@tanstack/react-query'
import { getDriveStatus } from '@/lib/platform-api'

/* ── Nav information architecture ── */
const PHOTOS_ITEMS = [
  { href: '/albums/1JMutj12MQTZcbkhzBE1W8pH0TCt2GxVf', label: 'Arjun',      eyebrow: 'Growing Up'        },
  { href: '/albums/1xbcuOKAcRofSo0KwjEykYV3rXnmAmd8J', label: 'Travel',     eyebrow: 'Adventures'        },
  { href: '/albums/1fyt_9BebLuyEyx7w8El1Bo4Nfs9h-59A', label: 'Milestones', eyebrow: 'Anchor Memories'   },
  { href: '/albums/1PMDy1-M23ZRkPxuaQ8IL3y_BorDEiepb', label: 'Life',       eyebrow: 'People & Moments'  },
] as const

const VIDEOS_ITEMS = [
  { href: '/videos',                label: 'All Videos',    eyebrow: 'Browse'        },
  { href: '/videos/arjun',          label: 'Arjun',         eyebrow: 'Growing Up'    },
  { href: '/videos/family-travel',  label: 'Family Travel', eyebrow: 'On the Road'   },
] as const

type NavDropdownKey = 'photos' | 'videos' | null

const FLAT_NAV = [
  { href: '/favorites', label: 'Favorites' },
  { href: '/memories',  label: 'Memories'  },
] as const

/* Route that gets the transparent, floating-over-hero nav treatment.
 * Every other shell page gets the near-black interior treatment. */
const TRANSPARENT_NAV_ROUTES = ['/home']

/* ── Dropdown panel ── */
function NavDropdown({
  items,
  onClose,
}: {
  items: ReadonlyArray<{ href: string; label: string; eyebrow: string }>
  onClose: () => void
}) {
  return (
    <motion.div
      className="nav-dropdown"
      initial={{ opacity: 0, y: -6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.97 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="nav-dropdown__item"
          onClick={onClose}
        >
          <span className="nav-dropdown__eyebrow">{item.eyebrow}</span>
          <span className="nav-dropdown__label">{item.label}</span>
        </Link>
      ))}
    </motion.div>
  )
}

/* ── Privacy badge ── */
const PRIVACY_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  private:     { label: 'Private',     icon: <Lock className="w-3 h-3" />,  color: 'oklch(0.70 0.145 58)' },
  invite_only: { label: 'Invite Only', icon: <Users className="w-3 h-3" />, color: 'oklch(0.70 0.140 220)' },
  public:      { label: 'Public',      icon: <Globe className="w-3 h-3" />, color: 'oklch(0.68 0.130 150)' },
}

/* ── Drive status indicator ── */
function DriveStatusDot({ workspaceId }: { workspaceId: number }) {
  const { data: status } = useQuery({
    queryKey: ['driveStatus', workspaceId],
    queryFn: () => getDriveStatus(workspaceId),
    staleTime: 30_000,
    retry: false,
  })
  if (!status) return null
  const isActive = status.status === 'active'
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10px] font-medium"
      style={{ color: isActive ? 'oklch(0.68 0.130 150)' : 'var(--muted-foreground)' }}
    >
      {isActive
        ? <CheckCircle2 className="w-3 h-3" />
        : <AlertCircle className="w-3 h-3" />}
      {isActive ? 'Drive connected' : 'Drive not connected'}
    </span>
  )
}

/* ── Polished user menu (desktop) ── */
function UserMenu() {
  const { data: user } = useCurrentUser()
  const logout = useLogout()
  const { workspace } = useWorkspace()
  const [open, setOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  if (!user) return null

  const privacy = workspace ? (PRIVACY_LABELS[workspace.privacy_mode] ?? PRIVACY_LABELS.private) : null

  const handleOpen = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpen(true)
  }
  const handleClose = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 140)
  }

  const initial = (user.display_name ?? user.email)[0]?.toUpperCase() ?? '?'

  return (
    <div
      className="relative"
      onMouseEnter={handleOpen}
      onMouseLeave={handleClose}
    >
      {/* Avatar trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full overflow-hidden transition-all duration-200"
        style={{
          border: `1.5px solid ${open ? 'var(--primary)' : 'oklch(1 0 0 / 14%)'}`,
        }}
        aria-label="User menu"
        aria-expanded={open}
      >
        {user.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatar_url}
            alt={user.display_name ?? ''}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <span
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
            style={{
              background: 'var(--amber-muted)',
              color: 'var(--primary)',
            }}
          >
            {initial}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute right-0 top-full mt-2 w-64 overflow-hidden z-50"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={{
              background: 'var(--popover)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: '0 12px 32px oklch(0 0 0 / 32%)',
            }}
            onMouseEnter={handleOpen}
            onMouseLeave={handleClose}
          >
            {/* Header: avatar + identity */}
            <div
              className="px-4 pt-4 pb-3 flex items-start gap-3"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <div className="flex-shrink-0">
                {user.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatar_url}
                    alt={user.display_name ?? ''}
                    className="w-10 h-10 rounded-full object-cover"
                    style={{ border: '1.5px solid var(--amber-border)' }}
                  />
                ) : (
                  <span
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold"
                    style={{ background: 'var(--amber-muted)', color: 'var(--primary)' }}
                  >
                    {initial}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate leading-tight">
                  {user.display_name ?? 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{user.email}</p>
              </div>
            </div>

            {/* Workspace section */}
            {workspace && (
              <div
                className="px-4 py-2.5 flex items-center justify-between"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground mb-0.5">
                    Workspace
                  </p>
                  <p className="text-xs font-medium text-foreground truncate">{workspace.name}</p>
                </div>
                {privacy && (
                  <span
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ml-2"
                    style={{
                      background: `${privacy.color}18`,
                      color: privacy.color,
                      border: `1px solid ${privacy.color}30`,
                    }}
                  >
                    {privacy.icon}
                    {privacy.label}
                  </span>
                )}
              </div>
            )}

            {/* Drive status */}
            {workspace && (
              <div
                className="px-4 py-2"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <DriveStatusDot workspaceId={workspace.id} />
              </div>
            )}

            {/* Actions */}
            <div className="py-1.5">
              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-muted/60"
              >
                <Settings className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span>Settings</span>
              </Link>
              {user.is_platform_admin && (
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-muted/60"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <span>Admin</span>
                </Link>
              )}
              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-muted/60"
              >
                <HardDrive className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span>Drive settings</span>
              </Link>
            </div>

            {/* Sign out */}
            <div style={{ borderTop: '1px solid var(--border)' }} className="py-1.5">
              <button
                onClick={() => logout.mutate()}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
              >
                <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── Main TopNav ── */
export function TopNav() {
  const pathname = usePathname()
  const reduce = useReducedMotion()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobilePhotosOpen, setMobilePhotosOpen] = useState(false)
  const [mobileVideosOpen, setMobileVideosOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<NavDropdownKey>(null)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { workspace } = useWorkspace()
  const { data: user } = useCurrentUser()
  const logout = useLogout()

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  const photosActive = isActive('/photos') || isActive('/albums')
  const videosActive = isActive('/videos')

  const isTransparentRoute = TRANSPARENT_NAV_ROUTES.some((r) => pathname === r)
  const navVariant = isTransparentRoute ? 'transparent' : 'solid'

  const openDropdown = (key: NavDropdownKey) => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current)
    setActiveDropdown(key)
  }
  const scheduleClose = () => {
    leaveTimer.current = setTimeout(() => setActiveDropdown(null), 120)
  }
  const toggleDropdown = (key: Exclude<NavDropdownKey, null>) => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current)
    setActiveDropdown((current) => (current === key ? null : key))
  }
  /** Close a flyout when focus leaves the whole dropdown host (keyboard tab-out). */
  const handleHostBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setActiveDropdown(null)
    }
  }

  // Family name: prefer workspace subtitle (as tagline) or fall back to workspace name
  // If neither exists, show empty — never hardcode "Kotcherlakota"
  const brandName = workspace?.name ?? 'Our Frame'
  const familyLine = workspace?.subtitle ?? null
  const userInitial = user ? (user.display_name ?? user.email)[0]?.toUpperCase() ?? '?' : null

  const closeMobile = () => {
    setMobileOpen(false)
    setMobilePhotosOpen(false)
    setMobileVideosOpen(false)
  }

  /* Escape dismisses whichever overlay is open (desktop flyout / mobile sheet). */
  useEffect(() => {
    if (!mobileOpen && !activeDropdown) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setActiveDropdown(null)
      setMobileOpen(false)
      setMobilePhotosOpen(false)
      setMobileVideosOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mobileOpen, activeDropdown])

  /* Lock body scroll behind the full-screen mobile sheet. */
  useEffect(() => {
    if (!mobileOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [mobileOpen])

  return (
    <>
      {/* ── Top bar ── */}
      <header className="top-nav" data-variant={navVariant}>
        {/* Brand wordmark — uses workspace name */}
        <Link href="/home" className="top-nav__logo" aria-label={`${brandName} — Home`}>
          <span className="top-nav__wordmark font-serif">{brandName}</span>
          {familyLine && (
            <span className="top-nav__family font-sans">{familyLine}</span>
          )}
        </Link>

        {/* Desktop nav */}
        <nav className="top-nav__links" aria-label="Main navigation">

          {/* Home — flat link */}
          <Link
            href="/home"
            className="top-nav__link"
            aria-current={isActive('/home') ? 'page' : undefined}
            data-active={isActive('/home') ? '' : undefined}
          >
            Home
            {isActive('/home') && (
              <motion.span className="top-nav__active-bar" layoutId="active-bar"
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} />
            )}
          </Link>

          {/* Photos dropdown */}
          <div
            className="top-nav__dropdown-host"
            onMouseEnter={() => openDropdown('photos')}
            onMouseLeave={scheduleClose}
            onFocus={() => openDropdown('photos')}
            onBlur={handleHostBlur}
          >
            <Link
              href="/photos"
              className={`top-nav__link top-nav__link--btn${photosActive ? ' top-nav__link--btn-active' : ''}`}
              aria-expanded={activeDropdown === 'photos'}
              aria-current={photosActive ? 'page' : undefined}
            >
              Photos
              <ChevronDown
                className="top-nav__chevron"
                style={{
                  transform: activeDropdown === 'photos' ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
              {photosActive && (
                <motion.span className="top-nav__active-bar" layoutId="active-bar"
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} />
              )}
            </Link>
            <AnimatePresence>
              {activeDropdown === 'photos' && (
                <NavDropdown
                  items={PHOTOS_ITEMS}
                  onClose={() => setActiveDropdown(null)}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Videos dropdown */}
          <div
            className="top-nav__dropdown-host"
            onMouseEnter={() => openDropdown('videos')}
            onMouseLeave={scheduleClose}
            onFocus={() => openDropdown('videos')}
            onBlur={handleHostBlur}
          >
            <button
              type="button"
              onClick={() => toggleDropdown('videos')}
              className={`top-nav__link top-nav__link--btn${videosActive ? ' top-nav__link--btn-active' : ''}`}
              aria-haspopup="true"
              aria-expanded={activeDropdown === 'videos'}
              aria-current={videosActive ? 'page' : undefined}
            >
              Videos
              <ChevronDown
                className="top-nav__chevron"
                style={{
                  transform: activeDropdown === 'videos' ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
              {videosActive && (
                <motion.span className="top-nav__active-bar" layoutId="active-bar"
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} />
              )}
            </button>
            <AnimatePresence>
              {activeDropdown === 'videos' && (
                <NavDropdown
                  items={VIDEOS_ITEMS}
                  onClose={() => setActiveDropdown(null)}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Flat items */}
          {FLAT_NAV.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className="top-nav__link"
                aria-current={active ? 'page' : undefined}
                data-active={active ? '' : undefined}
              >
                {item.label}
                {active && (
                  <motion.span className="top-nav__active-bar" layoutId="active-bar"
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} />
                )}
              </Link>
            )
          })}
        </nav>

        {/* User menu — shown from the same breakpoint the hamburger disappears
            (md), otherwise tablet widths lose access to settings/sign out. */}
        <div className="hidden md:block">
          <UserMenu />
        </div>

        {/* Mobile hamburger */}
        <button
          className="top-nav__toggle"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          aria-expanded={mobileOpen}
        >
          <Menu className="h-4 w-4" style={{ color: 'oklch(1 0 0 / 70%)' }} />
        </button>
      </header>

      {/* ── Mobile full-screen sheet ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="mobile-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mobile-sheet__header">
              <Link href="/home" className="top-nav__logo" onClick={closeMobile} aria-label={`${brandName} — Home`}>
                <span className="top-nav__wordmark font-serif">{brandName}</span>
              </Link>
              <button
                className="top-nav__toggle"
                onClick={closeMobile}
                aria-label="Close menu"
              >
                <X className="h-4 w-4" style={{ color: 'oklch(1 0 0 / 70%)' }} />
              </button>
            </div>

            <nav className="mobile-sheet__nav" aria-label="Mobile navigation">
              <Link
                href="/home"
                className="mobile-sheet__link"
                onClick={closeMobile}
                aria-current={isActive('/home') ? 'page' : undefined}
                data-active={isActive('/home') ? '' : undefined}
              >
                Home
                <span className="mobile-sheet__dot" />
              </Link>

              {/* Photos — accordion */}
              <button
                className="mobile-sheet__link w-full text-left"
                onClick={() => setMobilePhotosOpen((v) => !v)}
                aria-expanded={mobilePhotosOpen}
                data-active={photosActive ? '' : undefined}
              >
                Photos
                <ChevronDown
                  className="mobile-sheet__chevron"
                  style={{ transform: mobilePhotosOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </button>
              <AnimatePresence>
                {mobilePhotosOpen && (
                  <motion.div
                    className="mobile-sheet__sub"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: reduce ? 0 : 0.2, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Link href="/photos" className="mobile-sheet__sub-link" onClick={closeMobile}>
                      All Photos
                    </Link>
                    {PHOTOS_ITEMS.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="mobile-sheet__sub-link"
                        onClick={closeMobile}
                        data-active={isActive(item.href) ? '' : undefined}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Videos — accordion */}
              <button
                className="mobile-sheet__link w-full text-left"
                onClick={() => setMobileVideosOpen((v) => !v)}
                aria-expanded={mobileVideosOpen}
                data-active={videosActive ? '' : undefined}
              >
                Videos
                <ChevronDown
                  className="mobile-sheet__chevron"
                  style={{ transform: mobileVideosOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </button>
              <AnimatePresence>
                {mobileVideosOpen && (
                  <motion.div
                    className="mobile-sheet__sub"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: reduce ? 0 : 0.2, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {VIDEOS_ITEMS.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="mobile-sheet__sub-link"
                        onClick={closeMobile}
                        data-active={isActive(item.href) ? '' : undefined}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {FLAT_NAV.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="mobile-sheet__link"
                    onClick={closeMobile}
                    aria-current={active ? 'page' : undefined}
                    data-active={active ? '' : undefined}
                  >
                    {item.label}
                    <span className="mobile-sheet__dot" />
                  </Link>
                )
              })}
            </nav>

            {/* Quiet profile row */}
            {user && (
              <div className="mobile-sheet__footer flex items-center justify-between">
                <Link
                  href="/settings"
                  onClick={closeMobile}
                  className="flex items-center gap-2.5"
                >
                  {user.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatar_url}
                      alt={user.display_name ?? ''}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                      style={{ background: 'var(--amber-muted)', color: 'var(--primary)' }}
                    >
                      {userInitial}
                    </span>
                  )}
                  <span className="text-sm text-foreground">{user.display_name ?? 'Settings'}</span>
                </Link>
                <button
                  onClick={() => logout.mutate()}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign out
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
