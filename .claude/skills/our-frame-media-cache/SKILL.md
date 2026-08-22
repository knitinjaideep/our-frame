---
name: our-frame-media-cache
description: Domain and workflow guidance for implementing Our Frame's fast Google Drive media-cache architecture for photos, video posters, MP4 derivatives, workspace access, and multi-device browsing.
---

# Our Frame Media Cache

Use this skill whenever implementing or reviewing Our Frame media performance, Drive sync, thumbnails, video posters, video playback, derivative storage, or workspace media access.

Before architectural decisions, read the relevant references in this skill.

References:

- `references/media-architecture.md`
- `references/derivatives.md`
- `references/privacy-access.md`
- `references/workflow.md`

## Product Principle

Our Frame should feel like a private family memory book that works instantly on any device.

Google Drive remains the source of truth for originals.

Our Frame owns:

- fast metadata queries
- cached thumbnails and previews
- video posters
- browser-safe playback derivatives
- workspace access control

## Current Target

Move from request-time Drive downloads toward precomputed derivatives.

The frontend should receive ready-to-render URLs:

- `thumbnail_url`
- `preview_url`
- `poster_url`
- `playback_url`
- `download_url`
- `processing_status`
- `media_type`

## Non-Negotiables

- Do not modify Google Drive originals.
- Do not expose private media without auth.
- Do not commit generated media, SQLite DBs, tokens, or secrets.
- Preserve legacy endpoints while migration is incomplete.
- Make sync and derivative processing idempotent.
- Treat `.MOV` / `video/quicktime` as source media that needs browser-safe derivatives.

## Completion Standard

Do not call video work complete until:

- video cards show real poster thumbnails when ready
- MP4 playback derivatives are available or honest processing states are shown
- range/video playback does not require downloading full originals first
- failed processing states are visible and retryable

Do not call photo cache work complete until:

- grid thumbnails are cached
- lightbox previews are cached
- repeated page views do not regenerate the same derivatives unnecessarily

## Workflow

Each work item should follow the workflow in:

`references/workflow.md`
