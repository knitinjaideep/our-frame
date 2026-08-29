# Our Frame Premium Redesign State

Status: PR 8 complete

Last updated: 2026-08-29

## Current Context

Executing the page-by-page premium redesign brief (see
`docs/redesign/PROMPTS.md`) via `our-frame-implementer` →
`our-frame-reviewer` → `our-frame-verifier`, one PR at a time, each on its
own branch off `main`, per `docs/redesign/MILESTONES.md`.

## Ruling: design-system direction change

`docs/design-system.md` currently specifies a light+dark "warm amber memory
book" system. This redesign moves to a dark-first, near-black,
bronze/gold-accented cinematic system starting in PR 1. This is an explicit
user request (2026-08-28/29) and supersedes the amber direction; it does not
relax any non-visual rule in `.claude/CLAUDE.md` (architecture, privacy,
data safety, backend standards all still apply).

## Active Safety Notes

(Same as `docs/media-cache/STATE.md` — this work does not change them.)

- Do not commit `.env`, OAuth tokens, SQLite databases, or generated
  media-cache files.
- Do not modify Google Drive originals.
- Preserve legacy gallery routes and existing media-cache derivative
  behavior — this is a visual/frontend redesign, not a data/backend
  migration.
- Keep private media behind authenticated app access.
- Each PR stays on its own branch; do not push or merge without explicit
  approval.

## PR Progress

| PR | Name | Status | Branch | Commit |
|---|---|---|---|---|
| 1 | Global Design System + Navigation | Complete | redesign/pr-1-design-system | 8690aca |
| 2 | Home / Landing | Complete | redesign/pr-2-home (branched from redesign/pr-1-design-system) | e12b11d |
| 3 | Photos Overview | Complete | redesign/pr-3-photos-overview (branched from redesign/pr-2-home) | 2a377dc |
| 4 | Arjun / Album Detail (gallery primitives) | Complete | redesign/pr-4-arjun-gallery (branched from redesign/pr-3-photos-overview) | 3e3a4d9 |
| 5 | Photo Lightbox / Viewer | Complete | redesign/pr-5-lightbox (branched from redesign/pr-4-arjun-gallery) | a90c98a |
| 6 | Travel, Milestones, Life | Complete | redesign/pr-6-travel-milestones-life (branched from redesign/pr-5-lightbox) | fe8cdbd |
| 7 | Videos | Complete | redesign/pr-7-videos (branched from redesign/pr-6-travel-milestones-life) | f5b7d5c |
| 8 | Favorites | Complete | redesign/pr-8-favorites (branched from redesign/pr-7-videos) | df5d739 |
| 9 | Memories / On This Day | Pending | — | — |
| 10 | Mobile Experience Polish | Pending | — | — |

## Next Action

Create `redesign/pr-9-memories` branch off `redesign/pr-8-favorites` and
dispatch `our-frame-implementer` for PR 9 (Memories / On This Day page).

## Completed Checks

- 2026-08-29: Created `docs/redesign/PROMPTS.md`, `docs/redesign/MILESTONES.md`,
  and this state tracker from the user-provided 13-prompt redesign brief,
  grouped into 10 PRs per the user's stated ordering.
- 2026-08-29: PR 1 implementer added design tokens (spacing/motion/typography
  scale/reduced-motion), rebuilt `frontend/components/layout/top-nav.tsx`
  (transparent-on-home vs solid-interior variants, restrained bronze active
  state, full-screen mobile sheet), added 11 new primitives under
  `frontend/components/design-system/` plus a `SectionHeading` alias, and
  restructured `docs/design-system.md` with the new cinematic system as the
  authoritative "Part 1" section (old amber system kept below as reference).
- 2026-08-29: PR 1 implementer `npm run build` passed (24 routes); lint clean
  on touched/added files.
- 2026-08-29: PR 1 reviewer returned `REVIEW STATUS: PASS WITH FIXES` —
  fixed keyboard-inaccessible Videos dropdown trigger and mouse-only
  flyouts (added onClick/onFocus/onBlur), added Escape-key dismissal, added
  mobile-sheet body-scroll lock, fixed `UserMenu` breakpoint mismatch
  (`hidden lg:block` → `hidden md:block`), raised two bronze micro-label
  contrast values to `var(--amber-bright)` at 0.85 opacity.
  Reviewer confirmed zero backend/auth/media-route changes and restrained
  (~5-10%) bronze visual weight.
- 2026-08-29: PR 1 verifier ran `npm run build`, `npx tsc --noEmit`, and
  `eslint` on changed files — all clean — and independently confirmed each
  reviewer fix is present in the final file contents. Returned
  `VERIFICATION: PASS`.
- 2026-08-29: PR 2 implementer fixed the nav-over-hero overlay bug flagged by
  PR 1's review (`conditional-shell.tsx` now skips `<main>` top padding only
  on `/home` via `FULL_BLEED_HERO_ROUTES`), rebuilt hero content (eyebrow
  "Welcome Home", headline "Every frame holds a story.", CTA "Explore Our
  Story"), added a `variant="rail"` mode to `ChapterCard` for the floating
  4-card chapter rail (Arjun/Travel/Milestones/Life) using real Drive bucket
  thumbnails, and made the Ken Burns hero animation respect
  `prefers-reduced-motion`.
- 2026-08-29: PR 2 implementer `npm run build` passed (26 routes); tsc and
  lint clean.
- 2026-08-29: PR 2 reviewer returned `REVIEW STATUS: PASS WITH FIXES` — fixed
  a cross-state regression where removing `<main>`'s top padding on `/home`
  also broke clearance for `HomeSetupView`'s no-workspace/no-drive/no-media
  states (added calc-based top padding there), fixed a dead/no-op
  `hover:border-amber-border` Tailwind class in `ChapterCard`, fixed the
  hero's bottom scroll-indicator/slide-counter colliding with the new
  chapter rail, strengthened the hero vignette so the taller new text block
  stays legible on bright photos, sized the CTA button properly, and
  de-duplicated the four Drive folder IDs (previously hardcoded a third time
  in `home-feed-view.tsx`) down to a single shared list. Reviewer confirmed
  the `/home`-only scope of the layout change against every other
  shell-wrapped route.
- 2026-08-29: PR 2 verifier ran `npm run build`, `npx tsc --noEmit`, and
  `eslint` — all clean — and independently confirmed each reviewer fix is
  present in the final file contents. Returned `VERIFICATION: PASS`.
- 2026-08-29: PR 3 implementer rewrote `frontend/app/photos/page.tsx` as an
  asymmetric mosaic (Arjun/Life dominant at `lg:col-span-7`,
  Travel/Milestones at `lg:col-span-5`) using real `photo_count`/thumbnail
  data from `useRootBuckets()`, with a matching loading skeleton; added an
  additive `size?: 'lg' | 'md'` prop to `ChapterCard`'s `cover` variant.
- 2026-08-29: PR 3 implementer `npm run build` passed (26 routes); tsc and
  lint clean; confirmed no regression vs 8 pre-existing unrelated
  `components/onboarding/*` lint errors already on the base branch.
- 2026-08-29: PR 3 reviewer returned `REVIEW STATUS: PASS WITH FIXES` —
  fixed the mosaic's aspect ratios (the "dominant" cards were actually
  shorter in area than the "secondary" ones; added a shared
  `CHAPTER_COVER_ASPECT` constant so dominant tiles are genuinely ~1.85x
  larger), fixed a tablet-width layout bug (portrait cards rendering
  near-viewport-height between 640-1024px), added a real error/empty state
  via `EmptyState` (previously: four blank blank countless dark cards on
  fetch failure or an unsynced workspace — the exact "unexplained black
  cards" pattern `.claude/rules/frontend.md` forbids), added
  `group-focus-visible:` parity for the hover-only arrow affordance, and
  set `imageAlt=""` on chapter thumbnails since the card already carries a
  text label in the same link. Reviewer confirmed real (non-fabricated)
  photo counts/images and left the `#chapters` anchor and fixed-pattern
  mosaic order as deliberate, documented judgment calls rather than
  escalating them.
- 2026-08-29: PR 3 verifier ran `npm run build`, `npx tsc --noEmit`, and
  `eslint` — all clean — and independently confirmed each reviewer fix is
  present in the final file contents, plus confirmed `ChapterCard`'s
  `variant="rail"` consumer (Home page) is unaffected. Returned
  `VERIFICATION: PASS`.
- 2026-08-29: PR 4 implementer found the nav's "Arjun" link actually routes
  to the generic `/albums/[id]` page shared by all four chapters, and
  scoped the redesign to a single `id === BUCKETS[0].id` branch rendering a
  new `frontend/components/albums/arjun-gallery.tsx` (breadcrumb, serif
  title/subtitle, quiet count, Filter/Sort text controls, `GalleryTabs`
  All/By Age/By Year/Albums, optional Featured memories strip,
  `MasonryGallery`, `PhotoLightbox`), leaving every other album id's
  markup untouched. Added `frontend/lib/photo-age.ts` to derive age
  captions from the earliest-dated photo (no birth-date field exists).
  Completed `GalleryTabs`' ARIA gap (roving tabindex, arrow/Home/End nav)
  flagged since PR 1.
- 2026-08-29: PR 4 implementer `npm run build` passed (26 routes); tsc and
  lint clean.
- 2026-08-29: PR 4 reviewer returned `REVIEW STATUS: PASS WITH FIXES` —
  found and fixed a **media-performance defect**: grid/featured-strip tiles
  were falling back to `preview_url` (the legacy full-Drive-original-download
  route) whenever a cached thumbnail wasn't ready yet, which would have hit
  every un-synced `.MOV` in the chapter. Replaced with a `gridThumbnail()`
  helper that only ever sources `thumbnail_url`/`poster_url`, rendering an
  honest processing placeholder otherwise. Also fixed: favorite control was
  a non-focusable nested `<span>` (keyboard users couldn't favorite from the
  grid) — rebuilt as a real sibling `<button>` with `aria-pressed` and
  `group-focus-within` reveal; missing focus ring on photo tiles (clipped by
  `overflow-hidden`); no video/still distinction in the grid; a
  favorite-toggle/display predicate mismatch; `aria-controls` pointing at
  unmounted tabpanels; added an honesty caption on the By Age tab since ages
  are a derived approximation, not literal fact; reduced bronze/eyebrow
  weight (was one gold label per age-bucket section, now plain text except
  the single "Featured Memories" label).
- 2026-08-29: PR 4 verifier ran `npm run build`, `npx tsc --noEmit`, and
  `eslint` — all clean — and independently confirmed the `preview_url` fix
  (grepped for the string, confirmed absence from grid/featured-strip
  sourcing) and every other reviewer fix in the final file contents.
  Returned `VERIFICATION: PASS`.
- 2026-08-29: PR 5 implementer redesigned `frontend/components/photos/resilient-lightbox.tsx`
  (the real lightbox `frontend/components/design-system/photo-lightbox.tsx`
  wraps, untouched): near-black backdrop via the existing `.yarl__root` CSS
  var, translucent circular Close/Favorite/Download/Details/Prev/Next
  controls replacing the default yarl toolbar, a 3s auto-hide-to-0.32-opacity
  control fade, a discreet caption/date line with an expandable details
  panel, and — per the PR 4 follow-up — a working favorite control wired to
  the same `isFav()`/`toggleFavorite()` the Arjun grid uses. Preserved the
  existing image retry/fallback chain and video plugin unchanged.
- 2026-08-29: PR 5 implementer `npm run build` passed (26 routes); tsc and
  lint clean.
- 2026-08-29: PR 5 reviewer returned `REVIEW STATUS: PASS WITH FIXES` —
  independently verified from the installed `yet-another-react-lightbox`
  library source (not just trusting the implementer's report) that
  Escape/arrow-key navigation and pointer-swipe survive the custom controls
  override. Found and fixed a **critical bug**: pressing the new favorite
  control while browsing snapped the viewer back to the originally-opened
  photo, because the `slides` array's identity change (favoriteIds in its
  memo deps) caused the library to reset to the fixed `index` prop — fixed
  with live-index state that only re-seeds on a genuine fresh open, which
  also benefits the untouched `photo-grid.tsx` consumer. Also fixed:
  full-width control bands had `pointer-events-auto` and could swallow taps
  on an underlying video's native scrubber (narrowed to individual
  buttons); details toggle used `aria-pressed` with no panel linkage (added
  `aria-expanded`/`aria-controls`/`id`); favorite-heart pulse read as a
  bounce (`scale-125` → `scale-110`).
- 2026-08-29: PR 5 verifier ran `npm run build`, `npx tsc --noEmit`, and
  `eslint` — all clean — and independently confirmed every reviewer fix in
  the final file contents, plus confirmed
  `frontend/components/design-system/photo-lightbox.tsx` remained
  untouched. Returned `VERIFICATION: PASS`.
- 2026-08-29: PR 6 implementer extended the PR 4 per-bucket branching
  pattern in `frontend/app/albums/[id]/page.tsx` to add `TravelGallery`,
  `MilestonesGallery`, `LifeGallery`; upgraded the generic `/albums/[id]`
  template (used by every nested destination/milestone album) from the
  legacy `PhotoGrid` to `MasonryGallery`/`PhotoLightbox`; added
  `useAlbumDetails` (parallel per-sub-album fetches) and
  `latestDate`/`dateRangeLabel` helpers that return null rather than
  guessing when dated photo data is missing. Discovered via direct backend
  investigation that all four top-level chapter buckets have zero direct
  photos (real photos live in Drive sub-albums), and grounded all three
  pages' structure in that finding rather than fabricating trip/milestone
  metadata. Deliberately skipped Life's Family/Friends/Home/Celebrations/
  Everyday filters since no tagging field exists in the data model.
- 2026-08-29: PR 6 implementer `npm run build` passed (26 routes); tsc and
  lint clean.
- 2026-08-29: PR 6 reviewer returned `REVIEW STATUS: PASS WITH FIXES` —
  independently re-verified the zero-direct-photos finding against the raw
  SQLite database (not just trusting the implementer). Fixed a Milestones
  navigational dead end ("Marriage" has 0 direct photos, only nested
  sub-albums, and had no link at all), a Life page that could render
  blank below the header on a sub-query failure (the same
  unexplained-blank pattern PR 3 already had to fix once), a Travel
  featured-hero card that visibly swapped destination identity ~1s after
  paint, and upscaled 400px thumbnails being used as full-width hero
  images (switched Travel's and Life's single hero image each to
  `preview_url`, while keeping every grid/journal/masonry tile on cached
  thumbnails only — confirmed the PR 4 `preview_url` bug was not
  reintroduced). Replaced three hand-rolled empty states with the shared
  `EmptyState` primitive.
- 2026-08-29: PR 6 verifier ran `npm run build`, `npx tsc --noEmit`, and
  `eslint` — all clean — and independently confirmed every reviewer fix in
  the final file contents, plus confirmed `preview_url` is used only for
  the two hero images and lightbox slides, never grid/card tiles. Returned
  `VERIFICATION: PASS`.
- 2026-08-29: PR 7 implementer rewrote `frontend/app/videos/page.tsx` as a
  cinematic film library (eyebrow "Stories in Motion", heading "Family
  Films", one featured film + grouped supporting tiles, posters sourced
  from cached `poster_url`/`thumbnail_url` only), reusing the existing
  `PhotoLightbox`/`ResilientLightbox` Video plugin for playback rather than
  building a separate player, and generalized the lightbox's Prev/Next
  labels to say "video" instead of always "photo" on video slides.
  Investigated (did not fix) the Arjun-videos-unreachable bug from PR 6 and
  found it doesn't affect this page — see the updated bug entry above.
- 2026-08-29: PR 7 implementer `npm run build` passed (26 routes); tsc and
  lint clean.
- 2026-08-29: PR 7 reviewer independently re-confirmed the video-reachability
  finding via direct SQLite queries and reading `sections_service.py` (not
  trusting the implementer's numbers). Returned `REVIEW STATUS: PASS WITH
  FIXES` — fixed a real bug where reopening the featured film after
  browsing to another one would silently reopen on the previously-viewed
  slide (the page was clamping the lightbox `index` prop to 0, defeating
  the PR-5 live-index re-seed logic that only re-seeds when that prop
  actually changes), and fixed misleading screen-reader labels on
  still-processing video tiles (announced "Play" instead of "still
  processing").
- 2026-08-29: PR 7 verifier ran `npm run build`, `npx tsc --noEmit`, and
  `eslint` — all clean — and independently confirmed both reviewer fixes in
  the final file contents. Returned `VERIFICATION: PASS`.
- 2026-08-29: PR 8 implementer rewrote `frontend/app/favorites/page.tsx`
  ("The Ones We Love", real saved-photo count, `MasonryGallery`+
  `PhotoLightbox` for the with-favorites state, `EmptyState`-based empty
  state with a discovery row and a client-side-loop "Select"/bulk-remove
  action since no bulk backend endpoint exists), and added additive
  `selected`/`onToggleSelect` props to `MasonryGalleryItem`.
- 2026-08-29: PR 8 implementer `npm run build` passed (26 routes); tsc and
  lint clean.
- 2026-08-29: PR 8 reviewer returned `REVIEW STATUS: PASS WITH FIXES` —
  found the empty-state "Recently Captured" row was **materially
  misleading** (verified against the real database: it showed only
  2023-dated photos from a hero-scored pool while the library's actual
  newest photo is from 2026) and fixed it by re-sourcing from a
  library-wide pool and relabeling it "From The Collection" rather than
  falsely implying recency (see follow-up note below — a true "recently
  captured" feature needs a new backend endpoint). Also fixed a bulk-remove
  partial-failure gap (`Promise.all` → `Promise.allSettled` with retryable
  failed-id tracking and a status message), an error-state branch that
  rendered a stray count/Select bar, and a lightbox-shows-empty-slide edge
  case when the last favorite is removed mid-view.
- 2026-08-29: PR 8 verifier ran `npm run build`, `npx tsc --noEmit`, and
  `eslint` — all clean — and independently confirmed every reviewer fix in
  the final file contents, plus confirmed `MasonryGalleryItem`'s new props
  are additive and don't affect any other consumer. Returned
  `VERIFICATION: PASS`.

## Pre-existing bugs found during redesign work (not caused by this redesign)

Found during PR 6's data investigation, confirmed independently by both the
PR 6 implementer and reviewer against the live database — reported to the
user 2026-08-29, not yet fixed, out of scope for the current 10-PR redesign:

1. **The already-implemented Arjun gallery (PR 4) currently renders empty
   in real use.** All four top-level chapter buckets (Arjun/Travel/
   Milestones/Life) have zero photos directly attached — every real photo
   lives in a Drive sub-album one level down. `arjun-gallery.tsx` reads
   `data.photos` from the top bucket only, so its All/By Age/By Year tabs
   and Featured Memories strip render `EmptyState "No photos yet"`; only
   its Albums tab (13 real sub-albums) shows anything. The fix is the same
   `useAlbumDetails` hook PR 6 added for Travel/Milestones/Life — applying
   it to Arjun is a natural fast-follow, but is a real behavior change to
   already-committed work and should be its own reviewed change, not
   silently folded into an unrelated PR.
2. **36 of Arjun's videos are unreachable via the album/gallery views.**
   Backend bug in `_flatten_subfolders()` (`backend/services/album_service.py`):
   when a structural folder (e.g. `Arjun/Videos`) has no child sub-albums of
   its own, the function returns only its flattened children and silently
   drops the folder's own direct photos/videos. `Arjun/Videos` has 0
   children, so its 36 files appear in no `/albums/{id}` view anywhere.
   **Update (PR 7):** this bug does NOT affect the dedicated Videos page —
   `get_video_files()` in `backend/services/sections_service.py` queries
   video folders directly via `photo_repo.get_by_folder()`, bypassing
   `_flatten_subfolders()` entirely. All 51 real videos in the dataset
   (36 under `Arjun/Videos`, 15 under a nested Pregnancy-period folder) are
   reachable and shown on `/videos`. The bug's remaining real-world impact
   is scoped to `_flatten_subfolders()`'s callers (album/gallery browsing),
   not video discovery specifically.

## Known follow-ups for later PRs

- `MasonryGalleryItem`/`PhotoLightbox` prop contracts (in
  `frontend/components/design-system/`) will need additive fields for
  favorite/date/caption metadata when PR 4 and PR 5 wire them up — expect
  non-breaking extension, not rework.
- `GalleryTabs` ARIA (`role="tablist"/"tab"`) has no `aria-controls`,
  tabpanels, or roving-tabindex yet — complete this in PR 4 when real panels
  are attached.
- Unused `data-theme` presets (`cool_dark`, `soft_light`) remain in
  `globals.css` — dead weight, not a defect; candidate for a future cleanup
  pass, not part of this redesign's scope.
- Hero slide-dot buttons are ~4×4px hit targets, below the 24×24 minimum —
  address in PR 10 (Mobile Polish).
- `.hero-slideshow` still carries an inline `width: 100vw` (pre-existing);
  can cause a horizontal scrollbar with classic (non-overlay) scrollbars —
  `w-full` would fix it; flag for PR 10 or a follow-up cleanup, not urgent.
- `HeroSlideshow` cannot currently distinguish "loading" from "zero
  slideshow photos" — benign today since `has_media === false` correctly
  routes to `HomeSetupView`'s `no_media` state, but worth a real skeleton if
  this ever becomes user-visible.
- No flat "all photos across every chapter" route exists yet. PR 3's "View
  all photos" action anchors to `#chapters` in-page as an honest
  interpretation rather than inventing an out-of-scope page/route. A real
  `/photos/all` (or similar) is a candidate for a future PR, not required
  by the current 10-PR redesign scope.
- `frontend/app/albums/page.tsx` and `/photography` (redirects to `/life`)
  are stale, un-redesigned legacy surfaces the new Photos overview page
  does not link to — leave them alone; they are outside this redesign's
  scope unless a later PR is explicitly asked to retire them.
- `MasonryGallery` uses CSS `columns-*`, which fills column-by-column, so
  on-screen visual order is not strictly chronological even though the
  lightbox's prev/next follows the real chronological photo order. This is
  inherent to the primitive; worth a look in PR 10 (Mobile Polish) or a
  dedicated pass if it becomes a real UX complaint.
- Age captions ("1st month", "1st year") in `frontend/lib/photo-age.ts` are
  an approximation derived from the chapter's earliest photo, not a real
  birth-date field (none exists in the data model). The UI now discloses
  this ("Ages are estimated..."). A per-chapter reference-date setting
  would be the real fix if exact ages ever matter — a genuine product
  decision, intentionally left open.
- No endpoint returns photos ordered by recency. PR 8's Favorites empty
  state wants a "Recently captured" row, but every available source is
  quality-scored, not date-ordered: `/home/feed` `hero_photos` returns (on
  the real database) only 4 photos, all from one root album, all from 2023,
  while the newest library photo is from 2026; `/home/slideshow`'s
  no-favorites fallback is library-wide but still score-ranked. PR 8 sources
  the row from `/home/slideshow`, orders it newest-first, and labels it
  honestly ("From the collection") instead of claiming recency. A real
  `/photos/recent` endpoint (or a `sort=created_time` option) is the proper
  fix and would let that section use the prompt's literal label — a small
  backend addition, deliberately not made inside a frontend-only redesign PR.
- With the Favorites filter active on a gallery page, unfavoriting a photo
  from inside the lightbox removes that slide and the viewer lands on a
  neighbor rather than any specifically "right" photo. Not obviously wrong,
  but PR 8 (Favorites) should make a deliberate call here.
- Lightbox Prev/Next buttons are labelled "Previous/Next photo" even for
  video slides — cosmetic, generalize the label in PR 7 (Videos).
- After the lightbox's 3s control auto-hide, controls sit at opacity 0.32;
  fine on most photos but `white/80` icons may read faint on very bright
  images — consider bumping toward ~0.4 during PR 10 (Mobile Polish) after
  real-device testing.
- Lightbox ambient background blur (explicitly optional in the PR 5 prompt)
  was not implemented — real new infrastructure, not required.
- Nested-only sub-albums (0 direct photos, only children, e.g. Milestones'
  "Marriage") undercount in any header/card total that sums direct
  `photo_count` only. A recursive count on `AlbumSummary` would fix this
  properly but is a backend/API change, not a frontend PR — no current
  redesign page hits this in a user-visible way beyond the count string.
- Milestones' hero images use the 400px thumbnail derivative (scales with
  milestone count, so `preview_url` wasn't used there per PR 6's review).
  The backend already generates a 900px `grid` derivative that the API
  never exposes (`media_response_service.py` returns thumbnail/poster/
  playback/preview only) — exposing `grid_url` would be the right fix, a
  candidate for a future media-cache PR.
- `frontend/lib/media.ts`'s `gridThumbnail()` duplicates logic already
  inline in `arjun-gallery.tsx` (kept deliberately separate per PR 6 scope
  discipline). Collapse into one shared helper whenever Arjun is next
  touched (e.g. alongside pre-existing-bug fix #1 above).
- `/travel`, `/milestones`, `/life`, `/arjun` remain stale legacy
  `SectionWorldPage` routes nothing in the redesigned nav links to —
  there are now two divergent "Travel" (etc.) surfaces in the tree.
  Candidate for retirement in a future cleanup PR, not required by the
  current redesign scope.
- Up to 5 parallel `/albums/{id}` shallow-sync requests fire per
  Travel/Milestones/Life page load; each is idempotent and cached, but
  SQLite has no explicit `busy_timeout` configured and now sees more
  concurrent-write pressure than before. Acceptable today (default pysqlite
  timeout should absorb it); worth monitoring, and moot once the stated
  Postgres migration happens.
- `/videos/arjun` and `/videos/family-travel` (older per-chapter video
  pages) remain un-redesigned while `/videos` (the new all-videos page) is
  redesigned — the Videos nav dropdown currently spans two visual
  languages. Candidate for a future PR, not required by current scope.
- `media_items.duration_ms` exists in the backend and is populated for
  synced videos, but isn't exposed via `PhotoResponse`/`media_response_fields`
  or `frontend/types` — the redesigned Videos page correctly omits duration
  rather than fabricating it, but exposing it would be a small, real
  improvement for a future media-cache PR.
- One video has a ready poster but a `processing_status: failed` playback
  derivative — clicking it re-attempts the transcode (retryable by design,
  pre-existing behavior) but the UI can't distinguish "poster ready,
  playback failed" from "fully ready" ahead of the click. A per-derivative
  (not item-level) status field in the API would let the UI be honest about
  this; not introduced by the redesign, not fixed here.

## Open Questions

- None blocking.

## Notes for Future Agents

Before continuing:

1. Read `.claude/CLAUDE.md`.
2. Read this state file and `docs/redesign/MILESTONES.md`.
3. Inspect `git status --short` and current branch.
4. Continue from the first PR without a commit SHA recorded.
5. Never push/merge a redesign branch without explicit user approval.
