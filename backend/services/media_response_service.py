"""
Builds the media URL fields shared by every gallery API response.

Media is served by the authenticated, workspace-authorized media-cache route
(`/media/file/{drive_file_id}/{kind}`) whenever a `media_items` row exists for
the Drive file. That route serves precomputed derivatives and works on hosts
where the legacy `backend/token.json` credential file cannot exist.

Drive files that have not been media-synced yet keep the legacy
`/drive/file/...` URLs so they continue to render exactly as before while the
migration finishes. Once sync covers every file, the legacy branch stops being
used and the legacy routes can be retired.
"""
from __future__ import annotations

from typing import Any

from sqlmodel import Session

from repositories import media_repo
from services.media_service import classify_media_type

LEGACY_THUMBNAIL_SIZE = 600
LEGACY_PREVIEW_WIDTH = 1600


def _cached_url(drive_file_id: str, kind: str) -> str:
    return f"/media/file/{drive_file_id}/{kind}"


def _legacy_thumbnail_url(drive_file_id: str, size: int = LEGACY_THUMBNAIL_SIZE) -> str:
    return f"/drive/file/{drive_file_id}/thumbnail?s={size}"


def _legacy_preview_url(drive_file_id: str, width: int = LEGACY_PREVIEW_WIDTH) -> str:
    return f"/drive/file/{drive_file_id}/preview?w={width}"


def thumbnail_url_for(
    session: Session,
    drive_file_id: str,
    workspace_id: int | None = None,
) -> str:
    """
    Thumbnail URL for a single Drive file id (album covers, section covers).

    Prefers the cached derivative route and falls back to the legacy Drive
    route when the file has no `media_items` row yet.
    """
    media_item = (
        media_repo.get_item_by_drive_file(session, drive_file_id, workspace_id)
        if workspace_id is not None
        else media_repo.get_item_by_drive_file_any_scope(session, drive_file_id)
    )
    if media_item:
        return _cached_url(drive_file_id, "thumbnail")
    return _legacy_thumbnail_url(drive_file_id)


def media_response_fields(
    session: Session,
    *,
    drive_file_id: str,
    mime_type: str,
    workspace_id: int | None = None,
) -> dict[str, Any]:
    media_type = classify_media_type(mime_type)
    media_item = (
        media_repo.get_item_by_drive_file(session, drive_file_id, workspace_id)
        if workspace_id is not None
        else media_repo.get_item_by_drive_file_any_scope(session, drive_file_id)
    )
    is_video = media_type == "video"

    if media_item is None:
        # Not media-synced yet: keep legacy Drive URLs so these items render as
        # they did before the cache migration. Videos get no thumbnail/poster
        # (the legacy image routes cannot render a video frame), so the frontend
        # shows its honest processing state instead of a broken image, and a
        # null `playback_url` makes it fall back to the legacy Drive stream.
        # `preview_url` is a required response field, so it always gets a value.
        return {
            "media_type": media_type,
            "processing_status": None,
            "thumbnail_url": None if is_video else _legacy_thumbnail_url(drive_file_id),
            "poster_url": None,
            "playback_url": None,
            "preview_url": _legacy_preview_url(drive_file_id),
        }

    return {
        "media_type": media_type,
        "processing_status": media_item.processing_status,
        "thumbnail_url": _cached_url(drive_file_id, "poster" if is_video else "thumbnail"),
        "poster_url": _cached_url(drive_file_id, "poster") if is_video else None,
        "playback_url": _cached_url(drive_file_id, "playback") if is_video else None,
        "preview_url": _cached_url(drive_file_id, "preview"),
    }
