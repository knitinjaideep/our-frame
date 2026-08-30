'use client'
import { AlertTriangle, Check } from 'lucide-react'

interface ConfirmationToastProps {
  /** Rendered nothing when `null` — caller owns show/auto-hide timing. */
  message: string | null
  /**
   * `'error'` swaps the bronze check for a muted warning mark, so a failed
   * mutation reports honestly instead of silently doing nothing (see
   * `.claude/CLAUDE.md`'s "fail visibly and recoverably").
   */
  tone?: 'success' | 'error'
}

/**
 * ConfirmationToast — the quiet, bronze-check confirmation shown after a
 * cover-selection action (`docs/OUR-FRAME-DESIGN-SYSTEM.md` §13, board 5:
 * "a bronze check icon with 'Cover updated'"). Deliberately generic (just a
 * message), so any future owner-only mutation can reuse it rather than each
 * one inventing its own toast.
 *
 * Fixed + a very high z-index so it stays visible even while the lightbox
 * (a `yet-another-react-lightbox` portal, default z-index 9999) is open —
 * PR 7's brief requires the confirmation to show without closing the
 * lightbox.
 */
export function ConfirmationToast({ message, tone = 'success' }: ConfirmationToastProps) {
  if (!message) return null

  const isError = tone === 'error'

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-6 flex justify-center px-4 sm:bottom-8"
      style={{ zIndex: 10000 }}
    >
      <div
        className="pointer-events-auto flex items-center gap-2.5 rounded-full border px-4 py-2.5 text-small shadow-2xl"
        style={{
          background: 'oklch(0.10 0.01 48 / 96%)',
          borderColor: 'var(--border)',
          color: 'var(--foreground)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
          style={{ background: isError ? 'oklch(0.62 0.17 28)' : 'var(--amber)' }}
        >
          {isError ? (
            <AlertTriangle className="h-3 w-3" style={{ color: 'oklch(0.98 0 0)' }} aria-hidden />
          ) : (
            <Check className="h-3 w-3" style={{ color: 'oklch(0.08 0.006 46)' }} aria-hidden />
          )}
        </span>
        {message}
      </div>
    </div>
  )
}
