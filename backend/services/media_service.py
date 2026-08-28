from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlmodel import Session

from models.media import MediaDerivative, MediaItem
from repositories import media_repo


IMAGE_PREFIX = "image/"
VIDEO_PREFIX = "video/"


def classify_media_type(mime_type: str) -> str:
    if mime_type.startswith(IMAGE_PREFIX):
        return "image"
    if mime_type.startswith(VIDEO_PREFIX):
        return "video"
    return "unknown"


def upsert_drive_media_item(
    session: Session,
    *,
    drive_file_id: str,
    name: str,
    mime_type: str,
    workspace_id: Optional[int] = None,
    folder_id: Optional[str] = None,
    created_time: Optional[datetime] = None,
    modified_time: Optional[datetime] = None,
    size: Optional[int] = None,
    width: Optional[int] = None,
    height: Optional[int] = None,
    duration_ms: Optional[int] = None,
    drive_thumbnail_url: Optional[str] = None,
    web_view_link: Optional[str] = None,
    commit: bool = True,
) -> MediaItem:
    media_type = classify_media_type(mime_type)
    initial_status = "queued" if media_type in {"image", "video"} else "failed"
    error = None if media_type in {"image", "video"} else f"Unsupported mime type: {mime_type}"
    existing = media_repo.get_item_by_drive_file(session, drive_file_id, workspace_id)

    return media_repo.upsert_item(
        session,
        drive_file_id=drive_file_id,
        workspace_id=workspace_id,
        folder_id=folder_id,
        name=name,
        media_type=media_type,
        mime_type=mime_type,
        created_time=created_time,
        modified_time=modified_time,
        size=size,
        width=width,
        height=height,
        duration_ms=duration_ms,
        drive_thumbnail_url=drive_thumbnail_url,
        web_view_link=web_view_link,
        processing_status=initial_status if existing is None else None,
        processing_error=error if existing is None else None,
        commit=commit,
    )


def mark_item_processing(
    session: Session,
    item: MediaItem,
    status: str,
    error: Optional[str] = None,
) -> MediaItem:
    item.processing_status = status
    item.processing_error = error
    session.add(item)
    session.commit()
    session.refresh(item)
    return item


def get_ready_derivative(
    session: Session,
    media_item_id: int,
    kind: str,
) -> MediaDerivative | None:
    derivative = media_repo.get_derivative(session, media_item_id, kind)
    if derivative and derivative.status == "ready":
        return derivative
    return None


def media_counts_by_type_and_status(session: Session) -> list[dict]:
    return [
        {"media_type": media_type, "status": status, "count": count}
        for media_type, status, count in media_repo.count_items_by_type_and_status(session)
    ]
