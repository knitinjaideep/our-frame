'use client'

import { motion } from 'framer-motion'
import { Loader2, CheckCircle2, HardDrive, Lock, Users, LayoutTemplate, Palette, Folder } from 'lucide-react'
import type { LayoutPreset, ThemePreset, PrivacyMode } from '@/types/platform'

interface Props {
  workspaceName: string
  subtitle?: string | null
  themePreset: ThemePreset
  layoutPreset: LayoutPreset
  privacyMode: PrivacyMode
  rootFolderName?: string | null
  folderTemplate?: string
  onFinish: () => void
  loading?: boolean
}

const THEME_LABELS: Record<ThemePreset, string> = {
  warm_dark: 'Warm Dark',
  cool_dark: 'Cool Dark',
  soft_light: 'Soft Light',
}
const LAYOUT_LABELS: Record<LayoutPreset, string> = {
  editorial: 'Editorial',
  grid: 'Grid',
  timeline: 'Timeline',
}
const PRIVACY_LABELS: Record<PrivacyMode, string> = {
  private: 'Private — only you',
  invite_only: 'Invite Only',
  public: 'Public',
}
const PRIVACY_ICONS: Record<PrivacyMode, React.ReactNode> = {
  private:     <Lock className="w-3.5 h-3.5" />,
  invite_only: <Users className="w-3.5 h-3.5" />,
  public:      <></>,
}

const TEMPLATE_LABELS: Record<string, string> = {
  family:       'Family Members',
  events:       'Events & Occasions',
  travel:       'Travel & Destinations',
  custom:       'Custom Structure',
  timeline:     'Year-by-Year Timeline',
  media_split:  'Photos & Videos Split',
  portfolio:    'Portfolio / Archive',
}

import type { Variants } from 'framer-motion'

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
}
const staggerItem: Variants = {
  hidden: { opacity: 0, x: -8 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
}

export function StepFinish({
  workspaceName,
  subtitle,
  themePreset,
  layoutPreset,
  privacyMode,
  rootFolderName,
  folderTemplate,
  onFinish,
  loading,
}: Props) {
  const summaryRows: { icon: React.ReactNode; label: string; value: string }[] = [
    {
      icon: <Palette className="w-3.5 h-3.5" />,
      label: 'Theme',
      value: THEME_LABELS[themePreset],
    },
    {
      icon: <LayoutTemplate className="w-3.5 h-3.5" />,
      label: 'Layout',
      value: LAYOUT_LABELS[layoutPreset],
    },
    {
      icon: PRIVACY_ICONS[privacyMode],
      label: 'Privacy',
      value: PRIVACY_LABELS[privacyMode],
    },
    ...(rootFolderName
      ? [{
          icon: <HardDrive className="w-3.5 h-3.5" />,
          label: 'Drive root',
          value: rootFolderName,
        }]
      : []),
    ...(folderTemplate && folderTemplate !== 'family'
      ? [{
          icon: <Folder className="w-3.5 h-3.5" />,
          label: 'Structure',
          value: TEMPLATE_LABELS[folderTemplate] ?? folderTemplate,
        }]
      : []),
  ]

  return (
    <div className="space-y-10">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="text-center space-y-4"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
          style={{ background: 'var(--amber-muted)', border: '1.5px solid var(--amber-border)' }}
        >
          <CheckCircle2 className="w-8 h-8" style={{ color: 'var(--primary)' }} />
        </motion.div>

        <div>
          <h2 className="font-serif text-4xl text-foreground leading-tight">
            {workspaceName} is ready
          </h2>
          {subtitle && (
            <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>
          )}
        </div>

        <p className="text-muted-foreground text-base leading-relaxed max-w-xs mx-auto">
          Your private archive is set up.
          {rootFolderName
            ? ` Photos and videos from ${rootFolderName} will start loading.`
            : ' Connect Google Drive from Settings to start browsing your photos.'}
        </p>
      </motion.div>

      {/* Setup summary */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid var(--border)' }}
      >
        <div
          className="px-4 py-2.5"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--card)' }}
        >
          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
            Your setup
          </p>
        </div>
        {summaryRows.map((row, i) => (
          <motion.div
            key={row.label}
            variants={staggerItem}
            className="flex items-center justify-between px-4 py-3"
            style={{
              borderBottom: i < summaryRows.length - 1 ? '1px solid var(--border)' : 'none',
              background: 'var(--card)',
            }}
          >
            <div className="flex items-center gap-2.5 text-muted-foreground">
              {row.icon}
              <span className="text-xs">{row.label}</span>
            </div>
            <span className="text-xs font-medium text-foreground">{row.value}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-3"
      >
        <button
          onClick={onFinish}
          disabled={loading}
          className="w-full px-8 py-4 rounded-xl font-medium text-base transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2.5"
          style={{
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
          }}
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Enter your archive
        </button>
        <p className="text-xs text-muted-foreground text-center">
          Settings are always available from the menu in the top right.
        </p>
      </motion.div>
    </div>
  )
}
