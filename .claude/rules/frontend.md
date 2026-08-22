---
paths:
  - "frontend/**"
  - "components/**"
  - "app/**"
  - "src/**/*.tsx"
  - "src/**/*.ts"
---

# Our Frame Frontend Rules

Follow the existing Next.js App Router architecture and warm memory-book visual language.

Frontend components render media data returned by APIs. They should not own Drive sync, transcoding, derivative generation, or authorization logic.

## Media UX

Photos and videos are the product.

Use real media surfaces whenever available:

- image cards should show cached thumbnails or previews
- video cards should show poster images
- processing videos should show a polished processing state
- failed media should show a clear retry/error state

Avoid unexplained black cards for media that is not ready.

## API Data

Prefer API-provided fields:

- `thumbnail_url`
- `preview_url`
- `poster_url`
- `playback_url`
- `download_url`
- `media_type`
- `processing_status`

Do not infer readiness from filenames or MIME types alone when the API provides status.

## Layout

Support:

- phone
- tablet
- laptop
- desktop
- large desktop

Use stable grid dimensions so media loading does not shift layouts.

Text must not overlap media controls or card chrome.

## Design

Use existing CSS variables and tokens before adding new colors.

Keep chrome quiet so family media remains the visual focus.

For controls, prefer recognizable icons from the existing icon library.

## Loading States

Each media surface should have:

- loading state
- empty state
- error state
- processing state when relevant

Loading states should match the final media shape.

## Auth

Use the shared API client so session-token fallback behavior remains consistent.

Do not create parallel fetch wrappers for authenticated API calls unless the task explicitly asks for it.

## Verification

When frontend changes:

- run `npm run build`
- visually inspect important pages when possible
- check mobile and desktop assumptions for media grids
