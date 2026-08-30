# Design System Primitives (PR 1)

These are the shared building blocks for the premium/cinematic redesign
described in `docs/redesign/PROMPTS.md` (PR 1) and documented in
`docs/design-system.md`.

Rules for every component in this folder:

- Consume semantic tokens (`var(--background)`, `var(--card)`,
  `var(--foreground)`, `var(--muted-foreground)`, `var(--amber)`,
  `var(--border)`, `var(--radius-*)`, `var(--motion-*)`) — never hardcode
  hex/oklch values inline unless there is no existing token (e.g. one-off
  overlay gradients).
- Use `text-h1`/`text-h2`/`text-h3`/`text-body`/`text-small`/`text-eyebrow*`
  typography classes from `app/globals.css` rather than ad-hoc font sizing.
- Respect `prefers-reduced-motion` (either via `useReducedMotion()` from
  framer-motion, or by relying on the global CSS media query).
- Icons come from `lucide-react` only.

Some of these components (`MasonryGallery`, `PhotoLightbox`, `FeaturedStory`,
`TimelineEntry`) are intentionally visual-primitive-only in PR 1. Later PRs
(4, 5, 6, 9) wire them up with real page content/data — see
`docs/redesign/MILESTONES.md`.
