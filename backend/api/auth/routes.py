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
from services.auth_service import (
    SESSION_COOKIE,
    delete_session,
    get_session_by_token,
    get_user_by_id,
)

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
    from models.workspace import Workspace
    from models.drive_connection import DriveConnection

    all_owned = db.exec(
        select(Workspace)
        .where(Workspace.owner_user_id == user.id)
        .order_by(Workspace.updated_at.desc())
    ).all()

    log.debug(
        "bootstrap: user_id=%s found %d owned workspaces: %s",
        user.id,
        len(all_owned),
        [(w.id, w.name, w.onboarding_complete) for w in all_owned],
    )

    if not all_owned:
        log.debug("bootstrap: no workspaces → send to /onboarding")
        return {
            "authenticated": True,
            "user": _user_dict(user),
            "has_workspace": False,
            "workspace": None,
            "active_workspace_id": None,
            "has_drive_connection": False,
            "onboarding_complete": False,
            "drive_connect_deferred": False,
            "next_route": "/onboarding",
        }

    # ── Select active workspace deterministically ─────────────────────────────
    # Fetch all drive connections for owned workspaces in one query
    owned_ids = [w.id for w in all_owned]
    drive_conns = db.exec(
        select(DriveConnection)
        .where(DriveConnection.workspace_id.in_(owned_ids))
    ).all()
    active_drive_ws_ids = {
        dc.workspace_id for dc in drive_conns if dc.connection_status == "active"
    }

    # Priority 1: complete + active drive (most recently updated)
    workspace = next(
        (w for w in all_owned if w.onboarding_complete and w.id in active_drive_ws_ids),
        None,
    )
    # Priority 2: complete, any drive state
    if workspace is None:
        workspace = next((w for w in all_owned if w.onboarding_complete), None)
    # Priority 3: most recently touched incomplete workspace
    if workspace is None:
        workspace = all_owned[0]

    log.debug(
        "bootstrap: selected workspace id=%s name=%r onboarding_complete=%s",
        workspace.id, workspace.name, workspace.onboarding_complete,
    )

    # ── Resolve drive connection for selected workspace ───────────────────────
    drive_conn = next(
        (dc for dc in drive_conns if dc.workspace_id == workspace.id), None
    )
    has_drive = drive_conn is not None and drive_conn.connection_status == "active"
    drive_deferred = getattr(workspace, "drive_connect_deferred", False) or False
    onboarding_done = workspace.onboarding_complete

    # ── Determine next route ──────────────────────────────────────────────────
    if not onboarding_done:
        log.debug(
            "bootstrap: onboarding_complete=False for workspace %s → /onboarding",
            workspace.id,
        )
        next_route = "/onboarding"
    else:
        log.debug(
            "bootstrap: onboarding_complete=True for workspace %s → /",
            workspace.id,
        )
        next_route = "/"

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
        "onboarding_complete": onboarding_done,
        "drive_connect_deferred": drive_deferred,
        "next_route": next_route,
    }


def _unauthenticated_response():
    return {
        "authenticated": False,
        "user": None,
        "has_workspace": False,
        "workspace": None,
        "active_workspace_id": None,
        "has_drive_connection": False,
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
    db: Session = Depends(_get_db),
):
    token = request.cookies.get(SESSION_COOKIE)
    if token:
        delete_session(db, token)
    response = JSONResponse({"ok": True})
    response.delete_cookie(SESSION_COOKIE, path="/")
    return response
