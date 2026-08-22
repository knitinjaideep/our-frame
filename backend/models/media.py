from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import UniqueConstraint
from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class MediaItem(SQLModel, table=True):
    """
    Canonical metadata row for one Google Drive media file.

    This table is introduced alongside the legacy `photos` table so the media
    cache can be built incrementally without breaking existing gallery routes.
    """

    __tablename__ = "media_items"
    __table_args__ = (
        UniqueConstraint("workspace_id", "drive_file_id", name="uq_media_items_workspace_drive_file"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    workspace_id: Optional[int] = Field(default=None, foreign_key="workspaces.id", index=True)

    drive_file_id: str = Field(index=True, max_length=255)
    folder_id: Optional[str] = Field(default=None, index=True, max_length=255)
    name: str = Field(max_length=500)

    # image / video
    media_type: str = Field(index=True, max_length=20)
    mime_type: str = Field(index=True, max_length=100)

    created_time: Optional[datetime] = Field(default=None, index=True)
    modified_time: Optional[datetime] = Field(default=None, index=True)
    size: Optional[int] = None
    width: Optional[int] = None
    height: Optional[int] = None
    duration_ms: Optional[int] = None

    drive_thumbnail_url: Optional[str] = None
    web_view_link: Optional[str] = None

    # queued / processing / ready / failed
    processing_status: str = Field(default="queued", index=True, max_length=30)
    processing_error: Optional[str] = None

    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)


class MediaDerivative(SQLModel, table=True):
    """
    Generated or cached renderable asset for a MediaItem.

    Examples: image thumbnail, image preview, video poster, video mp4_720p.
    """

    __tablename__ = "media_derivatives"
    __table_args__ = (
        UniqueConstraint("media_item_id", "kind", name="uq_media_derivatives_item_kind"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    media_item_id: int = Field(foreign_key="media_items.id", index=True)

    # thumbnail / grid / preview / poster / mp4_720p / mp4_1080p
    kind: str = Field(index=True, max_length=50)
    # local / r2 / supabase
    storage_backend: str = Field(default="local", max_length=50)
    storage_key: str = Field(max_length=1000)
    content_type: str = Field(max_length=100)

    width: Optional[int] = None
    height: Optional[int] = None
    size: Optional[int] = None

    # queued / processing / ready / failed
    status: str = Field(default="queued", index=True, max_length=30)
    error: Optional[str] = None

    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)
