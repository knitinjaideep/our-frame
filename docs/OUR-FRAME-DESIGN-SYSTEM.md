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

**Read this before opening any mockup:** the mockups are references, not
literal specs. Two places where the shipped product intentionally differs
from what the boards depict are recorded in this file — the Home page's
omitted "Recently Captured" section (§7) and the category folder-grid
column count (§9). Do not rebuild either from the image alone.

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
board 5's gold `OWNER` badges on the two owner-only overflow-menu rows.
(Measured board canvas backgrounds fall in the `#060403`–`#13100d` warm
near-black range — consistent with `--background`, not pure `#000`.)

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

- Desktop: left "Our Frame" serif wordmark, center links (Home / Photos /
  Videos / Favorites / Memories), right profile/avatar. Board 1 also shows a
  quiet search icon immediately left of the avatar; treat search as optional
  and out of scope for this V2 pass unless a PR asks for it.
- Slim, understated, subtle active-state underline — never a glowing or
  thick indicator.
- Photos/Videos carry a small chevron and use floating dropdown
  sub-navigation (visible on boards 2–4).
- Mobile: hamburger → full-screen sheet, same link set, no bottom tab bar.
  The boards disagree on mobile bar arrangement (board 1: hamburger left,
  centered wordmark, avatar right; board 2: wordmark left, hamburger right).
  Neither is authoritative — keep the existing shipped `top-nav` mobile
  arrangement rather than churning it.

Every mockup board (1–5) shows the same nav bar at the top — this is the
strongest single consistency signal in the reference set. Do not vary nav
per page.

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

### ⚠️ Known, intentional deviation from board 1 — do not build "Recently Captured"

Board 1 depicts a `RECENTLY CAPTURED` photo strip (desktop: a 5-thumbnail
row with a "View all photos →" link, between the chapter rail and Family
Films; mobile: a 3-thumbnail row with "View all"). **The user has
explicitly opted out of it. It must not be built.**

- PR 3 (Home Page) of `docs/redesign-v2/MILESTONES.md` must not add it while
  doing its other Home work (removing duplicate category cards, fixing hero
  framing).
- No later PR touching Home may reintroduce it under any name — "Recently
  Captured", "Latest Frames", "Recent Memories", "Recently Added".
- PR 8's final consistency audit must explicitly re-verify it is absent.
- Home's section order is therefore hero → chapter rail → Family Films →
  optional closing strip, with **nothing** between the rail and Family
  Films.

This note exists precisely because the mockup shows the section: a future
session working from the image alone would otherwise rebuild it in good
faith. The same deviation is recorded in `docs/redesign-v2/STATE.md`
("Explicit user deviation") and `docs/mockups/README.md`.

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
(per-category gold eyebrow → serif title → one-line description → photo
count with a small image glyph). Each card is a photo tile with a dark
bottom-up gradient scrim carrying the text. This is a folder browser:
consistency over novelty, no card is visually more important than another.

Page header above the grid: "OUR STORY IN FRAMES" eyebrow → serif "Photos"
title → one-line description, with a quiet "View all photos →" text link
(top-right on desktop, below the description on mobile).

Note the eyebrows are per-category and editorial, not generic: `GROWING UP`
(Arjun), `STORIES FROM EVERYWHERE` (Travel), `ANCHOR MEMORIES`
(Milestones), `PEOPLE & MOMENTS` (Life). Keep these consistent with the
longer category-page eyebrows in §9.

Mobile: single column, identical card content and hierarchy, no masonry.
Board 2's mobile cards are shorter/wider than its desktop cards, so match
the desktop *content* and treatment, not its exact aspect ratio — pick one
mobile ratio and apply it to all four cards identically.

## 9. Category Page Rules

Per board 3 (`03-category-pages-shared-folder-system.png`): Arjun, Travel,
Milestones, and Life all share one reusable page shell:

1. Global nav
2. Breadcrumb (Home / Photos / <Category>)
3. Small gold editorial eyebrow — per category, and longer than the Photos
   overview version: `GROWING UP, FRAME BY FRAME` (Arjun),
   `STORIES FROM EVERYWHERE` (Travel), `ANCHOR MEMORIES` (Milestones),
   `PEOPLE & MOMENTS` (Life)
4. Category title (serif)
5. Short description (one line)
6. Folder count ("113 folders", "42 folders", "28 folders", "56 folders" —
   present on all four boards, so treat it as standard, not optional)
7. Folder grid

Folder cards within a category share one component: identical dimensions,
radius, overlay, typography, spacing — regardless of category. Anatomy:
photo thumbnail, dark gradient scrim at the bottom, a small bronze folder
glyph, the folder name in serif, and one muted sans secondary line whose
*content* varies by category (Arjun: item count; Travel: country;
Milestones: date; Life: nothing) while the slot and styling stay fixed.

**Known deviation from board 3 — column count.** The boards render each
category page at 4 folder cards across. The written brief
(`docs/redesign-v2/PROMPTS.md`, PR 5) specifies **desktop 3 / tablet 2 /
mobile 1**. The brief wins: build 3/2/1. This is a real conflict between
image and text, not a rendering artifact — it is called out here so PR 5
doesn't "fix" the grid back to 4 columns from the picture.

Content (folder names, thumbnails, counts) differs per category; the visual
system does not.

## 10. Album Page Rules

Per board 4 (`04-album-page-shared-editorial-template.png`): one shared
editorial album template used for every album regardless of category. The
board proves this with two instances of the identical template: the primary
example `Home / Photos / Travel / Maine`, and an "ALTERNATE EXAMPLE" panel
`Home / Photos / Milestones` titled "Milestones" (2015 – 2025).

The header sits **on top of the album's cover photo**, which runs full-bleed
to the right/top edge of the content area behind the text, with a dark
left-to-right gradient scrim so the copy stays legible. This is the album's
selected cover (see §13), not a decorative asset.

Header, in order:

1. Breadcrumb
2. Gold eyebrow `ALBUM`
3. Title (serif, large)
4. Optional metadata row — location with a pin icon and/or date range with a
   calendar icon (Maine shows both: "Maine, USA" + "May 10 – May 17, 2024";
   Milestones shows date range only)
5. Short description (1–2 lines)
6. Photo count ("113 photos")

Do **not** repeat the album title a second time anywhere on the page — the
board explicitly calls this out ("Single, clean header — no duplicate
titles"). Then the gallery begins directly, preceded by one quiet control
row: `Filter ⌄` and `Sort ⌄` on the left, and on the right a "View" label
with a small 3-option grid-density toggle (the active option marked in
bronze). Controls stay visually subordinate to the photos.

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

- Action lives in the lightbox photo overflow/action menu, in the board's
  order: "Add to favorites", "Download original", "Set as album cover"
  `OWNER`, "Set as thumbnail" `OWNER`, then a destructive "Delete photo" in
  red, separated from the rest.
- The two `OWNER`-badged actions are permission-gated to the workspace
  owner. Non-owners must not see them — do not render-then-disable, and do
  not rely on the client alone; the backend must enforce it.
- Store only a photo reference/id as the cover — never duplicate image
  bytes. (Also keeps this consistent with `docs/media-cache/`: the cover
  renders from the existing cached derivative for that photo, so selecting a
  cover must not trigger new derivative generation.)
- On selection: persist immediately, update the album/folder card without a
  page reload, show a brief, subtle confirmation — board 5 shows a bronze
  check icon with "Cover updated" and a one-line explanation.
- The choice must persist across reloads.
- Deterministic fallback when no custom cover is set (e.g. first/most
  recent photo) — never a randomly-changing cover.
- Board 5 also shows the updated cover propagating to two surfaces: the
  album header (mobile, with a "Change cover" affordance overlaid on the
  cover image and an edit pencil in the header) and the folder card in the
  parent grid. Both must reflect the new cover.

## 14. Lightbox Rules

Per board 5: near-black background, image sized as large as practical
without unnecessary cropping — the board's portrait photo is letterboxed
with generous dark margin rather than cropped or upscaled to fill.

Chrome placement in the board: slide position ("12 / 113") top-left;
overflow "…" and Close "×" top-right; circular Previous/Next arrows
vertically centered at the left and right edges; "View details" as a small
pill bottom-right. Bottom-left caption block shows gold date ("Dec 2025")
→ serif album/context name ("Engagement") → muted location line ("The
botanical gardens, Maine"), set in the dark margin beside the photo, not
overlaid across it.

Favoriting appears only in the overflow menu on this board; a dedicated
icon is acceptable if it stays equally quiet. Keyboard arrows + Escape and
mobile swipe gestures are required.

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
is the requirement. PR 2 of `docs/redesign-v2/MILESTONES.md` is where this
shared architecture actually gets built/refactored; this document is the
rule set that work must satisfy.

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
