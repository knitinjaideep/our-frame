# Our Frame Redesign V2 — Prompt Sequence

Source: `OUR-FRAME-REDESIGN-EXECUTION-GUIDE.md`, provided by the user
2026-08-29 and designated "Redesign V2" for this initiative. This
**replaces** the prior (unstarted) bronze/cinematic single-mockup V2 scaffold
that previously lived in this file — that plan never began implementation
(Status was "Ready to start PR 1", no mockup was ever uploaded) and is
superseded per explicit user decision on 2026-08-29.

Run one PR at a time, in order. Do not skip review or verification. Each PR
is delegated to `our-frame-implementer`, then `our-frame-reviewer`, then
`our-frame-verifier`, tracked in `docs/redesign-v2/STATE.md`.

## Relationship to the already-completed `docs/redesign/` work

`docs/redesign/` (PRs 1–10, all complete, verified, committed to
`redesign/pr-1-design-system` … `redesign/pr-10-mobile-polish`, none merged
to `main`) already moved the visual system to a dark, near-black,
bronze/gold-accented cinematic direction and rebuilt every major page. This
V2 initiative is a **second, more targeted pass** on top of that work: it
fixes duplicate/inconsistent folder-browsing UI (different card systems
across Arjun/Travel/Milestones/Life), standardizes category and album page
structure, and adds album metadata + manual cover-photo selection. It is not
a from-scratch visual overhaul.

**Branch base:** each `redesign-v2/pr-*` branch chains off
`redesign/pr-10-mobile-polish` (the tip of the completed first redesign,
current branch as of 2026-08-29), not off `main` — because this work assumes
the shared design-system primitives and page rebuilds from that chain
already exist. `main` does not yet have that work.

## Required Reference Mockups

Already uploaded to `docs/mockups/` (not `docs/redesign-v2/mockups/` — that
was the prior plan's expected location and is no longer used):

1. `01-home-page-second-pass-redesign.png` — Home page reference
2. `02-photos-overview-unified-folder-system.png` — Photos overview reference
3. `03-category-pages-shared-folder-system.png` — Category page reference
4. `04-album-page-shared-editorial-template.png` — Album page reference
5. `05-lightbox-album-cover-selection.png` — Lightbox / cover-selection reference

Implementers must inspect the relevant mockup(s) before coding each PR.
Reviewers and verifiers must compare finished UI against the same mockups,
not only textual acceptance criteria.

## Explicit user deviation from the source guide

The user does **not** want a "Recently Captured" / "Latest Frames" recent-
photos section added to the Home page. The source guide's PR 3 (Home Page)
and its "5C" sub-prompt call for replacing the duplicate category cards below
the hero with such a section — **skip that specific piece**. Everything else
in PR 3 (removing duplicate category navigation, fixing slideshow framing,
hero sizing) still applies. After the hero and the single chapter rail, the
Home page should move directly into Family Films / other existing relevant
content — do not add a recent-photos grid.

---

## PR 1 — Design Memory / Source of Truth

```text
You are working on my private family photo archive app, "Our Frame."

Before making any UI changes, treat the redesign mockups in this repository
as the visual source of truth for this project.

IMPORTANT:
Do not redesign from your own taste.
Do not invent a new visual direction.
Do not create page-specific themes.
Do not drift away from the mockups as future tasks are implemented.

The mockups define the design system, hierarchy, spacing, card treatment,
typography, gallery behavior, and consistency rules I want across the
application.

PRIMARY DESIGN GOAL

Our Frame should feel like:
- a premium private family archive
- an editorial photo book
- cinematic but restrained
- warm and deeply personal
- timeless rather than trendy
- photography-first

It should NOT feel like:
- a SaaS dashboard
- Google Photos
- Instagram
- Netflix
- Pinterest
- a generic dark website
- a wedding template
- a collection of unrelated page designs

The photos are the product. The UI should quietly frame them.

MOCKUPS TO USE AS REFERENCE

Study all supplied mockups before implementation. Use these exact files from
`docs/mockups/`:

1. `01-home-page-second-pass-redesign.png` — Home Page
2. `02-photos-overview-unified-folder-system.png` — Photos Overview
3. `03-category-pages-shared-folder-system.png` — Category Pages
4. `04-album-page-shared-editorial-template.png` — Album Pages
5. `05-lightbox-album-cover-selection.png` — Lightbox + Album Cover Selection

Treat these mockups as one unified system, not separate concepts. If a
mockup conflicts with existing implementation, prefer the mockup unless
doing so would break important functionality.

GLOBAL DESIGN LANGUAGE

COLOR: very dark warm background (not pure black). Primary text warm
ivory/cream. Secondary text muted warm gray. Accent restrained bronze/amber/
antique gold, used sparingly — do not flood the interface with orange.
Borders low-contrast and subtle.

TYPOGRAPHY: one editorial serif for page titles, album names, emotional
statements, selected section headings. One clean sans-serif for body,
navigation, metadata, buttons, controls. Hierarchy without excessive size.
Uppercase primarily for small editorial eyebrow labels.

SPACING: whitespace is part of the design. Consistent max-width containers,
horizontal padding, section gaps, card spacing, vertical rhythm. Do not
solve empty space with unnecessary UI.

NAVIGATION: one consistent nav component across the app. Desktop: left "Our
Frame", center Home/Photos/Videos/Favorites/Memories, right profile/avatar.
Slim, understated, subtle active state, no glowing indicators.

CORE INFORMATION ARCHITECTURE

Home → Photos → Category → Album → Photo

Categories: Arjun, Travel, Milestones, Life — different content, same
structural design system. Do not build custom layouts per category.

HOME PAGE RULES

Contains: cinematic slideshow, ONE chapter/category rail, Family Films
preview, other relevant content only if useful. Do NOT repeat
Arjun/Travel/Milestones/Life multiple times. Do NOT add a "Recently
Captured"/recent-photos section — the user has explicitly opted out of that
piece of the original brief.

SLIDESHOW: must begin with the complete photograph visible. No cropped
faces/subjects at start. Use contained/full-image presentation where
necessary; blurred/darkened backdrop behind portrait images if needed. Ken
Burns (if used): start scale(1), end ~scale(1.02–1.04), slow and restrained.
Slightly smaller than full viewport height, roughly 78–84vh desktop.

PHOTOS OVERVIEW RULES: uniform 2x2 desktop grid for Arjun/Travel/Milestones/
Life. Identical width, height, aspect ratio, corner radius, overlay
behavior, title positioning, metadata hierarchy, hover interaction. This is
a folder browser — consistency over novelty.

CATEGORY PAGE RULES: Arjun/Travel/Milestones/Life share one reusable
category page shell — breadcrumb, small editorial eyebrow, category title,
short description, optional counts, folder grid. Folder cards share one
component; identical dimensions across a page. Desktop: consistent grid.
Tablet: 2 columns. Mobile: 1 column. Content differs per category; UI
structure does not.

ALBUM PAGE RULES: one shared editorial album template for every album.
Header: breadcrumb, eyebrow "ALBUM", title, optional location/date,
description, photo count — then gallery. Do not repeat the album title
twice.

PHOTO GALLERY RULES: folder grids uniform; actual photo galleries may be
organic/masonry, respecting natural aspect ratios, mixing portrait/
landscape, consistent gutters. Photography should dominate.

IMAGE QUALITY: thumbnails must look high-definition on Retina/high-DPI
screens; no enlarging tiny previews; responsive image sizes; lightbox loads
higher-resolution images; don't load every original upfront.

ALBUM COVER / THUMBNAIL SELECTION: each album supports a manually selected
cover photo via a lightbox/photo menu action ("Set as album cover"). Store
only the photo reference/id. Persist across reloads; update album card
immediately with a subtle confirmation toast, no page reload. Deterministic
fallback when no custom cover is set; never randomly change covers.

LIGHTBOX: near-black background, largest practical size without
unnecessary cropping. Controls: Close, Previous, Next, Favorite, Overflow/
actions, Details — visually quiet. Keyboard arrows, Escape, mobile swipe.
Metadata not heavily overlaid on the photo.

RESPONSIVE DESIGN: mobile preserves the same hierarchy, not a shrunk
desktop layout. Folders stack cleanly, photos stay large, navigation is
intentionally mobile-designed, touch targets accessible.

MOTION: subtle only — opacity, 1–2% scale, 2–6px translations, restrained
cross-fades. No bounce/spring/exaggerated parallax/flashy/glowing effects.
Support reduced-motion.

COMPONENT ARCHITECTURE: before adding page-specific code, inspect the app
for duplicated implementations. Prefer shared components such as GlobalNav,
PageContainer, CategoryHeader, FolderGrid, FolderCard, AlbumHeader,
AlbumPhotoGrid, PhotoLightbox, PhotoActionsMenu, ThumbnailPicker,
SectionHeader, EditorialEyebrow — names can follow existing conventions;
reuse is the requirement.

HOW TO HANDLE FUTURE TASKS: read the project brief, review mockups, inspect
existing reusable components, reuse the design system, modify only what the
task requires, don't redesign unrelated screens, don't introduce a new
component when an existing shared one can be extended, preserve routes/data/
working functionality unless explicitly asked otherwise, check desktop and
mobile, check the result against the mockups before considering the task
complete.

MOST IMPORTANT RULE: consistency beats novelty. If two pages perform the
same conceptual function, they should look and behave like the same
component. One excellent reusable design used everywhere beats four
individually clever designs. The mockups are the reference point for all
future visual decisions.
```

```text
Now create a repository-level design reference file:

docs/OUR-FRAME-DESIGN-SYSTEM.md

Put the above design rules into that file in a clean, maintainable format.

Also update CLAUDE.md with a short section titled:

"UI / Design Source of Truth"

That section should instruct future Claude sessions to read
docs/OUR-FRAME-DESIGN-SYSTEM.md before making any frontend/UI changes. Do
not duplicate the entire design document inside CLAUDE.md — point to it and
state that it is mandatory for UI work.

Also create docs/mockups/README.md documenting these exact expected
filenames (the images already exist in docs/mockups/ — do not expect an
upload):

- 01-home-page-second-pass-redesign.png
- 02-photos-overview-unified-folder-system.png
- 03-category-pages-shared-folder-system.png
- 04-album-page-shared-editorial-template.png
- 05-lightbox-album-cover-selection.png

For each filename, add a one-line explanation of what UI it governs.

Future UI tasks should treat both docs/OUR-FRAME-DESIGN-SYSTEM.md and
docs/mockups/ as the visual source of truth. When implementing a specific
page, reference the relevant mockup filename explicitly.

Also inspect docs/design-system.md (the design-system doc produced by the
already-completed docs/redesign/ work) and reconcile it with the mockups:
if it already matches the mockups' warm/dark editorial bronze direction,
say so and link the two docs together rather than duplicating; only rewrite
docs/design-system.md if it actually conflicts with the mockups.
```

---

## PR 2 — Shared Photos Architecture

```text
I need a second-pass consistency refactor for the Photos experience.

Do NOT redesign the app from scratch.

The current redesign has several good ideas (from the already-completed
docs/redesign/ work), but different folders now use different layouts and
visual systems. I want one coherent design language for every photo category
and every album.

Focus only on creating the shared architecture/components for:

Home → Photos → Arjun / Travel / Milestones / Life → individual folders/
albums → individual photos

Do not touch Favorites, Memories, or Videos in this task.

GOAL

Create a unified photo browsing system so Arjun, Travel, Milestones, and
Life all feel like the same application. The content can differ, but the
structural rules must stay consistent.

CREATE SHARED COMPONENTS

Create/reuse components such as: PhotoSectionHeader, FolderGrid, FolderCard,
AlbumHeader, AlbumPhotoGrid, PhotoContextMenu, ThumbnailPicker,
PhotoLightbox. Use existing project naming conventions where appropriate —
check for existing equivalents (e.g. MasonryGallery, GalleryTabs,
ChapterCard from docs/redesign/) before creating new ones.

CORE RULES

1. All category pages share the same page shell.
2. All folder cards on the same screen use the same width, height, aspect
   ratio, corner radius, typography, spacing, and overlay treatment.
3. All album pages use the same header pattern.
4. All photo grids use the same spacing and image quality rules.
5. Milestones and Life should not have totally separate visual systems.
6. Travel should not have a different card system from Arjun.
7. Preserve the premium dark editorial aesthetic already established.

Do not remove useful existing functionality. Do not hardcode category-
specific layouts unless there is an actual content reason. Create
reusable data-driven components instead.

Before implementation: inspect the current routes/components, identify
duplicated layouts, identify category-specific code that should become
shared, give a concise implementation plan. Then implement the refactor. Do
not modify unrelated pages.
```

---

## PR 3 — Home Page

```text
Update only the Home page.

The current Home page repeats the same folder/category links twice: once as
floating cards at the bottom of the hero, again as large Photos cards below.
I do not want duplicate navigation.

GOAL

Keep only ONE elegant representation of the primary photo categories: Arjun,
Travel, Milestones, Life.

PREFERRED APPROACH

Keep the elegant chapter rail near the bottom of the hero and remove the
duplicate category cards from the next section.

The Home page should flow like this:

1. Hero slideshow
2. One elegant category/chapter rail: Arjun, Travel, Milestones, Life
3. Family Films preview
4. Other relevant homepage content

Do NOT repeat the same category navigation. Do NOT add a "Recently
Captured"/"Latest Frames" recent-photos section — the user has explicitly
opted out of that section of the original brief. After the chapter rail,
move directly into Family Films / other existing relevant content.

CATEGORY RAIL

Compact, elegant, consistent width, photo-backed or subtle translucent
cards, title + small subtitle, restrained icon, clickable. Not huge. Sits
between the hero and content below as the main gateway into Photos.

SLIDESHOW FRAMING

The current slideshow may start already zoomed/cropped and zoom further,
cutting off faces/important parts, especially on portrait images. Fix this.

Every slide should START by showing the entire image. Never crop important
parts at the start.

LAYOUT: slightly smaller than full viewport height. Target ~78–84vh
desktop, not nearly the entire screen. Leave room for the chapter rail to
feel intentional.

IMAGE BEHAVIOR: start every image with the full photograph visible. Use
object-fit: contain (or equivalent) when needed to preserve the entire
photo — do not default to object-fit: cover if it cuts off the image.
Landscape photos that naturally fit the hero can fill more space. Portrait
photos: keep the entire portrait visible, centered, with a subtle blurred/
darkened version of the same photo behind it to fill unused side space if
needed. Do not stretch images.

KEN BURNS / MOTION: if used, start at scale(1), increase only slightly to
~scale(1.02)–scale(1.04). Never begin already zoomed in. Never crop a face
or primary subject. Long, subtle transition, ~8–12 seconds per slide. Avoid
aggressive panning. Use focal-point metadata if it exists; otherwise center
and prioritize full-image visibility.

TRANSITIONS: restrained cross-fade only, no flashy slides.

NAVIGATION: preserve previous/next controls, slide count, automatic
slideshow behavior. Ensure transitions never reset to a cropped state.

Test with: portrait images, close-up family portraits, landscape travel
images, group photos. The first frame of every slide must respect the
complete photograph.

Preserve the existing premium dark editorial aesthetic. Do not touch Photos
detail pages in this task.
```

---

## PR 4 — Photos Overview

```text
Update only Home → Photos.

The current Photos page uses different-sized category tiles. I no longer
want the asymmetric card layout here — it looks visually inconsistent and
makes some folders appear more important than others.

GOAL

Arjun, Travel, Milestones, Life should all use the exact same folder card
system.

LAYOUT

Desktop: clean 2x2 grid. All four cards identical width, height, aspect
ratio, corner radius, internal padding, text placement. Recommended card
ratio ~16:9 or 4:3. Do not mix portrait and landscape card shapes — the
source photo can crop inside the thumbnail, but card dimensions stay
consistent.

TEXT: every card follows the same hierarchy — small eyebrow, folder/
category name, short description, optional photo/folder count.

Example:
GROWING UP, FRAME BY FRAME
Arjun
"Every milestone, every laugh."

Same treatment for Travel, Milestones, Life — no special layouts.

HEADER: keep "OUR STORY IN FRAMES" / "Photos" / "Four chapters. Every frame
we have captured together." / "View all photos →". Generous, premium
spacing.

MOBILE: single-column layout, every folder card keeps the same ratio. No
masonry on this page — it is a folder browser, not a photo gallery.
```

---

## PR 5 — Category Pages

```text
Refactor the category landing pages: Photos → Arjun, Photos → Travel,
Photos → Milestones, Photos → Life. Do not change individual album/photo
pages yet.

The four category pages currently use inconsistent designs. I want them to
share ONE common page structure.

GOAL

Every category page should look structurally identical while allowing its
own title, description, thumbnail imagery, folder names, and counts. Use a
shared component.

PAGE STRUCTURE

1. Global navbar
2. Breadcrumb
3. Small editorial eyebrow
4. Category title
5. Short category description
6. Optional total folder/photo count
7. Folder grid

Example:
Photos / Travel
STORIES FROM EVERYWHERE
Travel
"Roads taken, cities explored, memories carried home."
12 folders • 842 photos

FOLDER GRID: all folder tiles same size, aspect ratio, border radius,
overlay, typography, spacing. Grid: desktop 3 columns, tablet 2, mobile 1.
No album larger than another. Each card: folder name, optional small
description/location, optional photo count.

CONTENT DIFFERENCES: Arjun may use age/month-oriented folders, Travel
trip/destination folders, Milestones event folders, Life people/event/
everyday folders — content changes, visual system does not.

IMPORTANT: remove the unique timeline presentation from the Milestones
category landing page (that belongs on the album/detail level only, per the
shared system, not the category landing page). Remove any separate
Life-specific theme. Milestones and Life can still contain different
content, but navigation and folder browsing must be consistent with Arjun
and Travel.

Then, as a second pass, create ONE reusable category header used by all
four pages. Use the current Milestones page header as visual inspiration
but more compact — desktop top margin after navbar 48–64px, bottom margin
before content 48–64px, not a giant hero. Eyebrow: small uppercase bronze.
Title: large editorial serif, not oversized. Description: muted warm gray.
Metadata: small subtle text. Aligned to the same max-width container as the
folder grid. Use this exact component for every category — no per-category
headers.

Preserve existing URLs and data. Do not modify individual albums in this
task.
```

---

## PR 6 — Album Pages

```text
Refactor the individual album page used at Home → Photos → Category →
Album (e.g. Photos → Travel → Maine, Photos → Arjun → 1st Month, Photos →
Milestones → Engagement, Photos → Life → [folder]).

Use the best existing individual-album presentation in the app today as the
base concept for ALL individual album pages.

GOAL

Every album should have: consistent album header, album description/
location, photo count, high-quality photo gallery, consistent layout across
all categories.

HEADER: do NOT repeat the album title twice (e.g. "ALBUM / Maine" followed
later by "PHOTOS / Maine" — remove that duplication). Use one clean header:

Home / Photos / Travel / Maine
ALBUM
Maine
Bar Harbor, Maine
"A few quiet days by the coast — ocean air, long walks, and sunsets over
the harbor."
113 photos

Then begin the gallery directly. Apply the same structure to Arjun,
Milestones, and Life albums.

DESCRIPTION: support optional location, optional date/date range, optional
short description. If data is unavailable, gracefully omit that line — no
empty placeholders.

PHOTO GRID: preserve the best existing gallery visual style. Use the same
gallery component for all albums — natural aspect ratios, tasteful masonry.
Folder/category pages stay uniform; individual photo galleries can be
organic. Keep spacing consistent. Do not create different gallery designs
per category — all albums use the same component.

Do not touch Favorites/Memories/Videos.
```

---

## PR 7 — Metadata, Thumbnail Selection, Image Quality

```text
Add metadata support for photo albums. Do not redesign unrelated UI.

I want every album/folder to optionally support: title, description,
location, startDate, endDate, thumbnail, photoCount. All fields except
title are optional.

DATA MODEL: inspect the existing data structure first. Extend the existing
model rather than creating a parallel system. Do not break existing
folders.

UI: display metadata in (1) category folder cards — title, location OR
short description, photo count; (2) individual album header — title,
location, date/date range if available, description, photo count. Do not
display absent fields. Keep the UI subtle and editorial. Keep the solution
simple — no full CMS.

HIGH-DEFINITION THUMBNAILS: improve thumbnail quality throughout. Inspect
how images are currently loaded/optimized. Folder/category thumbnails
should request an image large enough for their rendered size (target ~1200–
1600px wide source where appropriate), responsive srcset/sizes, high-DPI
support. Photo grid: optimized preview images, lazy loading, responsive
sizes, no full original loaded immediately for every grid photo. Lightbox:
load a higher-resolution version appropriate to the viewport. Folder
thumbnails use object-fit: cover; photo album gallery respects natural
aspect ratio; hero slideshow follows the PR 3 full-image framing behavior.
Maintain performance; do not reduce image quality just to save bandwidth.

MANUAL ALBUM COVER SELECTION: add the ability to manually choose the
thumbnail/cover image for any album/folder. Add "Set as album cover" (or
equivalent wording matching existing UI) to the photo context/overflow
menu, or a discreet three-dot action on hover / in the lightbox if no
context menu exists — do not permanently show the action over every image.

Behavior: on select, save the selected photo ID/path as the album
thumbnail, immediately update the album card, persist the choice, show a
subtle confirmation toast ("Album cover updated"). Must remain selected
across reloads. Store only a reference (e.g. coverPhotoId or the existing
equivalent concept) — do not duplicate image data.

Fallback: if no custom cover is selected, use a deterministic fallback
(first photo, or existing automatic thumbnail logic) — never randomly
change thumbnails on reload. If useful, add "Reset album cover" to return
to the automatic/default thumbnail.

This is a private authenticated app — use the existing authenticated
editing model; do not expose this control to unauthenticated viewers if
public viewing exists. Apply to folders under Arjun, Travel, Milestones,
Life using one shared implementation.

LIGHTBOX ACTIONS: enhance the existing photo lightbox only. Add the owner
action "Set as album cover" via a three-dot overflow menu or existing
actions menu (alongside Favorite, Download, Photo details) — subtle, do not
clutter the lightbox. When clicked: save this photo as the current album's
cover, immediately reflect the new thumbnail wherever the album card
appears, show a small confirmation message, do not close the lightbox. Do
not add a large visible "Set thumbnail" button over the photograph — the
image stays the focus.
```

---

## PR 8 — Final Consistency Audit

```text
Perform a visual consistency audit of only: Home, Photos overview, Arjun,
Travel, Milestones, Life, and all individual photo albums.

Do not modify: Favorites, Memories, Videos.

VERIFY

Navigation: same navbar everywhere.
Page width: same max-width rules.
Category headers: same component.
Folder cards: same height, width, radius, typography, overlay, hover
behavior.
Folder grids: same column rules.
Album headers: same component.
Album photo gallery: same component.
Photo lightbox: same component.
Thumbnail resolution: consistent and Retina-ready.
Thumbnail selection: works for all categories.
Metadata: location/description/date appear consistently.
Spacing: same vertical rhythm.
Typography: same serif/sans hierarchy.
Colors: same background and bronze accent system.
Confirm the Home page has no "Recently Captured"/recent-photos section
(explicit user deviation from the original brief — verify it was not
reintroduced in an earlier PR).

Fix any category-specific CSS or components that unnecessarily override the
shared system.

Do NOT try to make the actual photographs look identical. Consistency
should come from the UI around the photographs.

After changes, test these routes manually: Home; Photos; Photos → Arjun,
Photos → Arjun → one album; Photos → Travel, Photos → Travel → Maine (or
equivalent); Photos → Milestones, Photos → Milestones → one milestone;
Photos → Life, Photos → Life → one folder.

Report any remaining inconsistencies you intentionally kept and explain
why.
```
