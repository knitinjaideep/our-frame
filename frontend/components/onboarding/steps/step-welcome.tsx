'use client'

import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import type { CurrentUser } from '@/types/platform'
import { HardDrive, Lock, Eye, Zap } from 'lucide-react'

interface Props {
  onNext: () => void
  user?: CurrentUser | null
}

const TRUST_POINTS = [
  {
    icon: <HardDrive className="w-4 h-4" />,
    heading: 'Your photos stay in Drive',
    body: 'We never copy or store your originals. They live in your Google Drive — always.',
  },
  {
    icon: <Lock className="w-4 h-4" />,
    heading: 'Private by default',
    body: 'Nothing is visible to anyone until you choose to share it.',
  },
  {
    icon: <Eye className="w-4 h-4" />,
    heading: 'Minimal metadata only',
    body: 'We store only what we need to show your archive — never the photos themselves.',
  },
  {
    icon: <Zap className="w-4 h-4" />,
    heading: 'Takes about two minutes',
    body: 'Name your space, choose a look, connect Drive. You can change anything later.',
  },
]

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.09, delayChildren: 0.2 },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
}

function getGreeting(user: CurrentUser | null | undefined): string {
  if (!user) return 'Welcome'
  const firstName = user.display_name?.split(' ')[0]
  if (firstName) return `Welcome, ${firstName}`
  return 'Welcome'
}

export function StepWelcome({ onNext, user }: Props) {
  const greeting = getGreeting(user)

  return (
    <div className="space-y-10">
      {/* Identity + greeting */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-5"
      >
        {/* Avatar — if available */}
        {user?.avatar_url && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="flex justify-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={user.avatar_url}
              alt={user.display_name ?? 'Your photo'}
              className="w-16 h-16 rounded-full object-cover"
              style={{
                border: '2px solid var(--amber-border)',
                boxShadow: '0 0 0 4px var(--amber-subtle), 0 4px 20px oklch(0 0 0 / 40%)',
              }}
            />
          </motion.div>
        )}

        {!user?.avatar_url && (
          <div
            className="w-14 h-14 rounded-full mx-auto flex items-center justify-center font-serif text-2xl"
            style={{
              background: 'var(--amber-muted)',
              color: 'var(--primary)',
              border: '1.5px solid var(--amber-border)',
            }}
          >
            ✦
          </div>
        )}

        <div className="text-center space-y-2">
          <h1 className="font-serif text-4xl text-foreground leading-snug">
            {greeting}
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            Let&apos;s set up your private memory archive.
            {user?.email && (
              <span className="block text-xs mt-1 text-muted-foreground/70">
                Signed in as {user.email}
              </span>
            )}
          </p>
        </div>
      </motion.div>

      {/* Trust card */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
        }}
      >
        {TRUST_POINTS.map((point, i) => (
          <motion.div
            key={i}
            variants={itemVariants}
            className="flex items-start gap-3.5 px-5 py-4"
            style={{
              borderBottom: i < TRUST_POINTS.length - 1 ? '1px solid var(--border)' : 'none',
            }}
          >
            <span
              className="flex-shrink-0 mt-0.5 w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: 'var(--amber-subtle)', color: 'var(--primary)' }}
            >
              {point.icon}
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">{point.heading}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{point.body}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-3"
      >
        <button
          onClick={onNext}
          className="w-full px-6 py-3.5 rounded-xl font-medium text-sm transition-opacity hover:opacity-90"
          style={{
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
          }}
        >
          Begin setup
        </button>
        <p className="text-xs text-center text-muted-foreground">
          You can change everything later in Settings.
        </p>
      </motion.div>
    </div>
  )
}
