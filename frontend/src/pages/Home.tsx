import { useEffect, useState } from "react";
import axios from "axios";
import type { Photo } from "../types";
import { PhotoGrid } from "../components/PhotoGrid";
import { Loader2, Image as ImageIcon } from "lucide-react";

const API = (p: string) => `http://localhost:8000${p}`;

const thumbSrc = (p: Photo, size = 800) =>
  API(`/drive/file/${encodeURIComponent(p.id)}/thumbnail?s=${size}`);

export default function Home() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRootPhotos = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(API("/drive/children"));
      const files = (data?.files ?? []) as Photo[];
      setPhotos(files);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Failed to load photos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRootPhotos();
  }, []);

  const hero = photos[0];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-50">
            Welcome back 👋
          </h1>
          <p className="text-sm text-slate-400">
            Your recent memories from Google Drive.
          </p>
        </div>
        <button
          onClick={loadRootPhotos}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 shadow-sm hover:bg-slate-800 disabled:opacity-60"
        >
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Refresh
        </button>
      </div>

      {loading && !photos.length && (
        <div className="mb-8 flex items-center justify-center rounded-3xl border border-slate-800 bg-slate-900/70 py-16 text-slate-300">
          <Loader2 className="mr-3 h-5 w-5 animate-spin" />
          Loading your memories…
        </div>
      )}

      {error && (
        <div className="mb-8 rounded-2xl border border-rose-500/40 bg-rose-900/40 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      )}

      {!loading && !hero && !error && (
        <div className="mb-8 flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-700 bg-slate-900/60 py-16 text-center text-slate-300">
          <ImageIcon size={40} className="mb-3 opacity-80" />
          <p className="font-medium">No photos yet in your root folder.</p>
          <p className="mt-1 text-xs text-slate-500">
            Add photos to your configured Google Drive folder and come back!
          </p>
        </div>
      )}

      {hero && (
        <div className="mb-10 h-[320px] overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70">
          <img
            src={thumbSrc(hero, 1600)}
            className="h-full w-full object-cover"
            alt={hero.name}
          />
        </div>
      )}

      {photos.length > 1 && (
        <PhotoGrid
          photos={photos.slice(1)}
          thumbSrc={(p) => thumbSrc(p, 600)}
          thumbSrcLg={(p) => thumbSrc(p, 1200)}
        />
      )}
    </div>
  );
}
