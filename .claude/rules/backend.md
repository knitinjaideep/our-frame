---
paths:
  - "backend/**"
  - "tests/**/*.py"
---

# Our Frame Backend Rules

Keep backend layers clear:

API route
→ service
→ repository
→ database/storage

Do not put long-running Drive sync, derivative generation, or transcoding logic directly in route handlers.

## Google Drive

Google Drive originals are read-only.

Never modify, move, delete, or rename files in Drive unless the user explicitly requests a write-capable Drive feature.

Drive sync must be idempotent:

- same Drive file ID maps to the same media item
- repeated syncs update metadata rather than duplicating rows
- failed derivative jobs can be retried

Preserve legacy gallery endpoints while migrating toward workspace-aware media items.

## Media Cache

Media APIs should prefer cached derivatives:

- photo thumbnail
- photo grid preview
- photo lightbox preview
- video poster
- video MP4 playback derivative

Do not regenerate expensive derivatives on every request.

Generated derivatives belong under configured cache/storage paths, not in source-controlled folders.

## Video

Treat `video/quicktime` and `.MOV` originals as source files, not final browser playback assets.

Generate browser-safe MP4 H.264/AAC derivatives before marking video playback as fully ready.

Streaming endpoints must support byte ranges and should avoid full-file downloads for range requests.

## Auth and Privacy

Private media endpoints must require an authenticated session or a deliberately scoped signed URL design.

Do not log:

- OAuth access tokens
- refresh tokens
- private media URLs
- raw secrets

Workspace ownership/membership checks must be enforced for workspace-scoped routes.

## Database

SQLite is acceptable for local development.

Use backward-compatible migrations where SQLModel `create_all()` cannot add columns.

Do not commit:

- `.db` files
- token files
- generated cache files
- `.env`

## Testing

Prefer focused checks for:

- idempotent sync
- derivative state transitions
- missing ffmpeg behavior
- private endpoint authorization
- range response behavior for videos
