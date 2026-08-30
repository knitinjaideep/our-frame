# Our Frame Redesign V2 State

Status: PR 1 implemented (awaiting review)

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
| 1 | Design Memory / Source of Truth | Implemented (awaiting review) | redesign-v2/pr-1-design-memory | — |
| 2 | Shared Photos Architecture | Pending | redesign-v2/pr-2-photos-architecture | — |
| 3 | Home Page | Pending | redesign-v2/pr-3-home | — |
| 4 | Photos Overview | Pending | redesign-v2/pr-4-photos-overview | — |
| 5 | Category Pages | Pending | redesign-v2/pr-5-category-pages | — |
| 6 | Album Pages | Pending | redesign-v2/pr-6-album-pages | — |
| 7 | Metadata, Thumbnail Selection, Image Quality | Pending | redesign-v2/pr-7-metadata-covers | — |
| 8 | Final Consistency Audit | Pending | redesign-v2/pr-8-consistency-audit | — |

## Next Action

PR 1 is implemented on `redesign-v2/pr-1-design-memory` and awaiting
`our-frame-reviewer` / `our-frame-verifier`. Do not start PR 2 until PR 1 is
reviewed/verified and the user decides on merge sequencing.

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
