"""
Drive service: wraps google_drive_client with caching and clean error handling.
Returns typed dicts; callers turn them into DB models or schemas as needed.
"""
from __future__ import annotations

from typing import Optional
from googleapiclient.errors import HttpError

from core.exceptions import ReauthRequired, DriveError
from google_drive_client import get_credentials, get_drive as _build_drive_client


_IMAGE_MIME_FILTER = (
    "mimeType = 'application/vnd.google-apps.folder' OR "
    "mimeType CONTAINS 'image/' OR "
    "mimeType CONTAINS 'video/'"
)

_FILE_FIELDS = (
    "files("
    "id,name,mimeType,webViewLink,thumbnailLink,parents,"
    "createdTime,modifiedTime,size,imageMediaMetadata"
    "),nextPageToken"
)


def get_drive_client():
    creds = get_credentials()
    if not creds:
        raise ReauthRequired("No credentials available")
    return _build_drive_client(creds)


def list_children(parent_id: str) -> dict:
    """
    Returns { folders: [...], files: [...] } from Drive.
    Raises ReauthRequired or DriveError.
    """
    try:
        svc = get_drive_client()
    except Exception:
        raise ReauthRequired("Drive credentials missing or expired")

    q = f"'{parent_id}' in parents and trashed = false and ({_IMAGE_MIME_FILTER})"

    try:
        resp = (
            svc.files()
            .list(
                q=q,
                fields=_FILE_FIELDS,
                pageSize=200,
                supportsAllDrives=True,
                includeItemsFromAllDrives=True,
                orderBy="name_natural",
                spaces="drive",
            )
            .execute()
        )
    except HttpError as e:
        raise DriveError(f"Drive API error: {e}")

    files = resp.get("files", [])
    folders = []
    photos = []

    for f in files:
        mime = f.get("mimeType", "")
        if mime == "application/vnd.google-apps.folder":
            folders.append({"id": f["id"], "name": f.get("name", "")})
        elif mime.startswith("image/") or mime.startswith("video/"):
            meta = f.get("imageMediaMetadata") or {}
            photos.append(
                {
                    "id": f["id"],
                    "name": f.get("name", ""),
                    "mimeType": mime,
                    "webViewLink": f.get("webViewLink"),
                    "createdTime": f.get("createdTime"),
                    "modifiedTime": f.get("modifiedTime"),
                    "size": f.get("size"),
                    "width": meta.get("width"),
                    "height": meta.get("height"),
                }
            )

    return {"parent_id": parent_id, "folders": folders, "files": photos}
