# backend/responses.py

"""
Utility responses for OAuth reauthentication.
Your Google Drive API endpoints use this when the user's token is expired.

Functions:
    reauth_json(auth_url: str) -> dict
"""

from typing import Optional


def reauth_json(auth_url: Optional[str] = None):
    """
    Return a JSON object that tells the frontend it must reauthenticate.

    Your frontend checks this and does:
        if (data.needsAuth && data.authUrl) window.location.href = data.authUrl

    The backend should supply an OAuth URL for the user to visit.
    """
    return {
        "needsAuth": True,
        "authUrl": auth_url or "/auth/login",  # fallback if you don't pass one
    }
