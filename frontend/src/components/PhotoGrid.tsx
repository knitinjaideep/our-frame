import type { Photo } from '../types'
import { PhotoCard } from './PhotoCard'

export function PhotoGrid({
  photos,
  onPreview,
}: {
  photos: Photo[]
  onPreview?: (index: number) => void
}) {
  if (!photos.length) {
    return (
      <div className="grid place-items-center rounded-2xl border bg-white/70 py-16 text-center">
        <div>
          <p className="text-sm text-slate-600">No photos yet.</p>
          <p className="text-xs text-slate-500">Connect Google Drive to start.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {photos.map((p, i) => (
        <PhotoCard key={p.id} photo={p} onClick={() => onPreview?.(i)} />
      ))}
    </div>
  )
}
