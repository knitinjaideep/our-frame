from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class DriveConnection(SQLModel, table=True):
    """Stores per-workspace Google Drive OAuth credentials.

    Security notes:
    - Tokens are base64-encoded in this local-dev implementation.
    - In production, replace with KMS-backed encryption or a secrets manager
      (AWS Secrets Manager, GCP Secret Manager, HashiCorp Vault).
    - Never log or expose the token fields via API responses.
    """

    __tablename__ = "drive_connections"

    id: Optional[int] = Field(default=None, primary_key=True)
    workspace_id: int = Field(foreign_key="workspaces.id", index=True, unique=True)
    # The user who performed the OAuth grant
    user_id: int = Field(foreign_key="users.id", index=True)

    provider: str = Field(default="google", max_length=50)
    google_account_email: Optional[str] = Field(default=None, max_length=320)
    root_folder_id: Optional[str] = Field(default=None, max_length=200)

    # Tokens are stored base64-encoded (local dev).
    # Production: store an opaque reference to a secrets manager entry.
    encrypted_access_token: Optional[str] = Field(default=None)
    encrypted_refresh_token: Optional[str] = Field(default=None)
    token_expiry: Optional[datetime] = Field(default=None)

    # "active" | "expired" | "revoked" | "pending"
    connection_status: str = Field(default="pending", max_length=50)

    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)
