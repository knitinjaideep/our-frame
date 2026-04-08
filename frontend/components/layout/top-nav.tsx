'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Menu, X, ChevronDown } from 'lucide-react'
import { useState, useRef } from 'react'

/* ── Nav information architecture ── */
const PHOTOS_ITEMS = [
  { href: '/albums/1JMutj12MQTZcbkhzBE1W8pH0TCt2GxVf', label: 'Arjun',      eyebrow: 'Growing Up'        },
  { href: '/albums/1xbcuOKAcRofSo0KwjEykYV3rXnmAmd8J', label: 'Travel',     eyebrow: 'Adventures'        },
  { href: '/albums/1fyt_9BebLuyEyx7w8El1Bo4Nfs9h-59A', label: 'Milestones', eyebrow: 'Anchor Memories'   },
  { href: '/albums/1PMDy1-M23ZRkPxuaQ8IL3y_BorDEiepb', label: 'Life',       eyebrow: 'People & Moments'  },
] as const

const VIDEOS_ITEMS = [
  { href: '/videos', label: 'All Videos', eyebrow: 'Browse' },
] as const

type NavDropdownKey = 'photos' | 'videos' | null

const FLAT_NAV = [
  { href: '/favorites', label: 'Favorites' },
  { href: '/memories',  label: 'Memories'  },
] as const

/* Final nav order: Home · Photos ↓ · Videos ↓ · Favorites · Memories */

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

export function TopNav() {
  const pathname = usePathname()
  const reduce = useReducedMotion()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<NavDropdownKey>(null)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  const photosActive = isActive('/photos') || isActive('/albums')
  const videosActive = isActive('/videos')

  const openDropdown = (key: NavDropdownKey) => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current)
    setActiveDropdown(key)
  }
  const scheduleClose = () => {
    leaveTimer.current = setTimeout(() => setActiveDropdown(null), 120)
  }

  /* Mobile: all items flattened */
  const allMobileItems = [
    { href: '/',                                                     label: 'Home',       group: null     },
    { href: '/photos',                                               label: 'Photos',     group: 'Photos' },
    { href: '/albums/1JMutj12MQTZcbkhzBE1W8pH0TCt2GxVf',            label: 'Arjun',      group: 'Photos' },
    { href: '/albums/1xbcuOKAcRofSo0KwjEykYV3rXnmAmd8J',            label: 'Travel',     group: 'Photos' },
    { href: '/albums/1fyt_9BebLuyEyx7w8El1Bo4Nfs9h-59A',            label: 'Milestones', group: 'Photos' },
    { href: '/albums/1PMDy1-M23ZRkPxuaQ8IL3y_BorDEiepb',            label: 'Life',       group: 'Photos' },
    { href: '/videos',                                               label: 'Videos',     group: 'Videos' },
    { href: '/favorites',                                            label: 'Favorites',  group: null     },
    { href: '/memories',                                             label: 'Memories',   group: null     },
  ] as const

  return (
    <>
      {/* ── Top bar ── */}
      <header className="top-nav">
        {/* Brand wordmark — no icon, gold shimmer */}
        <Link href="/" className="top-nav__logo" aria-label="Our Frame — Home">
          <span className="top-nav__wordmark font-serif text-gold-shimmer">Our Frame</span>
          <span className="top-nav__family font-sans">Kotcherlakota</span>
        </Link>

        {/* Desktop nav */}
        <nav className="top-nav__links" aria-label="Main navigation">

          {/* Home — flat link */}
          <Link
            href="/"
            className="top-nav__link"
            aria-current={isActive('/') ? 'page' : undefined}
            data-active={isActive('/') ? '' : undefined}
          >
            Home
            {isActive('/') && (
              <motion.span className="top-nav__active-bar" layoutId="active-bar"
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} />
            )}
          </Link>

          {/* Photos dropdown */}
          <div
            className="top-nav__dropdown-host"
            onMouseEnter={() => openDropdown('photos')}
            onMouseLeave={scheduleClose}
          >
            <Link
              href="/photos"
              className={`top-nav__link top-nav__link--btn${photosActive ? ' top-nav__link--btn-active' : ''}`}
              aria-expanded={activeDropdown === 'photos'}
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
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} />
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
          >
            <button
              className={`top-nav__link top-nav__link--btn${videosActive ? ' top-nav__link--btn-active' : ''}`}
              aria-expanded={activeDropdown === 'videos'}
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
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} />
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
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="top-nav__toggle"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen
            ? <X    className="h-4 w-4" style={{ color: 'oklch(1 0 0 / 60%)' }} />
            : <Menu className="h-4 w-4" style={{ color: 'oklch(1 0 0 / 60%)' }} />
          }
        </button>
      </header>

      {/* ── Mobile dropdown ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <div
              className="fixed inset-0 z-[44] lg:hidden"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              className="mobile-menu"
              initial={{ opacity: 0, scale: 0.96, y: -8 }}
              animate={{ opacity: 1, scale: 1,    y: 0  }}
              exit={{    opacity: 0, scale: 0.96, y: -8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: 'top right' }}
            >
              <motion.nav
                className="mobile-menu__nav"
                initial="hidden"
                animate="visible"
                variants={{
                  visible: { transition: { staggerChildren: 0.04, delayChildren: 0.04 } },
                }}
              >
                {allMobileItems.map((item) => {
                  const active = isActive(item.href)
                  return (
                    <motion.div
                      key={item.href}
                      variants={{
                        hidden:  { opacity: 0, y: reduce ? 0 : 5 },
                        visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] as const } },
                      }}
                    >
                      <Link
                        href={item.href}
                        className="mobile-menu__item"
                        onClick={() => setMobileOpen(false)}
                        aria-current={active ? 'page' : undefined}
                      >
                        <span
                          className="mobile-menu__label font-serif"
                          style={{ color: active ? 'var(--amber)' : 'oklch(1 0 0 / 75%)' }}
                        >
                          {item.label}
                        </span>
                        {active && <span className="mobile-menu__active-dot" />}
                      </Link>
                    </motion.div>
                  )
                })}
              </motion.nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
