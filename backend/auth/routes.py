# backend/auth/routes.py

import os
import json
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse, JSONResponse
from google_auth_oauthlib.flow import Flow

router = APIRouter()

# Google OAuth config
SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]

CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = os.getenv("GOOGLE_OAUTH_REDIRECT", "http://localhost:8000/auth/callback")

# Where to persist tokens – service.py should read from the same path
TOKEN_PATH = Path(os.getenv("GOOGLE_TOKEN_PATH", "token.json")).resolve()


def _require_oauth_env():
    if not CLIENT_ID or not CLIENT_SECRET:
        raise HTTPException(
            status_code=500,
            detail="Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env",
        )


def _build_flow(state: Optional[str] = None) -> Flow:
    """
    Build a Google OAuth Flow from env vars instead of client_secret.json
    """
    _require_oauth_env()

    client_config = {
        "web": {
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "redirect_uris": [REDIRECT_URI],
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
        }
    }

    return Flow.from_client_config(
        client_config,
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI,
        state=state,
    )


@router.get("/start")
def auth_start():
    """
    Start Google OAuth flow.
    Redirects user to Google's consent screen.
    """
    flow = _build_flow()
    authorization_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
    )

    # In a real multi-user app, you'd store `state` in a server-side session.
    # For local dev / single user, it's fine to skip.

    return RedirectResponse(authorization_url)


@router.get("/callback")
def auth_callback(request: Request, code: str, state: Optional[str] = None):
    """
    Handle Google's redirect, exchange code for tokens, and save them.
    """
    flow = _build_flow(state=state)
    flow.fetch_token(code=code)

    creds = flow.credentials

    data = {
        "token": creds.token,
        "refresh_token": creds.refresh_token,
        "token_uri": creds.token_uri,
        "client_id": creds.client_id,
        "client_secret": creds.client_secret,
        "scopes": list(creds.scopes or []),
    }

    TOKEN_PATH.write_text(json.dumps(data))

    # After successful auth, send user back to your frontend root
    # Adjust this if your frontend runs on a different port/origin.
    frontend_root = os.getenv("FRONTEND_ROOT", "http://localhost:5173")
    return RedirectResponse(frontend_root)


@router.get("/status")
def auth_status():
    """
    Simple endpoint to check if we have a saved token.
    """
    if not TOKEN_PATH.exists():
        return JSONResponse({"authenticated": False, "hasToken": False})

    try:
        raw = TOKEN_PATH.read_text()
        data = json.loads(raw)
    except Exception:
        return JSONResponse({"authenticated": False, "hasToken": False})

    return JSONResponse({"authenticated": True, "hasToken": True, "scopes": data.get("scopes", [])})
