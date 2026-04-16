'use client'

import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

interface Props {
  workspaceName: string
  onFinish: () => void
  loading?: boolean
}

export function StepFinish({ workspaceName, onFinish, loading }: Props) {
  return (
    <div className="space-y-10 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-4"
      >
        <div className="text-6xl">✦</div>
        <h2 className="font-serif text-4xl text-foreground">
          {workspaceName} is ready
        </h2>
        <p className="text-muted-foreground text-lg max-w-sm mx-auto leading-relaxed">
          Your private family space is set up. Photos will start loading from
          your Drive once you connect it.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-3"
      >
        <button
          onClick={onFinish}
          disabled={loading}
          className="w-full px-8 py-4 rounded-xl bg-primary text-primary-foreground font-medium text-base transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Enter your space
        </button>
        <p className="text-xs text-muted-foreground">
          Settings are always available from the menu.
        </p>
      </motion.div>
    </div>
  )
}
