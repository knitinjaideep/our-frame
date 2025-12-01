import { useEffect, useState } from "react";
import axios from "axios";
import type { DriveFolder, Photo } from "../types";
import { Album, Loader2, Image as ImageIcon } from "lucide-react";

const API = (p: string) => `http://localhost:8000${p}`;

type ChildrenResponse = {
  parentId?: string;
  folders?: DriveFolder[];
  files?: Photo[];
  needsAuth?: boolean;
  authUrl?: string;
};

type AlbumWithThumb = DriveFolder & {
  coverPhoto?: Photo | null;
};

const thumbSrc = (p: Photo, size = 800) =>
  API(`/drive/file/${encodeURIComponent(p.id)}/thumbnail?s=${size}`);

export default function Albums() {
  const [albums, setAlbums] = useState<AlbumWithThumb[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAlbums = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1) Get root folders (albums)
      const { data } = await axios.get<ChildrenResponse>(API("/drive/children"));
      const folders = (data?.folders ?? []) as DriveFolder[];

      if (folders.length === 0) {
        setAlbums([]);
        return;
      }

      // 2) For each folder, fetch its children and pick a photo as cover
      const requests = folders.map((f) =>
        axios.get<ChildrenResponse>(
          API(`/drive/children?parentId=${encodeURIComponent(f.id)}`)
        )
      );

      const responses = await Promise.all(requests);

      const albumsWithThumbs: AlbumWithThumb[] = folders.map((folder, idx) => {
        const folderData = responses[idx].data;
        const files = (folderData.files ?? []) as Photo[];
        // Choose first photo as cover (you could randomize if you like)
        const coverPhoto = files.length > 0 ? files[0] : null;

        return {
          ...folder,
          coverPhoto,
        };
      });

      setAlbums(albumsWithThumbs);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Failed to load albums.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlbums();
  }, []);

  return (
    <div className="px-2">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Album className="h-5 w-5 text-indigo-400" />
          <h1 className="text-xl font-semibold text-slate-50">Albums</h1>
        </div>
        <button
          onClick={loadAlbums}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 shadow-sm hover:bg-slate-800 disabled:opacity-60"
        >
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-2xl border border-rose-500/40 bg-rose-900/40 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && albums.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-12 text-center text-slate-300">
          <ImageIcon size={40} className="mb-3 opacity-70" />
          <p className="font-medium">No albums yet.</p>
          <p className="mt-1 text-xs text-slate-500">
            Create folders in your configured Google Drive root folder to see
            them here.
          </p>
        </div>
      )}

      {/* Albums grid */}
      {albums.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((album) => (
            <div
              key={album.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-sm hover:-translate-y-1 hover:shadow-md transition-transform"
            >
              {/* Thumbnail / fun fallback */}
              <div className="relative h-32 w-full overflow-hidden">
                {album.coverPhoto ? (
                  <>
                    <img
                      src={thumbSrc(album.coverPhoto, 800)}
                      alt={album.name}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  </>
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500/40 via-sky-500/30 to-emerald-500/40">
                    <span className="text-3xl">🎉</span>
                  </div>
                )}
              </div>

              {/* Text */}
              <div className="p-4">
                <h2 className="truncate text-sm font-semibold text-slate-50">
                  {album.name}
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Google Drive folder
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
