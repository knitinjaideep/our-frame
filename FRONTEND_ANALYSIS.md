# Our Frame — Frontend Analysis

A comprehensive breakdown of the frontend codebase for sharing context with AI tools or collaborators.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.2 (App Router) |
| UI Library | React 19.2.4 |
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
│   │   ├── featured-child-section.tsx  # Horizontal portrait strip (children/Arjun)
│   │   ├── arjun-section.tsx      # Alternative portrait strip variant
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

## Design System

### Color Palette (OKLCH dark theme)

| Token | Value | Description |
|---|---|---|
| `--background` | `oklch(0.128 0.007 48)` | Deep warm charcoal |
| `--foreground` | `oklch(0.942 0.010 68)` | Off-white |
| `--primary` | `oklch(0.72 0.105 62)` | Warm muted gold |
| `--amber` | `oklch(0.74 0.130 63)` | Warm gold accent |
| `--muted` | `oklch(0.245 0.010 55)` | Subtle backgrounds |
| `--destructive` | `oklch(0.704 0.191 22)` | Red |

Single cohesive dark warm cinematic theme — no light mode toggle.

### Typography

| Class | Spec | Usage |
|---|---|---|
| `.text-display` | clamp(3.25rem, 8vw, 6.5rem) — Playfair Display italic | Hero titles |
| `.text-display-sm` | clamp(2rem, 4vw, 3.5rem) — Playfair Display italic | Section titles |
| `.text-section-heading` | 1.25rem, 600 weight | Section headers |
| `.text-eyebrow` | 0.65rem, 800 weight, letter-spacing wide | Small labels |

- **Sans**: Geist (body, UI)
- **Serif**: Playfair Display italic (editorial headings)

### Layout

- **Editorial Rail**: 130px fixed left sidebar (desktop lg+)
- **Content Offset**: 160px padding-left to clear the rail
- **Breakpoints**: Mobile first → `md` (768px) → `lg` (1024px) → `xl` (1280px)
- **Cards**: `border-radius: 0.75rem`, warm box shadows

---

## Pages

### Home (`app/page.tsx`)

The main editorial experience. Sections render in sequence with scroll-triggered fade-in animations:

1. **Hero Slideshow** — full viewport, auto-advancing
2. **Memory Stats Strip** — total photos, albums, favorites, year range
3. **World Divider** — chapter label ("01 / Growing Up")
4. **Featured Child Section** — horizontal portrait scroll strip (Arjun albums)
5. **World Divider** — chapter label ("02 / Adventures")
6. **Travel Section** — hero card + secondary grid layout
7. **Favorites Strip** — horizontal strip of favorited photos
8. **World Divider** — chapter label ("03 / The Lens")
9. **Photography Section** — editorial grid portfolio
10. **World Divider** — chapter label ("04 / Throwbacks")
11. **Memory Strip** — "On This Day" throwback photos

Each section is wrapped in a `SectionReveal` component that triggers a fade+translateY animation when scrolled into view.

### Albums (`app/albums/page.tsx`)

Grid listing of all albums sourced from Google Drive. Shows total count in header, skeleton loader, and a helpful error state if the Drive connection is unavailable.

### Album Detail (`app/albums/[id]/page.tsx`)

Individual album view with photo grid, subfolders shown as nested album cards.

### Favorites (`app/favorites/page.tsx`)

Collection of all photos the user has hearted. Empty state shows an encouraging message. Photo shapes are normalized from the `Favorite` type.

### Memories (`app/memories/page.tsx`)

"On This Day" throwback view. Photos grouped by year with a clock icon divider. Empty state with sparkle icon.

### Search (`app/search/page.tsx`)

Placeholder UI. States: "Metadata and keyword search coming soon. Semantic AI-powered discovery in a future release."

---

## Key Components

### Hero Slideshow (`components/home/hero-slideshow.tsx`)

Full-viewport cinematic carousel:
- Auto-advances every 10 seconds
- Manual prev/next arrow controls
- Dot indicator (up to 12 slides)
- **Ken Burns** zoom animation on each slide with varied origin points
- Outgoing slide fades out over 1400ms
- Multi-layer gradient overlay (bottom-heavy, cinematic)
- Responsive hero text: "Family Archive" eyebrow + family surname in display font
- Scroll indicator arrow at bottom
- Preloads next image in background
- Static gradient fallback for empty state

### Editorial Rail (`components/layout/editorial-rail.tsx`)

**Desktop (lg+):** Fixed left sidebar with:
- Curved right edge with backdrop blur + saturate filter
- Book icon logo + vertical "Our Frame" wordmark
- Four "Worlds" navigation items with staggered entry animation:
  - `01` Albums — The Archive
  - `02` Arjun — Growing Up
  - `03` Photography — The Lens
  - `04` Travel — Adventures
- Active item: amber glow indicator
- Hover: number and label brighten, sub-label fades in

**Mobile (< lg):** Top bar with:
- Logo + hamburger toggle
- Full-screen overlay menu
- World items with staggered slide-up animation
- Active state shown as amber dot

### Travel Section (`components/home/travel-section.tsx`)

Sophisticated editorial layout inspired by magazine spreads:
- Hero card (16:10 ratio) spanning 7/12 columns
- Secondary 2-card grid (4:3 ratio) spanning 5/12 columns
- Year extracted from album name (e.g. "Japan 2023" → "2023" badge)
- Overflow horizontal strip for 5+ albums
- Cinematic gradient with amber bottom accent line
- MapPin placeholder icon when no thumbnail

### Photography Section (`components/home/photography-section.tsx`)

Editorial grid with visual rhythm:
- 2 columns mobile → 3 tablet → 4 desktop
- Alternating tall cards at positions 0 and 3 (`aspect-[3/4]` vs `aspect-square`)
- Minimal hover overlay (30% dark wash)
- Title fades in on hover with translateY effect
- Muted amber eyebrow at 70% opacity

### Featured Child Section (`components/home/featured-child-section.tsx`)

Horizontal scroll strip of portrait cards:
- First card is featured/wider; remaining cards are standard width
- Warm gradient overlay on each card
- Amber bottom accent line on hover
- Photo count label
- Links to album detail pages

---

## Data Architecture

### API Client (`lib/api-client.ts`)

Centralized fetch wrapper:
- Includes credentials (cookies) on all requests
- Auto-redirects to `/auth/start` on 401
- Custom `ApiError` class with status code
- Methods: `get<T>()`, `post<T>()`, `delete()`

Media URL helpers:
- `thumbnailUrl(id, size)` — thumbnail at given size
- `previewUrl(id, width)` — preview at given width
- `downloadUrl(id)` — full download URL
- `mediaUrl(url)` — resolves relative URLs

### React Query Setup

- Global `staleTime: 60_000` (1 minute)
- Retry: 1 attempt
- Query keys factory in `lib/query-keys.ts`

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

### TypeScript Types

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
| Scroll reveal | `framer-motion` `whileInView` + `once: true` | All home sections |
| Ken Burns | CSS `@keyframes` scale + translate | Hero slideshow slides |
| Hero crossfade | Framer Motion `AnimatePresence` | Slide transitions (1400ms) |
| Stagger children | `staggerChildren: 0.1` in parent variant | Nav items, grid items |
| Hover scale | `whileHover={{ scale: 1.02 }}` | Cards throughout |
| Skeleton shimmer | CSS `@keyframes shimmer` gradient | Loading states |
| Nav slide-up | `y: 20 → 0` with stagger | Mobile menu items |

---

## Current Limitations & Placeholders

- **Search page** — UI placeholder only, no functionality yet
- **Arjun section** — Two variants exist (`arjun-section.tsx` and `featured-child-section.tsx`), likely one is unused or being replaced
- **Sections API** — `use-sections.ts` fetches curated section data but not all home sections use it yet (some derive from `use-home-feed`)
- **HEIC support** — Backend handles conversion; frontend just consumes URLs
- **No light mode** — Single dark theme only

---

## What's Working Well

- **Editorial visual design** — Magazine-quality layout with Playfair Display serif headings, warm cinematic tones, and Ken Burns hero animation
- **Performance** — Skeleton loaders on all data-fetched views, image preloading in hero
- **Navigation** — Dual desktop/mobile nav with smooth animations and active state tracking
- **Favorites system** — Full toggle with optimistic UI and API persistence
- **Throwback memories** — "On This Day" grouped by year, ready for enrichment
- **Type safety** — Full TypeScript coverage across API layer, hooks, and components
- **Responsive** — Works well from mobile through widescreen desktop
