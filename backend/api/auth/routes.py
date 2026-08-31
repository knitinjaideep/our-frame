"""
Per-user Google OAuth login routes.

GET  /api/auth/me        → return current user (reads HttpOnly cookie OR ?t= param)
GET  /api/auth/bootstrap → single source of truth: auth + workspace + drive state
POST /api/auth/logout    → clear session
"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from fastapi.responses import JSONResponse
from sqlmodel import Session, select

from core.config import settings
from core.database import get_session
from repositories import media_repo
from services.auth_service import (
    SESSION_COOKIE,
    delete_session,
    get_session_by_token,
    get_user_by_id,
)
from services.workspace_service import get_active_workspace_for_user, list_user_workspaces

router = APIRouter(prefix="/api/auth", tags=["Auth v2"])


def _get_db(session: Session = Depends(get_session)):
    return session


def _resolve_token(request: Request, t: Optional[str] = Query(default=None)) -> Optional[str]:
    """Read the session token from the HttpOnly cookie first, then ?t= fallback."""
    return request.cookies.get(SESSION_COOKIE) or t


@router.get("/me")
def get_current_user(
    token: Optional[str] = Depends(_resolve_token),
    db: Session = Depends(_get_db),
):
    if not token:
        raise HTTPException(401, "Not authenticated")

    sess = get_session_by_token(db, token)
    if not sess:
        raise HTTPException(401, "Session expired or invalid")

    user = get_user_by_id(db, sess.user_id)
    if not user:
        raise HTTPException(401, "User not found")

    return {
        "id": user.id,
        "email": user.email,
        "display_name": user.display_name,
        "avatar_url": user.avatar_url,
        "is_platform_admin": user.is_platform_admin,
        "created_at": user.created_at.isoformat(),
    }


@router.get("/bootstrap")
def bootstrap(
    token: Optional[str] = Depends(_resolve_token),
    db: Session = Depends(_get_db),
):
    """
    Single source of truth for frontend routing decisions.

    Active workspace selection (deterministic):
      1. Any workspace where onboarding_complete=True AND has an active drive
         connection — most recently updated wins.
      2. Any workspace where onboarding_complete=True — most recently updated wins.
      3. Any workspace (incomplete) — most recently updated wins, so the user
         resumes the flow they were last working on.

    This prevents the stale first-workspace problem where a user creates multiple
    workspaces and the oldest incomplete one keeps being selected.
    """
    import logging
    log = logging.getLogger(__name__)

    # ── Resolve user ──────────────────────────────────────────────────────────
    if not token:
        log.debug("bootstrap: no token → unauthenticated")
        return _unauthenticated_response()

    sess = get_session_by_token(db, token)
    if not sess:
        log.debug("bootstrap: token invalid/expired → unauthenticated")
        return _unauthenticated_response()

    user = get_user_by_id(db, sess.user_id)
    if not user:
        log.debug("bootstrap: session user not found → unauthenticated")
        return _unauthenticated_response()

    # ── Resolve workspaces ────────────────────────────────────────────────────
    from models.drive_connection import DriveConnection

    workspaces = sorted(
        list_user_workspaces(db, user.id),
        key=lambda w: w.updated_at,
        reverse=True,
    )

    log.debug(
        "bootstrap: user_id=%s found %d workspaces: %s",
        user.id,
        len(workspaces),
        [(w.id, w.name, w.onboarding_complete) for w in workspaces],
    )

    if not workspaces:
        log.debug("bootstrap: no workspaces → /home (setup state will prompt creation)")
        return {
            "authenticated": True,
            "user": _user_dict(user),
            "has_workspace": False,
            "workspace": None,
            "active_workspace_id": None,
            "has_drive_connection": False,
            "has_root_folder": False,
            "has_media": False,
            "onboarding_complete": False,
            "drive_connect_deferred": False,
            "next_route": "/home",
        }

    workspace = get_active_workspace_for_user(db, user.id)
    if workspace is None:
        log.debug("bootstrap: no active workspace → /home")
        return {
            "authenticated": True,
            "user": _user_dict(user),
            "has_workspace": False,
            "workspace": None,
            "active_workspace_id": None,
            "has_drive_connection": False,
            "has_root_folder": False,
            "has_media": False,
            "onboarding_complete": False,
            "drive_connect_deferred": False,
            "next_route": "/home",
        }

    # Fetch all drive connections for candidate workspaces in one query.
    workspace_ids = [w.id for w in workspaces if w.id is not None]
    drive_conns = db.exec(
        select(DriveConnection)
        .where(DriveConnection.workspace_id.in_(workspace_ids))
    ).all() if workspace_ids else []

    log.debug(
        "bootstrap: selected workspace id=%s name=%r onboarding_complete=%s",
        workspace.id, workspace.name, workspace.onboarding_complete,
    )

    # ── Resolve drive connection for selected workspace ───────────────────────
    drive_conn = next(
        (dc for dc in drive_conns if dc.workspace_id == workspace.id), None
    )
    has_drive = drive_conn is not None and drive_conn.connection_status == "active"
    has_root_folder = (
        drive_conn is not None
        and bool(getattr(drive_conn, "root_folder_id", None))
    )
    drive_deferred = getattr(workspace, "drive_connect_deferred", False) or False
    onboarding_done = workspace.onboarding_complete

    has_media = media_repo.workspace_has_media(db, workspace.id)

    log.debug(
        "bootstrap: workspace %s → has_drive=%s has_root_folder=%s onboarding_done=%s has_media=%s → /home",
        workspace.id, has_drive, has_root_folder, onboarding_done, has_media,
    )

    return {
        "authenticated": True,
        "user": _user_dict(user),
        "has_workspace": True,
        "workspace": {
            "id": workspace.id,
            "name": workspace.name,
            "slug": workspace.slug,
            "onboarding_complete": onboarding_done,
            "drive_connect_deferred": drive_deferred,
        },
        "active_workspace_id": workspace.id,
        "has_drive_connection": has_drive,
        "has_root_folder": has_root_folder,
        "has_media": has_media,
        "onboarding_complete": onboarding_done,
        "drive_connect_deferred": drive_deferred,
        # Always send authenticated users to /home — setup state is resolved there
        "next_route": "/home",
    }


def _unauthenticated_response():
    return {
        "authenticated": False,
        "user": None,
        "has_workspace": False,
        "workspace": None,
        "active_workspace_id": None,
        "has_drive_connection": False,
        "has_media": False,
        "onboarding_complete": False,
        "drive_connect_deferred": False,
        "next_route": "/login",
    }


def _user_dict(user) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "display_name": user.display_name,
        "avatar_url": user.avatar_url,
        "is_platform_admin": user.is_platform_admin,
    }


@router.post("/logout")
def logout(
    request: Request,
    token: Optional[str] = Depends(_resolve_token),
    db: Session = Depends(_get_db),
):
    if token:
        delete_session(db, token)
    response = JSONResponse({"ok": True})
    response.delete_cookie(SESSION_COOKIE, path="/")
    return response
