# Our Frame — Warm Memory Book Design System

> **Emotional goal:** A quiet Sunday afternoon flipping through a beautiful family memory book.

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
