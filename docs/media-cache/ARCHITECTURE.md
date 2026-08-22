# Our Frame Media Cache Architecture

## Purpose

Our Frame keeps Google Drive as the source of truth and serves optimized local derivatives from the app. The goal is faster family browsing on any device without modifying Drive originals or exposing private media publicly.

## Data Flow

1. Google Drive sync discovers folders and image/video files.
2. Legacy tables stay populated for existing album/photo/favorite views.
3. Every image/video also gets a `media_items` row with Drive metadata.
4. Derivative generation writes optimized files under `backend/data/media-cache/`.
5. `media_derivatives` tracks each generated file by media item and kind.
6. API responses expose derivative URLs so the frontend can use cached media first.

## Tables

`media_items`

- Canonical row for a Drive media file.
- Stores `drive_file_id`, optional `workspace_id`, folder, name, MIME type, media type, size, dimensions, duration, Drive thumbnail link, and processing status.
- Processing status is one of `queued`, `processing`, `ready`, or `failed`.

`media_derivatives`

- One generated renderable asset for a media item.
- Current kinds:
  - `thumbnail`, `grid`, `preview` for photos
  - `poster` for videos
  - `playback` for browser-safe MP4 video
- Local files are scoped by media item ID and Drive file ID to avoid cross-workspace cache sharing.

## Local Storage

Generated derivatives are stored under:

```text
backend/data/media-cache/
```

This folder is gitignored. Do not commit generated media.

Example paths:

```text
backend/data/media-cache/photos/123-driveFileId/thumbnail.jpg
backend/data/media-cache/videos/456-driveFileId/poster.jpg
backend/data/media-cache/videos/456-driveFileId/playback.mp4
```

## API Routes

Media serving:

```text
GET /media/file/{drive_file_id}/{kind}
```

Supported `kind` values:

- `thumbnail`
- `grid`
- `preview`
- `poster`
- `playback`

The route requires the existing app session. If the media item has a workspace, the current user must be the owner or a workspace member. Cached files use private browser cache headers.

Debug and processing:

```text
GET  /sync/media/status
GET  /api/admin/media/queue
POST /api/admin/media/process
```

The admin routes require `is_platform_admin`.

## Local Operation

Start the app:

```bash
npm run dev
```

Check the backend:

```bash
curl http://127.0.0.1:8000/health
```

Inspect media sync counts:

```bash
curl http://127.0.0.1:8000/sync/media/status
```

Inspect missing derivatives as an admin:

```bash
curl "http://127.0.0.1:8000/api/admin/media/queue"
```

Process queued photo derivatives and video posters:

```bash
curl -X POST "http://127.0.0.1:8000/api/admin/media/process?limit=25"
```

Process video MP4 playback derivatives explicitly:

```bash
curl -X POST "http://127.0.0.1:8000/api/admin/media/process?media_type=video&include_playback=true&limit=2"
```

MP4 transcoding can take time and disk space. Keep `limit` low when testing.

## Frontend Behavior

Photo grids use API-provided `preview_url` values.

Video cards prefer:

1. `poster_url`
2. `thumbnail_url`
3. a visible processing state

Video playback prefers:

1. `playback_url`
2. legacy Drive stream fallback

## Troubleshooting

If no photos or videos appear:

- Confirm Google Drive OAuth is connected.
- Run the existing Drive sync flow.
- Check `/sync/media/status` for image/video media item counts.

If video cards show `Processing`:

- Run `/api/admin/media/process?limit=25` to generate posters.
- Check `/api/admin/media/queue` for remaining missing poster derivatives.

If MP4 playback is missing:

- Confirm `ffmpeg` is installed and available on `PATH`.
- Run playback processing with `include_playback=true`.
- Keep the processing limit low for large `.MOV` files.

If processing fails:

- Check `media_items.processing_error` and `media_derivatives.error`.
- Errors are bounded and should not include tokens.
- Retry failed items with `retry_failed=true` after fixing the cause.

## Deployment Notes

Before family-wide hosted use:

- Move SQLite to a managed Postgres database.
- Move local derivative files to object storage such as Cloudflare R2 or Supabase Storage.
- Keep derivative URLs authenticated or signed; do not make private family media public.
- Configure secure cookies, production CORS origins, token encryption, and secret management.
- Run derivative processing as a background worker rather than request-time work for large videos.
