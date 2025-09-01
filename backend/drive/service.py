from io import BytesIO
from googleapiclient.http import MediaIoBaseDownload
from google_drive_client import get_credentials, get_drive

class ReauthRequired(Exception):
    """Raised when Google Drive credentials are missing or expired."""

def get_drive_service():
    """Return an authenticated Google Drive service client."""
    creds = get_credentials()
    if not creds:
        raise ReauthRequired("Google Drive credentials required")
    return get_drive(creds)

def download_file_bytes(svc, file_id: str) -> bytes:
    """Download a file’s raw bytes from Google Drive."""
    fh = BytesIO()
    req = svc.files().get_media(fileId=file_id)
    dl = MediaIoBaseDownload(fh, req)
    done = False
    while not done:
        _, done = dl.next_chunk()
    fh.seek(0)
    return fh.getvalue()
