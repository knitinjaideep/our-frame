from __future__ import annotations

from typing import Any, Optional

from fastapi import HTTPException
from sqlmodel import Session, select

from models.media import MediaItem
from repositories import media_repo
from services.media_derivative_service import (
    PHOTO_DERIVATIVE_SIZES,
    VIDEO_PLAYBACK_KIND,
    VIDEO_POSTER_KIND,
    derivative_path,
    get_or_create_photo_derivative_for_media,
    get_or_create_video_playback_for_media,
    get_or_create_video_poster_for_media,
)
from services.media_service import media_counts_by_type_and_status


def _required_kinds(media: MediaItem, include_playback: bool) -> list[str]:
    if media.media_type == "image":
        return list(PHOTO_DERIVATIVE_SIZES)
    if media.media_type == "video":
        kinds = [VIDEO_POSTER_KIND]
        if include_playback:
            kinds.append(VIDEO_PLAYBACK_KIND)
        return kinds
    return []


def _derivative_ready(session: Session, media: MediaItem, kind: str) -> bool:
    if media.id is None:
        return False
    derivative = media_repo.get_derivative(session, media.id, kind)
    if not derivative or derivative.status != "ready":
        return False
    if derivative.storage_backend == "local":
        return derivative_path(derivative).exists()
    return True


def missing_derivative_kinds(
    session: Session,
    media: MediaItem,
    *,
    include_playback: bool = False,
) -> list[str]:
    return [
        kind
        for kind in _required_kinds(media, include_playback)
        if not _derivative_ready(session, media, kind)
    ]


def queue_status(session: Session, *, include_playback: bool = False) -> dict[str, Any]:
    items = list(session.exec(select(MediaItem).order_by(MediaItem.created_at)).all())
    missing: dict[str, dict[str, int]] = {}
    eligible = 0

    for item in items:
        missing_kinds = missing_derivative_kinds(
            session,
            item,
            include_playback=include_playback,
        )
        if not missing_kinds:
            continue
        if item.processing_status != "processing":
            eligible += 1
        media_bucket = missing.setdefault(item.media_type, {})
        for kind in missing_kinds:
            media_bucket[kind] = media_bucket.get(kind, 0) + 1

    return {
        "media_counts": media_counts_by_type_and_status(session),
        "missing_derivatives": missing,
        "eligible_items": eligible,
        "include_playback": include_playback,
    }


def _candidate_items(
    session: Session,
    *,
    limit: int,
    media_type: Optional[str] = None,
    retry_failed: bool = False,
    include_playback: bool = False,
) -> list[MediaItem]:
    stmt = select(MediaItem).order_by(MediaItem.created_at)
    if media_type:
        stmt = stmt.where(MediaItem.media_type == media_type)

    candidates: list[MediaItem] = []
    for item in session.exec(stmt).all():
        if item.processing_status == "processing":
            continue
        if item.processing_status == "failed" and not retry_failed:
            continue
        if not missing_derivative_kinds(session, item, include_playback=include_playback):
            continue
        candidates.append(item)
        if len(candidates) >= limit:
            break
    return candidates


def process_media_queue(
    session: Session,
    *,
    limit: int = 10,
    media_type: Optional[str] = None,
    retry_failed: bool = False,
    include_playback: bool = False,
) -> dict[str, Any]:
    processed: list[dict[str, Any]] = []
    failed: list[dict[str, Any]] = []

    for item in _candidate_items(
        session,
        limit=limit,
        media_type=media_type,
        retry_failed=retry_failed,
        include_playback=include_playback,
    ):
        before = missing_derivative_kinds(session, item, include_playback=include_playback)
        try:
            if item.media_type == "image":
                get_or_create_photo_derivative_for_media(session, item, "thumbnail")
            elif item.media_type == "video":
                get_or_create_video_poster_for_media(session, item)
                if include_playback:
                    get_or_create_video_playback_for_media(session, item)
            else:
                continue
            session.refresh(item)
            processed.append(
                {
                    "media_item_id": item.id,
                    "drive_file_id": item.drive_file_id,
                    "media_type": item.media_type,
                    "requested_kinds": before,
                    "status": item.processing_status,
                }
            )
        except HTTPException as exc:
            failed.append(
                {
                    "media_item_id": item.id,
                    "drive_file_id": item.drive_file_id,
                    "media_type": item.media_type,
                    "requested_kinds": before,
                    "status_code": exc.status_code,
                    "error": str(exc.detail)[:500],
                }
            )

    return {
        "processed": processed,
        "failed": failed,
        "processed_count": len(processed),
        "failed_count": len(failed),
        "remaining": queue_status(session, include_playback=include_playback),
    }
