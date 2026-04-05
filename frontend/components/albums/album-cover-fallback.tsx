/**
 * AlbumCoverFallback — elegant dark placeholder for albums with no resolved cover.
 * Uses a cinematic frame/aperture SVG icon — never a letter placeholder.
 */
export function AlbumCoverFallback({ name: _ }: { name: string }) {
  return (
    <div className="album-fallback" aria-hidden="true">
      {/* Layered warm dark gradient */}
      <div className="album-fallback__grad" />
      {/* Subtle frame outline */}
      <div className="album-fallback__frame" />

      {/* Cinematic frame icon — no letter, pure motif */}
      <div className="album-fallback__icon">
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: '2.6rem', height: '2.6rem' }}
        >
          {/* Outer frame */}
          <rect
            x="4" y="4" width="40" height="40" rx="3"
            stroke="url(#gold-grad)" strokeWidth="1.4" fill="none" opacity="0.55"
          />
          {/* Film sprocket holes — top row */}
          <rect x="7"  y="7"  width="4" height="5" rx="1" fill="url(#gold-grad)" opacity="0.35" />
          <rect x="14" y="7"  width="4" height="5" rx="1" fill="url(#gold-grad)" opacity="0.35" />
          <rect x="21" y="7"  width="4" height="5" rx="1" fill="url(#gold-grad)" opacity="0.35" />
          <rect x="28" y="7"  width="4" height="5" rx="1" fill="url(#gold-grad)" opacity="0.35" />
          <rect x="35" y="7"  width="4" height="5" rx="1" fill="url(#gold-grad)" opacity="0.35" />
          {/* Film sprocket holes — bottom row */}
          <rect x="7"  y="36" width="4" height="5" rx="1" fill="url(#gold-grad)" opacity="0.35" />
          <rect x="14" y="36" width="4" height="5" rx="1" fill="url(#gold-grad)" opacity="0.35" />
          <rect x="21" y="36" width="4" height="5" rx="1" fill="url(#gold-grad)" opacity="0.35" />
          <rect x="28" y="36" width="4" height="5" rx="1" fill="url(#gold-grad)" opacity="0.35" />
          <rect x="35" y="36" width="4" height="5" rx="1" fill="url(#gold-grad)" opacity="0.35" />
          {/* Center image area */}
          <rect
            x="7" y="15" width="34" height="18" rx="1.5"
            stroke="url(#gold-grad)" strokeWidth="1" fill="none" opacity="0.3"
          />
          {/* Simple mountain / horizon inside frame */}
          <path
            d="M10 30 L18 20 L24 26 L30 18 L38 30 Z"
            fill="url(#gold-grad)" opacity="0.18"
          />
          {/* Lens circle */}
          <circle cx="24" cy="24" r="3.5" stroke="url(#gold-grad)" strokeWidth="1" fill="none" opacity="0.4" />

          <defs>
            <linearGradient id="gold-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%"   stopColor="oklch(0.52 0.110 52)" />
              <stop offset="45%"  stopColor="oklch(0.70 0.145 58)" />
              <stop offset="60%"  stopColor="oklch(0.84 0.135 70)" />
              <stop offset="100%" stopColor="oklch(0.70 0.145 58)" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Grain overlay */}
      <div className="album-fallback__grain" />
    </div>
  )
}
