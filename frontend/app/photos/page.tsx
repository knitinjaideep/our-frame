'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useState } from 'react'

/* ── The three photo worlds ── */
const WORLDS = [
  {
    href: '/arjun',
    eyebrow: 'Growing Up, Frame by Frame',
    title: 'Arjun',
    description: 'Every milestone, every laugh. A chapter written in light.',
    accentColor: 'oklch(0.70 0.145 58)',
    gradient: 'linear-gradient(135deg, oklch(0.13 0.018 48) 0%, oklch(0.20 0.025 55) 60%, oklch(0.16 0.022 52) 100%)',
  },
  {
    href: '/travel',
    eyebrow: 'Stories From Everywhere',
    title: 'Family Travel',
    description: 'Roads taken, cities explored, memories carried home.',
    accentColor: 'oklch(0.65 0.130 200)',
    gradient: 'linear-gradient(135deg, oklch(0.12 0.015 210) 0%, oklch(0.19 0.022 200) 60%, oklch(0.14 0.018 205) 100%)',
  },
  {
    href: '/photography',
    eyebrow: 'Our Story in Frames',
    title: 'The Lens',
    description: 'Stills that hold a world. Photography as a personal archive.',
    accentColor: 'oklch(0.62 0.095 300)',
    gradient: 'linear-gradient(135deg, oklch(0.12 0.012 295) 0%, oklch(0.18 0.018 300) 60%, oklch(0.13 0.015 305) 100%)',
  },
] as const

function WorldCard({
  world,
  index,
}: {
  world: (typeof WORLDS)[number]
  index: number
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        href={world.href}
        className="world-card"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          '--card-accent': world.accentColor,
          '--card-gradient': world.gradient,
          transform: hovered ? 'translateY(-8px) scale(1.012)' : 'translateY(0) scale(1)',
          boxShadow: hovered
            ? `0 28px 60px oklch(0 0 0 / 55%), 0 6px 20px oklch(0 0 0 / 35%), 0 0 0 1px ${world.accentColor.replace(')', ' / 18%)')}, 0 0 48px ${world.accentColor.replace(')', ' / 10%)')}`
            : '0 4px 16px oklch(0 0 0 / 30%), 0 1px 4px oklch(0 0 0 / 20%)',
          transition: 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
        } as React.CSSProperties}
      >
        <div className="world-card__bg" style={{ background: world.gradient }} />
        <div
          className="world-card__glow"
          style={{
            background: `radial-gradient(ellipse 80% 60% at 50% 110%, ${world.accentColor.replace(')', ' / 22%)')} 0%, transparent 70%)`,
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.45s ease',
          }}
        />
        <div className="world-card__noise" />
        <div className="world-card__content">
          <p className="world-card__eyebrow" style={{ color: world.accentColor }}>
            {world.eyebrow}
          </p>
          <h2 className="world-card__title font-serif">{world.title}</h2>
          <p
            className="world-card__desc"
            style={{
              opacity: hovered ? 0.85 : 0.55,
              transform: hovered ? 'translateY(0)' : 'translateY(4px)',
              transition: 'opacity 0.35s ease, transform 0.35s ease',
            }}
          >
            {world.description}
          </p>
        </div>
        <div
          className="world-card__accent-line"
          style={{
            background: `linear-gradient(to right, transparent, ${world.accentColor}, transparent)`,
            opacity: hovered ? 0.7 : 0.15,
            transition: 'opacity 0.35s ease',
          }}
        />
        <div
          className="world-card__arrow"
          style={{
            opacity: hovered ? 1 : 0,
            transform: hovered ? 'translateX(0)' : 'translateX(-6px)',
            color: world.accentColor,
            transition: 'opacity 0.3s ease, transform 0.3s ease',
          }}
        >
          →
        </div>
      </Link>
    </motion.div>
  )
}

export default function PhotosPage() {
  return (
    <div className="content-padding py-12 pb-24 max-w-6xl">
      <motion.div
        className="mb-12"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <p className="text-eyebrow-gold mb-3">Our Story in Frames</p>
        <h1 className="text-display-sm font-serif text-foreground">
          Photos
        </h1>
        <p className="mt-3 text-sm text-muted-foreground max-w-md leading-relaxed">
          Three worlds. Every frame we have captured together.
        </p>
      </motion.div>

      <div className="worlds-grid">
        {WORLDS.map((world, i) => (
          <WorldCard key={world.href} world={world} index={i} />
        ))}
      </div>
    </div>
  )
}
