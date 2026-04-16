from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class UserSession(SQLModel, table=True):
    """Server-side session record keyed by a random opaque token stored in an HttpOnly cookie."""

    __tablename__ = "user_sessions"

    id: Optional[int] = Field(default=None, primary_key=True)
    session_token: str = Field(index=True, unique=True, max_length=128)
    user_id: int = Field(foreign_key="users.id", index=True)
    expires_at: datetime
    created_at: datetime = Field(default_factory=_utcnow)
    # Pending OAuth state: workspace_id being connected when flow was initiated
    pending_workspace_id: Optional[int] = Field(default=None)
