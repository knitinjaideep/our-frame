'use client'
import { useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'

interface SectionRevealProps {
  children: React.ReactNode
  delay?: number
}

export function SectionReveal({ children, delay = 0 }: SectionRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px 0px' })
  const reduce = useReducedMotion()
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: reduce ? 0 : 22 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}
