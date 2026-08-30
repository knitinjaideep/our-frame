# Our Frame Redesign V2 State

Status: PR 1 verified — PASS

Last updated: 2026-08-30

## Current Context

Execute the V2 consistency-redesign brief in `docs/redesign-v2/PROMPTS.md`
via `our-frame-implementer` → `our-frame-reviewer` → `our-frame-verifier`,
one PR at a time, each on its own branch, per
`docs/redesign-v2/MILESTONES.md`.

This plan supersedes the prior (unstarted) bronze/cinematic single-mockup V2
scaffold that previously occupied `docs/redesign-v2/`. That scaffold never
began implementation and was replaced per explicit user decision on
2026-08-29/30, in favor of running `OUR-FRAME-REDESIGN-EXECUTION-GUIDE.md`
(user-designated "Redesign V2") instead. See the "Superseded plan" note at
the bottom of this file.

## Relationship to `docs/redesign/` (already complete)

`docs/redesign/` (10 PRs, all complete/reviewed/verified, on branches
`redesign/pr-1-design-system` … `redesign/pr-10-mobile-polish`, none merged
to `main`) already delivered the dark bronze/cinematic visual system and
rebuilt every major page. This V2 initiative is a second, targeted
consistency pass on top of that — see `docs/redesign-v2/PROMPTS.md` for the
detailed relationship note.

## Required Reference Mockups

Already present in `docs/mockups/` (user-provided, uploaded prior to this
session):

- `01-home-page-second-pass-redesign.png`
- `02-photos-overview-unified-folder-system.png`
- `03-category-pages-shared-folder-system.png`
- `04-album-page-shared-editorial-template.png`
- `05-lightbox-album-cover-selection.png`

No further upload needed. The same 5 files are also present (identical, by
checksum) in `docs/redesign-v2/mockups/` from the superseded plan's upload
location — both are fine to leave as-is; `docs/mockups/` is the canonical
path referenced throughout `PROMPTS.md`/`MILESTONES.md`. Implementers/
reviewers/verifiers must inspect the relevant file(s) for each PR, not only
read the text brief.

## Explicit user deviation

**No "Recently Captured" / recent-photos section on the Home page.** The
user explicitly opted out of that piece of PR 3 in the source guide. Every
PR touching Home must respect this; PR 8 (final audit) must explicitly
re-verify it wasn't reintroduced.

## Branch Plan

Each `redesign-v2/pr-*` branch chains off the previous one.
`redesign-v2/pr-1-design-memory` branches off `redesign/pr-10-mobile-polish`
(current branch / tip of the completed first redesign), not `main`.

## Active Safety Notes

(Same as `docs/media-cache/STATE.md` and `docs/redesign/STATE.md` — this
work does not change them.)

- Do not commit `.env`, OAuth tokens, SQLite databases, or generated
  media-cache files.
- Do not modify Google Drive originals.
- Preserve legacy gallery routes and existing media-cache derivative
  behavior — this is a visual/frontend redesign, not a data/backend
  migration (PR 7's metadata field additions are the one schema-adjacent
  exception, and must be additive/backward compatible per `.claude/
  CLAUDE.md`'s Data Safety section).
- Keep private media behind authenticated app access.
- Each PR stays on its own branch; do not push or merge without explicit
  approval.

## PR Progress

| PR | Name | Status | Branch | Commit |
|---|---|---|---|---|
| 1 | Design Memory / Source of Truth | Verified — PASS | redesign-v2/pr-1-design-memory | 361a7ea |
| 2 | Shared Photos Architecture | Pending | redesign-v2/pr-2-photos-architecture | — |
| 3 | Home Page | Pending | redesign-v2/pr-3-home | — |
| 4 | Photos Overview | Pending | redesign-v2/pr-4-photos-overview | — |
| 5 | Category Pages | Pending | redesign-v2/pr-5-category-pages | — |
| 6 | Album Pages | Pending | redesign-v2/pr-6-album-pages | — |
| 7 | Metadata, Thumbnail Selection, Image Quality | Pending | redesign-v2/pr-7-metadata-covers | — |
| 8 | Final Consistency Audit | Pending | redesign-v2/pr-8-consistency-audit | — |

## Next Action

PR 1 is implemented, reviewed (PASS WITH FIXES), and verified (PASS) on
`redesign-v2/pr-1-design-memory`. Ready for user decision on merge
sequencing. Do not start PR 2 until the user approves.

## Completed Checks

- 2026-08-30: Created `docs/redesign-v2/PROMPTS.md`, `MILESTONES.md`, and
  this state tracker from the user-provided
  `OUR-FRAME-REDESIGN-EXECUTION-GUIDE.md`, mapped 1:1 to its own PR1–PR8
  sequence (distinct from `docs/redesign/`'s PR1–PR10 sequence), with the
  Home-page "Recently Captured" section explicitly excluded per user
  instruction, and confirmed the 5 required mockups already exist in
  `docs/mockups/` with the exact expected filenames.
- 2026-08-30: Implemented PR 1 (Design Memory / Source of Truth). Visually
  inspected all 5 mockups in `docs/mockups/` (not just the text brief) and
  reconciled them against `docs/design-system.md` Part 1 ("Premium
  Cinematic System," from the completed `docs/redesign/` work): found it
  fully compatible with the mockups' dark-editorial-bronze direction, so
  `docs/design-system.md` was left untouched (no conflicts found) and
  cross-linked rather than duplicated. Created
  `docs/OUR-FRAME-DESIGN-SYSTEM.md` (color/typography/spacing/nav/IA/
  home/photos-overview/category/album/gallery/image-quality/cover-
  selection/lightbox/responsive/motion/component-architecture rules,
  each tied to specific mockup evidence), including an explicit "Known,
  intentional deviation" note in the Home-page rules section documenting
  that board 1 depicts a "Recently Captured" section but the user opted
  out of it — instructing PR 3 (and PR 8's audit) not to reintroduce it.
  Created `docs/mockups/README.md` documenting the 5 exact existing
  filenames with a one-line explanation of what UI each governs. Added a
  short "UI / Design Source of Truth" section to `.claude/CLAUDE.md`
  pointing to `docs/OUR-FRAME-DESIGN-SYSTEM.md` (no content duplicated).
  This was a documentation-only PR — no page/component code touched. Ran
  `npm run build` in `frontend/` to confirm nothing broke; passed. Files
  changed: `docs/OUR-FRAME-DESIGN-SYSTEM.md` (new),
  `docs/mockups/README.md` (new), `.claude/CLAUDE.md` (new section),
  `docs/redesign-v2/STATE.md` (this entry).

- 2026-08-30: Reviewed PR 1 (`our-frame-reviewer`) — **PASS WITH FIXES**.
  Independently opened all 5 mockups rather than trusting the implementer's
  summary, and independently re-derived the claims. Confirmed docs-only:
  `git diff --stat` vs merge-base `70cc9f1` shows only `.claude/CLAUDE.md`,
  `docs/OUR-FRAME-DESIGN-SYSTEM.md`, `docs/mockups/README.md`, and the
  V2 planning docs/mockups — zero page/component code touched. Verified
  independently: (a) the `docs/design-system.md` compatibility claim is
  correct — every cross-reference in the reconciliation table checks out
  against the real file (`--background`/`--foreground`/`--muted-foreground`/
  `--amber`/`--border` token names, Playfair + Geist Sans, `--container-max`
  88rem, motion 165/260/520ms, `top-nav.tsx` transparent/solid variants,
  §7 primitives, §10 anti-patterns), so leaving that file untouched was the
  right call, not laziness; (b) sampled mockup canvas pixels (`#060403`–
  `#13100d`) to confirm the warm near-black claim; (c) confirmed the 5
  `docs/redesign-v2/mockups/` mirrors are byte-identical by SHA-256, as
  claimed; (d) confirmed the CLAUDE.md section is a pointer only, with no
  duplicated content, per the acceptance criteria. Defects found and fixed
  in review: factual error in §10 (claimed board 4's alternate example was
  "Milestones → Engagement"; it is actually the **Milestones** album,
  2015–2025); §10 omitted that the album header sits on a full-bleed cover
  photo with a gradient scrim, plus the icon'd location/date row and the
  Filter/Sort/View-density control row; §9 rationalized the 4-vs-3 folder
  column conflict as a "board framing" artifact instead of naming it as a
  real image-vs-brief conflict, and marked the folder count "optional" when
  all four boards show it; §9/§8 omitted folder/category card anatomy and
  the per-category eyebrow strings; §8 wrongly asserted mobile cards keep
  the same aspect ratio as desktop (board 2's do not) and omitted the
  "View all photos →" link; §5 omitted the search icon and the boards'
  mutual disagreement on mobile bar arrangement; §13/§14 omitted the
  overflow-menu ordering, owner-gating enforcement, and lightbox chrome
  placement; two dangling `docs/redesign-v2/PR N` pseudo-paths corrected to
  real `MILESTONES.md` references. Strengthened the "Recently Captured"
  deviation from a buried paragraph into a flagged `###` subsection listing
  the aliases it must not reappear under, added a forward-pointer in §0,
  and added a deviation section to `docs/mockups/README.md` so an
  implementer opening the mockup sees it at the point of use. No product,
  hosting, or privacy decision was needed; nothing blocked.

- 2026-08-30: Verified PR 1 (`our-frame-verifier`) — **PASS**. Independently
  verified all reviewer fixes were correctly applied: (a) §10 now correctly
  names the alternate example as "Milestones" (2015–2025), not "Milestones
  → Engagement"; (b) §10 now includes full-bleed cover photo with gradient
  scrim, icon'd location/date row, and Filter/Sort/View-density controls;
  (c) §9 now explicitly marks the 4-vs-3 column count as a "real conflict
  between image and text, not a rendering artifact"; (d) §8 now correctly
  states board 2's mobile cards are shorter/wider than desktop, and includes
  the "View all photos →" link; (e) §7 now has a clearly flagged `###`
  subsection for "Recently Captured" deviation listing disallowed aliases
  ("Recently Captured", "Latest Frames", "Recent Memories", "Recently
  Added"); (f) mockups/README.md now carries the deviation note prominently.
  All 5 acceptance criteria met: OUR-FRAME-DESIGN-SYSTEM.md created with
  clean structure, .claude/CLAUDE.md points without duplicating, mockups/
  README.md documents all 5 files with governance, docs/design-system.md
  confirmed compatible and left untouched (git diff shows no modification),
  all 5 mockups visibly inspected. `npm run build` passes cleanly. `git diff
  --stat` shows zero code changes, only documentation and mockup images.
  Commit 361a7ea contains all fixes. No defects found; PR 1 is ready for
  merge decision.

## Open Questions

- None blocking.

## Superseded plan (2026-08-29/30)

Before this session, `docs/redesign-v2/` contained a different, already-
detailed bronze/cinematic V2 plan (10 PRs, expecting a single reference
image at `docs/redesign-v2/mockups/redesign.<ext>`). It was never started
(Status: "Ready to start PR 1", no mockup was ever uploaded to that path).
When the user described a "new Redesign V2" and attached
`OUR-FRAME-REDESIGN-EXECUTION-GUIDE.md`, they were asked explicitly which
plan to run and chose the attached guide. This file, `PROMPTS.md`, and
`MILESTONES.md` were overwritten accordingly. If the old plan's content is
ever needed again, it is recoverable from git history on this branch prior
to the 2026-08-30 commit that replaced these three files.

## Notes for Future Agents

Before continuing:

1. Read `.claude/CLAUDE.md`.
2. Read this state file and `docs/redesign-v2/MILESTONES.md`.
3. Confirm the 5 reference mockups exist in `docs/mockups/` and inspect the
   ones relevant to the PR at hand before implementation.
4. Inspect `git status --short` and current branch.
5. Continue from the first PR without a commit SHA recorded.
6. Remember the Home-page "no Recently Captured section" deviation from the
   source guide — do not silently reintroduce it.
7. Never push/merge a redesign-v2 branch without explicit user approval.
