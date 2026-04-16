from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class PrivacyMode(str):
    PRIVATE = "private"
    INVITE_ONLY = "invite_only"
    PUBLIC = "public"


class Workspace(SQLModel, table=True):
    __tablename__ = "workspaces"

    id: Optional[int] = Field(default=None, primary_key=True)
    owner_user_id: int = Field(foreign_key="users.id", index=True)

    name: str = Field(max_length=200)
    # URL-safe slug — unique across platform
    slug: str = Field(index=True, unique=True, max_length=100)
    subtitle: Optional[str] = Field(default=None, max_length=400)

    # UI presets — stored as string keys
    layout_preset: str = Field(default="editorial", max_length=50)
    theme_preset: str = Field(default="warm_dark", max_length=50)
    privacy_mode: str = Field(default="private", max_length=50)
    folder_template: str = Field(default="family", max_length=50)

    onboarding_complete: bool = Field(default=False)
    # True when the user explicitly chose "skip for now" on Drive connect
    drive_connect_deferred: bool = Field(default=False)

    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)


class WorkspaceMember(SQLModel, table=True):
    __tablename__ = "workspace_members"

    id: Optional[int] = Field(default=None, primary_key=True)
    workspace_id: int = Field(foreign_key="workspaces.id", index=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    # owner / editor / viewer
    role: str = Field(default="viewer", max_length=50)
    created_at: datetime = Field(default_factory=_utcnow)
