# backend/auth/routes.py
#
# Login flow — uses openid + email + profile scopes ONLY.
# Drive connection is a completely separate flow in api/drive/routes.py.
#
# Authorized redirect URI in Google Cloud Console:
#   http://localhost:8000/auth/callback
#
# Routes:
#   GET /auth/start    — redirect to Google consent (identity scopes)
#   GET /auth/callback — exchange code, create session, hand off to frontend
#   GET /auth/status   — legacy: check token.json exists
#   GET /auth/debug-session — dev helper

import json
import logging
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse
from google_auth_oauthlib.flow import Flow
from sqlmodel import Session

from core.config import settings
from core.database import get_session

router = APIRouter()
logger = logging.getLogger(__name__)

# ── Identity scopes — these give us email, name, picture from the id_token ──
# Never mix in drive.readonly here; that's the Drive connect flow.
LOGIN_SCOPES = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
]

REDIRECT_URI = settings.google_oauth_redirect  # http://localhost:8000/auth/callback
TOKEN_PATH = Path(__file__).resolve().parent.parent / settings.google_token_path


def _build_login_flow(state: Optional[str] = None) -> Flow:
    if not settings.google_client_id or not settings.google_client_secret:
        raise HTTPException(500, "Google OAuth not configured. Set GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET.")
    client_config = {
        "web": {
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "redirect_uris": [REDIRECT_URI],
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
        }
    }
    return Flow.from_client_config(
        client_config,
        scopes=LOGIN_SCOPES,
        redirect_uri=REDIRECT_URI,
        state=state,
    )


@router.get("/start")
def auth_start():
    """Redirect to Google's consent screen requesting identity scopes only."""
    flow = _build_login_flow()
    auth_url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="false",  # don't inherit old drive scope
        prompt="consent",
    )
    # Return HTML that navigates via JS so the browser handles it as a
    # top-level navigation (avoids cross-origin redirect cookie issues later)
    return HTMLResponse(
        content=f'<script>window.location.replace({json.dumps(auth_url)});</script>',
        status_code=200,
    )


@router.get("/callback")
def auth_callback(
    request: Request,
    code: str,
    state: Optional[str] = None,
    db: Session = Depends(get_session),
):
    """
    Exchange Google auth code for identity tokens, create a platform session,
    then hand off to the frontend /auth/callback page.

    Identity is extracted from the id_token (JWT) — no extra HTTP call needed
    when openid scope is present. Falls back to userinfo endpoint if needed.
    """
    flow = _build_login_flow(state=state)
    flow.fetch_token(code=code)
    creds = flow.credentials

    # ── Extract identity from id_token (guaranteed with openid scope) ────────
    google_info: Optional[dict] = None

    # Path 1: decode the id_token (no extra network call)
    if creds.id_token:
        try:
            from google.oauth2 import id_token as _id_token
            from google.auth.transport import requests as _google_requests
            payload = _id_token.verify_oauth2_token(
                creds.id_token,
                _google_requests.Request(),
                settings.google_client_id,
            )
            google_info = {
                "sub": payload.get("sub"),
                "id": payload.get("sub"),
                "email": payload.get("email"),
                "name": payload.get("name"),
                "picture": payload.get("picture"),
            }
            logger.info("Identity from id_token: email=%s", google_info.get("email"))
        except Exception as exc:
            logger.warning("id_token verification failed, falling back to userinfo: %s", exc)

    # Path 2: userinfo endpoint (fallback — works because we have identity scopes)
    if not google_info or not google_info.get("email"):
        try:
            from googleapiclient.discovery import build as _build
            svc = _build("oauth2", "v2", credentials=creds)
            info = svc.userinfo().get().execute()
            google_info = {
                "sub": info.get("id"),
                "id": info.get("id"),
                "email": info.get("email"),
                "name": info.get("name"),
                "picture": info.get("picture"),
            }
            logger.info("Identity from userinfo: email=%s", google_info.get("email"))
        except Exception as exc:
            logger.error("userinfo endpoint failed: %s", exc)

    if not google_info or not google_info.get("email"):
        logger.error("Could not obtain user identity. google_info=%s", google_info)
        raise HTTPException(502, "Could not obtain user identity from Google. Please try again.")

    # ── Upsert user + create session ─────────────────────────────────────────
    from services.auth_service import upsert_user, create_session, SESSION_COOKIE

    user = upsert_user(db, google_info)
    sess = create_session(db, user.id)
    logger.info("Session created: user_id=%s email=%s", user.id, user.email)

    # ── Hand off to frontend /auth/callback ───────────────────────────────────
    # We redirect to a dedicated frontend page (not the app root) so the frontend
    # can seed its React Query cache with fresh data before routing.
    # The session token is passed as ?t= alongside the HttpOnly cookie so the
    # frontend can bootstrap auth even if the cross-port cookie doesn't arrive.
    frontend_callback = (
        f"{settings.frontend_root.rstrip('/')}/auth/callback"
        f"?t={sess.session_token}"
    )

    # Serve an HTML 200 (not a 307 redirect) so the browser stores the
    # Set-Cookie correctly. A cross-origin 307 response drops cookies in Chrome.
    response = HTMLResponse(
        content=f"""<!doctype html>
<html><head><meta charset="utf-8"><title>Signing in…</title></head>
<body><script>window.location.replace({json.dumps(frontend_callback)});</script>
</body></html>""",
        status_code=200,
    )
    response.set_cookie(
        SESSION_COOKIE,
        sess.session_token,
        max_age=settings.session_ttl_seconds,
        httponly=True,
        samesite="lax",
        path="/",
    )
    return response


@router.get("/debug-session")
def debug_session(request: Request, db: Session = Depends(get_session)):
    """Dev helper: inspect what session the backend sees."""
    from services.auth_service import SESSION_COOKIE, get_session_by_token, get_user_by_id
    token = request.cookies.get(SESSION_COOKIE)
    if not token:
        return {"cookie_present": False, "cookies": list(request.cookies.keys())}
    sess = get_session_by_token(db, token)
    if not sess:
        return {"cookie_present": True, "session_valid": False}
    user = get_user_by_id(db, sess.user_id)
    return {
        "cookie_present": True,
        "session_valid": True,
        "email": user.email if user else None,
        "expires_at": sess.expires_at.isoformat(),
    }


@router.get("/status")
def auth_status():
    """Legacy: check whether token.json exists (used by Drive sync)."""
    if not TOKEN_PATH.exists():
        return JSONResponse({"authenticated": False, "hasToken": False})
    try:
        data = json.loads(TOKEN_PATH.read_text())
    except Exception:
        return JSONResponse({"authenticated": False, "hasToken": False})
    return JSONResponse({"authenticated": True, "hasToken": True, "scopes": data.get("scopes", [])})
