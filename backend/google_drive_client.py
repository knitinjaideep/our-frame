"""
Google Drive client for Our Frame
- Stores credentials in token.json (JSON)
- Auto-refreshes access tokens
- If refresh fails with invalid_grant (Testing mode ~7 days), raises ReauthRequired

Notes for images:
- We query with `mimeType contains 'image/'`, which covers JPG and HEIC (image/heic).
- The frontend uses Drive's `thumbnailLink` so HEIC will display as JPEG thumbnails in browsers.

Required:
  backend/client_secrets.json  (OAuth client: Web application)
  env GOOGLE_OAUTH_REDIRECT (default http://localhost:8000/auth/callback)
"""
from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Optional, Dict, Any

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from google.auth.exceptions import RefreshError

BASE_DIR = Path(__file__).resolve().parent
CLIENT_SECRETS_FILE = BASE_DIR / "client_secrets.json"
TOKEN_PATH = BASE_DIR / "token.json"

SCOPES = [
    "https://www.googleapis.com/auth/drive.readonly",
]

DEFAULT_REDIRECT_URI = os.getenv("GOOGLE_OAUTH_REDIRECT", "http://localhost:8000/auth/callback")


class ReauthRequired(Exception):
    """Raised when re-running the OAuth consent flow is required."""


def _save_credentials(creds: Credentials) -> None:
    data = {
        "token": creds.token,
        "refresh_token": creds.refresh_token,
        "token_uri": creds.token_uri,
        "client_id": creds.client_id,
        "client_secret": creds.client_secret,
        "scopes": creds.scopes,
    }
    TOKEN_PATH.write_text(json.dumps(data, indent=2))


def _load_credentials() -> Optional[Credentials]:
    if not TOKEN_PATH.exists():
        return None
    try:
        creds = Credentials.from_authorized_user_file(str(TOKEN_PATH), SCOPES)
        return creds
    except Exception:
        try:
            TOKEN_PATH.unlink()
        except Exception:
            pass
        return None


def get_credentials(force_reauth: bool = False) -> Credentials:
    creds = None if force_reauth else _load_credentials()

    if not creds:
        raise ReauthRequired("No local token.json; run OAuth consent flow.")

    if creds.expired and creds.refresh_token:
        try:
            creds.refresh(Request())
            _save_credentials(creds)
        except RefreshError as e:
            try:
                TOKEN_PATH.unlink()
            except Exception:
                pass
            raise ReauthRequired(f"Refresh failed ({e}); re-consent required.")

    if not creds.valid:
        raise ReauthRequired("Credentials invalid and cannot refresh; re-consent required.")

    return creds


def create_auth_url(redirect_uri: Optional[str] = None, state: Optional[str] = None) -> str:
    if not CLIENT_SECRETS_FILE.exists():
        raise FileNotFoundError(
            f"Missing {CLIENT_SECRETS_FILE}. Download OAuth client JSON (Web) and place it there."
        )

    ru = redirect_uri or DEFAULT_REDIRECT_URI

    flow = Flow.from_client_secrets_file(
        client_secrets_file=str(CLIENT_SECRETS_FILE),
        scopes=SCOPES,
        redirect_uri=ru,
    )
    # include_granted_scopes must be lowercase string "true"/"false"
    auth_url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
        state=state,
    )
    return auth_url


def exchange_code_for_credentials(code: str, redirect_uri: Optional[str] = None) -> Credentials:
    if not CLIENT_SECRETS_FILE.exists():
        raise FileNotFoundError(f"Missing {CLIENT_SECRETS_FILE}.")

    ru = redirect_uri or DEFAULT_REDIRECT_URI

    flow = Flow.from_client_secrets_file(
        client_secrets_file=str(CLIENT_SECRETS_FILE),
        scopes=SCOPES,
        redirect_uri=ru,
    )
    flow.fetch_token(code=code)
    creds = flow.credentials
    _save_credentials(creds)
    return creds


def get_drive(creds: Optional[Credentials] = None):
    if creds is None:
        creds = get_credentials()
    return build("drive", "v3", credentials=creds)


def list_photos(folder_id: Optional[str] = None, page_token: Optional[str] = None) -> Dict[str, Any]:
    """List image-like files (JPG/HEIC/etc.) from Drive."""
    service = get_drive()

    if folder_id:
        q = f"'{folder_id}' in parents and trashed = false and (mimeType contains 'image/')"
    else:
        q = "(mimeType contains 'image/') and trashed = false"

    fields = "files(id,name,mimeType,webViewLink,thumbnailLink,parents,createdTime,modifiedTime,size),nextPageToken"

    resp = service.files().list(
        q=q,
        fields=fields,
        pageSize=200,
        pageToken=page_token,
        supportsAllDrives=True,
        includeItemsFromAllDrives=True,
        spaces="drive",
        orderBy="name_natural",
    ).execute()

    return resp
