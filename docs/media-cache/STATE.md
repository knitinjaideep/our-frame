# Our Frame Media Cache State

Status: Phase 1 complete

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
| 1 | Data Model | Complete | pending commit |
| 2 | Drive Metadata Sync | Pending | |
| 3 | Local Photo Derivative Cache | Pending | |
| 4 | Video Posters | Pending | |
| 5 | MP4 Video Derivatives | Pending | |
| 6 | Processing Queue | Pending | |
| 7 | Frontend Media URLs | Pending | |
| 8 | API Response Compatibility | Pending | |
| 9 | Local End-to-End Verification | Pending | |
| 10 | Documentation | Pending | |
| 11 | Final Review | Pending | |

## Next Action

Begin Phase 2 from `docs/media-cache/PROMPTS.md`: Drive metadata sync into `media_items`.

## Completed Checks

- 2026-08-22: Created Our Frame-specific `.claude` agents, rules, skills, milestone docs, prompt sequence, blocker log, and this state tracker.
- 2026-08-22: Phase 0 reviewer agent returned `REVIEW STATUS: PASS`.
- 2026-08-22: Phase 1 added `media_items` and `media_derivatives` models plus repository/service helpers.
- 2026-08-22: Phase 1 backend syntax check passed for changed backend files.
- 2026-08-22: Phase 1 create-table/upsert smoke check passed; synthetic row was removed afterward.
- 2026-08-22: Phase 1 reviewer found processing status reset risk; fixed upsert behavior to preserve existing processing state.
- 2026-08-22: Phase 1 idempotency smoke check passed: an existing `ready` item remains `ready` after metadata upsert.
- 2026-08-22: Phase 1 second reviewer pass returned `REVIEW STATUS: PASS`.

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
