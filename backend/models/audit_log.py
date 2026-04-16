from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class AuditLog(SQLModel, table=True):
    """Platform-level audit trail for admin visibility."""

    __tablename__ = "audit_logs"

    id: Optional[int] = Field(default=None, primary_key=True)
    actor_user_id: Optional[int] = Field(default=None, foreign_key="users.id", index=True)
    workspace_id: Optional[int] = Field(default=None, foreign_key="workspaces.id", index=True)
    event_type: str = Field(max_length=100, index=True)
    # JSON-encoded event metadata — never include raw tokens or PII beyond IDs
    event_metadata: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=_utcnow)
