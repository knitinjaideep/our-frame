import { useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { MediaItem } from "../types";

interface LightboxProps {
  item: MediaItem;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export default function Lightbox({ item, onClose, onPrev, onNext }: LightboxProps) {

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <button className="absolute top-6 right-6 p-2 bg-white/10 rounded-full">
        <X size={24} />
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
        className="absolute left-6 top-1/2 p-4 bg-white/10 rounded-full"
      >
        <ChevronLeft size={34} />
      </button>

      <div
        className="max-h-[85vh] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        {item.type === "video" ? (
          <video
            src={item.url}
            controls
            autoPlay
            className="rounded-xl max-h-[85vh]"
          />
        ) : (
          <img
            src={item.url}
            className="rounded-xl max-h-[85vh] object-contain"
          />
        )}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        className="absolute right-6 top-1/2 p-4 bg-white/10 rounded-full"
      >
        <ChevronRight size={34} />
      </button>
    </div>
  );
}
