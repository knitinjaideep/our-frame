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

const SectionHeader = ({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) => (
  <div className="mb-4 flex items-center justify-between gap-3">
    <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
    <div className="flex gap-2">{children}</div>
  </div>
);

export default function Gallery() {
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [rootFolderId, setRootFolderId] = useState<string | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

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

      if (!parentId && !rootFolderId && data?.parentId)
        setRootFolderId(data.parentId);
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
  const openFolder = (id: string) => loadChildren(id);
  const backToRoot = () => loadChildren(undefined);

  // Prefetch preview images for snappier next/prev in lightbox
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

  const FoldersView = () => (
    <>
      <SectionHeader title="Folders">
        <button
          onClick={refresh}
          disabled={loading}
          className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
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
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
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
        <div className="flex items-center justify-center rounded-2xl border bg-white/80 py-16">
          <div className="flex items-center gap-3 text-slate-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading folders…</span>
          </div>
        </div>
      )}

      {!loading && !error && (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {folders.map((f) => (
            <button
              key={f.id}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-800 shadow-sm hover:-translate-y-1 hover:border-slate-300 hover:shadow-md"
              onClick={() => openFolder(f.id)}
              title={f.name}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-indigo-500">
                <Album size={18} />
              </div>
              <span className="truncate">{f.name}</span>
            </button>
          ))}
          {folders.length === 0 && (
            <div className="col-span-full rounded-2xl border bg-white/80 p-6 text-center text-sm text-slate-600">
              <ImageIcon size={32} className="mx-auto mb-2 opacity-70" />
              <p className="font-medium">No folders found</p>
              <p className="text-xs opacity-80 mt-1">
                Create subfolders in your root Drive folder, then click Refresh.
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );

  const PhotosView = () => (
    <>
      <SectionHeader title="Photos">
        <div className="flex gap-2">
          <button
            onClick={backToRoot}
            className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            title="Back to folders"
          >
            <ChevronLeftCircle size={16} />
            Back
          </button>
          {photos.length > 0 && (
            <button
              onClick={openPreviewAll}
              className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              title="Preview all"
            >
              <Maximize2 size={16} />
              Preview All
            </button>
          )}
          <button
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
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

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
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
        <div className="flex items-center justify-center rounded-2xl border bg-white/80 py-16">
          <div className="flex items-center gap-3 text-slate-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading photos…</span>
          </div>
        </div>
      )}

      {!loading && !error && photos.length === 0 && (
        <div className="rounded-2xl border bg-white/80 p-6 text-center text-sm text-slate-600">
          <ImageIcon size={32} className="mx-auto mb-2 opacity-70" />
          <p className="font-medium">No photos in this folder</p>
          <p className="text-xs opacity-80 mt-1">
            Choose another folder or go back.
          </p>
        </div>
      )}

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

          {/* Download buttons on each card */}
          <div className="hidden" />
          {/* downloads are handled below in the lightbox overlay */}
        </div>
      )}

      {isPreviewOpen && photos.length > 0 && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/90"
          onClick={() => setIsPreviewOpen(false)}
        >
          <button
            className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              setIsPreviewOpen(false);
            }}
            title="Close"
          >
            <X size={18} />
          </button>
          <button
            className="lb-btn lb-prev absolute left-4 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            title="Previous"
          >
            <ChevronLeft size={22} />
          </button>

          <div
            className="max-h-[85vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewSrc(photos[previewIndex], 1600)}
              className="max-h-[85vh] rounded-xl object-contain"
              alt={photos[previewIndex].name}
            />
            <div className="mt-3 flex items-center justify-between text-xs text-slate-200">
              <span className="truncate pr-4">
                {photos[previewIndex].name}
              </span>
              <a
                className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[11px] font-medium hover:bg-white/25"
                href={API(
                  `/drive/file/${encodeURIComponent(
                    photos[previewIndex].id
                  )}/download`
                )}
                title="Download original"
                onClick={(e) => e.stopPropagation()}
              >
                <Download size={14} />
                Download
              </a>
            </div>
          </div>

          <button
            className="lb-btn lb-next absolute right-4 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            title="Next"
          >
            <ChevronRight size={22} />
          </button>
        </div>
      )}
    </>
  );

  return (
    <div className="space-y-6">
      {isAtRoot ? <FoldersView /> : <PhotosView />}
    </div>
  );
}
