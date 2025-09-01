import type { Photo } from '../types'

type Props = {
  photo: Photo
  /** optional: explicit thumbnail URL (proxy) */
  thumbSrc?: string
  /** optional: larger thumbnail URL for hi-DPI */
  thumbSrcLg?: string
  /** optional: full/previewsrc for lightbox */
  fullSrc?: string
  onClick?: () => void
}

export function PhotoCard({ photo, thumbSrc, thumbSrcLg, fullSrc, onClick }: Props) {
  // Fallbacks in case caller forgets to pass custom URLs
  const fallback = `http://localhost:8000/drive/file/${encodeURIComponent(photo.id)}/content`
  const small = thumbSrc ?? photo.thumbnailLink ?? fallback
  const large = thumbSrcLg ?? small

  return (
    <div className="group overflow-hidden rounded-2xl border bg-card shadow-sm">
      <button onClick={onClick} className="block w-full" title="Preview">
        <div className="aspect-[4/3] w-full overflow-hidden bg-muted/40">
          <img
            src={small}
            srcSet={`${small} 600w, ${large} 1200w`}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 25vw"
            alt={photo.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </button>

      <div className="p-3">
        <p className="truncate text-sm font-medium text-slate-900">{photo.name}</p>
        <p className="mt-0.5 text-xs text-slate-600">{photo.mimeType}</p>
        <div className="mt-2 flex justify-end">
          <a
            href={photo.webViewLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-xl border px-2 py-1 text-xs hover:bg-black/5"
          >
            Open in Drive
          </a>
        </div>
      </div>
    </div>
  )
}
