'use client'

import { motion } from 'framer-motion'

interface Props {
  onNext: () => void
}

export function StepWelcome({ onNext }: Props) {
  return (
    <div className="space-y-10 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-4"
      >
        <div className="text-5xl font-serif text-primary mx-auto">✦</div>
        <h1 className="font-serif text-4xl text-foreground leading-snug">
          Welcome to Our Frame
        </h1>
        <p className="text-muted-foreground text-lg leading-relaxed max-w-sm mx-auto">
          Let's set up your private family photo space. It takes about two minutes.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-4"
      >
        <ul className="text-sm text-muted-foreground space-y-2 text-left bg-card border border-border rounded-xl px-6 py-5 mx-auto max-w-sm">
          <li className="flex gap-2 items-start"><span className="text-primary mt-0.5">→</span> Name your workspace</li>
          <li className="flex gap-2 items-start"><span className="text-primary mt-0.5">→</span> Choose your look and feel</li>
          <li className="flex gap-2 items-start"><span className="text-primary mt-0.5">→</span> Set your privacy preferences</li>
          <li className="flex gap-2 items-start"><span className="text-primary mt-0.5">→</span> Connect your Google Drive</li>
        </ul>

        <p className="text-xs text-muted-foreground">
          You can change everything later in Settings.
        </p>

        <button
          onClick={onNext}
          className="w-full px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm transition-opacity hover:opacity-90"
        >
          Let's begin
        </button>
      </motion.div>
    </div>
  )
}
