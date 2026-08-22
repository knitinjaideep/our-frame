# Media Derivatives

## Photos

Generate:

- `thumbnail`: small card image, about 400px
- `grid`: higher-quality grid image, about 900px
- `preview`: lightbox image, about 1800px

Use JPEG or WebP depending on browser/storage strategy. Keep implementation simple until production storage is selected.

HEIC/HEIF originals should be decoded server-side and cached as browser-safe images.

## Videos

Generate:

- `poster`: JPEG/WebP frame image for cards
- `mp4_720p`: H.264/AAC browser-safe playback derivative
- `mp4_1080p`: optional later

Start with 720p MP4 to make the experience reliable before adding HLS.

## Processing Status

Use clear state transitions:

`queued` → `processing` → `ready`

or:

`queued` → `processing` → `failed`

Retries should be possible.

Do not hide failed processing behind black cards.

## ffmpeg

If `ffmpeg` or `ffprobe` is missing:

- do not crash the app
- mark the derivative or media item as failed with a useful message
- let the UI show a clear processing/setup issue

## Idempotency

Before generating a derivative, check whether a ready derivative already exists.

If the source Drive `modified_time` changes, derivatives may need regeneration.

Avoid duplicate rows for the same `media_item_id` and `kind`.

## Serving

Derivative routes should serve cached files directly.

Original Drive routes can remain as fallback, but should not be the primary grid/playback path.

Video range requests should not force full original downloads.
