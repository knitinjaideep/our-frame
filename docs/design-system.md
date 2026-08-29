# Our Frame — Design System

> **Status (2026-08-29):** Superseded direction. The "Premium Cinematic
> System" below (added in PR 1 of the redesign,
> `docs/redesign/PROMPTS.md`/`docs/redesign/MILESTONES.md`) is now the
> single source of truth for new work. The original "Warm Memory Book"
> section further down is kept for historical reference only — do not
> invent new tokens from it. See the "Ruling: design-system direction
> change" note in `docs/redesign/MILESTONES.md`.

---

# Part 1 — Premium Cinematic System (current)

> **Emotional goal:** A private, cinematic evening spent with a beautifully
> bound family archive — near-black, intimate, editorial, photo-first.
> Not a SaaS dashboard, not Instagram, not Netflix, not an orange/black
> theme template.

## 1. Design Direction

Dark-first, near-black, warm-charcoal surfaces. A restrained antique
bronze/gold accent (~5–10% of the visual experience) is used only for
labels, active-state indicators, and small icon accents — never as a
dominant fill. Photography is always the star; UI chrome stays quiet.

This app is dark-only (see `app/layout.tsx` — `className="dark"`,
"no light/dark switching"). Three internal presets exist as CSS
`data-theme` variants (`warm_dark` default, `cool_dark`, `soft_light`) for
possible future use, but the shipped experience is `warm_dark`.

## 2. Semantic Color Tokens

All tokens live in `frontend/app/globals.css` under `:root` /
`[data-theme="warm_dark"]` and are bridged into Tailwind via `@theme inline`.
**Always consume them through semantic Tailwind classes or `var(--token)` —
never hardcode hex/oklch values in component code** (existing legacy inline
`oklch(...)` usage predates this rule and is being phased out, not a
pattern to copy).

| Concept (brief) | Token(s) | Tailwind class |
|---|---|---|
| Background primary (very deep charcoal) | `--background` | `bg-background` |
| Background elevated (cards/panels) | `--card` | `bg-card` |
| Background muted (subtle fills, tab bars) | `--muted` | `bg-muted` |
| Text primary (warm ivory) | `--foreground` | `text-foreground` |
| Text secondary (muted warm gray) | `--muted-foreground` | `text-muted-foreground` |
| Accent — restrained antique bronze | `--amber`, `--primary` | `text-amber`, `bg-primary` |
| Accent subtle fill (icon containers) | `--amber-muted` | `bg-amber-muted` |
| Accent hover/border | `--amber-border`, `--amber-hover` | `border-amber` |
| Border (low-opacity warm gray) | `--border` | `border-border` |
| Destructive | `--destructive` | `text-destructive` / `bg-destructive/5` |
| Focus ring | `--ring` | `outline-ring/50`, `:focus-visible` |

Reference values (warm_dark): background `oklch(0.118 0.010 46)` (near-black
warm charcoal), card `oklch(0.155 0.012 48)` (elevated), foreground
`oklch(0.948 0.012 72)` (warm ivory), accent `oklch(0.70 0.145 58)`
(bronze-gold), border `oklch(1 0 0 / 7%)` (near-invisible).

**Bronze accent rule:** icons, eyebrow labels, active-nav indicators, and
occasional small highlights only. Never a background fill on large
surfaces, never on error states, never more than 2–3 visible bronze
elements on screen at once.

## 3. Typography

- **Serif display** (`--font-serif`, Playfair Display): page titles, H1/H2,
  emotional headings, quotes, album/chapter titles.
- **Sans body/UI** (`--font-sans`, Geist Sans): navigation, metadata,
  buttons, controls, body copy.
- Avoid excessive uppercase — reserve it for small editorial eyebrow labels
  (`.text-eyebrow`, `.text-eyebrow-gold`).

Typography scale (utility classes in `app/globals.css`):

| Token / class | Size | Use |
|---|---|---|
| `.text-display` | 56–120px (`clamp(3.5rem, 9vw, 7.5rem)`) | Hero slideshow title only |
| `.text-h1` | 44–60px (`clamp(2.75rem, 5.2vw, 3.75rem)`) | Page titles (serif) |
| `.text-h2` | 32–40px (`clamp(2rem, 3.6vw, 2.5rem)`) | Section titles (serif) |
| `.text-h3` | 24–30px (`clamp(1.5rem, 2.4vw, 1.875rem)`) | Sub-section titles (sans) |
| `.text-body` | 15px | Body copy (sans) |
| `.text-small` | 13px | Metadata / captions (sans, muted) |
| `.text-eyebrow` / `.text-eyebrow-gold` | ~10px, tracked, uppercase | Eyebrow labels |

## 4. Spacing, Layout, Radius, Shadow, Motion Tokens

Defined in `app/globals.css` (`:root`), theme-agnostic:

- **Spacing:** `--space-1` (4px) through `--space-24` (96px). Interior page
  container: `--container-max` (88rem / 1408px) — use `content-padding`
  utility for responsive side padding. Photography pages may exceed this
  width where visual impact benefits (see `docs/redesign/PROMPTS.md`).
- **Radius:** `--radius: 0.75rem` (12px) base, scaled via
  `--radius-sm`/`md`/`lg`/`xl`/`2xl`/`3xl` (`rounded-sm` … `rounded-3xl`).
  Target 12–20px (`rounded-lg`/`rounded-xl`) for most components; larger
  radii (`rounded-2xl`/`3xl`) are reserved for big surfaces (hero,
  full-bleed cards) per section 8 below.
- **Shadow:** extremely restrained — `shadow-warm` (resting) /
  `shadow-warm-hover` (hover) map to `--shadow-card` /
  `--shadow-card-hover`, both plain neutral drop shadows (no colored glow).
  Prefer contrast/layering/spacing over visible elevation. Never use raw
  `shadow-xl`/`shadow-2xl` or colored glow shadows on new components.
- **Motion:** `--motion-fast` (165ms, micro-interactions), `--motion-standard`
  (260ms, default transitions), `--motion-slow` (520ms, editorial
  reveals/image transitions), `--ease-standard` /`--ease-in-out` easing
  curves. Global `@media (prefers-reduced-motion: reduce)` rule collapses
  all animation/transition durations to near-zero. Components using
  framer-motion should also call `useReducedMotion()` and skip
  transform/opacity animation when true (see `TopNav`).
  - Allowed: tiny scale (1–2%), opacity, translate 2–6px, slow image reveal.
  - Avoid: bouncing/spring physics, exaggerated parallax, glowing animation.

## 5. Buttons

Defined in `components/ui/button.tsx` (`cva` variants) — extend this file,
don't add a parallel button component.

| Variant | Recipe |
|---|---|
| Primary (`variant="default"`) | `bg-primary text-primary-foreground` — warm bronze background, dark text, restrained radius |
| Secondary (`variant="outline"`/`"secondary"`) | transparent/subtle-fill, `border-border`, cream text |
| Tertiary | Plain text + arrow — use the `TextLink` primitive, not a `Button` variant |

Avoid stacking multiple prominent buttons on one screen.

## 6. Icon Library

`lucide-react` — the one consistent thin-line icon library already used
throughout the app (nav, buttons, empty states). Do not introduce a second
icon library. No emoji anywhere in the UI.

## 7. Reusable Component Primitives (PR 1)

Live in `frontend/components/design-system/` (barrel export
`components/design-system/index.ts`), except where an existing component
was extended in place:

| Component | Location | Notes |
|---|---|---|
| `PageIntro` | `design-system/page-intro.tsx` | Eyebrow + H1 + description + quiet action |
| `EditorialEyebrow` | `design-system/editorial-eyebrow.tsx` | Small tracked uppercase label |
| `ChapterCard` | `design-system/chapter-card.tsx` | Photo-led chapter tile (Home rail / Photos mosaic) |
| `PhotoGrid` | `components/photos/photo-grid.tsx` | Pre-existing; extended in later PRs, not duplicated |
| `MasonryGallery` | `design-system/masonry-gallery.tsx` | CSS-columns masonry, real aspect ratios preserved |
| `GalleryTabs` | `design-system/gallery-tabs.tsx` | Elegant text tabs, restrained bronze underline |
| `PhotoLightbox` | `design-system/photo-lightbox.tsx` | Thin contract wrapper around `ResilientLightbox`; PR 5 redesigns the visual language in place |
| `EmptyState` | `design-system/empty-state.tsx` | Centered editorial empty state |
| `SectionHeading` | `components/ui/section-header.tsx` (`SectionHeading` export, alias of `SectionHeader`) | Eyebrow + title + subtitle + action |
| `TextLink` | `design-system/text-link.tsx` | Tertiary "text + arrow" action |
| `IconButton` | `design-system/icon-button.tsx` | Restrained circular icon control (ghost / translucent) |
| `FeaturedStory` | `design-system/featured-story.tsx` | Large photo + editorial statement |
| `TimelineEntry` | `design-system/timeline-entry.tsx` | Alternating date/title/photo chronological entry |

`FeaturedStory`, `TimelineEntry`, `MasonryGallery`, and `PhotoLightbox` ship
in PR 1 as visual primitives with stable prop contracts; real page content
is wired up in PR 4/5/6/9 per `docs/redesign/MILESTONES.md`.

## 8. Navigation

`components/layout/top-nav.tsx` (desktop) — slim bar, brand left, links
center, avatar right. Two variants via `data-variant` on `.top-nav`:

- `transparent` — floats over the Home hero (`/home` route only): no solid
  background, subtle top-down gradient wash for legibility, no border.
- `solid` — near-black surface (`oklch(0.09 0.006 46 / 96%)`) with a
  1px `border-border` bottom divider, used on every other interior page.

Active state: a 1.5px restrained bronze underline (`.top-nav__active-bar`,
`opacity: 0.8`, no box-shadow/glow) — never a thick glowing underline. Hover
state brightens link text and adds a near-invisible background tint; it
never fills the link with a solid bronze block.

Photos/Videos use elegant floating dropdown menus (`.nav-dropdown`):
generous padding, `border-border`, restrained shadow, no aggressive glow.

Mobile: hamburger opens a full-screen sheet (`.mobile-sheet`) with large
serif links (Home, Photos, Videos, Favorites, Memories), an inline
accordion under Photos/Videos for sub-destinations (Arjun/Travel/
Milestones/Life, All Photos), and a quiet profile row (avatar, settings,
sign out) at the bottom. No bottom tab bar, no nested dropdown-in-dropdown.

## 9. Accessibility

- Global `:focus-visible` outline (`app/globals.css`, base layer) using
  `--ring` — every interactive element gets a visible keyboard focus ring.
- Icon-only controls (`IconButton`) require a `label` prop, used as
  `aria-label`/`title`.
- Nav uses `aria-current="page"`, `aria-expanded` on dropdown/accordion
  triggers, and `role="dialog"`/`aria-modal` on the mobile sheet.
- `prefers-reduced-motion: reduce` is respected globally (see section 4)
  and explicitly in components that drive framer-motion animations.
- Maintain sufficient contrast between `--foreground`/`--muted-foreground`
  and `--background`/`--card` when introducing new text/surface pairings.
- Provide descriptive `alt` text for all photo/video imagery where the
  API/data provides a name or caption.

## 10. Anti-Patterns (carried forward, still apply)

Semantic tokens over hardcoded values, `skeleton-shimmer` over
`animate-pulse`, no raw `shadow-xl`/`shadow-2xl` on cards, no more than 2–3
bronze accents visible at once, no emoji. See the "Anti-Patterns to Avoid"
table in Part 2 below — it still applies verbatim under the new palette.

---

# Part 2 — Warm Memory Book (superseded, historical reference)

The following was the original light+dark amber design system. It has been
superseded by the Premium Cinematic System above as of PR 1
(2026-08-29). Component recipes, spacing rhythm, and anti-pattern guidance
below are still broadly useful as *structural* reference (grid gaps, hover
lift amounts, etc.) — but color/typography/shadow specifics should defer to
Part 1.

---

## 1. Design Direction

**Light mode:** warm cream paper, premium photo album, soft natural daylight, editorial and intimate.
**Dark mode:** warm cinematic evening, espresso charcoal studio, immersive photo viewing, soft luxury.

Neither mode is an inversion of the other. Both are intentionally designed.

---

## 2. Semantic Token Usage

**Always use semantic tokens. Never hardcode hex or arbitrary Tailwind color values.**

| Token | Use |
|---|---|
| `bg-background` | Page background |
| `bg-card` | Elevated surfaces: cards, panels |
| `bg-muted` | Subtle surface fills, tab bars, inputs |
| `bg-sidebar` | Navigation sidebar |
| `text-foreground` | Primary body text |
| `text-card-foreground` | Text inside card surfaces |
| `text-muted-foreground` | Secondary/supporting text |
| `border-border` | Default borders |
| `bg-primary` / `text-primary-foreground` | Primary CTA buttons |
| `bg-secondary` | Muted action buttons |
| `bg-accent` | Hover states on nav items |
| `var(--amber)` | Brand accent: icons, active states, highlights |
| `var(--amber-muted)` | Icon container backgrounds |
| `var(--amber-border)` | Hover borders on interactive cards |
| `shadow-warm` | Card resting shadow |
| `shadow-warm-hover` | Card hovered shadow |
| `skeleton-shimmer` | CSS class for loading shimmer |

---

## 3. Color Palette Quick Reference

### Light Mode
```
background:       #F6F3EF — warm ivory
foreground:       #2C2C28 — deep charcoal
card:             #FEFCFA — near-white
muted:            #EFE7DE — warm parchment
muted-foreground: #6F6A63 — warm medium gray
primary:          #C8A97E — warm sand/tan
secondary:        #E8DED2 — warm beige
border:           #E5DCD3 — soft warm border
amber (brand):    warm gold
```

### Dark Mode
```
background:       #1A1816 — warm charcoal (NOT pure black)
foreground:       #F5F3F0 — warm near-white
card:             #23201D — cocoa charcoal
muted:            #2A2622 — warm dark taupe
muted-foreground: #B8B2AA — warm light gray
primary:          #D6B98C — muted warm gold
secondary:        #3A342F — warm dark taupe
border:           white/7% — subtle warm border
amber (brand):    bright warm gold
```

---

## 4. Typography Rules

- **Body font:** Geist Sans (default, sans-serif, highly readable)
- **Serif accents:** Playfair Display — use **only** for:
  - Hero slideshow title (`font-serif italic`)
  - Special editorial moments
  - Do NOT use for body text, buttons, or general UI
- **Headings:** `font-semibold tracking-tight` — not bold, not thin
- **Eyebrows:** `text-eyebrow` class — small caps, amber color
- **Section titles:** `text-section-heading` class or `text-xl font-semibold`
- **Page titles:** `text-3xl font-semibold tracking-tight text-foreground`

---

## 5. Spacing & Layout

- **Page container:** `max-w-7xl mx-auto px-5 md:px-10 lg:px-14`
- **Section spacing:** `space-y-14` between major sections
- **Inner section spacing:** `space-y-6` within a section
- **Grid gaps:** `gap-4` for album cards, `gap-2` for photo grids
- **Cards:** `p-4` or `px-4 py-3.5`
- **Whitespace is intentional** — don't compress sections. Let the app breathe.

---

## 6. Component Recipes

### Card (base)
```tsx
<div className="rounded-2xl border border-border bg-card shadow-warm transition-all duration-300 hover:shadow-warm-hover hover:-translate-y-0.5">
  {/* content */}
</div>
```

### Album Card
- `aspect-[4/3]` cover image
- `rounded-2xl` corners
- Warm amber border on hover (set via `onMouseEnter/Leave`)
- Subtle `-translate-y-0.5` lift on hover
- `shadow-warm` → `shadow-warm-hover`

### Photo Card
- `aspect-square` with `rounded-xl`
- `skeleton-shimmer` while loading
- Gradient overlay: `from-black/40 to-black/10` (NOT flat `bg-black/30`)
- Favorite button: `opacity-0 group-hover:opacity-100`
- Name label: slides up with `translate-y-full → translate-y-0`

### Stats Card
- `rounded-2xl border border-border bg-card`
- Icon in `var(--amber-muted)` circle, icon color `var(--amber)`
- Large `text-2xl font-bold tabular-nums`
- Hover: `-translate-y-0.5`

### Empty State
```tsx
<div className="rounded-3xl border border-border bg-card py-24 text-center shadow-warm">
  <div className="h-16 w-16 rounded-2xl bg-amber-muted mx-auto mb-5 flex items-center justify-center">
    <Icon className="h-7 w-7 text-amber" />
  </div>
  <p className="text-lg font-semibold text-foreground">No items yet</p>
  <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
    Helpful message about how to populate this section.
  </p>
</div>
```

### Section Header
```tsx
<SectionHeader
  title="Albums"
  eyebrow="Your Collection"       // optional — amber small caps label
  subtitle="42 albums"            // optional — muted supporting text
  action={<RefreshButton />}      // optional — right-side slot
/>
```

### Page Header
```tsx
<PageHeader
  title="Favorites"
  description="Your saved photos"
  icon={<Heart className="h-5 w-5" />}   // renders in amber icon box
/>
```

### Skeleton
- Always use `skeleton-shimmer` class (defined in `globals.css`)
- Match exact shape of the real content (same aspect ratio, border radius)
- Never use `animate-pulse bg-white/5` — that's the old pattern

### Error Banner
```tsx
<div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-5 py-4 text-sm text-destructive">
  Error message here.
</div>
```

---

## 7. Motion & Interaction

- **Hover lift:** `-translate-y-0.5` + shadow upgrade
- **Image zoom:** `group-hover:scale-[1.04]` (not 1.1 — too aggressive)
- **Fade-in:** opacity `0 → 100` on image load
- **Slide reveal:** `translate-y-full → translate-y-0` for overlays
- **Duration:** 200–400ms for micro-interactions, 700–1000ms for photo transitions
- **Easing:** `ease-out` for entrances, `ease-in-out` for loops
- **No bouncy animations.** No spring physics unless extremely subtle.
- **No flashy keyframe animations** on UI chrome (only on hero/photo elements)

---

## 8. Corner Radius Rules

| Element | Radius |
|---|---|
| Photo thumbnails | `rounded-xl` |
| Album cards | `rounded-2xl` |
| Hero slideshow | `rounded-3xl` |
| Empty states | `rounded-3xl` |
| Icon containers | `rounded-xl` |
| Buttons (standard) | `rounded-lg` |
| Theme toggle pill | `rounded-full` |
| Stat cards | `rounded-2xl` |

---

## 9. Shadow Rules

| Context | Class |
|---|---|
| Cards (resting) | `shadow-warm` |
| Cards (hovered) | `shadow-warm-hover` |
| Photos | CSS `var(--shadow-photo)` |
| Sidebar | No shadow — use border only |
| Buttons | `shadow-warm` (optional) |
| Never use | `shadow-xl`, `shadow-2xl`, or raw Tailwind drop-shadow on cards |

---

## 10. Amber Brand Accent Rules

Use the amber accent **sparingly and consistently**:

✅ Active nav item icons
✅ Eyebrow labels above section titles
✅ Icon container backgrounds (`var(--amber-muted)`)
✅ Hero title family name
✅ Throwback year labels
✅ Dot indicators on hero slideshow
✅ Active dot on theme toggle
✅ Stat card icons
✅ Hover border on album cards

❌ DO NOT use amber for body text
❌ DO NOT use amber as a background fill on large surfaces
❌ DO NOT use amber on error/destructive states
❌ DO NOT use more than 2–3 amber elements visible at once on any screen

---

## 11. Photos Are the Hero

- UI elements should **support** photos, never compete with them
- Keep chrome (nav, headers, borders) quiet and restrained
- Photo grids: minimal gap, let images fill the space
- Hover overlays: warm gradient, not flat black
- Lightbox/viewer: always dark regardless of app theme — use `.yarl__root` token
- Loading states: match the shape exactly with `skeleton-shimmer`

---

## 12. Anti-Patterns to Avoid

| ❌ Bad | ✅ Good |
|---|---|
| `text-[#F5F0EB]` | `text-foreground` |
| `bg-[#141416]` | `bg-card` |
| `text-[#9E9B96]` | `text-muted-foreground` |
| `border-white/[0.06]` | `border-border` |
| `bg-rose-950/30` | `bg-destructive/5` |
| `text-rose-300` | `text-destructive` |
| `animate-pulse bg-white/5` | `skeleton-shimmer` class |
| `shadow-xl` on cards | `shadow-warm` / `shadow-warm-hover` |
| `scale-[1.1]` on image hover | `scale-[1.04]` |
| `font-bold` on all headings | `font-semibold tracking-tight` |

---

## 13. Future Pages — Suggested Design Direction

### `/memories`
- Section per year, or timeline layout
- Amber year labels with warm horizontal dividers
- `SectionHeader` with eyebrow "From the Past"
- Same `PhotoGrid` component

### `/search`
- Warm bordered search input: `rounded-xl border-border bg-card`
- Focus ring: `ring-amber/40`
- Results: same `AlbumGrid` / `PhotoGrid` components
- Empty state with magnifying glass icon in amber box

### Future: Journal / Notes
- `bg-card` surface with `rounded-2xl`
- Serif font (`font-serif`) for journal body text
- Amber accent for date labels
- Warm parchment feel — use `bg-muted` background

---

## 14. Acceptance Checklist

Before shipping any new page or component, verify:

- [ ] No hardcoded hex or arbitrary color values in className
- [ ] Semantic tokens used throughout (`bg-card`, `text-muted-foreground`, etc.)
- [ ] Loading state uses `skeleton-shimmer` at correct shape/ratio
- [ ] Empty state uses `PageHeader`-style warm icon box
- [ ] Error state uses `border-destructive/20 bg-destructive/5 text-destructive`
- [ ] Images use `rounded-xl` or `rounded-2xl`
- [ ] Hover: `-translate-y-0.5` lift + shadow upgrade
- [ ] Amber accent used for icons/labels only, not backgrounds
- [ ] Both light and dark mode verified visually
- [ ] No raw `shadow-xl` or `shadow-2xl` on cards
- [ ] Section spacing: `space-y-14` between sections
- [ ] `SectionHeader` used for section titles (not ad-hoc `<h2>`)
- [ ] `PageHeader` used for page-level titles
