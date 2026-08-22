"""
Per-workspace Drive connection routes.

GET  /api/drive/connect/{workspace_id}          → start Drive OAuth for workspace
GET  /api/drive/callback                        → handle Google callback, store tokens
GET  /api/drive/{workspace_id}/status           → connection status
POST /api/drive/{workspace_id}/root-folder      → set/change root folder ID
GET  /api/drive/{workspace_id}/folders          → list top-level folders (picker aid)
GET  /api/drive/{workspace_id}/folders/{id}/children → list children of a folder
POST /api/drive/{workspace_id}/analyze          → analyze folder structure & return recommendations
"""
from __future__ import annotations

import json
import secrets

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import HTMLResponse, RedirectResponse
from pydantic import BaseModel
from sqlmodel import Session

from api.deps import get_current_user, get_db, require_workspace_owner
from core.config import settings
from models.user import User
from models.workspace import Workspace
from services.drive_connect_service import (
    build_drive_flow,
    get_drive_service_for_workspace,
    update_root_folder,
    upsert_drive_connection,
)
from services.workspace_service import get_drive_connection

router = APIRouter(prefix="/api/drive", tags=["Drive Connection"])

_DRIVE_STATE_COOKIE = "of_drive_state"


# ── Start Drive OAuth for a workspace ─────────────────────────────────────────


@router.get("/connect/{workspace_id}")
def drive_connect_start(
    workspace: Workspace = Depends(require_workspace_owner),
    user: User = Depends(get_current_user),
):
    """Redirect to Google Drive consent screen for this workspace."""
    import base64
    state_payload = json.dumps({
        "flow": "drive_connect",
        "workspace_id": workspace.id,
        "user_id": user.id,
        "nonce": secrets.token_urlsafe(16),
    })
    state = base64.urlsafe_b64encode(state_payload.encode()).decode()

    flow = build_drive_flow(state=state)
    auth_url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="false",
        prompt="consent",
    )

    # Use an HTML response to ensure the browser stores the cookie before
    # following the redirect (avoids Chrome cross-origin redirect cookie drops).
    response = HTMLResponse(
        content=f'<script>window.location.replace({json.dumps(auth_url)});</script>',
        status_code=200,
    )
    response.set_cookie(
        _DRIVE_STATE_COOKIE,
        state,
        max_age=600,
        httponly=True,
        samesite="lax",
    )
    return response


# ── Drive OAuth callback ───────────────────────────────────────────────────────


@router.get("/callback")
def drive_connect_callback(
    request: Request,
    code: str,
    state: str = "",
    db: Session = Depends(get_db),
):
    """
    Handle Google callback for Drive connect flow.

    Auth is resolved from the state payload (workspace_id + user_id) so we
    don't depend on the HttpOnly cookie surviving the cross-origin redirect chain.
    We look up the session token from the DB to pass back to the frontend as ?t=
    so the frontend can authenticate itself without relying on cookie timing.
    """
    import base64
    from models.session import UserSession
    from sqlmodel import select as _select
    from services.auth_service import SESSION_COOKIE

    expected_state = request.cookies.get(_DRIVE_STATE_COOKIE, "")
    if state and expected_state and state != expected_state:
        raise HTTPException(400, "OAuth state mismatch")

    try:
        state_payload = json.loads(base64.urlsafe_b64decode(state.encode()).decode())
        workspace_id = int(state_payload["workspace_id"])
        user_id = int(state_payload["user_id"])
        flow_type = state_payload.get("flow", "drive_connect")
    except Exception:
        raise HTTPException(400, "Invalid state parameter")

    if flow_type != "drive_connect":
        raise HTTPException(400, "Invalid flow type in state")

    # Validate workspace ownership using user_id from state (not cookie)
    workspace = db.get(Workspace, workspace_id)
    if not workspace or workspace.owner_user_id != user_id:
        raise HTTPException(403, "Access denied")

    try:
        flow = build_drive_flow(state=state)
        flow.fetch_token(code=code)
        creds = flow.credentials
    except Exception as exc:
        raise HTTPException(400, f"Failed to exchange code: {exc}")

    # Get the Drive account email
    google_account_email = None
    try:
        from googleapiclient.discovery import build as _build
        svc = _build("oauth2", "v2", credentials=creds)
        info = svc.userinfo().get().execute()
        google_account_email = info.get("email")
    except Exception:
        pass

    upsert_drive_connection(db, workspace_id, user_id, creds, google_account_email)

    # Find the user's active session token to pass back to the frontend as ?t=
    # so the frontend can authenticate even if the cookie doesn't arrive in time.
    session_token = request.cookies.get(SESSION_COOKIE)
    if not session_token:
        # Fallback: look up the most recent valid session for this user
        from datetime import datetime, timezone
        sess = db.exec(
            _select(UserSession)
            .where(UserSession.user_id == user_id)
            .where(UserSession.expires_at > datetime.now(timezone.utc))
            .order_by(UserSession.created_at.desc())
        ).first()
        if sess:
            session_token = sess.session_token

    # Return to home — setup state on /home handles Drive-connected state
    frontend_url = (
        f"{settings.frontend_root}/home?drive_connected=1&workspace={workspace_id}"
        + (f"&t={session_token}" if session_token else "")
    )

    # Use HTML response (not 307 redirect) so the browser handles the
    # Set-Cookie correctly before following the redirect.
    response = HTMLResponse(
        content=f"""<!doctype html>
<html><head><meta charset="utf-8"><title>Connecting Drive…</title></head>
<body><script>window.location.replace({json.dumps(frontend_url)});</script>
</body></html>""",
        status_code=200,
    )
    response.delete_cookie(_DRIVE_STATE_COOKIE)
    return response


# ── Connection status ──────────────────────────────────────────────────────────


@router.get("/{workspace_id}/status")
def drive_status(
    workspace: Workspace = Depends(require_workspace_owner),
    db: Session = Depends(get_db),
):
    conn = get_drive_connection(db, workspace.id)
    if not conn:
        return {"status": "not_connected", "google_account_email": None, "has_root_folder": False}

    return {
        "status": conn.connection_status,
        "google_account_email": conn.google_account_email,
        "has_root_folder": bool(conn.root_folder_id),
        "root_folder_id": conn.root_folder_id,
    }


# ── Set root folder ────────────────────────────────────────────────────────────


class SetRootFolderBody(BaseModel):
    root_folder_id: str


@router.post("/{workspace_id}/root-folder")
def set_root_folder(
    body: SetRootFolderBody,
    workspace: Workspace = Depends(require_workspace_owner),
    db: Session = Depends(get_db),
):
    try:
        update_root_folder(db, workspace.id, body.root_folder_id)
    except ValueError as exc:
        raise HTTPException(400, str(exc))
    return {"ok": True, "root_folder_id": body.root_folder_id}


# ── List top-level Drive folders (folder picker helper) ───────────────────────


@router.get("/{workspace_id}/folders")
def list_folders(
    workspace: Workspace = Depends(require_workspace_owner),
    db: Session = Depends(get_db),
):
    """List top-level Drive folders for folder selection UI."""
    try:
        service = get_drive_service_for_workspace(db, workspace.id)
    except ValueError as exc:
        raise HTTPException(400, str(exc))

    resp = service.files().list(
        q="mimeType = 'application/vnd.google-apps.folder' and 'root' in parents and trashed = false",
        fields="files(id,name)",
        pageSize=100,
        orderBy="name",
    ).execute()

    return {"folders": resp.get("files", [])}


# ── List children of a specific folder ────────────────────────────────────────


@router.get("/{workspace_id}/folders/{folder_id}/children")
def list_folder_children(
    folder_id: str,
    workspace: Workspace = Depends(require_workspace_owner),
    db: Session = Depends(get_db),
):
    """List immediate child folders of the given folder (for breadcrumb navigation)."""
    try:
        service = get_drive_service_for_workspace(db, workspace.id)
    except ValueError as exc:
        raise HTTPException(400, str(exc))

    resp = service.files().list(
        q=f"mimeType = 'application/vnd.google-apps.folder' and '{folder_id}' in parents and trashed = false",
        fields="files(id,name)",
        pageSize=50,
        orderBy="name",
    ).execute()

    return {"folders": resp.get("files", []), "parent_id": folder_id}


# ── Analyze folder structure and return recommendations ───────────────────────


class AnalyzeFolderBody(BaseModel):
    folder_id: str


def _classify_folders(names: list[str]) -> list[dict]:
    """
    Analyse top-level folder names and return up to 3 recommended structure
    patterns, ordered by confidence.  Also always appends a 'custom' option.
    """
    import re

    lower = [n.lower() for n in names]
    name_set = set(lower)
    recommendations: list[dict] = []
    scored: list[tuple[int, dict]] = []

    # ── PATTERN: year-based timeline ────────────────────────────────────────
    year_re = re.compile(r"^(19|20)\d{2}$")
    year_names = [n for n in names if year_re.match(n.strip())]
    year_score = len(year_names)
    if year_score >= 2:
        scored.append((year_score * 10, {
            "id": "timeline",
            "title": "Year-by-Year Timeline",
            "description": "Folders organised by year — great for chronological browsing.",
            "reasoning": f"Found {year_score} year folders ({', '.join(year_names[:4])}).",
            "template": "events",
            "preview": ["2020 → 2021 → 2022 → 2023", "Albums: Trips, Holidays, Moments"],
        }))

    # ── PATTERN: media split (Photos + Videos) ──────────────────────────────
    media_keywords = {"photos", "pictures", "images", "videos", "movies", "clips", "media"}
    media_matches = [n for n in lower if n in media_keywords or any(k in n for k in media_keywords)]
    media_score = len(media_matches)
    if media_score >= 1:
        scored.append((media_score * 9, {
            "id": "media_split",
            "title": "Photos & Videos Split",
            "description": "Separate root folders for photos and videos.",
            "reasoning": f"Found media folders: {', '.join(media_matches[:3])}.",
            "template": "family",
            "preview": ["Photos → Albums by date/event", "Videos → Clips by category"],
        }))

    # ── PATTERN: person/family members ──────────────────────────────────────
    family_keywords = {"family", "kids", "children", "baby", "toddler", "arjun", "mom", "dad",
                       "parents", "grandma", "grandpa", "nana", "grandparents", "siblings", "brother", "sister"}
    family_matches = [n for n in lower if any(k in n for k in family_keywords)]
    family_score = len(family_matches)
    if family_score >= 1:
        scored.append((family_score * 8, {
            "id": "family",
            "title": "Family Members",
            "description": "Organised around people — each folder is a person or group.",
            "reasoning": f"Found person/family folders: {', '.join([names[lower.index(m)] for m in family_matches[:3]])}.",
            "template": "family",
            "preview": ["Per-person albums", "Events & Milestones cross-linked"],
        }))

    # ── PATTERN: travel / destinations ──────────────────────────────────────
    travel_keywords = {"travel", "trips", "vacation", "holidays", "adventures", "destinations",
                       "road trip", "europe", "india", "japan", "california", "beach", "mountains"}
    travel_matches = [n for n in lower if any(k in n for k in travel_keywords)]
    travel_score = len(travel_matches)
    if travel_score >= 1:
        scored.append((travel_score * 7, {
            "id": "travel",
            "title": "Travel & Destinations",
            "description": "Albums built around trips and destinations.",
            "reasoning": f"Found travel folders: {', '.join([names[lower.index(m)] for m in travel_matches[:3]])}.",
            "template": "travel",
            "preview": ["Trips → Destinations → Days", "Memories by place & season"],
        }))

    # ── PATTERN: events / occasions ─────────────────────────────────────────
    event_keywords = {"birthday", "christmas", "thanksgiving", "halloween", "wedding",
                      "graduation", "anniversary", "holiday", "event", "party", "celebration", "reunion"}
    event_matches = [n for n in lower if any(k in n for k in event_keywords)]
    event_score = len(event_matches)
    if event_score >= 1:
        scored.append((event_score * 7, {
            "id": "events",
            "title": "Events & Occasions",
            "description": "Memories organised around occasions and celebrations.",
            "reasoning": f"Found event folders: {', '.join([names[lower.index(m)] for m in event_matches[:3]])}.",
            "template": "events",
            "preview": ["Birthdays, Holidays, Milestones", "Albums by event type"],
        }))

    # ── PATTERN: portfolio / project / professional ──────────────────────────
    portfolio_keywords = {"portfolio", "projects", "clients", "work", "archive", "collection",
                          "prints", "editorial", "sessions", "galleries"}
    portfolio_matches = [n for n in lower if any(k in n for k in portfolio_keywords)]
    portfolio_score = len(portfolio_matches)
    if portfolio_score >= 1:
        scored.append((portfolio_score * 6, {
            "id": "portfolio",
            "title": "Portfolio / Archive",
            "description": "Professional or curated archive style organisation.",
            "reasoning": f"Found portfolio/project folders: {', '.join([names[lower.index(m)] for m in portfolio_matches[:3]])}.",
            "template": "custom",
            "preview": ["Collections by project/client", "Series → Shoots → Selects"],
        }))

    # Sort by score, take top 3
    scored.sort(key=lambda x: x[0], reverse=True)
    recommendations = [item for _, item in scored[:3]]

    # Always append custom
    recommendations.append({
        "id": "custom",
        "title": "Custom — I'll map it myself",
        "description": "Tell us how your folders work and we'll respect your structure.",
        "reasoning": "Full control over how the app interprets your folders.",
        "template": "custom",
        "preview": ["You choose grouping style", "Albums derived from your rules"],
    })

    return recommendations


@router.post("/{workspace_id}/analyze")
def analyze_folder_structure(
    body: AnalyzeFolderBody,
    workspace: Workspace = Depends(require_workspace_owner),
    db: Session = Depends(get_db),
):
    """
    Inspect a folder's top-level children and return structure recommendations.
    The analysis is done server-side so the frontend never needs to list raw Drive data.
    """
    try:
        service = get_drive_service_for_workspace(db, workspace.id)
    except ValueError as exc:
        raise HTTPException(400, str(exc))

    # Fetch top-level subfolders of the selected folder
    resp = service.files().list(
        q=f"mimeType = 'application/vnd.google-apps.folder' and '{body.folder_id}' in parents and trashed = false",
        fields="files(id,name)",
        pageSize=80,
        orderBy="name",
    ).execute()
    subfolders = resp.get("files", [])
    names = [f["name"] for f in subfolders]

    recommendations = _classify_folders(names)

    return {
        "folder_id": body.folder_id,
        "subfolder_count": len(subfolders),
        "subfolders_sampled": names[:20],
        "recommendations": recommendations,
    }
