# Our Frame Media Cache Milestones

## Goal

Make Our Frame fast and reliable for private family photo/video browsing across devices by keeping Google Drive as the source of truth while serving optimized cached derivatives from the app.

## Phase 0 — Planning

Status: Pending

Acceptance criteria:

- Current legacy media path and workspace path are documented.
- Migration risks are listed.
- No implementation files are changed except docs/state.

## Phase 1 — Data Model

Status: Pending

Acceptance criteria:

- `media_items` model/table exists.
- `media_derivatives` model/table exists.
- SQLite migration path is safe for existing local DBs.
- Existing albums/photos/favorites behavior is preserved.
- Repository/service helpers exist for common media-item and derivative operations.

## Phase 2 — Drive Metadata Sync

Status: Pending

Acceptance criteria:

- Images and videos discovered during Drive sync upsert corresponding `media_items`.
- Existing `photos` sync still works.
- Drive thumbnail links are captured when available.
- Media counts by type/status can be inspected via read-only debug endpoint.
- Sync is idempotent for repeated Drive scans.

## Phase 3 — Local Photo Derivative Cache

Status: Pending

Acceptance criteria:

- Local cache root is under `backend/data/media-cache`.
- Generated cache files are ignored by git.
- Photo thumbnail/grid/preview derivatives are generated and persisted.
- Repeated requests reuse ready derivatives.
- Existing `/drive/file/...` routes remain usable as fallback.

## Phase 4 — Video Posters

Status: Pending

Acceptance criteria:

- Video poster derivative generation exists.
- Poster URLs are exposed to the frontend/API layer.
- Missing `ffmpeg` or processing failure does not crash the app.
- Failed processing records contain useful non-secret error information.

## Phase 5 — MP4 Video Derivatives

Status: Pending

Acceptance criteria:

- MOV/QuickTime source videos can produce browser-safe MP4 H.264/AAC derivatives.
- Playback URL points to cached MP4 when ready.
- Processing status transitions are clear.
- Worker is idempotent and retryable.

## Phase 6 — Processing Queue

Status: Pending

Acceptance criteria:

- Queued derivative work can be processed manually in local dev.
- Queue status is inspectable.
- Duplicate work is avoided.
- Failed jobs can be retried safely.

## Phase 7 — Frontend Media URLs

Status: Pending

Acceptance criteria:

- Photo grids use cached thumbnail/preview URLs when available.
- Video cards show poster images when ready.
- Video playback uses cached MP4 derivative when ready.
- Processing/failed states are visible and polished.
- No unexplained black cards for ready media.

## Phase 8 — API Response Compatibility

Status: Pending

Acceptance criteria:

- Album/detail/home/sections responses include derivative fields where needed.
- Existing frontend consumers continue to work.
- TypeScript types match API responses.

## Phase 9 — Local End-to-End Verification

Status: Pending

Acceptance criteria:

- Local sync can populate media metadata.
- Local derivative processing can produce photo thumbnails and video posters.
- Arjun video grid shows poster thumbnails.
- Video playback starts faster from cached derivative when ready.
- Frontend build passes.

## Phase 10 — Documentation

Status: Pending

Acceptance criteria:

- Architecture docs explain sync, derivatives, storage, and troubleshooting.
- Local operation docs explain how to trigger sync/processing.
- Deployment notes identify what changes before family-wide hosted use.

## Phase 11 — Final Review

Status: Pending

Acceptance criteria:

- Full diff reviewed.
- Privacy/security risks reviewed.
- Generated artifacts are not tracked.
- Checks pass.
- Known limitations are documented.
