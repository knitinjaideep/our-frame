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
  Archive,
  Calendar,
  Zap,
  RefreshCw,
  Lock,
  BookOpen, // Added BookOpen for Journaling
  Sparkles, // Added Sparkles for AI flair
} from "lucide-react";

// --- Utility Functions (Kept as is) ---
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

// --- Main Component ---
export default function Home() {
  const [allPhotos, setAllPhotos] = useState<Photo[]>([]);
  const [slideshowPhotos, setSlideshowPhotos] = useState<Photo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Load and Slideshow Logic (Kept as is) ---
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
  const totalMemories = allPhotos.length;
  const hasAnyPhotos = totalMemories > 0;

  const goPrev = () =>
    totalSlides && setCurrentIndex((i) => (i === 0 ? totalSlides - 1 : i - 1));

  const goNext = () =>
    totalSlides && setCurrentIndex((i) => (i + 1) % totalSlides);

  // --- Static Data for Navigation Example (Kept as is) ---
  const keyFolders = [
    { name: "Yearbooks", count: 12, icon: Calendar, color: "text-amber-400" },
    { name: "Family Trips", count: 8, icon: Zap, color: "text-blue-400" },
    { name: "Newborns", count: 4, icon: Heart, color: "text-red-400" },
    { name: "Videos", count: 15, icon: Film, color: "text-green-400" },
  ];

  return (
    <div className="space-y-16 pb-20">
      
      {/* 💖 HERO SECTION (Slideshow) */}
      <section className="relative h-[85vh] w-full overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 mt-6"> 
        {/* Slideshow Rendering Logic (Kept as is) */}
        {slideshowPhotos.map((photo, index) => {
          const isActive = index === currentIndex;
          return (
            <div
              key={photo.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                isActive ? "opacity-100" : "opacity-0"
              }`}
            >
              {/* Blurred backdrop */}
              <img
                src={thumbSrc(photo)}
                alt=""
                className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl opacity-30"
              />

              {/* Main image — Ken Burns style zoom */}
              <div className="relative z-10 flex h-full w-full items-center justify-center">
                <img
                  src={thumbSrc(photo)}
                  alt={photo.name}
                  className={`max-h-full max-w-full object-contain drop-shadow-2xl transition-transform duration-[6000ms] ease-out ${
                    isActive ? "scale-105" : "scale-100"
                  }`}
                />
              </div>
            </div>
          );
        })}

        {/* Vignette overlay */}
        <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/80 via-black/20 to-transparent" /> 

        {/* Text overlay (Centered and refined) */}
        <div className="absolute inset-x-0 bottom-16 z-30 flex flex-col items-center text-center text-slate-50">
          <h1 className="text-7xl font-extrabold leading-none tracking-tight drop-shadow-lg">
            The <span className="text-teal-400">Kotcherlakota</span> Vault
          </h1>
          <p className="mt-4 text-xl font-light max-w-3xl text-slate-200">
            Every moment, from the smallest smile to the biggest adventure, preserved safely here.
          </p>
        </div>

        {/* Prev/Next */}
        {totalSlides > 1 && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-6 top-1/2 z-30 -translate-y-1/2 rounded-full bg-black/40 p-3 backdrop-blur hover:bg-black/60"
            >
              <ChevronLeft className="text-white h-7 w-7" />
            </button>
            <button
              onClick={goNext}
              className="absolute right-6 top-1/2 z-30 -translate-y-1/2 rounded-full bg-black/40 p-3 backdrop-blur hover:bg-black/60"
            >
              <ChevronRight className="text-white h-7 w-7" />
            </button>
          </>
        )}

        {/* Index */}
        <div className="absolute bottom-6 right-6 z-30 rounded-full bg-black/50 px-3 py-1 text-xs text-white backdrop-blur">
          {totalSlides ? currentIndex + 1 : 0} / {totalSlides || 0}
        </div>

        {/* No photos message (Kept as is) */}
        {!current && !loading && !error && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center text-slate-300">
            <ImageIcon size={40} className="mb-4 opacity-70" />
            <p className="font-medium">No photos found yet.</p>
            <p className="mt-1 text-xs text-slate-500">
              Add photos to Google Drive and refresh!
            </p>
          </div>
        )}
      </section>

      {/* 🚀 SECTION 2: Quick Access/Key Albums (Kept with max-w) */}
      {hasAnyPhotos && (
        <section className="max-w-7xl mx-auto space-y-8 px-4">
          <h2 className="text-3xl font-bold text-slate-100 border-b border-slate-700/50 pb-2 flex items-center">
            <FolderOpen className="mr-3 text-pink-400 h-6 w-6" /> Quick Access Albums
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {keyFolders.map((folder) => (
              <div
                key={folder.name}
                className="p-6 rounded-2xl bg-slate-800 hover:bg-slate-700/70 transition duration-300 cursor-pointer border border-slate-700"
              >
                <folder.icon className={`h-8 w-8 mb-3 ${folder.color}`} />
                <h3 className="text-xl font-semibold text-slate-50">{folder.name}</h3>
                <p className="text-sm text-slate-400 mt-1">{folder.count} Collections</p>
              </div>
            ))}
          </div>
        </section>
      )}
      
      {/* 📅 SECTION 3: Featured Memories (Throwbacks) */}
      {hasAnyPhotos && (
        <section className="max-w-7xl mx-auto space-y-8 px-4">
          <h2 className="text-3xl font-bold text-slate-100 border-b border-slate-700/50 pb-2 flex items-center">
            <RefreshCw className="mr-3 text-teal-400 h-6 w-6" /> Throwbacks: On This Day
          </h2>
          <div className="p-8 bg-slate-800 rounded-2xl border border-slate-700 text-center">
            <p className="text-lg text-slate-300">
              Looking back at **December 5, 2019**...
            </p>
            <div className="mt-4 flex justify-center space-x-4">
               {/* Placeholder for fetching specific memory thumbnails */}
               <div className="h-40 w-40 rounded-lg bg-slate-700 flex items-center justify-center text-slate-400 text-sm">
                 [Image 1]
               </div>
               <div className="h-40 w-40 rounded-lg bg-slate-700 flex items-center justify-center text-slate-400 text-sm">
                 [Image 2]
               </div>
               <div className="h-40 w-40 rounded-lg bg-slate-700 flex items-center justify-center text-slate-400 text-sm">
                 [Image 3]
               </div>
            </div>
            <button className="mt-6 px-4 py-2 text-sm bg-pink-600 text-white rounded-full hover:bg-pink-700 transition">
              View Full Album
            </button>
          </div>
        </section>
      )}
      
      {/* 📚 SECTION 4: AI Journaling (COMING SOON - Phase 5) */}
      <section className="max-w-7xl mx-auto space-y-8 px-4">
          <h2 className="text-3xl font-bold text-slate-100 border-b border-slate-700/50 pb-2 flex items-center">
            <BookOpen className="mr-3 text-amber-400 h-6 w-6" /> Family Journal
          </h2>
          <div className="p-8 bg-slate-900/50 rounded-2xl border border-amber-600/50 text-center relative overflow-hidden">
            
            {/* Overlay for the 'Coming Soon' effect */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-10 rounded-2xl">
                <Sparkles className="h-10 w-10 text-amber-400 mb-3 animate-pulse" />
                <p className="text-xl font-bold text-amber-300">
                    Coming Soon: AI-Assisted Journaling (Phase 5)
                </p>
                <p className="mt-2 text-sm text-slate-400 max-w-md">
                    Automatically generate beautiful stories and titles for your events.
                </p>
            </div>
            
            {/* Mock content behind the overlay */}
            <p className="text-lg text-slate-300 opacity-20">
              Journal Entry: **Little Misha's First Steps**
            </p>
            <div className="mt-4 flex justify-center space-x-4 opacity-20">
               <div className="h-40 w-40 rounded-lg bg-slate-700 flex items-center justify-center text-slate-400 text-sm">
                 [Journal Photo 1]
               </div>
               <div className="h-40 w-40 rounded-lg bg-slate-700 flex items-center justify-center text-slate-400 text-sm">
                 [Journal Photo 2]
               </div>
            </div>
          </div>
      </section>


      {/* 📊 Memory Stats (Kept with max-w) */}
      {hasAnyPhotos && (
        <section className="max-w-7xl mx-auto py-6 px-4">
          <div className="flex justify-around p-6 rounded-2xl border border-slate-700 bg-slate-800/50">
            <div className="text-center">
              <Archive className="h-8 w-8 text-pink-400 mx-auto mb-2" />
              <p className="text-4xl font-extrabold text-slate-50">{totalMemories.toLocaleString()}</p>
              <p className="text-sm text-slate-400">Memories Stored</p>
            </div>
            <div className="text-center">
              <FolderOpen className="h-8 w-8 text-indigo-400 mx-auto mb-2" />
              <p className="text-4xl font-extrabold text-slate-50">9</p> 
              <p className="text-sm text-slate-400">Folders to Explore</p>
            </div>
            <div className="text-center">
              <Calendar className="h-8 w-8 text-teal-400 mx-auto mb-2" />
              <p className="text-4xl font-extrabold text-slate-50">5+ Years</p>
              <p className="text-sm text-slate-400">Of History</p>
            </div>
          </div>
        </section>
      )}

      {/* Loading & Error */}
      {loading && !hasAnyPhotos && (
        <div className="flex items-center justify-center py-12 text-slate-300">
          <Loader2 className="mr-3 h-5 w-5 animate-spin" />
          Loading your memories…
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-600/30 bg-rose-900/40 px-4 py-3 text-rose-100 max-w-7xl mx-auto">
          {error}
        </div>
      )}

      {/* 🔒 FOOTER */}
      <footer className="mt-12 p-8 border-t border-slate-800 bg-slate-900/50 text-center text-slate-500">
        <p className="flex items-center justify-center">
            <Lock className="h-4 w-4 mr-2 text-green-500" />
            The Kotcherlakota Family &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}