import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import type { Photo, DriveFolder } from "../types";
import { PhotoGrid } from "../components/PhotoGrid";
import { 
  Loader2, 
  Heart, 
  RefreshCw, 
  Zap,
  Maximize2, // For Fullscreen Slideshow button
  Download, // For Download button in Lightbox
  ChevronLeft, 
  ChevronRight,
  X,
} from "lucide-react";
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

const previewSrc = (p: Photo, width = 1600) =>
  API(`/drive/file/${encodeURIComponent(p.id)}/preview?w=${width}`);

// Function to get the original file download URL
const fullSrcOriginal = (p: Photo) => {
  const mt = p.mimeType?.toLowerCase() || "";
  // If it's a known non-standard type like HEIC/HEIF, link to webViewLink (if available)
  return mt.includes("heic") || mt.includes("heif")
    ? p.webViewLink ?? "" 
    : API(`/drive/file/${encodeURIComponent(p.id)}/content`);
};


export default function Favorites() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Lightbox/Slideshow State ---
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasFavorites = photos.length > 0;
  const favoriteCount = photos.length;

  // --- Slideshow Logic ---
  const next = useCallback(
    () => setPreviewIndex((i) => (i + 1) % photos.length),
    [photos.length]
  );
  const prev = useCallback(
    () => setPreviewIndex((i) => (i - 1 + photos.length) % photos.length),
    [photos.length]
  );
  const openPreviewAll = () => {
    if (photos.length) {
      setPreviewIndex(0);
      setIsPreviewOpen(true);
    }
  };
  
  // Prefetching logic (copied from Gallery.tsx)
  useEffect(() => {
    if (!isPreviewOpen || photos.length === 0) return;
    const ids = [
      previewIndex,
      (previewIndex + 1) % photos.length,
      (previewIndex - 1 + photos.length) % photos.length,
    ];
    ids.forEach((i) => {
      const img = new Image();
      img.decoding = "async";
      // Use a smaller size for prefetch since we only need preview
      img.src = previewSrc(photos[i], 1600); 
    });
  }, [isPreviewOpen, previewIndex, photos]);

  return (
    <div className="space-y-8">
      
      {/* 🌟 HERO: Title, Count, and Refresh Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-slate-700/50 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <Heart className="h-8 w-8 text-rose-500 fill-rose-500 drop-shadow-lg" />
            <h1 className="text-3xl font-bold text-slate-50">Favorites</h1>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
           {hasFavorites && (
            <button
              onClick={openPreviewAll}
              className="inline-flex items-center gap-1 rounded-full border border-pink-500 bg-pink-600 px-3 py-1.5 text-xs font-medium text-white shadow-lg hover:bg-pink-700 transition"
              title="Fullscreen Slideshow"
            >
              <Maximize2 size={16} />
              Start Slideshow
            </button>
          )}
          <button
            onClick={loadFavorites}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 shadow-md hover:bg-slate-700 transition disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh List
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-2xl border border-rose-600/30 bg-rose-900/40 p-4 text-sm text-rose-100">
          {error}
        </div>
      )}

      {/* Empty State (More prominent) */}
      {!loading && !error && !hasFavorites && (
        <div className="grid place-items-center rounded-3xl border border-slate-700 bg-slate-800/50 py-20 text-center shadow-xl">
          <div>
            <Heart className="mx-auto mb-4 h-10 w-10 text-rose-500 fill-rose-500 opacity-80" />
            <p className="text-lg font-semibold text-slate-100">Your favorite collection is empty.</p>
            <p className="mt-2 text-sm text-slate-400 max-w-sm">
              Start building your curated collection! Go to **Albums** and tap the heart icon on your most cherished photos.
            </p>
          </div>
        </div>
      )}

      {/* Photo Grid */}
      {hasFavorites && (
        <PhotoGrid
          photos={photos}
          thumbSrc={(p) => thumbSrc(p, 800)} 
          thumbSrcLg={(p) => thumbSrc(p, 1600)}
          onPreview={(idx) => { // Added click handler for PhotoGrid
            setPreviewIndex(idx);
            setIsPreviewOpen(true);
          }}
        />
      )}
      
      {/* Loading Spinner */}
      {loading && !error && !hasFavorites && (
         <div className="flex items-center justify-center py-12 text-slate-300">
           <Loader2 className="mr-3 h-5 w-5 animate-spin" />
           Loading your cherished memories...
         </div>
      )}

      {/* 🖼️ LIGHTBOX/FULLSCREEN PREVIEW (Copied from Gallery.tsx) */}
      {isPreviewOpen && photos.length > 0 && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/95" 
          onClick={() => setIsPreviewOpen(false)}
        >
          {/* Close */}
          <button
            className="absolute right-6 top-6 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 transition"
            onClick={(e) => {
              e.stopPropagation();
              setIsPreviewOpen(false);
            }}
            title="Close"
          >
            <X size={24} />
          </button>

          {/* Index badge */}
          <div className="pointer-events-none absolute left-6 top-6 rounded-full bg-white/15 px-3 py-1 text-sm font-medium text-slate-50 backdrop-blur">
            {previewIndex + 1} / {photos.length}
          </div>

          {/* Prev */}
          <button
            className="absolute left-6 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm transition"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            title="Previous"
          >
            <ChevronLeft size={28} />
          </button>

          {/* Image and Download Link */}
          <div
            className="max-h-[90vh] max-w-[95vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              // Use the previewSrc for large size, keeping the max-width reasonable
              src={previewSrc(photos[previewIndex], 1600)} 
              className="max-h-[90vh] rounded-xl object-contain shadow-2xl"
              alt={photos[previewIndex].name}
            />
            <div className="mt-4 flex items-center justify-between text-sm text-slate-200">
              <span className="truncate pr-4 text-slate-300 font-medium">
                {photos[previewIndex].name}
              </span>
              <a
                className="inline-flex items-center gap-1 rounded-full bg-pink-600/80 px-4 py-1.5 text-xs font-semibold hover:bg-pink-700 transition"
                href={fullSrcOriginal(photos[previewIndex])}
                title="Download original file"
                onClick={(e) => e.stopPropagation()}
                download
              >
                <Download size={14} />
                Download Original
              </a>
            </div>
          </div>

          {/* Next */}
          <button
            className="absolute right-6 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm transition"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            title="Next"
          >
            <ChevronRight size={28} />
          </button>
        </div>
      )}
      
    </div>
  );
}