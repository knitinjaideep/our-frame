# Our Frame Media Architecture

## Source of Truth

Google Drive owns original family photos and videos.

Our Frame stores metadata and generated derivatives so browsing does not depend on a Drive download for every card or playback attempt.

## Recommended Layers

Google Drive
→ sync service
→ metadata database
→ derivative processor
→ derivative storage
→ Our Frame API
→ frontend

## Metadata Tables

Target tables:

- `media_items`
- `media_derivatives`

`media_items` should represent one Drive file.

Recommended fields:

- `id`
- `workspace_id`
- `drive_file_id`
- `folder_id`
- `name`
- `media_type`: `image` or `video`
- `mime_type`
- `created_time`
- `modified_time`
- `size`
- `width`
- `height`
- `duration_ms`
- `drive_thumbnail_url`
- `processing_status`: `queued`, `processing`, `ready`, `failed`
- `processing_error`
- `created_at`
- `updated_at`

`media_derivatives` should represent generated or cached renderable assets.

Recommended fields:

- `id`
- `media_item_id`
- `kind`: `thumbnail`, `grid`, `preview`, `poster`, `mp4_720p`, `mp4_1080p`
- `storage_backend`: `local`, `r2`, `supabase`
- `storage_key`
- `content_type`
- `width`
- `height`
- `size`
- `status`: `queued`, `processing`, `ready`, `failed`
- `error`
- `created_at`
- `updated_at`

## Legacy Coexistence

Existing tables and routes still matter:

- `albums`
- `photos`
- `favorites`
- `/albums`
- `/home/feed`
- `/sections`
- `/drive/file/...`

Migration should preserve these while adding media-cache paths.

## API Shape

Frontend responses should evolve toward:

```json
{
  "id": "media_123",
  "drive_file_id": "...",
  "name": "IMG_4170.mov",
  "media_type": "video",
  "mime_type": "video/quicktime",
  "thumbnail_url": "/media/derivatives/...",
  "poster_url": "/media/derivatives/...",
  "preview_url": null,
  "playback_url": "/media/derivatives/...",
  "download_url": "/drive/file/.../download",
  "processing_status": "ready"
}
```

## Storage

Development:

- local disk under `backend/data/media-cache`

Production:

- object storage such as Cloudflare R2 or Supabase Storage
- CDN-backed URLs when privacy model is defined

Do not hard-code storage assumptions across frontend and backend.
