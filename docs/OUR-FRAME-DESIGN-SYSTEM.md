# Our Frame — Design System (V2 Reference)

> **Status:** Canonical visual source of truth for the `redesign-v2/` initiative
> and for all future UI work on Our Frame. Produced in PR 1 of
> `docs/redesign-v2/` by inspecting the 5 mockups in `docs/mockups/` and
> reconciling them against `docs/design-system.md` (the token-level system
> produced by the earlier, already-complete `docs/redesign/` initiative).
>
> **Relationship to `docs/design-system.md`:** that file owns the low-level
> implementation details — exact color tokens, Tailwind classes, component
> file locations, typography scale values, spacing/radius/shadow/motion
> tokens. This file owns the higher-level *rules and hierarchy* the mockups
> establish — what each page/pattern must contain, in what order, and with
> what consistency guarantees. Read both; do not duplicate token values here.
> Where this file says "bronze accent" or "serif display," it means the
> tokens already defined in `docs/design-system.md` Part 1 (Premium
> Cinematic System) — not a new palette.

## 0. How to Use This Document

Before any frontend/UI work on Our Frame:

1. Read this file in full.
2. Open the mockup(s) in `docs/mockups/` relevant to the page/pattern you're
   touching (see `docs/mockups/README.md` for which file governs what).
3. Read the relevant sections of `docs/design-system.md` for exact tokens.
4. Inspect existing components before adding new ones — reuse beats novelty.
5. Implement only what the task requires. Do not redesign unrelated pages.
6. Check the result against the mockup, on desktop and mobile, before
   considering the task complete.

**Most important rule: consistency beats novelty.** If two pages perform the
same conceptual function (e.g. two category pages, two album pages), they
must look and behave like instances of the same component — not four
individually clever designs.

## 1. Primary Design Goal

Our Frame should feel like:

- a premium private family archive
- an editorial photo book
- cinematic but restrained
- warm and deeply personal
- timeless rather than trendy
- photography-first — the photos are the product, the UI quietly frames them

It should **not** feel like: a SaaS dashboard, Google Photos, Instagram,
Netflix, Pinterest, a generic dark website, a wedding template, or a
collection of unrelated page designs.

## 2. Color System

Very dark, warm background — not pure black. Primary text is warm ivory/
cream. Secondary text is muted warm gray. Accent is a restrained bronze/
amber/antique gold, used sparingly (small labels, active states, icon
accents) — never flooding the interface. Borders are low-contrast and
subtle.

This matches `docs/design-system.md` Part 1 ("Premium Cinematic System")
token-for-token: `--background`, `--foreground`, `--muted-foreground`,
`--amber`/`--primary`, `--border`. Use those semantic tokens; do not
hardcode hex/oklch values. See the mockups' near-black canvas (all 5 boards
render on `#0c0a09`-range backgrounds) and restrained gold usage on eyebrow
labels, active nav underline, and icon accents (never as a large fill) —
e.g. board 2's "OUR STORY IN FRAMES" eyebrow, board 4's "ALBUM" eyebrow,
board 5's overflow-menu "Set as album cover" gold highlight row.

## 3. Typography

One editorial serif (Playfair Display, per `docs/design-system.md`) for:
page titles, album/category names, emotional statements ("Every frame holds
a story."), selected section headings ("Arjun", "Travel", "Maine").

One clean sans-serif (Geist Sans) for: body copy, navigation, metadata,
buttons, controls, breadcrumbs, captions, folder/photo counts.

Hierarchy comes from size/weight/spacing, not decoration. Uppercase is
reserved for small editorial eyebrow labels ("WELCOME HOME", "OUR STORY IN
FRAMES", "GROWING UP, FRAME BY FRAME", "ALBUM") — never for body text or
buttons.

## 4. Spacing

Whitespace is part of the design, not empty space to be solved with more UI.
Every page uses:

- a consistent max-width content container with consistent horizontal
  padding (see `docs/design-system.md` §4 — `--container-max`,
  `content-padding`)
- consistent section-to-section vertical gaps
- consistent card-to-card gaps within a grid
- consistent internal card padding

Do not compress sections to fit more content; do not introduce one-off
spacing values per page.

## 5. Navigation

One consistent nav component across the entire app (already implemented per
`docs/design-system.md` §8, `components/layout/top-nav.tsx` — the mockups
confirm this, not contradict it):

- Desktop: left "Our Frame" wordmark, center links (Home / Photos / Videos /
  Favorites / Memories), right profile/avatar.
- Slim, understated, subtle active-state underline — never a glowing or
  thick indicator.
- Photos/Videos may use floating dropdown sub-navigation.
- Mobile: hamburger → full-screen sheet, same link set, no bottom tab bar.

Every mockup board (1–5) shows the exact same nav bar at the top — this is
the strongest single consistency signal in the reference set. Do not vary
nav per page.

## 6. Information Architecture

```
Home → Photos → Category (Arjun / Travel / Milestones / Life) → Album → Photo
```

Categories have different content but must share one structural design
system. Do not build custom layouts per category (this is the core problem
this V2 initiative fixes — see board 3's "One layout. Four stories. Built
for clarity, built to scale.").

## 7. Home Page Rules

Per board 1 (`01-home-page-second-pass-redesign.png`), Home contains, in
order:

1. Cinematic hero slideshow (full-bleed photo, serif emotional headline,
   short supporting line, primary CTA, prev/next controls, dot indicators)
2. **One** chapter/category rail ("OUR STORY IN FRAMES" — Arjun, Travel,
   Milestones, Life, shown once, each as a compact icon + title + subtitle
   card)
3. Family Films preview (video cards with duration badge, title, subtitle,
   "View all" link)
4. Optional closing value-proposition strip (four short benefit statements)

**Do not** repeat the Arjun/Travel/Milestones/Life navigation a second time
elsewhere on the page (board 1 as drawn does show a "RECENTLY CAPTURED"
photo strip between the chapter rail and Family Films — see the explicit
deviation note below).

**Known, intentional deviation from this mockup:** the user has explicitly
opted out of a "Recently Captured" / recent-photos section on Home, even
though board 1 depicts one. `docs/redesign-v2/PR 3` is responsible for
enforcing this (removing duplicate category cards, fixing hero framing) and
must **not** reintroduce a "Recently Captured"/"Latest Frames" section when
it does so. Every later PR touching Home — and PR 8's final audit — must
verify this section stays absent. This file exists so that future sessions
reading only the mockup image don't silently rebuild the omitted section.

**Slideshow behavior:**

- Every slide starts with the complete photograph visible — no cropped
  faces/subjects at first frame.
- Use `object-fit: contain` (or equivalent) where needed to preserve the
  whole image; portrait photos get a blurred/darkened backdrop of the same
  image rather than being cropped or stretched to fill a landscape frame.
- Ken Burns, if used: start at `scale(1)`, cap around `scale(1.02)`–
  `scale(1.04)`, 8–12s per slide, no aggressive panning.
- Cross-fade transitions only.
- Preserve prev/next controls, slide count/dots, and autoplay.
- Hero height: roughly 78–84vh desktop — smaller than full viewport, so the
  chapter rail below feels intentional rather than off-screen.

## 8. Photos Overview Rules

Per board 2 (`02-photos-overview-unified-folder-system.png`): a uniform 2x2
desktop grid of exactly four category cards — Arjun, Travel, Milestones,
Life. All four cards share identical width, height, aspect ratio, corner
radius, overlay treatment, title placement, and metadata hierarchy
(eyebrow → serif title → one-line description → photo count). This is a
folder browser: consistency over novelty, no card is visually more
important than another. Mobile: single column, same card ratio/content, no
masonry.

## 9. Category Page Rules

Per board 3 (`03-category-pages-shared-folder-system.png`): Arjun, Travel,
Milestones, and Life all share one reusable page shell:

1. Global nav
2. Breadcrumb (Home / Photos / <Category>)
3. Small editorial eyebrow (e.g. "GROWING UP, FRAME BY FRAME")
4. Category title (serif)
5. Short description
6. Optional folder/photo count
7. Folder grid

Folder cards within a category share one component: identical dimensions,
radius, overlay, typography, spacing — regardless of category. Grid:
desktop multi-column (board 3 shows 4 across at 1440px in the composite
board layout; treat the per-category grid itself, not the board framing, as
the reference — PR 5's own column spec, 3/2/1 across desktop/tablet/mobile,
governs the shipped breakpoints), tablet 2 columns, mobile 1 column.
Content (folder names, thumbnails, counts) differs per category; the visual
system does not.

## 10. Album Page Rules

Per board 4 (`04-album-page-shared-editorial-template.png`): one shared
editorial album template used for every album regardless of category
(Travel → Maine and Milestones → Engagement in the mockup use the identical
template).

Header, in order: breadcrumb → eyebrow "ALBUM" → title (serif) → optional
location/date line → short description → photo count. Do **not** repeat the
album title a second time anywhere on the page. Then the gallery begins
directly, with light filter/sort/view controls that stay out of the way of
the photos.

## 11. Photo Gallery Rules

Folder/category grids (browsing UI) stay uniform in card shape. Actual photo
galleries inside an album (board 4's masonry section) may be organic —
natural aspect ratios preserved, portrait and landscape mixed, consistent
gutters, no forced-square cropping. Photography should dominate the layout;
gallery chrome (filter/sort/view toggle) stays quiet and secondary.

## 12. Image Quality Rules

- Thumbnails must look high-definition on Retina/high-DPI screens.
- Never enlarge a small source image to fill a larger card.
- Use responsive image sizes (srcset/sizes) appropriate to each rendered
  size — folder/category thumbnails need enough source resolution for their
  card size, not a full original.
- Lightbox loads a higher-resolution version appropriate to the viewport.
- Don't load every original upfront in a grid — lazy-load, prefer cached
  derivatives per `docs/media-cache/` guidance.

## 13. Album Cover / Thumbnail Selection Rules

Per board 5 (`05-lightbox-album-cover-selection.png`): every album supports
a manually selected cover photo.

- Action lives in the lightbox photo overflow/action menu: "Set as album
  cover" and "Set as thumbnail" (both marked "OWNER" in the mockup —
  gate to the workspace owner/appropriate permission level), alongside
  "Add to favorites," "Download original," and "Delete photo."
- Store only a photo reference/id as the cover — never duplicate image
  bytes.
- On selection: persist immediately, update the album/folder card without a
  page reload, show a brief, subtle confirmation ("Cover updated" /
  "Album cover updated").
- The choice must persist across reloads.
- Deterministic fallback when no custom cover is set (e.g. first/most
  recent photo) — never a randomly-changing cover.

## 14. Lightbox Rules

Per board 5: near-black background, image sized as large as practical
without unnecessary cropping. Visible controls: Close, Previous, Next,
Favorite (via overflow or dedicated icon), Overflow/actions menu, Details
("View details"). Bottom-left caption area shows date + album/context name
+ location — kept minimal, not overlaid across the photo itself. Slide
position indicator ("12 / 113") top-left. Keyboard arrows + Escape, mobile
swipe gestures.

## 15. Responsive Design Rules

Mobile preserves the same information hierarchy as desktop — it is not a
shrunk desktop layout. Folders stack cleanly in a single column; photos
stay large; navigation is purpose-built for mobile (full-screen sheet, not
a squeezed desktop bar); touch targets stay accessible size. Board 1's
mobile frame (390px) demonstrates this: same hero → chapter rail (now
stacked rows) → Family Films flow, same visual language, no desktop
layout crammed into a small viewport.

## 16. Motion Rules

Subtle only: opacity changes, 1–2% scale, 2–6px translations, restrained
cross-fades. No bounce/spring physics, no exaggerated parallax, no flashy or
glowing effects. Respect `prefers-reduced-motion`. Matches
`docs/design-system.md` §4 motion tokens (`--motion-fast/standard/slow`)
exactly — no new motion system needed.

## 17. Component Architecture Rules

Before adding page-specific code, inspect the app for duplicated
implementations. Prefer shared, data-driven components over per-category
variants:

- `GlobalNav` / `TopNav`
- `PageContainer` / page shell
- `CategoryHeader` (breadcrumb + eyebrow + title + description + count)
- `FolderGrid` / `FolderCard`
- `AlbumHeader`
- `AlbumPhotoGrid` (existing `MasonryGallery` per `docs/design-system.md`
  §7 is the natural fit)
- `PhotoLightbox` (existing component, per `docs/design-system.md` §7)
- `PhotoActionsMenu` / overflow menu (favorite, download, set cover, set
  thumbnail, delete)
- `ThumbnailPicker` / cover-selection action
- `SectionHeader` / `EditorialEyebrow` (existing, per `docs/design-system.md`
  §7)

Names can follow existing project conventions; reuse — not the exact name —
is the requirement. `docs/redesign-v2/PR 2` is where this shared
architecture actually gets built/refactored; this document is the rule set
that work must satisfy.

## 18. How to Handle Future UI Tasks

1. Read the project brief / task.
2. Review the relevant mockup(s) in `docs/mockups/` (see
   `docs/mockups/README.md`).
3. Inspect existing reusable components before writing new ones.
4. Reuse this design system — do not invent a new visual direction, do not
   create a page-specific theme.
5. Modify only what the task requires; don't redesign unrelated screens.
6. Don't introduce a new component when an existing shared one can be
   extended.
7. Preserve routes/data/working functionality unless explicitly asked
   otherwise.
8. Check both desktop and mobile.
9. Compare the result against the mockup before considering the task done.

## 19. Reconciliation with `docs/design-system.md`

`docs/design-system.md` Part 1 ("Premium Cinematic System," produced by
`docs/redesign/` PR 1) was inspected against all 5 mockups. **It is
compatible with the mockups' direction — no rewrite was necessary.**
Specifically:

| Mockup evidence | `docs/design-system.md` Part 1 |
|---|---|
| Near-black warm backgrounds across all 5 boards | §1–2: dark-first, near-black warm-charcoal surfaces |
| Restrained gold/bronze on eyebrows, active nav, icon accents only | §2 bronze accent rule: icons/labels/active-state only, never a large fill |
| Serif titles ("Every frame holds a story.", "Arjun", "Maine"), sans body/metadata | §3: serif display for titles, Geist Sans for body/UI |
| Slim, identical nav bar on every board | §8: one `TopNav` component, transparent-on-hero / solid-elsewhere variants |
| Quiet card borders/shadows, no glow | §4 shadow tokens: restrained, no colored glow; §10 anti-patterns |
| Restrained hover states (board 5 overflow menu, board 4 filter/sort) | §4 motion tokens: 165–520ms, no bounce/spring |

No conflicts were found. This file (`docs/OUR-FRAME-DESIGN-SYSTEM.md`) adds
the page/pattern-level *structural* rules (what each page contains, in what
order, what must stay identical across categories) that the mockups
establish; `docs/design-system.md` remains the source of truth for exact
tokens, Tailwind classes, and component file locations. Use both together;
neither supersedes the other.

Part 2 of `docs/design-system.md` ("Warm Memory Book") remains explicitly
superseded/historical, unaffected by this reconciliation.
