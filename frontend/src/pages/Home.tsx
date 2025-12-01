import { useEffect, useState } from "react";
import axios from "axios";
import type { Photo, DriveFolder } from "../types";
import {
  Loader2,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Film,
  FolderOpen,
  Heart,
} from "lucide-react";

const API = (p: string) => `http://localhost:8000${p}`;

type ChildrenResponse = {
  parentId?: string;
  folders?: DriveFolder[];
  files?: Photo[];
  needsAuth?: boolean;
  authUrl?: string;
};

const thumbSrc = (p: Photo, size = 1600) =>
  API(`/drive/file/${encodeURIComponent(p.id)}/thumbnail?s=${size}`);

export default function Home() {
  const [allPhotos, setAllPhotos] = useState<Photo[]>([]);
  const [slideshowPhotos, setSlideshowPhotos] = useState<Photo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuthBounce = (data: ChildrenResponse) => {
    if (data?.needsAuth && data?.authUrl) {
      window.location.href = API(data.authUrl);
      return true;
    }
    return false;
  };

  const selectRandomSlideshow = (photos: Photo[]) => {
    if (!photos.length) {
      setSlideshowPhotos([]);
      setCurrentIndex(0);
      return;
    }
    const shuffled = [...photos].sort(() => 0.5 - Math.random());
    const subset = shuffled.slice(0, 50);
    setSlideshowPhotos(subset);
    setCurrentIndex(0);
  };

  const loadAllPhotos = async () => {
    setLoading(true);
    setError(null);
    try {
      const rootRes = await axios.get<ChildrenResponse>(API("/drive/children"));
      const rootData = rootRes.data;
      if (handleAuthBounce(rootData)) return;

      const collected: Photo[] = [...(rootData.files ?? [])];
      const folders = rootData.folders ?? [];

      if (folders.length) {
        const responses = await Promise.all(
          folders.map((f) =>
            axios.get<ChildrenResponse>(
              API(`/drive/children?parentId=${encodeURIComponent(f.id)}`)
            )
          )
        );
        for (const r of responses) {
          const d = r.data;
          if (handleAuthBounce(d)) return;
          if (d.files?.length) collected.push(...d.files);
        }
      }

      setAllPhotos(collected);
      selectRandomSlideshow(collected);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Failed to load photos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllPhotos();
  }, []);

  useEffect(() => {
    if (!slideshowPhotos.length) return;
    const id = window.setInterval(() => {
      setCurrentIndex((prev) =>
        slideshowPhotos.length ? (prev + 1) % slideshowPhotos.length : 0
      );
    }, 5000);
    return () => window.clearInterval(id);
  }, [slideshowPhotos]);

  const current = slideshowPhotos[currentIndex] ?? null;
  const totalSlides = slideshowPhotos.length;
  const hasAnyPhotos = allPhotos.length > 0;

  const goPrev = () =>
    totalSlides && setCurrentIndex((i) => (i === 0 ? totalSlides - 1 : i - 1));

  const goNext = () =>
    totalSlides && setCurrentIndex((i) => (i + 1) % totalSlides);

  return (
    <div className="space-y-12 pb-10">

      {/* 🔥 HERO SECTION */}
      <section className="relative h-[70vh] w-full overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">

        {/* Blurred backdrop */}
        {current && (
          <img
            src={thumbSrc(current)}
            className="absolute inset-0 h-full w-full object-cover blur-2xl opacity-30 scale-110"
          />
        )}

        {/* Main image — fully contained */}
        {current && (
          <div className="relative z-10 flex h-full w-full items-center justify-center">
            <img
              src={thumbSrc(current)}
              alt={current.name}
              className="max-h-full max-w-full object-contain drop-shadow-2xl"
            />
          </div>
        )}

        {/* Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-20" />

        {/* Text overlay */}
        <div className="absolute bottom-6 left-6 z-30 text-slate-50">
          <h1 className="text-3xl font-semibold">Welcome Home 👋</h1>
          <p className="text-sm text-slate-300 mt-2">
            A fresh batch of your memories — 50 random moments.
          </p>
        </div>

        {/* Prev/Next */}
        {totalSlides > 1 && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-black/40 backdrop-blur p-3 rounded-full hover:bg-black/60"
            >
              <ChevronLeft className="text-white" />
            </button>
            <button
              onClick={goNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-black/40 backdrop-blur p-3 rounded-full hover:bg-black/60"
            >
              <ChevronRight className="text-white" />
            </button>
          </>
        )}

        {/* Index */}
        <div className="absolute bottom-6 right-6 z-30 bg-black/50 px-3 py-1 rounded-full text-xs text-white backdrop-blur">
          {currentIndex + 1} / {totalSlides || 1}
        </div>
      </section>

      {/* Loading */}
      {loading && !hasAnyPhotos && (
        <div className="flex items-center justify-center text-slate-300 py-12">
          <Loader2 className="h-5 w-5 animate-spin mr-3" />
          Loading your memories…
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-rose-900/40 border border-rose-600/30 px-4 py-3 text-rose-100">
          {error}
        </div>
      )}

      {/* Empty */}
      {!loading && !current && !error && (
        <div className="text-center py-20 rounded-2xl border border-slate-800 bg-slate-900/50 text-slate-300">
          <ImageIcon size={40} className="mx-auto mb-4 opacity-70" />
          <p className="font-medium">No photos found yet.</p>
          <p className="text-xs mt-1 text-slate-500">
            Add photos to Google Drive and refresh!
          </p>
        </div>
      )}

      {/* Memory Stats */}
      <section className="grid grid-cols-3 gap-4 text-center">
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 py-6">
          <p className="text-xl font-semibold text-slate-50">{allPhotos.length}</p>
          <p className="text-xs text-slate-400">Total Photos</p>
        </div>
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 py-6">
          <p className="text-xl font-semibold text-slate-50">{totalSlides}</p>
          <p className="text-xs text-slate-400">Slideshow</p>
        </div>
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 py-6">
          <p className="text-xl font-semibold text-slate-50">❤️</p>
          <p className="text-xs text-slate-400">Favorites (coming soon)</p>
        </div>
      </section>

      {/* Albums Preview (placeholder for now) */}
      <section>
        <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <FolderOpen size={18} /> Featured Albums (soon)
        </h2>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-slate-400 text-sm">
          Album preview section is coming soon…
        </div>
      </section>

      {/* Videos Coming Soon */}
      <section>
        <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Film size={18} /> Videos (coming soon)
        </h2>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-10 text-center text-slate-400">
          🎥 Video gallery will live here soon!
        </div>
      </section>
    </div>
  );
}
