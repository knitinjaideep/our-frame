"""
Auth service — per-user Google OAuth + session management.

Session flow:
1. GET /api/auth/google/start  → redirect to Google consent
2. Google → GET /api/auth/google/callback?code=...&state=...
3. Exchange code → get user info → upsert User → create UserSession
4. Set HttpOnly session cookie → redirect to frontend

Session cookie: "of_session" — HttpOnly, SameSite=Lax, Secure in production.
"""
from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from sqlmodel import Session, select

from core.config import settings
from models.user import User
from models.session import UserSession

SESSION_COOKIE = "of_session"

# Identity scopes for login (no Drive access — that's a separate flow)
AUTH_SCOPES = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
]


def _login_redirect_uri() -> str:
    # e.g. http://localhost:8000/api/auth/google/callback
    return settings.google_oauth_redirect.replace("/auth/callback", "/api/auth/google/callback")


def build_login_flow(state: Optional[str] = None) -> Flow:
    """Build a Flow for user login (identity only — no Drive scope yet)."""
    if not settings.google_client_id or not settings.google_client_secret:
        raise ValueError("Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.")

    redirect_uri = _login_redirect_uri()
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
        scopes=AUTH_SCOPES,
        redirect_uri=redirect_uri,
        state=state,
    )


def get_google_user_info(credentials) -> dict:
    """Fetch user profile from Google using the login credentials."""
    service = build("oauth2", "v2", credentials=credentials)
    return service.userinfo().get().execute()


def upsert_user(db: Session, google_info: dict) -> User:
    """Create or update a User from Google identity data."""
    google_sub = google_info.get("id") or google_info.get("sub", "")
    email = google_info.get("email", "")

    # Try by google_sub first (stable), fall back to email
    user = db.exec(select(User).where(User.google_sub == google_sub)).first()
    if not user and email:
        user = db.exec(select(User).where(User.email == email)).first()

    now = datetime.now(timezone.utc)

    if user:
        user.display_name = google_info.get("name") or user.display_name
        user.avatar_url = google_info.get("picture") or user.avatar_url
        user.google_sub = google_sub or user.google_sub
        user.updated_at = now
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        user = User(
            email=email,
            display_name=google_info.get("name"),
            avatar_url=google_info.get("picture"),
            google_sub=google_sub,
            auth_provider="google",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return user


def create_session(db: Session, user_id: int) -> UserSession:
    """Create a new server-side session for a user."""
    token = secrets.token_urlsafe(64)
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=settings.session_ttl_seconds)
    session = UserSession(
        session_token=token,
        user_id=user_id,
        expires_at=expires_at,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def get_session_by_token(db: Session, token: str) -> Optional[UserSession]:
    """Return a valid (non-expired) session or None."""
    sess = db.exec(select(UserSession).where(UserSession.session_token == token)).first()
    if not sess:
        return None
    expires = sess.expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if expires < datetime.now(timezone.utc):
        db.delete(sess)
        db.commit()
        return None
    return sess


def delete_session(db: Session, token: str) -> None:
    sess = db.exec(select(UserSession).where(UserSession.session_token == token)).first()
    if sess:
        db.delete(sess)
        db.commit()


def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    return db.get(User, user_id)
