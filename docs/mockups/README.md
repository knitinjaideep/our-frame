# Our Frame — Redesign V2 Mockups

These 5 images are the visual source of truth for the `redesign-v2/`
initiative. Read `docs/OUR-FRAME-DESIGN-SYSTEM.md` alongside them before any
frontend/UI work — that document translates what's shown here into rules.
When implementing a specific page, open the mockup file(s) below that
govern it, not just the written rules.

| File | Governs |
|---|---|
| `01-home-page-second-pass-redesign.png` | Home page: hero slideshow, chapter/category rail, Family Films preview, overall page flow (desktop + mobile). **Depicts a "RECENTLY CAPTURED" strip that must NOT be built — see below.** |
| `02-photos-overview-unified-folder-system.png` | Home → Photos overview page: the 2x2 uniform category grid (Arjun/Travel/Milestones/Life) |
| `03-category-pages-shared-folder-system.png` | Category landing pages (Photos → Arjun / Travel / Milestones / Life): shared page shell and folder grid |
| `04-album-page-shared-editorial-template.png` | Individual album pages: shared editorial header + photo gallery template used across every category |
| `05-lightbox-album-cover-selection.png` | Full-screen photo lightbox, photo overflow/actions menu, and manual album cover/thumbnail selection flow |

## ⚠️ Where the shipped product intentionally differs from these images

These boards are references, not literal specs. Two deliberate deviations
are already decided — do not "fix" the product back toward the image:

1. **Board 1 — no "Recently Captured" section.** Board 1 draws a
   `RECENTLY CAPTURED` photo strip between the chapter rail and Family
   Films (desktop and mobile). The user explicitly opted out of it. Home's
   order is hero → chapter rail → Family Films → optional closing strip,
   with nothing in between. Never reintroduce it under any name.
2. **Board 3 — folder grid column count.** The boards render category pages
   at 4 folder cards across; the written brief specifies desktop 3 / tablet
   2 / mobile 1. The brief wins.

Full rationale and the rest of the rules live in
`docs/OUR-FRAME-DESIGN-SYSTEM.md` (§0, §7, §9).

## Mirrored copies

All 5 files are also mirrored (identical by checksum, from a superseded
planning path) at `docs/redesign-v2/mockups/` — `docs/mockups/` is the
canonical location referenced by `docs/redesign-v2/PROMPTS.md` and
`docs/redesign-v2/MILESTONES.md`.
