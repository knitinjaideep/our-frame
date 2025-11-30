import type { Photo } from "../types";
import { PhotoCard } from "./PhotoCard";

export function PhotoGrid({
  photos,
  thumbSrc,
  thumbSrcLg,
  fullSrc,
  onPreview,
}: {
  photos: Photo[];
  thumbSrc: (p: Photo, size?: number) => string;
  thumbSrcLg?: (p: Photo, size?: number) => string;
  fullSrc?: (p: Photo) => string;
  onPreview?: (index: number) => void;
}) {
  if (!photos.length) {
    return (
      <div className="grid place-items-center rounded-2xl border border-slate-200 bg-white/70 py-16 text-center">
        <div>
          <p className="text-sm text-slate-700">No photos yet.</p>
          <p className="text-xs text-slate-500">
            Add some images to your Google Drive folder and refresh.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {photos.map((p, i) => (
        <PhotoCard
          key={p.id}
          photo={p}
          thumbSrc={thumbSrc(p, 600)}
          thumbSrcLg={thumbSrcLg ? thumbSrcLg(p, 1200) : undefined}
          fullSrc={fullSrc ? fullSrc(p) : undefined}
          onClick={() => onPreview?.(i)}
        />
      ))}
    </div>
  );
}
