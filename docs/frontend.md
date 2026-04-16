# Frontend Architecture

A deep-dive reference for the Our Frame Next.js frontend.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| UI Library | React 19 |
| Styling | Tailwind CSS v4 + PostCSS |
| Animations | Framer Motion 12.x |
| Data Fetching | TanStack React Query v5 |
| Icons | Lucide React |
| Lightbox | Yet Another React Lightbox |
| URL State | nuqs |
| Type Safety | TypeScript 5 |

---

## File Structure

```
frontend/
├── app/                           # Next.js App Router pages
│   ├── page.tsx                   # Home page (hero + editorial sections)
│   ├── layout.tsx                 # Root layout with fonts, nav, providers
│   ├── globals.css                # Global styles, design tokens, dark theme
│   ├── albums/
│   │   ├── page.tsx               # Albums listing grid
│   │   └── [id]/page.tsx          # Album detail with photo grid
│   ├── favorites/
│   │   └── page.tsx               # Favorited photos collection
│   ├── memories/
│   │   └── page.tsx               # "On This Day" throwback memories
│   └── search/
│       └── page.tsx               # Search (placeholder, coming soon)
│
├── components/
│   ├── home/
│   │   ├── hero-slideshow.tsx     # Full-viewport Ken Burns carousel
│   │   ├── featured-child-section.tsx  # Horizontal portrait strip
│   │   ├── travel-section.tsx     # Editorial travel layout (hero + grid)
│   │   ├── photography-section.tsx # Photography portfolio grid
│   │   ├── favorites-strip.tsx    # Horizontal favorites strip
│   │   ├── memory-strip.tsx       # Memory stats display strip
│   │   └── memory-stats.tsx       # Stats component (counts)
│   ├── layout/
│   │   ├── editorial-rail.tsx     # Desktop fixed sidebar + mobile nav overlay
│   │   └── providers.tsx          # React Query provider wrapper
│   ├── photos/
│   │   ├── photo-grid.tsx         # Responsive photo grid
│   │   ├── photo-grid-skeleton.tsx # Loading skeleton
│   │   ├── photo-card.tsx         # Individual photo card with lightbox
│   │   └── favorite-button.tsx    # Heart toggle button
│   ├── albums/
│   │   ├── album-grid.tsx         # Album grid layout
│   │   ├── album-grid-skeleton.tsx # Loading skeleton
│   │   └── album-card.tsx         # Individual album card
│   └── ui/
│       ├── section-header.tsx     # Eyebrow + heading + subtitle header
│       ├── badge.tsx              # Badge/pill component
│       ├── button.tsx             # Button variants
│       └── skeleton.tsx           # Base skeleton loader
│
├── hooks/
│   ├── use-home-feed.ts           # Fetches hero photos, albums, throwbacks, stats
│   ├── use-favorites.ts           # Fetches & toggles favorites
│   ├── use-albums.ts              # Fetches albums list and album detail
│   └── use-sections.ts            # Fetches curated section data
│
├── lib/
│   ├── api-client.ts              # HTTP client, auth handling, media URL helpers
│   ├── query-keys.ts              # Centralized React Query key factory
│   └── utils.ts                   # Utility functions (cn, etc.)
│
└── types/
    └── index.ts                   # All TypeScript interfaces
```

---

## Pages

### Home (`app/page.tsx`)

The main editorial experience. Sections render in sequence with scroll-triggered fade-in animations:

1. **Hero Slideshow** — full viewport, auto-advancing
2. **Memory Stats Strip** — total photos, albums, favorites, year range
3. **World Divider** — chapter label ("01 / Growing Up")
4. **Featured Child Section** — horizontal portrait scroll strip
5. **World Divider** — chapter label ("02 / Adventures")
6. **Travel Section** — hero card + secondary grid layout
7. **Favorites Strip** — horizontal strip of favorited photos
8. **World Divider** — chapter label ("03 / The Lens")
9. **Photography Section** — editorial grid portfolio
10. **World Divider** — chapter label ("04 / Throwbacks")
11. **Memory Strip** — "On This Day" throwback photos

Each section is wrapped in a `SectionReveal` component that triggers a `fade + translateY` animation on scroll.

### Albums (`app/albums/page.tsx`)

Grid listing of all albums sourced from Google Drive. Shows total count in header, skeleton loader, and an error state if the Drive connection is unavailable.

### Album Detail (`app/albums/[id]/page.tsx`)

Individual album view with photo grid and nested subfolders shown as album cards.

### Favorites (`app/favorites/page.tsx`)

Collection of all photos the user has hearted. Photo shapes are normalized from the `Favorite` type.

### Memories (`app/memories/page.tsx`)

"On This Day" throwback view. Photos grouped by year with a clock icon divider.

### Search (`app/search/page.tsx`)

Placeholder UI. Metadata and keyword search coming in a future release.

---

## Key Components

### Hero Slideshow (`components/home/hero-slideshow.tsx`)

Full-viewport cinematic carousel:
- Auto-advances every 10 seconds
- Manual prev/next arrow controls
- Dot indicator (up to 12 slides)
- **Ken Burns** zoom animation with varied origin points per slide
- Outgoing slide fades out over 1400ms
- Multi-layer gradient overlay (bottom-heavy, cinematic)
- Responsive hero text with serif display font
- Preloads next image in background

### Editorial Rail (`components/layout/editorial-rail.tsx`)

**Desktop (lg+):** Fixed left sidebar with curved right edge, backdrop blur, and four "Worlds" navigation items with staggered entry animation.

**Mobile (< lg):** Top bar with hamburger toggle that opens a full-screen overlay menu.

### Travel Section (`components/home/travel-section.tsx`)

Magazine-spread-style layout:
- Hero card (16:10) spanning 7/12 columns
- Secondary 2-card grid (4:3) spanning 5/12 columns
- Year extracted from album name (e.g. `"Japan 2023"` → `"2023"` badge)
- Horizontal overflow strip for 5+ albums

### Photography Section (`components/home/photography-section.tsx`)

Editorial grid with visual rhythm:
- 2 columns mobile → 3 tablet → 4 desktop
- Alternating tall cards at positions 0 and 3

---

## Data Architecture

### API Client (`lib/api-client.ts`)

Centralized fetch wrapper:
- Includes credentials (cookies) on all requests
- Auto-redirects to `/auth/start` on 401
- Custom `ApiError` class with status code
- Methods: `get<T>()`, `post<T>()`, `delete()`

**Media URL helpers:**

| Helper | Description |
|---|---|
| `thumbnailUrl(id, size)` | Thumbnail at given pixel size |
| `previewUrl(id, width)` | Preview at given width |
| `downloadUrl(id)` | Full original download URL |
| `mediaUrl(url)` | Resolves relative URLs |

### React Query Setup

- Global `staleTime: 60_000` (1 minute)
- Retry: 1 attempt
- Centralized query key factory in `lib/query-keys.ts`

```typescript
queryKeys = {
  albums: { all, detail(id) },
  favorites: { all },
  homeFeed: { all },
  authStatus: { all },
  sections: { all },
}
```

### Custom Hooks

| Hook | Endpoint | staleTime |
|---|---|---|
| `useHomeFeed()` | `GET /home-feed` | 60s |
| `useAlbums()` | `GET /albums` | 60s |
| `useAlbumDetail(id)` | `GET /albums/:id` | 60s |
| `useFavorites()` | `GET /favorites` | 30s |
| `useSections()` | `GET /sections` | 5min |

---

## TypeScript Types

```typescript
interface Album {
  id: string;
  name: string;
  cover_photo_id: string | null;
  photo_count: number | null;
  thumbnail_url: string | null;
}

interface Photo {
  id: string;
  name: string;
  mime_type: string;
  created_time: string | null;
  thumbnail_url: string;
  preview_url: string;
  is_favorite: boolean;
  width: number | null;
  height: number | null;
}

interface Favorite {
  photo_id: string;
  photo_name: string;
  folder_id: string | null;
  favorited_at: string;
  thumbnail_url: string;
  preview_url: string;
}

interface MemoryStats {
  total_photos: number;
  total_albums: number;
  total_favorites: number;
  oldest_year: number | null;
  newest_year: number | null;
}

interface HomeFeed {
  hero_photos: Photo[];
  recent_albums: Album[];
  featured_albums: Album[];
  throwbacks: ThrowbackGroup[];
  stats: MemoryStats;
}

interface SectionsResponse {
  featured_child: Album[];
  travel: Album[];
  photography: Album[];
}
```

---

## Animation Patterns

| Pattern | Implementation | Usage |
|---|---|---|
| Scroll reveal | Framer Motion `whileInView` + `once: true` | All home sections |
| Ken Burns | CSS `@keyframes` scale + translate | Hero slideshow slides |
| Hero crossfade | Framer Motion `AnimatePresence` | Slide transitions (1400ms) |
| Stagger children | `staggerChildren: 0.1` in parent variant | Nav items, grid items |
| Hover scale | `whileHover={{ scale: 1.02 }}` | Cards throughout |
| Skeleton shimmer | CSS `@keyframes shimmer` gradient | Loading states |
| Nav slide-up | `y: 20 → 0` with stagger | Mobile menu items |

---

## Known Limitations

- **Search page** — UI placeholder only, no functionality yet
- **Sections API** — `use-sections.ts` fetches curated section data but some home sections still derive from `use-home-feed`
- **HEIC support** — Backend handles conversion; frontend just consumes image URLs
- **No light mode** — Single dark warm theme only
