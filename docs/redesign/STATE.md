# Our Frame Premium Redesign State

Status: PR 1 complete

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
| 2 | Home / Landing | Pending | — | — |
| 3 | Photos Overview | Pending | — | — |
| 4 | Arjun / Album Detail (gallery primitives) | Pending | — | — |
| 5 | Photo Lightbox / Viewer | Pending | — | — |
| 6 | Travel, Milestones, Life | Pending | — | — |
| 7 | Videos | Pending | — | — |
| 8 | Favorites | Pending | — | — |
| 9 | Memories / On This Day | Pending | — | — |
| 10 | Mobile Experience Polish | Pending | — | — |

## Next Action

Create `redesign/pr-2-home` branch off `main` (after PR 1 merges) and dispatch
`our-frame-implementer` for PR 2 (Home / Landing page).

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

## Known follow-ups for later PRs (from PR 1 review)

- **PR 2 must make the transparent nav variant actually float over the Home
  hero photograph.** Currently `frontend/components/layout/conditional-shell.tsx`
  always applies top padding to `<main>`, so the nav sits over page
  background, not the hero image, on `/home`. Fixing this requires the PR 2
  full-bleed hero rework.
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

## Open Questions

- None blocking.

## Notes for Future Agents

Before continuing:

1. Read `.claude/CLAUDE.md`.
2. Read this state file and `docs/redesign/MILESTONES.md`.
3. Inspect `git status --short` and current branch.
4. Continue from the first PR without a commit SHA recorded.
5. Never push/merge a redesign branch without explicit user approval.
