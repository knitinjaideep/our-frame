import { useState } from "react";
import type { Photo } from "../types";
import { Heart } from "lucide-react";

const FAVORITES_KEY = "ourframe_favorite_photo_ids";

function readFavoriteIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((x) => typeof x === "string");
    }
  } catch {
    // ignore
  }
  return [];
}

function writeFavoriteIds(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

/** Toggle favorite for a photo id, returns the new state (true = now favorite). */
export function toggleFavoritePhoto(id: string): boolean {
  const ids = new Set(readFavoriteIds());
  let isNowFavorite = false;

  if (ids.has(id)) {
    ids.delete(id);
    isNowFavorite = false;
  } else {
    ids.add(id);
    isNowFavorite = true;
  }

  writeFavoriteIds(Array.from(ids));
  return isNowFavorite;
}

export function isFavoritePhoto(id: string): boolean {
  return readFavoriteIds().includes(id);
}

export function getFavoritePhotoIds(): string[] {
  return readFavoriteIds();
}

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
  const [isFavorite, setIsFavorite] = useState<boolean>(() =>
    isFavoritePhoto(photo.id)
  );

  const createdDate = photo.createdTime
    ? new Date(photo.createdTime).toLocaleDateString()
    : "";

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = toggleFavoritePhoto(photo.id);
    setIsFavorite(newState);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl bg-slate-900/70 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      {/* Favorite heart */}
      <button
        type="button"
        onClick={handleFavoriteClick}
        className="absolute right-2 top-2 z-10 inline-flex items-center justify-center rounded-full bg-black/60 p-1.5 text-white shadow-md transition hover:bg-black/80"
      >
        <Heart
          className={`h-4 w-4 transition ${
            isFavorite ? "fill-rose-500 stroke-rose-500" : "stroke-slate-50"
          }`}
        />
      </button>

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
