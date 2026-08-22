# Our Frame Media Cache State

Status: Phase 4 ready to commit

Last updated: 2026-08-22

## Current Context

Our Frame currently uses:

- Next.js frontend under `frontend/`
- FastAPI backend under `backend/`
- SQLite database at runtime
- Google Drive as original media source
- legacy `/drive/file/...` routes for thumbnails, previews, downloads, and video streams
- newer workspace/session setup flow in parallel with legacy gallery media paths

Observed issue:

- Video grids can show black cards because video records do not have poster thumbnails.
- `.MOV` / `video/quicktime` files are slow or unreliable in browser playback.
- Request-time Drive downloads make photos/videos slower than a derivative-cache architecture would.

## Active Safety Notes

- Do not commit `.env`, OAuth tokens, SQLite databases, or generated media-cache files.
- Do not modify Google Drive originals.
- Preserve legacy gallery routes while migration is incomplete.
- Keep private media behind authenticated app access unless a signed URL design is explicitly approved.

## Phase Progress

| Phase | Name | Status | Commit |
|---|---|---|---|
| 0 | Planning | Complete | 1d6413a |
| 1 | Data Model | Complete | b75621a |
| 2 | Drive Metadata Sync | Complete | 1a1eff5 |
| 3 | Local Photo Derivative Cache | Complete | bbd0ba5 |
| 4 | Video Posters | Complete | pending |
| 5 | MP4 Video Derivatives | Pending | |
| 6 | Processing Queue | Pending | |
| 7 | Frontend Media URLs | Pending | |
| 8 | API Response Compatibility | Pending | |
| 9 | Local End-to-End Verification | Pending | |
| 10 | Documentation | Pending | |
| 11 | Final Review | Pending | |

## Next Action

Commit Phase 4, record the commit SHA, then continue with Phase 5 MP4 video derivatives.

## Completed Checks

- 2026-08-22: Created Our Frame-specific `.claude` agents, rules, skills, milestone docs, prompt sequence, blocker log, and this state tracker.
- 2026-08-22: Phase 0 reviewer agent returned `REVIEW STATUS: PASS`.
- 2026-08-22: Phase 1 added `media_items` and `media_derivatives` models plus repository/service helpers.
- 2026-08-22: Phase 1 backend syntax check passed for changed backend files.
- 2026-08-22: Phase 1 create-table/upsert smoke check passed; synthetic row was removed afterward.
- 2026-08-22: Phase 1 reviewer found processing status reset risk; fixed upsert behavior to preserve existing processing state.
- 2026-08-22: Phase 1 idempotency smoke check passed: an existing `ready` item remains `ready` after metadata upsert.
- 2026-08-22: Phase 1 second reviewer pass returned `REVIEW STATUS: PASS`.
- 2026-08-22: Phase 2 updated Drive listing to capture `thumbnailLink` and video metadata.
- 2026-08-22: Phase 2 updated shallow sync to upsert image/video files into `media_items`.
- 2026-08-22: Phase 2 added read-only `/sync/media/status` count endpoint.
- 2026-08-22: Phase 2 backend syntax check passed.
- 2026-08-22: Phase 2 in-memory sync smoke check passed for a fake QuickTime video with thumbnail and duration metadata.
- 2026-08-22: Phase 2 reviewer returned `REVIEW STATUS: PASS`.
- 2026-08-22: Phase 3 added local media cache root config and gitignore entry for `backend/data/media-cache/`.
- 2026-08-22: Phase 3 added photo derivative service for thumbnail, grid, and preview JPEG derivatives.
- 2026-08-22: Phase 3 added `/media/file/{drive_file_id}/{kind}` route with cache-first serving and legacy Drive fallback.
- 2026-08-22: Phase 3 backend syntax check passed.
- 2026-08-22: Phase 3 synthetic in-memory derivative check passed and confirmed ready derivative reuse.
- 2026-08-22: Phase 3 reviewer returned `REVIEW STATUS: FAIL` for two blockers: unauthenticated private media route and item-level ready status after only one derivative.
- 2026-08-22: Phase 3 route now requires the existing app session and checks workspace owner/member access when `workspace_id` is present.
- 2026-08-22: Phase 3 cached file responses now use private cache headers.
- 2026-08-22: Phase 3 photo derivative generation now creates thumbnail, grid, and preview derivatives together before marking the item ready.
- 2026-08-22: Phase 3 synthetic derivative check passed: one thumbnail request generated all three photo derivatives and item status became ready only after all three existed.
- 2026-08-22: Phase 3 direct authorization check passed for owner, member, legacy authenticated user, and unrelated user denial.
- 2026-08-22: Phase 3 second reviewer returned `REVIEW STATUS: FAIL` for two route/service consistency blockers: unknown Drive IDs could fall back to legacy routes, and workspace-authorized media was not the same row used for derivative generation.
- 2026-08-22: Phase 3 route authorization now returns the exact authorized `MediaItem`; unknown Drive IDs return 404 before fallback and inaccessible workspace media returns 403.
- 2026-08-22: Phase 3 derivative service now supports generation from an already-authorized `MediaItem`, so workspace-only media uses the same row for auth and derivative lookup.
- 2026-08-22: Phase 3 route/service smoke check passed for unknown ID denial, workspace denial, workspace-only derivative generation, legacy authenticated access, and all three photo derivatives.
- 2026-08-22: Phase 3 frontend production build passed with `npm run build`.
- 2026-08-22: Phase 3 third reviewer returned `REVIEW STATUS: FAIL` for two privacy hardening issues: generation failures still redirected to legacy Drive routes, and local cache paths were scoped only by Drive file ID.
- 2026-08-22: Phase 3 removed legacy fallback redirects from the authenticated media-cache route.
- 2026-08-22: Phase 3 photo derivative storage keys now include the media item ID before the Drive file ID to avoid cross-workspace cache path sharing.
- 2026-08-22: Phase 3 hardened smoke check passed for duplicate Drive IDs across workspace and legacy rows, scoped cache paths, unknown ID denial, and all three derivatives.
- 2026-08-22: Phase 3 final hardening reviewer returned `REVIEW STATUS: PASS`.
- 2026-08-22: Phase 4 added video poster derivative generation through the media derivative service.
- 2026-08-22: Phase 4 poster generation uses Drive thumbnail links when available and falls back to `ffmpeg` frame extraction when a Drive thumbnail is missing.
- 2026-08-22: Phase 4 `/media/file/{drive_file_id}/poster` now serves authenticated cached poster derivatives.
- 2026-08-22: Phase 4 video API responses now expose `poster_url` and set video `thumbnail_url` to the poster endpoint for backward-compatible UI rendering.
- 2026-08-22: Phase 4 backend syntax check passed for changed backend files.
- 2026-08-22: Phase 4 poster smoke check passed for Drive thumbnail caching, ready derivative reuse, scoped video storage keys, and missing-`ffmpeg` failure recording.
- 2026-08-22: Phase 4 frontend production build passed with `npm run build`.
- 2026-08-22: Phase 4 reviewer returned `REVIEW STATUS: PASS`.
- 2026-08-22: Phase 4 backend syntax and diff hygiene checks passed before commit.

## Phase 0 Planning Summary

Current legacy media path:

- Drive sync reads Google Drive using the legacy token path and stores folder/photo records in `albums` and `photos`.
- Frontend pages consume `/albums`, `/albums/{id}`, `/home/feed`, `/home/slideshow`, `/sections`, and `/sections/videos/{section_key}`.
- Existing media rendering calls `/drive/file/{id}/thumbnail`, `/drive/file/{id}/preview`, `/drive/file/{id}/download`, and `/drive/file/{id}/stream`.
- Video records currently lack poster derivatives, so video grids can render dark cards.
- Request-time Drive download/conversion is the main performance bottleneck.

Current workspace path:

- Platform login/session/workspace tables exist.
- Workspace Drive connection flow exists.
- Gallery browsing is not fully workspace-scoped yet and still relies on the legacy media path.

Migration direction:

- Add media metadata tables alongside existing `albums`/`photos`.
- Sync Drive files into `media_items` without breaking legacy consumers.
- Generate reusable derivatives into `media_derivatives`.
- Serve cached derivatives to frontend pages first, with legacy Drive routes as fallback.
- Move toward workspace-aware media access before production family deployment.

Phase 0 migration risks:

- Schema changes must not break existing local SQLite data.
- Generated media cache can become large and must remain untracked.
- `.MOV` playback requires transcoding, not only streaming optimization.
- Workspace auth and legacy media routes overlap; private media must not become public during migration.
- Long-running video processing must be resumable and manually triggerable for local development.

## Open Questions

- Should hosted production use Cloudflare R2 or Supabase Storage for derivatives?
- Should remote family access use hosted deployment or private Tailscale first?
- What quality/size presets should be used for long-term video derivatives beyond the first 720p MP4 pass?

## Notes for Future Agents

Before continuing:

1. Read `.claude/CLAUDE.md`.
2. Read `.claude/skills/our-frame-media-cache/SKILL.md`.
3. Read this state file.
4. Inspect `git status --short`.
5. Continue from the first pending phase.
