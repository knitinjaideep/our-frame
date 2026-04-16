"""
Per-workspace Google Drive OAuth connection service.

This is separate from the login OAuth flow. After a user is logged in,
they initiate a Drive connect flow per workspace. This stores the Drive
OAuth tokens in DriveConnection, keyed by workspace_id.

Token encryption:
- If TOKEN_ENCRYPTION_KEY is set, tokens are Fernet-encrypted then base64'd.
- Otherwise tokens are base64-only (local dev warning).

Production note: replace with KMS-backed encryption or a secrets manager.
"""
from __future__ import annotations

import base64
import logging
import warnings
from datetime import datetime, timezone
from typing import Optional

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from sqlmodel import Session, select

from core.config import settings
from models.drive_connection import DriveConnection

logger = logging.getLogger(__name__)

DRIVE_SCOPES = [
    "https://www.googleapis.com/auth/drive.readonly",
]


def _drive_redirect_uri() -> str:
    return settings.google_drive_oauth_redirect


def build_drive_flow(state: Optional[str] = None) -> Flow:
    if not settings.google_client_id or not settings.google_client_secret:
        raise ValueError("Google OAuth not configured")

    redirect_uri = _drive_redirect_uri()
    client_config = {
        "web": {
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "redirect_uris": [redirect_uri],
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
        }
    }
    return Flow.from_client_config(
        client_config,
        scopes=DRIVE_SCOPES,
        redirect_uri=redirect_uri,
        state=state,
    )


def _encrypt_token(token: str) -> str:
    """Encrypt a token string. Falls back to base64 if no key is configured."""
    if settings.token_encryption_key:
        try:
            from cryptography.fernet import Fernet
            f = Fernet(settings.token_encryption_key.encode())
            return f.encrypt(token.encode()).decode()
        except Exception as e:
            logger.error("Token encryption failed: %s — falling back to base64", e)

    warnings.warn(
        "TOKEN_ENCRYPTION_KEY not set — Drive tokens stored base64-only. "
        "Set TOKEN_ENCRYPTION_KEY for production.",
        stacklevel=3,
    )
    return base64.b64encode(token.encode()).decode()


def _decrypt_token(encrypted: str) -> str:
    """Decrypt a token. Falls back to base64 decode if no key configured."""
    if settings.token_encryption_key:
        try:
            from cryptography.fernet import Fernet
            f = Fernet(settings.token_encryption_key.encode())
            return f.decrypt(encrypted.encode()).decode()
        except Exception:
            pass

    # Fallback: base64
    try:
        return base64.b64decode(encrypted.encode()).decode()
    except Exception as exc:
        raise ValueError(f"Failed to decrypt token: {exc}") from exc


def upsert_drive_connection(
    db: Session,
    workspace_id: int,
    user_id: int,
    credentials: Credentials,
    google_account_email: Optional[str] = None,
) -> DriveConnection:
    """Store (or update) Drive credentials for a workspace."""
    existing = db.exec(
        select(DriveConnection).where(DriveConnection.workspace_id == workspace_id)
    ).first()

    now = datetime.now(timezone.utc)
    enc_access = _encrypt_token(credentials.token or "")
    enc_refresh = _encrypt_token(credentials.refresh_token or "") if credentials.refresh_token else None

    expiry = None
    if credentials.expiry:
        expiry = credentials.expiry.replace(tzinfo=timezone.utc) if credentials.expiry.tzinfo is None else credentials.expiry

    if existing:
        existing.encrypted_access_token = enc_access
        existing.encrypted_refresh_token = enc_refresh
        existing.token_expiry = expiry
        existing.connection_status = "active"
        existing.updated_at = now
        if google_account_email:
            existing.google_account_email = google_account_email
        db.add(existing)
        db.commit()
        db.refresh(existing)
        return existing

    conn = DriveConnection(
        workspace_id=workspace_id,
        user_id=user_id,
        provider="google",
        google_account_email=google_account_email,
        encrypted_access_token=enc_access,
        encrypted_refresh_token=enc_refresh,
        token_expiry=expiry,
        connection_status="active",
    )
    db.add(conn)
    db.commit()
    db.refresh(conn)
    return conn


def load_drive_credentials(drive_conn: DriveConnection) -> Credentials:
    """Reconstruct a Credentials object from a DriveConnection."""
    access_token = _decrypt_token(drive_conn.encrypted_access_token) if drive_conn.encrypted_access_token else None
    refresh_token = _decrypt_token(drive_conn.encrypted_refresh_token) if drive_conn.encrypted_refresh_token else None

    creds = Credentials(
        token=access_token,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.google_client_id,
        client_secret=settings.google_client_secret,
        scopes=DRIVE_SCOPES,
    )
    if drive_conn.token_expiry:
        creds.expiry = drive_conn.token_expiry.replace(tzinfo=None)
    return creds


def get_drive_service_for_workspace(db: Session, workspace_id: int):
    """Return an authorized Google Drive service for a workspace, or raise."""
    conn = db.exec(
        select(DriveConnection).where(DriveConnection.workspace_id == workspace_id)
    ).first()

    if not conn or conn.connection_status != "active":
        raise ValueError(f"Workspace {workspace_id} has no active Drive connection")

    creds = load_drive_credentials(conn)

    # Auto-refresh if expired
    if creds.expired and creds.refresh_token:
        from google.auth.transport.requests import Request
        try:
            creds.refresh(Request())
            # Re-encrypt and save refreshed tokens
            upsert_drive_connection(db, workspace_id, conn.user_id, creds, conn.google_account_email)
        except Exception as exc:
            # Mark connection as expired
            conn.connection_status = "expired"
            db.add(conn)
            db.commit()
            raise ValueError(f"Drive token refresh failed: {exc}") from exc

    return build("drive", "v3", credentials=creds)


def update_root_folder(db: Session, workspace_id: int, root_folder_id: str) -> DriveConnection:
    conn = db.exec(
        select(DriveConnection).where(DriveConnection.workspace_id == workspace_id)
    ).first()
    if not conn:
        raise ValueError("No Drive connection for this workspace")
    conn.root_folder_id = root_folder_id
    conn.updated_at = datetime.now(timezone.utc)
    db.add(conn)
    db.commit()
    db.refresh(conn)
    return conn
