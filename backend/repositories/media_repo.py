from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import func
from sqlmodel import Session, select

from models.media import MediaDerivative, MediaItem


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def get_item_by_drive_file(
    session: Session,
    drive_file_id: str,
    workspace_id: Optional[int] = None,
) -> MediaItem | None:
    stmt = select(MediaItem).where(MediaItem.drive_file_id == drive_file_id)
    if workspace_id is None:
        stmt = stmt.where(MediaItem.workspace_id.is_(None))
    else:
        stmt = stmt.where(MediaItem.workspace_id == workspace_id)
    return session.exec(stmt).first()


def get_item_by_drive_file_any_scope(
    session: Session,
    drive_file_id: str,
) -> MediaItem | None:
    """
    Find a cached media item for a Drive file id regardless of workspace scoping.

    `get_item_by_drive_file` is scope-exact: called without a workspace_id it
    matches only legacy unscoped rows, so it answers "no" for workspace-scoped
    media. Workspace-agnostic callers (the gallery response builders, which have
    no workspace context during the migration) need "is this Drive file cached at
    all?". Workspace-scoped rows win, matching the media route's preference; a
    legacy unscoped row is the fallback.
    """
    items = list(
        session.exec(select(MediaItem).where(MediaItem.drive_file_id == drive_file_id)).all()
    )
    if not items:
        return None
    for item in items:
        if item.workspace_id is not None:
            return item
    return items[0]


def get_item_by_id(session: Session, media_item_id: int) -> MediaItem | None:
    return session.get(MediaItem, media_item_id)


def upsert_item(
    session: Session,
    *,
    drive_file_id: str,
    name: str,
    media_type: str,
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
    processing_status: Optional[str] = None,
    processing_error: Optional[str] = None,
    commit: bool = True,
) -> MediaItem:
    existing = get_item_by_drive_file(session, drive_file_id, workspace_id)
    now = _utcnow()

    if existing:
        existing.name = name
        existing.media_type = media_type
        existing.mime_type = mime_type
        existing.folder_id = folder_id
        existing.created_time = created_time
        existing.modified_time = modified_time
        existing.size = size
        existing.width = width
        existing.height = height
        existing.duration_ms = duration_ms
        existing.drive_thumbnail_url = drive_thumbnail_url
        existing.web_view_link = web_view_link
        if processing_status is not None:
            existing.processing_status = processing_status
        if processing_error is not None:
            existing.processing_error = processing_error
        existing.updated_at = now
        session.add(existing)
        if commit:
            session.commit()
            session.refresh(existing)
        else:
            session.flush()
        return existing

    item = MediaItem(
        workspace_id=workspace_id,
        drive_file_id=drive_file_id,
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
        processing_status=processing_status or "queued",
        processing_error=processing_error,
    )
    session.add(item)
    if commit:
        session.commit()
        session.refresh(item)
    else:
        session.flush()
    return item


def list_items_by_status(
    session: Session,
    status: str,
    media_type: Optional[str] = None,
    limit: int = 100,
) -> list[MediaItem]:
    stmt = (
        select(MediaItem)
        .where(MediaItem.processing_status == status)
        .order_by(MediaItem.created_at)
        .limit(limit)
    )
    if media_type:
        stmt = stmt.where(MediaItem.media_type == media_type)
    return list(session.exec(stmt).all())


def count_items_by_type_and_status(session: Session) -> list[tuple[str, str, int]]:
    items = session.exec(select(MediaItem)).all()
    counts: dict[tuple[str, str], int] = {}
    for item in items:
        key = (item.media_type, item.processing_status)
        counts[key] = counts.get(key, 0) + 1
    return [(media_type, status, count) for (media_type, status), count in sorted(counts.items())]


def count_items_for_workspace(session: Session, workspace_id: int) -> int:
    """Number of media items scoped to one workspace.

    Counted in SQL rather than by loading rows, because this runs on every
    bootstrap request.
    """
    return session.exec(
        select(func.count())
        .select_from(MediaItem)
        .where(MediaItem.workspace_id == workspace_id)
    ).one()


def count_legacy_items(session: Session) -> int:
    """Number of unscoped (pre-workspace) media items."""
    return session.exec(
        select(func.count())
        .select_from(MediaItem)
        .where(MediaItem.workspace_id.is_(None))
    ).one()


def workspace_has_media(session: Session, workspace_id: int) -> bool:
    """
    Whether the app has any media to show a member of this workspace.

    Workspace-scoped items come first. Legacy unscoped items count too: the
    gallery routes they feed are still workspace-agnostic during the
    migration, so an environment synced through the legacy path really does
    have media to browse and must not be sent back to the setup flow.
    """
    if count_items_for_workspace(session, workspace_id) > 0:
        return True
    return count_legacy_items(session) > 0


def get_derivative(
    session: Session,
    media_item_id: int,
    kind: str,
) -> MediaDerivative | None:
    return session.exec(
        select(MediaDerivative).where(
            MediaDerivative.media_item_id == media_item_id,
            MediaDerivative.kind == kind,
        )
    ).first()


def upsert_derivative(
    session: Session,
    *,
    media_item_id: int,
    kind: str,
    storage_key: str,
    content_type: str,
    storage_backend: str = "local",
    width: Optional[int] = None,
    height: Optional[int] = None,
    size: Optional[int] = None,
    status: str = "ready",
    error: Optional[str] = None,
) -> MediaDerivative:
    existing = get_derivative(session, media_item_id, kind)
    now = _utcnow()

    if existing:
        existing.storage_backend = storage_backend
        existing.storage_key = storage_key
        existing.content_type = content_type
        existing.width = width
        existing.height = height
        existing.size = size
        existing.status = status
        existing.error = error
        existing.updated_at = now
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing

    derivative = MediaDerivative(
        media_item_id=media_item_id,
        kind=kind,
        storage_backend=storage_backend,
        storage_key=storage_key,
        content_type=content_type,
        width=width,
        height=height,
        size=size,
        status=status,
        error=error,
    )
    session.add(derivative)
    session.commit()
    session.refresh(derivative)
    return derivative
