import { useEffect, useState } from "react";
import axios from "axios";
import type { DriveFolder } from "../types";
import { Album, Loader2, Image as ImageIcon } from "lucide-react";

const API = (p: string) => `http://localhost:8000${p}`;

export default function Albums() {
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAlbums = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(API("/drive/children"));
      const f = (data?.folders ?? []) as DriveFolder[];
      setFolders(f);
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

      {error && (
        <div className="mb-4 rounded-2xl border border-rose-500/40 bg-rose-900/40 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      )}

      {!loading && !error && folders.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-12 text-center text-slate-300">
          <ImageIcon size={40} className="mb-3 opacity-70" />
          <p className="font-medium">No albums yet.</p>
          <p className="mt-1 text-xs text-slate-500">
            Create folders in your configured Google Drive root folder to see
            them here.
          </p>
        </div>
      )}

      {folders.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {folders.map((album) => (
            <div
              key={album.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-sm hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex h-32 items-center justify-center bg-gradient-to-br from-indigo-600/40 to-slate-900">
                <Album className="h-9 w-9 text-indigo-100" />
              </div>
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
