import { useEffect, useState } from "react";
import axios from "axios";
import type { Photo, DriveFolder } from "../types";
import { PhotoGrid } from "../components/PhotoGrid";
import { Loader2, Heart } from "lucide-react";
import { getFavoritePhotoIds } from "../components/PhotoCard";

const API = (p: string) => `http://localhost:8000${p}`;

type ChildrenResponse = {
  parentId?: string;
  folders?: DriveFolder[];
  files?: Photo[];
  needsAuth?: boolean;
  authUrl?: string;
};

const thumbSrc = (p: Photo, size = 800) =>
  API(`/drive/file/${encodeURIComponent(p.id)}/thumbnail?s=${size}`);

export default function Favorites() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuthBounce = (data: ChildrenResponse) => {
    if (data?.needsAuth && data?.authUrl) {
      window.location.href = API(data.authUrl);
      return true;
    }
    return false;
  };

  const loadFavorites = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1) Get root children (same as Home/Gallery)
      const rootRes = await axios.get<ChildrenResponse>(API("/drive/children"));
      const rootData = rootRes.data;
      if (handleAuthBounce(rootData)) return;

      const allPhotos: Photo[] = [...(rootData.files ?? [])];
      const folders = (rootData.folders ?? []) as DriveFolder[];

      // 2) For each album folder, fetch its children and collect photos
      if (folders.length) {
        const responses = await Promise.all(
          folders.map((f) =>
            axios.get<ChildrenResponse>(
              API(`/drive/children?parentId=${encodeURIComponent(f.id)}`)
            )
          )
        );

        for (const r of responses) {
          const data = r.data;
          if (handleAuthBounce(data)) return;
          if (data.files?.length) {
            allPhotos.push(...(data.files as Photo[]));
          }
        }
      }

      // 3) Filter to only favorites (selected in Gallery/PhotoCard)
      const favoriteIds = new Set(getFavoritePhotoIds());
      const favoritesOnly = allPhotos.filter((f) => favoriteIds.has(f.id));

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
              Tap the heart on any photo in your albums to save it here.
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
