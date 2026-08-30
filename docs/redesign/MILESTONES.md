# Our Frame Premium Redesign Milestones

## Goal

Elevate Our Frame's visual language from the current warm-editorial baseline
(`docs/design-system.md`) to a premium, cinematic, dark, bronze-accented
editorial direction, page by page, without breaking legacy media routes,
workspace auth, or existing photo/video data. See `docs/redesign/PROMPTS.md`
for the exact brief text per PR.

## Ruling: design-system direction change

The existing `docs/design-system.md` ("Warm Memory Book") specifies a light
+ dark amber system. This redesign explicitly moves to a dark-first,
near-black, bronze/gold-accented cinematic system per PR 1. This supersedes
the amber direction. PR 1 must update `docs/design-system.md` in place (or
add a versioned successor doc referenced from it) so it stays the single
source of truth — no page should invent its own tokens.

This does not relax any Architecture, Privacy, Data Safety, or Backend
Standards section of `.claude/CLAUDE.md` — only the visual-design section.

## PR 1 — Global Design System + Navigation

Status: Pending

Acceptance criteria:

- Semantic color tokens exist for background (primary/elevated), text
  (primary/secondary), accent (bronze, ~5–10% of visual weight), and border,
  replacing/extending the tokens in `docs/design-system.md`.
- Serif display font wired for headings/quotes; sans-serif for UI/body.
- Typography scale tokens exist for Display/H1/H2/H3/Body/Small.
- Spacing, radius (12–20px), shadow, and motion tokens are defined and
  documented (no ad-hoc arbitrary Tailwind values in new code).
- Reusable components exist (or are stubbed with clear contracts) for:
  PageIntro, EditorialEyebrow, ChapterCard, PhotoGrid, MasonryGallery,
  GalleryTabs, PhotoLightbox, EmptyState, SectionHeading, TextLink,
  IconButton, FeaturedStory, TimelineEntry.
- Global navigation redesigned: slim, floating/transparent on Home hero,
  near-black on interior pages, subtle bronze active-state, mobile
  full-screen/sheet menu. No thick glowing underline.
- One consistent icon library used; no emoji.
- Accessibility: contrast, keyboard nav, visible focus states,
  `prefers-reduced-motion` respected.
- `npm run build` passes.
- No page content redesigned beyond what's needed to prove the primitives.

## PR 2 — Home / Landing Page

Status: Pending

Acceptance criteria:

- Full-bleed hero photo with cinematic vignette/grading; text stays
  readable.
- Eyebrow "WELCOME HOME", headline "Every frame holds a story.", supporting
  copy, primary CTA "Explore Our Story".
- Floating chapter rail: Arjun, Travel, Milestones, Life — translucent
  glass cards, one line icon each, restrained bronze accents, few-px hover
  lift.
- No dashboard-card look, no neon/heavy shadows/excessive gradients.
- Reuses real existing photos/content; no stock imagery.
- Desktop-first but usable on mobile.
- `npm run build` passes.

## PR 3 — Photos Overview Page

Status: Pending

Acceptance criteria:

- Eyebrow "OUR STORY IN FRAMES", heading "Photos", supporting copy, "View
  all photos" secondary action.
- Asymmetric editorial mosaic for Arjun/Travel/Milestones/Life — not four
  identical grid cards.
- Each chapter shows label, serif title, photo count, one-line poetic
  description, arrow affordance.
- Mobile: stacks vertically, keeps generous spacing.
- No Netflix/Pinterest/dashboard look.
- `npm run build` passes.

## PR 4 — Arjun / Album Detail (gallery primitives)

Status: Pending

Acceptance criteria:

- Breadcrumb, serif title "Arjun", subtitle, quiet photo count, refined
  filter/sort controls.
- Elegant text-tab gallery navigation: All / By Age / By Year / Albums.
- Optional "Featured memories" strip (2–4 photos).
- `MasonryGallery` primitive built and used: mixed aspect ratios, real
  image proportions, generous consistent gutters — not a rigid equal grid.
- Photo hover reveals favorite icon/date/caption subtly.
- Opens `PhotoLightbox` (PR 5) on click.
- `npm run build` passes.

## PR 5 — Photo Lightbox / Viewer

Status: Pending

Acceptance criteria:

- Near-black full-screen viewer, image at max practical size preserving
  aspect ratio.
- Close/Prev/Next/Favorite controls, translucent minimal circular buttons,
  fade after inactivity.
- Metadata (date/location/album/caption) shown discreetly below or in a
  details drawer — not overlaid on the photo.
- Keyboard (arrows/Escape) and mobile swipe navigation both work.
- Restrained favorite-heart animation.
- Used consistently by any page linking to it (Arjun at minimum for this
  PR).
- `npm run build` passes.

## PR 6 — Travel, Milestones, Life

Status: Pending

Acceptance criteria:

- Travel: bronze eyebrow "STORIES FROM EVERYWHERE", heading "Travel",
  featured-journey cinematic story card, editorial (non-uniform) trip
  cards, destination detail view reusing gallery primitives.
- Milestones: bronze eyebrow "ANCHOR MEMORIES", heading "Milestones",
  chronological editorial timeline (not a corporate stepper), alternating
  text/photo composition, restrained timeline indicator.
- Life: eyebrow "PEOPLE & MOMENTS", heading "Life", featured candid photo +
  statement, relaxed masonry gallery, occasional editorial text
  interruptions, optional subtle filters.
- All three reuse `MasonryGallery`/`PhotoLightbox`/`EditorialEyebrow`/
  `SectionHeading` from PR 1/4/5 rather than inventing new patterns.
- `npm run build` passes.

## PR 7 — Videos Page

Status: Pending

Acceptance criteria:

- Eyebrow "STORIES IN MOTION", heading "Family Films", supporting copy.
- One large featured film + medium supporting tiles, optional grouping by
  chapter/year — not a dense YouTube grid.
- Understated centered play control, subtle hover brighten/scale.
- Immersive near-black video player matching lightbox visual language,
  prev/next, favorite if supported, no autoplay.
- Existing playback/poster/derivative behavior from the media-cache work
  (`docs/media-cache/ARCHITECTURE.md`) preserved — this PR is visual only.
- `npm run build` passes.

## PR 8 — Favorites Page

Status: Pending

Acceptance criteria:

- Heading "The Ones We Love", saved count, one emotional line.
- Non-empty state: editorial/masonry gallery, varied sizes, quiet Select
  action for bulk management.
- Empty state: centered editorial empty state ("Your favorites will live
  here" / CTA "Start saving moments") plus a "Recently captured" row of
  4–6 photos so the page isn't dead.
- `npm run build` passes.

## PR 9 — Memories / On This Day Page

Status: Pending

Acceptance criteria:

- Eyebrow "MEMORIES", heading "Moments That Stay", supporting copy.
- When memories exist: grouped by year, vertical narrative flow.
- Empty state: "No throwbacks today" plus non-empty secondary sections —
  "This month in past years", "Recently revisited", optional "Our
  timeline" — so the page is never mostly blank.
- `npm run build` passes.

## PR 10 — Mobile Experience Polish

Status: Pending

Acceptance criteria:

- Home, Photos, Arjun/gallery, Photo Viewer, Favorites, Memories, and
  Navigation all reviewed specifically at mobile widths (not just shrunk
  desktop layouts).
- Single mobile navigation pattern chosen (full-screen/hamburger sheet by
  default) — not both hamburger and bottom nav.
- Touch targets accessible, no horizontal overflow, gallery viewer supports
  tap-to-toggle-controls and swipe.
- `npm run build` passes.
