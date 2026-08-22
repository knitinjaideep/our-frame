# Our Frame Media Cache Prompt Sequence

Use these prompts sequentially. Run one phase at a time. Do not skip review or verification.

## Phase 0 — Planning

```text
Read the current Our Frame codebase and produce a migration plan for a fast media cache architecture. Do not edit files yet. Focus on Google Drive sync, media metadata, derivatives, thumbnails, video posters, MP4 transcodes, workspace access, privacy, and deployment for two users across devices. Update docs/media-cache/STATE.md with findings and next recommended phase, but do not mark implementation phases complete.
```

## Phase 1 — Data Model

```text
Implement phase 1 of docs/media-cache/MILESTONES.md: add backend data models for media_items and media_derivatives while preserving existing albums/photos/favorites behavior. Include workspace_id support where appropriate, migration-safe SQLite changes, and repository/service helpers. Do not change frontend yet. Run backend syntax checks and any available targeted tests. Update docs/media-cache/STATE.md with status and checks.
```

## Phase 2 — Drive Metadata Sync

```text
Implement phase 2 of docs/media-cache/MILESTONES.md: update Drive sync so every image/video from Google Drive is represented as a media_item with metadata including media_type, mime_type, folder_id, drive_file_id, created_time, modified_time, width, height, size, duration when available, and drive_thumbnail_url when available. Keep existing photo sync working. Add a read-only debug endpoint to inspect media_items counts by type/status. Run focused backend checks and update docs/media-cache/STATE.md.
```

## Phase 3 — Local Photo Derivative Cache

```text
Implement phase 3 of docs/media-cache/MILESTONES.md: add local derivative cache storage under backend/data/media-cache. For photos, generate and cache thumbnail, grid preview, and lightbox preview derivatives. Store derivative rows in media_derivatives. Add API URLs that serve cached derivatives first and fall back safely if missing. Keep existing /drive/file routes working. Ensure generated files are gitignored. Run backend checks and update docs/media-cache/STATE.md.
```

## Phase 4 — Video Posters

```text
Implement phase 4 of docs/media-cache/MILESTONES.md: add video poster generation using ffmpeg or ffprobe if available. For each video media_item, generate a poster image derivative and expose poster_url in API responses. If ffmpeg is missing, fail gracefully and mark processing_status with a useful error. Add focused checks for missing-ffmpeg behavior where practical. Update docs/media-cache/STATE.md.
```

## Phase 5 — MP4 Video Derivatives

```text
Implement phase 5 of docs/media-cache/MILESTONES.md: add browser-safe video derivative generation. Transcode Google Drive MOV/QuickTime videos to MP4 H.264/AAC at 720p first. Store playback_url in media_derivatives. Add status fields or transitions for queued, processing, ready, and failed. Make the worker resumable and idempotent. Run checks and update docs/media-cache/STATE.md.
```

## Phase 6 — Processing Queue

```text
Implement phase 6 of docs/media-cache/MILESTONES.md: create a background processing service for media derivatives. It should process queued media_items, avoid duplicate work, retry failed items safely, and expose admin/debug endpoints for queue status. Keep it simple for local dev: callable manually via an API endpoint or CLI command. Run checks and update docs/media-cache/STATE.md.
```

## Phase 7 — Frontend Media URLs

```text
Implement phase 7 of docs/media-cache/MILESTONES.md: update frontend video and photo grids to use cached media derivative URLs. Video cards should show poster thumbnails, open quickly, and play cached MP4 derivatives when available. If a derivative is still processing, show a polished processing state instead of a black card. Run npm run build and update docs/media-cache/STATE.md.
```

## Phase 8 — API Response Compatibility

```text
Implement phase 8 of docs/media-cache/MILESTONES.md: update album/detail/home/sections APIs so frontend responses include thumbnail_url, preview_url, poster_url, playback_url, processing_status, and media_type where needed. Preserve backward compatibility for existing PhotoResponse consumers. Run backend checks and npm run build. Update docs/media-cache/STATE.md.
```

## Phase 9 — Local End-to-End Verification

```text
Run phase 9 of docs/media-cache/MILESTONES.md: start the app locally, trigger sync, trigger derivative processing, verify that Arjun videos show poster thumbnails, photos use cached thumbnails, and video playback starts faster. Fix any bugs found. Do not commit yet. Update docs/media-cache/STATE.md with commands run, results, and remaining issues.
```

## Phase 10 — Documentation

```text
Implement phase 10 of docs/media-cache/MILESTONES.md: add documentation for the new media cache architecture, how sync works, where files are stored locally, how to trigger processing, how to troubleshoot missing thumbnails/videos, and what is needed before deploying for family use. Update docs/media-cache/STATE.md.
```

## Phase 11 — Final Review

```text
Review the full diff for regressions, privacy issues, large generated files accidentally tracked by git, and migration risks. Run build/checks. Then summarize exactly what changed and what remains. Update docs/media-cache/STATE.md with final verification status. Do not push.
```

## Later Deployment Planning

Use after local media-cache work is stable.

```text
Design the production deployment plan for Our Frame so my dad and I can use it from any device. Compare Vercel + Render/Fly.io + Supabase Postgres + Cloudflare R2 versus a private Tailscale home-server setup. Recommend one path and list exact setup steps. Do not deploy yet.
```

```text
Implement storage abstraction for derivatives so local disk works in development and Cloudflare R2 or Supabase Storage can work in production. Do not migrate deployment yet; just create the abstraction and config.
```

```text
Prepare the app for production deployment: environment variables, database URL, storage settings, CORS, cookie security, token encryption, and deployment docs. Do not expose secrets.
```
