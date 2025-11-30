import type { Photo } from "../types";

interface PhotoCardProps {
  photo: Photo;
  thumbSrc: string;
  thumbSrcLg?: string;
  fullSrc?: string;
  onClick?: () => void;
}

export function PhotoCard({
  photo,
  thumbSrc,
  thumbSrcLg,
  onClick,
}: PhotoCardProps) {
  const createdDate = photo.createdTime
    ? new Date(photo.createdTime).toLocaleDateString()
    : "";

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl bg-slate-900/70 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      <img
        src={thumbSrcLg ?? thumbSrc}
        loading="lazy"
        decoding="async"
        className="h-52 w-full object-cover transition group-hover:scale-105"
        alt={photo.name}
      />

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 text-left">
        <p className="truncate text-sm font-medium text-slate-50">
          {photo.name}
        </p>
        {createdDate && (
          <p className="mt-0.5 text-[11px] font-normal text-slate-200/80">
            {createdDate}
          </p>
        )}
      </div>
    </button>
  );
}

export default PhotoCard;
