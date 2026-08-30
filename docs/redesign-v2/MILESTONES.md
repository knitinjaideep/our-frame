# Our Frame Redesign V2 Milestones

## Goal

Second-pass consistency redesign on top of the already-completed
`docs/redesign/` bronze/cinematic rebuild: eliminate duplicated folder/
category layouts, standardize Photos/Albums structure, fix Home page
slideshow framing and duplicate navigation, and add album metadata + manual
cover-photo selection. Source: `OUR-FRAME-REDESIGN-EXECUTION-GUIDE.md`
("Redesign V2" per user designation, 2026-08-29). See
`docs/redesign-v2/PROMPTS.md` for exact brief text per PR.

## Required Reference Mockups

`docs/mockups/01-home-page-second-pass-redesign.png` through
`05-lightbox-album-cover-selection.png` (already present in the repo).
Implementers must inspect the relevant mockup(s) before coding; reviewers
and verifiers must compare finished UI against them, not just the
acceptance criteria below.

## Explicit user deviation

No "Recently Captured" / recent-photos section on the Home page. This
overrides the source guide's PR 3 / "5C" sub-prompt on that one point only.
Every PR below that touches Home must not introduce or leave in such a
section.

## Branch base

Each `redesign-v2/pr-*` branch chains off the previous one, with
`redesign-v2/pr-1-design-memory` branched from `redesign/pr-10-mobile-
polish` (the tip of the already-completed first redesign chain), not
`main`.

## Ruling: relationship to `docs/design-system.md`

`docs/redesign/` already moved `docs/design-system.md` to a dark, bronze/
gold-accented cinematic system. PR 1 of this V2 sequence must reconcile
that doc against the mockups rather than assume a rewrite is needed — only
change it where it actually conflicts with the mockups.

This does not relax any Architecture, Privacy, Data Safety, or Backend
Standards section of `.claude/CLAUDE.md` — only the visual-design surface is
in scope.

## PR 1 — Design Memory / Source of Truth

Status: Pending

Acceptance criteria:

- `docs/OUR-FRAME-DESIGN-SYSTEM.md` created, containing the PR 1 design
  rules from `docs/redesign-v2/PROMPTS.md` in a clean, maintainable format.
- `.claude/CLAUDE.md` updated with a short "UI / Design Source of Truth"
  section pointing to `docs/OUR-FRAME-DESIGN-SYSTEM.md` — not a duplicate of
  its content.
- `docs/mockups/README.md` created, documenting the 5 expected mockup
  filenames (already present) with a one-line explanation of what UI each
  governs.
- `docs/design-system.md` reconciled against the mockups: either confirmed
  compatible and cross-linked, or updated only where it actually conflicts
  — not wholesale rewritten without cause.
- All 5 mockups in `docs/mockups/` actually inspected (not assumed) before
  writing the design-system doc.

## PR 2 — Shared Photos Architecture

Status: Pending

Acceptance criteria:

- Existing routes/components for Home → Photos → Arjun/Travel/Milestones/
  Life → albums → photos inspected; duplicated layouts identified before
  changes.
- Shared, data-driven components exist (reusing `docs/redesign/`'s
  MasonryGallery/ChapterCard/PhotoLightbox/GalleryTabs where they already
  fit) for: category page shell, folder grid, folder card, album header,
  album photo grid, photo context menu, thumbnail picker.
- No category-specific hardcoded layout remains without an actual content
  reason.
- Favorites, Memories, Videos untouched.
- `npm run build` passes.

## PR 3 — Home Page

Status: Pending

Acceptance criteria:

- Duplicate category navigation removed — only the chapter rail remains
  (Arjun/Travel/Milestones/Life shown once, not twice).
- **No "Recently Captured"/recent-photos section added or left in** — user
  deviation, verify explicitly.
- Home flow after this PR: hero → chapter rail → Family Films preview →
  other existing relevant content only.
- Slideshow: every slide starts showing the full image (object-fit: contain
  or equivalent where needed), no cropped faces/subjects at first frame;
  portrait images get a blurred/darkened backdrop rather than being
  cropped/stretched.
- Hero height ~78–84vh desktop, not full viewport.
- Ken Burns (if present): starts at scale(1), caps ~scale(1.02)–(1.04),
  8–12s per slide, no aggressive panning.
- Cross-fade transitions only; prev/next controls, slide count, autoplay
  preserved.
- Tested against portrait, close-up, landscape, and group photos.
- Photos detail pages untouched.
- `npm run build` passes.

## PR 4 — Photos Overview

Status: Pending

Acceptance criteria:

- Arjun/Travel/Milestones/Life use one identical FolderCard: same width,
  height, aspect ratio, corner radius, padding, text placement.
- Desktop 2x2 grid; mobile single column, same ratio preserved, no masonry.
- Header text ("Our Story in Frames" / "Photos" / supporting copy / "View
  all photos") preserved.
- No category has a special/asymmetric layout.
- `npm run build` passes.

## PR 5 — Category Pages

Status: Pending

Acceptance criteria:

- One shared category page shell used by Arjun/Travel/Milestones/Life:
  navbar, breadcrumb, eyebrow, title, description, optional count, folder
  grid.
- One shared, compact category header component (not a giant hero) used by
  all four — no per-category header markup remains.
- Milestones' unique timeline presentation removed from the category
  landing page (still fine at album/detail level if applicable elsewhere).
  Life's separate theme removed.
- Folder grid uniform across categories: desktop 3 columns / tablet 2 /
  mobile 1, identical card size/radius/overlay/typography/spacing.
- Existing URLs and data preserved; individual album pages untouched in
  this PR.
- `npm run build` passes.

## PR 6 — Album Pages

Status: Pending

Acceptance criteria:

- One shared album page template used for every album across all four
  categories.
- Album title appears exactly once in the header (no repeated "ALBUM /
  Name" then "PHOTOS / Name" pattern).
- Header supports optional location, optional date/date range, optional
  description — gracefully omitted when absent, no empty placeholders.
- One shared gallery component for all albums, natural aspect ratios,
  tasteful masonry, consistent spacing.
- Favorites/Memories/Videos untouched.
- `npm run build` passes.

## PR 7 — Metadata, Thumbnail Selection, Image Quality

Status: Pending

Acceptance criteria:

- Album/folder data model extended (not parallel-modeled) with optional
  description/location/startDate/endDate/thumbnail/photoCount fields;
  existing folders unaffected.
- Metadata surfaced subtly in folder cards and album headers; absent fields
  never rendered as empty placeholders.
- Thumbnails/previews sized appropriately for their rendered size with
  responsive sizes/high-DPI support; lightbox loads higher-resolution
  images; grid does not eagerly load full originals.
- "Set as album cover" available from the photo context menu and/or
  lightbox overflow menu; selecting one updates the album card immediately,
  persists across reloads, shows a confirmation toast, stores only a photo
  reference (no image duplication).
- Deterministic fallback when no custom cover is set; optional "Reset album
  cover" returns to it.
- Feature applied uniformly to Arjun/Travel/Milestones/Life via one shared
  implementation; respects existing authenticated-editing/access model.
- `npm run build` passes.

## PR 8 — Final Consistency Audit

Status: Pending

Acceptance criteria:

- Home, Photos overview, Arjun, Travel, Milestones, Life, and all album
  pages checked for: shared navbar, page width, category header component,
  folder card dimensions/radius/typography/overlay/hover, folder grid
  column rules, album header component, album gallery component, lightbox
  component, thumbnail resolution, thumbnail-selection availability,
  metadata display consistency, spacing rhythm, typography hierarchy, color/
  accent consistency.
- Explicitly confirmed: Home page still has no "Recently Captured"/recent-
  photos section anywhere in the chain.
- Favorites, Memories, Videos confirmed untouched.
- Any remaining, intentionally-kept inconsistency is documented with a
  reason in `docs/redesign-v2/STATE.md`, not silently left.
- Manual route check performed: Home; Photos; Photos→Arjun (+ one album);
  Photos→Travel (+ one album); Photos→Milestones (+ one album); Photos→Life
  (+ one album).
- `npm run build` passes.
