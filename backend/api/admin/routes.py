"""
Platform admin endpoints — safe summaries only.

All routes require is_platform_admin == True.
No media data, no photo exposure, no raw tokens.

GET /api/admin/users       — list all users (safe summary)
GET /api/admin/workspaces  — list all workspaces (safe summary)
GET /api/admin/stats       — platform stats
"""
from __future__ import annotations

from typing import Literal, Optional

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select, func

from api.deps import get_db, require_admin
from models.user import User
from models.workspace import Workspace
from models.drive_connection import DriveConnection
from services.media_processing_service import process_media_queue, queue_status

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/users")
def list_users(
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Safe summary of all platform users."""
    users = db.exec(select(User).order_by(User.created_at.desc())).all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "display_name": u.display_name,
            "avatar_url": u.avatar_url,
            "auth_provider": u.auth_provider,
            "is_platform_admin": u.is_platform_admin,
            "created_at": u.created_at.isoformat(),
        }
        for u in users
    ]


@router.get("/workspaces")
def list_workspaces(
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Safe summary of all workspaces."""
    workspaces = db.exec(select(Workspace).order_by(Workspace.created_at.desc())).all()
    return [
        {
            "id": w.id,
            "owner_user_id": w.owner_user_id,
            "name": w.name,
            "slug": w.slug,
            "privacy_mode": w.privacy_mode,
            "layout_preset": w.layout_preset,
            "theme_preset": w.theme_preset,
            "onboarding_complete": w.onboarding_complete,
            "created_at": w.created_at.isoformat(),
        }
        for w in workspaces
    ]


@router.get("/stats")
def platform_stats(
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """High-level platform stats."""
    user_count = db.exec(select(func.count()).select_from(User)).one()
    workspace_count = db.exec(select(func.count()).select_from(Workspace)).one()
    active_drives = db.exec(
        select(func.count()).select_from(DriveConnection).where(
            DriveConnection.connection_status == "active"
        )
    ).one()

    return {
        "total_users": user_count,
        "total_workspaces": workspace_count,
        "active_drive_connections": active_drives,
    }


@router.get("/media/queue")
def media_queue_status(
    include_playback: bool = Query(False),
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Inspect missing media derivatives without exposing media contents."""
    return queue_status(db, include_playback=include_playback)


@router.post("/media/process")
def process_media_derivatives(
    limit: int = Query(10, ge=1, le=100),
    media_type: Optional[Literal["image", "video"]] = Query(None),
    retry_failed: bool = Query(False),
    include_playback: bool = Query(False),
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Manually process queued/missing media derivatives for local development."""
    return process_media_queue(
        db,
        limit=limit,
        media_type=media_type,
        retry_failed=retry_failed,
        include_playback=include_playback,
    )
