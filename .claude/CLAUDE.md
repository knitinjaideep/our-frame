# Our Frame Development Instructions

## Project

Our Frame is a private family photo and video archive backed by Google Drive.

Primary stack:

- Frontend: Next.js App Router, React, TypeScript, Tailwind CSS
- Backend: FastAPI, Python, SQLModel
- Database: SQLite for local development, with a path toward Postgres for hosted multi-device use
- Source media: Google Drive
- Optimized media cache: local disk first, object storage later

Do not change major infrastructure unless the task explicitly calls for it.

## Architecture

Preserve separation between:

Frontend
→ API routes
→ services/business logic
→ repositories/data access
→ database/storage

React components should render API data and local UI state. They should not own Drive sync logic, derivative generation, access control, or media-processing decisions.

Google Drive is the source of truth for originals. Our Frame should cache metadata and generated derivatives so browsing is fast across devices.

## Current Migration Context

The codebase currently has two overlapping generations:

- Legacy gallery/media path: albums/photos/favorites plus `/drive/file/...` routes using `backend/token.json`.
- Platform foundation: users, sessions, workspaces, workspace Drive connections, setup flow.

When improving media performance, preserve existing behavior while moving toward workspace-aware media items and derivatives.

Do not remove legacy endpoints until all frontend consumers and migration paths are updated.

## Media Principles

Photos and videos should be fast because the app serves precomputed derivatives, not because the browser waits on Google Drive for every view.

For photos, prefer cached:

- thumbnail
- grid preview
- lightbox preview

For videos, prefer cached:

- poster image
- browser-safe MP4 playback derivative
- original download fallback

Most iPhone `.MOV` / `video/quicktime` files are not reliable browser playback assets. Generate MP4 H.264/AAC derivatives before treating video playback as complete.

## Privacy and Security

This app contains private family media.

Never:

- commit `.env`
- commit OAuth tokens
- commit SQLite databases
- commit generated media-cache files
- log secrets, refresh tokens, raw access tokens, or private media URLs unnecessarily
- expose unauthenticated media endpoints for private workspaces
- make public links unless the task explicitly asks for public sharing

Prefer synthetic test fixtures and tiny generated media samples.

## Data Safety

Google Drive originals must never be modified or deleted by Our Frame.

Sync must be idempotent:

- rescanning the same Drive folder should not duplicate media rows
- regenerated derivatives should update existing derivative rows
- failed processing jobs should be retryable

Schema changes must be backward compatible with existing local data whenever practical. Add lightweight SQLite migrations where SQLModel `create_all()` is insufficient.

## Frontend Standards

Follow the existing warm editorial memory-book design.

For media grids:

- show real thumbnails/posters whenever available
- show honest processing states when derivatives are not ready
- avoid black placeholder cards for ready media
- include loading, empty, error, and failed-processing states
- keep mobile and desktop layouts usable

Use existing components and design tokens before adding new UI systems.

## Backend Standards

Drive access, media sync, derivative generation, and storage decisions belong in backend services.

Route handlers should stay thin where practical.

Use repository/service helpers rather than duplicating SQL queries across routes.

Media processing should fail visibly and recoverably:

- `queued`
- `processing`
- `ready`
- `failed`

Store enough error context for troubleshooting without leaking secrets.

## Verification

For meaningful changes, run the smallest relevant checks first, then broader checks before declaring completion.

Common checks:

- `backend/.venv/bin/python -m py_compile <changed backend files>`
- `npm run build`
- targeted backend tests if present
- local API checks for media counts/status

Before committing, inspect `git status` and `git diff --stat`.

## Git

Do not:

- force push
- reset hard
- delete unrelated work
- commit generated databases/media cache
- deploy production

Create coherent commits only after verification passes.
