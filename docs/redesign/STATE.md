# Our Frame Premium Redesign State

Status: PR 3 complete

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
| 3 | Photos Overview | Complete | redesign/pr-3-photos-overview (branched from redesign/pr-2-home) | pending commit |
| 4 | Arjun / Album Detail (gallery primitives) | Pending | — | — |
| 5 | Photo Lightbox / Viewer | Pending | — | — |
| 6 | Travel, Milestones, Life | Pending | — | — |
| 7 | Videos | Pending | — | — |
| 8 | Favorites | Pending | — | — |
| 9 | Memories / On This Day | Pending | — | — |
| 10 | Mobile Experience Polish | Pending | — | — |

## Next Action

Create `redesign/pr-4-arjun-gallery` branch off `redesign/pr-3-photos-overview`
and dispatch `our-frame-implementer` for PR 4 (Arjun / Album Detail —
MasonryGallery/GalleryTabs primitives).

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

## Open Questions

- None blocking.

## Notes for Future Agents

Before continuing:

1. Read `.claude/CLAUDE.md`.
2. Read this state file and `docs/redesign/MILESTONES.md`.
3. Inspect `git status --short` and current branch.
4. Continue from the first PR without a commit SHA recorded.
5. Never push/merge a redesign branch without explicit user approval.
