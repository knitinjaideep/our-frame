"""
Shared FastAPI dependency helpers.

get_db              — yields a DB session
get_fav_ids         — legacy favorite IDs set
get_current_user    — resolves the session cookie → User or 401
require_workspace   — validates workspace membership for a given workspace_id
require_admin       — requires platform admin
"""
from __future__ import annotations

from typing import Optional

from fastapi import Cookie, Depends, HTTPException, Path, Query, Request
from sqlmodel import Session, select

from core.database import get_session
from models.user import User
from models.workspace import Workspace, WorkspaceMember
from models.session import UserSession
from repositories.favorites_repo import get_all_photo_ids
from services.auth_service import SESSION_COOKIE, get_session_by_token, get_user_by_id


# ── DB session ────────────────────────────────────────────────────────────────


def get_db() -> Session:
    yield from get_session()


# ── Legacy favorites helper ───────────────────────────────────────────────────


def get_fav_ids(session: Session = Depends(get_db)) -> set[str]:
    return get_all_photo_ids(session)


# ── Session / user resolution ─────────────────────────────────────────────────


def _session_token(
    request: Request,
    of_session: Optional[str] = Cookie(default=None),
    t: Optional[str] = Query(default=None),
) -> Optional[str]:
    """Read token from HttpOnly cookie first, then ?t= query param as fallback."""
    return of_session or t


def get_current_user(
    token: Optional[str] = Depends(_session_token),
    db: Session = Depends(get_db),
) -> User:
    """Resolve the session token to a User. Raises 401 if missing/expired."""
    if not token:
        raise HTTPException(401, "Not authenticated")
    sess = get_session_by_token(db, token)
    if not sess:
        raise HTTPException(401, "Session expired or invalid")
    user = get_user_by_id(db, sess.user_id)
    if not user:
        raise HTTPException(401, "User not found")
    return user


def get_current_user_optional(
    token: Optional[str] = Depends(_session_token),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Like get_current_user but returns None instead of raising."""
    if not token:
        return None
    sess = get_session_by_token(db, token)
    if not sess:
        return None
    return get_user_by_id(db, sess.user_id)


# ── Workspace access control ──────────────────────────────────────────────────


def require_workspace(
    workspace_id: int = Path(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Workspace:
    """
    Validates that the current user is a member (any role) of the requested workspace.
    Returns the Workspace. Raises 403/404 to avoid leaking existence.
    """
    workspace = db.get(Workspace, workspace_id)
    if not workspace:
        raise HTTPException(404, "Workspace not found")

    # Owner always has access
    if workspace.owner_user_id == user.id:
        return workspace

    member = db.exec(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user.id,
        )
    ).first()

    if not member:
        raise HTTPException(403, "Access denied")

    return workspace


def require_workspace_owner(
    workspace_id: int = Path(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Workspace:
    """Like require_workspace but only the owner can proceed."""
    workspace = db.get(Workspace, workspace_id)
    if not workspace:
        raise HTTPException(404, "Workspace not found")
    if workspace.owner_user_id != user.id:
        raise HTTPException(403, "Only the workspace owner can perform this action")
    return workspace


def require_admin(user: User = Depends(get_current_user)) -> User:
    """Require is_platform_admin == True."""
    if not user.is_platform_admin:
        raise HTTPException(403, "Platform admin access required")
    return user
