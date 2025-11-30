import type { MediaItem } from "./types";

const mockData: MediaItem[] = [
  {
    id: "1",
    url: "https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=2070&auto=format&fit=crop",
    thumbnail: "https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=600&auto=format&fit=crop",
    title: "School Projects",
    date: "2023-11-15",
    type: "image",
    aspectRatio: 1.5,
  },
  {
    id: "2",
    url: "https://images.unsplash.com/photo-1602631985686-1bb0e2254d3b?q=80&w=2070&auto=format&fit=crop",
    thumbnail: "https://images.unsplash.com/photo-1602631985686-1bb0e2254d3b?q=80&w=600&auto=format&fit=crop",
    title: "Summer Vacation",
    date: "2023-07-20",
    type: "image",
    aspectRatio: 0.66,
  },
];

export default mockData;
