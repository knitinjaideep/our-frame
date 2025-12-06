import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import type { Photo, DriveFolder } from "../types";
import {
  Loader2,
  RefreshCw,
  Album,
  Image as ImageIcon,
  ChevronLeftCircle,
  Maximize2,
  Download,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Zap, 
} from "lucide-react";
import { PhotoGrid } from "../components/PhotoGrid";

type ChildrenResponse = {
  parentId?: string;
  folders?: DriveFolder[];
  files?: Photo[];
  needsAuth?: boolean;
  authUrl?: string;
};

const API = (p: string) => `http://localhost:8000${p}`;

const thumbSrc = (p: Photo, size = 600) =>
  API(`/drive/file/${encodeURIComponent(p.id)}/thumbnail?s=${size}`);

const previewSrc = (p: Photo, width = 1600) =>
  API(`/drive/file/${encodeURIComponent(p.id)}/preview?w=${width}`);

const fullSrcOriginal = (p: Photo) => {
  const mt = p.mimeType?.toLowerCase() || "";
  return mt.includes("heic") || mt.includes("heif")
    ? p.webViewLink ?? ""
    : API(`/drive/file/${encodeURIComponent(p.id)}/content`);
};

// --- REDESIGNED SectionHeader (Kept as is) ---
const SectionHeader = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) => (
  <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-slate-700/50 pb-4">
    <div>
      <h2 className="text-3xl font-bold text-slate-50">{title}</h2>
      {subtitle && (
        <p className="text-sm text-slate-400 mt-1">{subtitle}</p>
      )}
    </div>
    <div className="flex gap-2">{children}</div>
  </div>
);
// --- END SectionHeader ---

export default function Gallery() {
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [rootFolderId, setRootFolderId] = useState<string | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [currentFolderName, setCurrentFolderName] = useState<string | null>(
    null
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  // albumId -> first Photo in that folder (or null if none)
  const [albumThumbs, setAlbumThumbs] = useState<Record<string, Photo | null>>(
    {}
  );

  const handleAuthBounce = (data: ChildrenResponse) => {
    if (data?.needsAuth && data?.authUrl) {
      window.location.href = API(data.authUrl);
      return true;
    }
    return false;
  };

  const loadChildren = async (parentId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = parentId
        ? API(`/drive/children?parentId=${encodeURIComponent(parentId)}`)
        : API("/drive/children");
      const { data } = await axios.get<ChildrenResponse>(url);
      if (handleAuthBounce(data)) return;

      if (!parentId && !rootFolderId && data?.parentId) {
        setRootFolderId(data.parentId);
      }

      setCurrentFolderId(data?.parentId ?? null);
      setFolders(data?.folders ?? []);
      setPhotos(data?.files ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load Drive items.");
      console.error("Drive load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChildren();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isAtRoot = !rootFolderId || currentFolderId === rootFolderId;

  const refresh = () => loadChildren(currentFolderId ?? undefined);

  const openFolder = (id: string, name?: string) => {
    if (name) setCurrentFolderName(name);
    loadChildren(id);
  };

  const backToRoot = () => {
    setCurrentFolderName(null);
    loadChildren(undefined);
  };

  // Prefetch preview images for snappier next/prev in lightbox (Kept as is)
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
      img.src = previewSrc(photos[i], 1600);
    });
  }, [isPreviewOpen, previewIndex, photos]);

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

  // Fetch a "cover photo" for each album (folder) for the album cards (Kept as is)
  useEffect(() => {
    if (!isAtRoot || folders.length === 0) return;

    const fetchThumbs = async () => {
      const toFetch = folders.filter(
        (f) => albumThumbs[f.id] === undefined
      );
      if (!toFetch.length) return;

      try {
        const results = await Promise.all(
          toFetch.map(async (f) => {
            try {
              const url = API(
                `/drive/children?parentId=${encodeURIComponent(f.id)}`
              );
              const { data } = await axios.get<ChildrenResponse>(url);
              if (handleAuthBounce(data)) return [f.id, null] as const;

              const firstPhoto = data?.files?.[0] ?? null;
              return [f.id, firstPhoto] as const;
            } catch (err) {
              console.error("Album thumb load error:", f.id, err);
              return [f.id, null] as const;
            }
          })
        );

        setAlbumThumbs((prev) => {
          const copy = { ...prev };
          results.forEach(([id, photo]) => {
            copy[id] = photo;
          });
          return copy;
        });
      } catch (err) {
        console.error("Album thumbs batch error:", err);
      }
    };

    fetchThumbs();
  }, [folders, isAtRoot, albumThumbs]);

  const FoldersView = () => (
    <>
      <SectionHeader
        title="All Albums"
        subtitle="Each album is a little time capsule. Tap to open and start flipping through memories."
      >
        <button
          onClick={refresh}
          disabled={loading}
          className="inline-flex items-center gap-1 rounded-full border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 shadow-lg hover:bg-slate-700 disabled:opacity-60 transition"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Refresh
        </button>
      </SectionHeader>

      {error && (
        <div className="rounded-2xl border border-rose-600/30 bg-rose-900/40 p-4 text-sm text-rose-100">
          <p className="mb-3">{error}</p>
          <button
            onClick={refresh}
            className="rounded-full bg-rose-600 px-3 py-1 text-xs font-medium text-white hover:bg-rose-700"
          >
            Try Again
          </button>
        </div>
      )}

      {loading && !error && (
        <div className="flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-800 py-16">
          <div className="flex items-center gap-3 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Gathering your albums…</span>
          </div>
        </div>
      )}

      {!loading && !error && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {folders.map((f) => {
            const cover = albumThumbs[f.id];
            const isLoadingCover = cover === undefined;

            return (
              <button
                key={f.id}
                className="group flex flex-col overflow-hidden rounded-3xl border border-slate-700 bg-slate-800 shadow-2xl transition hover:scale-[1.02] hover:border-pink-500/50 hover:shadow-pink-900/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
                onClick={() => openFolder(f.id, f.name)}
                title={f.name}
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-700">
                  {/* Loading shimmer */}
                  {isLoadingCover && (
                    <div className="h-full w-full animate-pulse bg-gradient-to-br from-slate-700 via-slate-800 to-slate-700" />
                  )}

                  {/* Real photo cover */}
                  {!isLoadingCover && cover && (
                    <img
                      src={thumbSrc(cover, 900)}
                      alt={f.name}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  )}

                  {/* Fun fallback cover if no photos */}
                  {!isLoadingCover && !cover && (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-pink-900/50 via-indigo-900/50 to-teal-900/50 text-slate-300">
                      <div className="mb-2 flex items-center gap-1 text-2xl">
                        <Zap className="text-teal-400"/>
                        <Album className="text-indigo-400"/>
                      </div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                        No photos yet
                      </p>
                    </div>
                  )}

                  {/* Overlay gradient + badge */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent px-4 pb-4 pt-8 text-left">
                    <div className="flex items-end justify-between gap-2">
                      <p className="max-w-[70%] text-xl font-bold text-white truncate">
                        {f.name}
                      </p>
                      <div className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-medium text-white shadow-sm backdrop-blur">
                        <Album className="h-3 w-3" />
                        <span>Open</span>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}

          {folders.length === 0 && (
            <div className="col-span-full rounded-3xl border border-slate-700 bg-slate-800 p-8 text-center text-sm text-slate-400">
              <div className="mb-3 flex items-center justify-center gap-2">
                <ImageIcon size={32} className="opacity-70 text-indigo-400" />
                <Sparkles size={18} className="opacity-80 text-pink-500" />
              </div>
              <p className="font-medium text-slate-50">No albums yet</p>
              <p className="mt-1 text-xs opacity-80">
                Create subfolders in your root Drive folder, then click
                <span className="font-semibold text-slate-200"> Refresh</span> to see them
                here.
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );

  const PhotosView = () => (
    <>
      <SectionHeader
        title={currentFolderName || "Photos"}
        subtitle={`Viewing album: ${currentFolderName}. Tap a photo to open the fullscreen viewer.`}
      >
        <div className="flex flex-wrap gap-2">
          <button
            onClick={backToRoot}
            className="inline-flex items-center gap-1 rounded-full border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 shadow-sm hover:bg-slate-700 transition"
            title="Back to albums"
          >
            <ChevronLeftCircle size={16} />
            Back to Albums
          </button>
          {photos.length > 0 && (
            <button
              onClick={openPreviewAll}
              className="inline-flex items-center gap-1 rounded-full border border-pink-500 bg-pink-600 px-3 py-1.5 text-xs font-medium text-white shadow-lg hover:bg-pink-700 transition"
              title="Preview all"
            >
              <Maximize2 size={16} />
              Fullscreen Slideshow
            </button>
          )}
          <button
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-full border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 shadow-sm hover:bg-slate-700 disabled:opacity-60 transition"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Refresh
          </button>
        </div>
      </SectionHeader>

      {/* Error / Loading / Empty State (Updated for dark theme) */}
      {error && (
        <div className="rounded-2xl border border-rose-600/30 bg-rose-900/40 p-4 text-sm text-rose-100">
          <p className="mb-3">{error}</p>
          <button
            onClick={refresh}
            className="rounded-full bg-rose-600 px-3 py-1 text-xs font-medium text-white hover:bg-rose-700"
          >
            Try Again
          </button>
        </div>
      )}

      {loading && !error && (
        <div className="flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-800 py-16">
          <div className="flex items-center gap-3 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading photos…</span>
          </div>
        </div>
      )}

      {!loading && !error && photos.length === 0 && (
        <div className="rounded-2xl border border-slate-700 bg-slate-800 p-6 text-center text-sm text-slate-400">
          <ImageIcon size={32} className="mx-auto mb-2 opacity-70 text-indigo-400" />
          <p className="font-medium text-slate-50">No photos in this album (yet!)</p>
          <p className="mt-1 text-xs opacity-80">
            Choose another album or go back to the albums overview.
          </p>
        </div>
      )}

      {/* Photo Grid */}
      {!loading && !error && photos.length > 0 && (
        <div className="space-y-4">
          <PhotoGrid
            photos={photos}
            thumbSrc={thumbSrc}
            thumbSrcLg={(p) => thumbSrc(p, 1200)}
            fullSrc={previewSrc}
            onPreview={(idx) => {
              setPreviewIndex(idx);
              setIsPreviewOpen(true);
            }}
          />
        </div>
      )}

      {/* Lightbox Preview (Kept as is) */}
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
            className="lb-btn lb-prev absolute left-6 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm transition"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            title="Previous"
          >
            <ChevronLeft size={28} />
          </button>

          {/* Image */}
          <div
            className="max-h-[90vh] max-w-[95vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
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
                href={API(
                  `/drive/file/${encodeURIComponent(
                    photos[previewIndex].id
                  )}/download`
                )}
                title="Download original"
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
            className="lb-btn lb-next absolute right-6 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm transition"
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
    </>
  );

  return (
    <div className="space-y-10">
      {/* Albums hero header (Kept as is) */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-600 via-sky-600 to-emerald-500 px-8 py-7 text-white shadow-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-[12px] font-semibold uppercase tracking-widest text-white backdrop-blur-sm">
              <Album className="h-4 w-4" />
              <span>THE ALBUMS</span>
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Kotcherlakota Family <span className="text-pink-200">Time Capsules</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm sm:text-base text-sky-50/90">
              Flip through seasons, milestones, and tiny everyday moments. 
              Pick an album below to dive in.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        {isAtRoot ? <FoldersView /> : <PhotosView />}
      </div>
    </div>
  );
}