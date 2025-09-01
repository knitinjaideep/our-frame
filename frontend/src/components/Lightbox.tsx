export function Lightbox({
    src,
    onClose,
    onPrev,
    onNext,
  }: {
    src: string
    onClose: () => void
    onPrev: () => void
    onNext: () => void
  }) {
    return (
      <div
        className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
        onClick={onClose}
        role="dialog"
        aria-modal
      >
        <img
          src={src}
          alt=""
          className="max-h-[90vh] max-w-[92vw] object-contain"
          onClick={(e) => e.stopPropagation()}
          decoding="async"
          fetchPriority="high"
        />
  
        <button
          className="absolute top-4 right-4 rounded-xl bg-white/90 px-3 py-2 text-xs font-semibold shadow"
          onClick={(e) => { e.stopPropagation(); onClose() }}
        >
          Close
        </button>
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 rounded-xl bg-white/90 px-3 py-2 text-xs font-semibold shadow"
          onClick={(e) => { e.stopPropagation(); onPrev() }}
        >
          Prev
        </button>
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-xl bg-white/90 px-3 py-2 text-xs font-semibold shadow"
          onClick={(e) => { e.stopPropagation(); onNext() }}
        >
          Next
        </button>
      </div>
    )
  }
  