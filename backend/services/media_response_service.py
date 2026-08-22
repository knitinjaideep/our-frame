from __future__ import annotations

from typing import Any

from sqlmodel import Session

from repositories import media_repo
from services.media_service import classify_media_type


def _photo_url(photo_id: str, size: int = 600) -> str:
    return f"/drive/file/{photo_id}/thumbnail?s={size}"


def _preview_url(photo_id: str, width: int = 1600) -> str:
    return f"/drive/file/{photo_id}/preview?w={width}"


def _poster_url(photo_id: str) -> str:
    return f"/media/file/{photo_id}/poster"


def _playback_url(photo_id: str) -> str:
    return f"/media/file/{photo_id}/playback"


def media_response_fields(
    session: Session,
    *,
    drive_file_id: str,
    mime_type: str,
) -> dict[str, Any]:
    media_type = classify_media_type(mime_type)
    media_item = media_repo.get_item_by_drive_file(session, drive_file_id)
    is_video = media_type == "video"

    return {
        "media_type": media_type,
        "processing_status": media_item.processing_status if media_item else None,
        "thumbnail_url": _poster_url(drive_file_id) if is_video else _photo_url(drive_file_id),
        "poster_url": _poster_url(drive_file_id) if is_video else None,
        "playback_url": _playback_url(drive_file_id) if is_video else None,
        "preview_url": _preview_url(drive_file_id),
    }
