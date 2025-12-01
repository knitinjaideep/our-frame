import { useEffect, useState } from "react";
import axios from "axios";
import type { Photo } from "../types";
import { PhotoGrid } from "../components/PhotoGrid";
import { Loader2, Heart } from "lucide-react";
import { getFavoritePhotoIds } from "../components/PhotoCard";

const API = (p: string) => `http://localhost:8000${p}`;

const thumbSrc = (p: Photo, size = 800) =>
  API(`/drive/file/${encodeURIComponent(p.id)}/thumbnail?s=${size}`);

export default function Favorites() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFavorites = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(API("/drive/children"));
      const files = (data?.files ?? []) as Photo[];
      const favoriteIds = new Set(getFavoritePhotoIds());
      const favoritesOnly = files.filter((f) => favoriteIds.has(f.id));
      setPhotos(favoritesOnly);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Failed to load favorites.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const hasFavorites = photos.length > 0;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-rose-400" />
          <h1 className="text-xl font-semibold text-slate-50">Favorites</h1>
        </div>
        <button
          onClick={loadFavorites}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 shadow-sm hover:bg-slate-800 disabled:opacity-60"
        >
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-rose-500/40 bg-rose-900/40 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      )}

      {!loading && !error && !hasFavorites && (
        <div className="grid place-items-center rounded-2xl border border-slate-800 bg-slate-900/60 py-16 text-center">
          <div>
            <Heart className="mx-auto mb-3 h-8 w-8 text-rose-400" />
            <p className="text-sm text-slate-100">No favorites yet.</p>
            <p className="mt-1 text-xs text-slate-500">
              Tap the heart on any photo to save it here.
            </p>
          </div>
        </div>
      )}

      {hasFavorites && (
        <PhotoGrid
          photos={photos}
          thumbSrc={(p) => thumbSrc(p, 600)}
          thumbSrcLg={(p) => thumbSrc(p, 1200)}
        />
      )}
    </div>
  );
}
