import os
from typing import Optional
from io import BytesIO

from fastapi import FastAPI, HTTPException, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, JSONResponse, StreamingResponse
from dotenv import load_dotenv
from PIL import Image
from googleapiclient.http import MediaIoBaseDownload

from google_drive_client import (
    ReauthRequired,
    create_auth_url,
    exchange_code_for_credentials,
    get_credentials,
    get_drive,
)

# Optional HEIC/HEIF support (recommended if you have iPhone photos)
try:
    import pillow_heif
    pillow_heif.register_heif_opener()
except Exception:
    pass

load_dotenv()  # loads backend/.env

app = FastAPI(title="Our Frame API")

# CORS for frontend on :3000 or :5173
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ROOT_FOLDER_ID = os.getenv("ROOT_FOLDER_ID")


@app.get("/")
def root():
    return {"ok": True, "service": "our-frame"}


# ---------- OAuth ----------
@app.get("/auth/start")
def auth_start():
    url = create_auth_url()
    return RedirectResponse(url)


@app.get("/auth/callback")
def auth_callback(request: Request):
    code = request.query_params.get("code")
    if not code:
        raise HTTPException(400, "Missing code")
    exchange_code_for_credentials(code)
    return JSONResponse({"ok": True, "message": "Authorization complete. You can close this tab."})


# ---------- Helpers ----------
def _drive():
    creds = get_credentials()
    return get_drive(creds)


def _reauth_json():
    return JSONResponse({"needsAuth": True, "authUrl": "/auth/start"}, status_code=401)


# ---------- Folder browsing ----------
@app.get("/drive/children")
def drive_children(parentId: Optional[str] = None, pageToken: Optional[str] = None):
    """
    Return subfolders and image files for a folder.
    If parentId omitted, uses ROOT_FOLDER_ID.
    """
    parent = parentId or ROOT_FOLDER_ID
    if not parent:
        raise HTTPException(400, "ROOT_FOLDER_ID not set and parentId missing")

    try:
        svc = _drive()
    except ReauthRequired:
        return _reauth_json()

    # Folders under parent
    q_folders = (
        f"'{parent}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false"
    )
    folders = svc.files().list(
        q=q_folders,
        fields="files(id,name,mimeType,parents,createdTime,modifiedTime),nextPageToken",
        pageSize=200,
        pageToken=pageToken,
        supportsAllDrives=True,
        includeItemsFromAllDrives=True,
        spaces="drive",
        orderBy="name_natural",
    ).execute()

    # Image files (JPG/HEIC/etc.) under parent
    q_files = f"'{parent}' in parents and (mimeType contains 'image/') and trashed = false"
    files = svc.files().list(
        q=q_files,
        fields=(
            "files("
            "id,name,mimeType,webViewLink,webContentLink,thumbnailLink,parents,"
            "createdTime,modifiedTime,size"
            "),nextPageToken"
        ),
        pageSize=200,
        pageToken=None,
        supportsAllDrives=True,
        includeItemsFromAllDrives=True,
        spaces="drive",
        orderBy="name_natural",
    ).execute()

    return {
        "parentId": parent,
        "folders": (folders or {}).get("files", []),
        "files": (files or {}).get("files", []),
        "nextPageToken": (folders or {}).get("nextPageToken"),
    }


# ---------- File streaming (inline preview & download) ----------
@app.get("/drive/file/{file_id}/content")
def drive_file_content(file_id: str):
    """
    Return the original file bytes inline with the correct mime type.
    Perfect for <img src="..."> in fullscreen preview.
    """
    try:
        svc = _drive()
    except ReauthRequired:
        return _reauth_json()

    meta = svc.files().get(fileId=file_id, fields="name,mimeType").execute()

    fh = BytesIO()
    request = svc.files().get_media(fileId=file_id)
    downloader = MediaIoBaseDownload(fh, request)
    done = False
    while not done:
        _, done = downloader.next_chunk()
    fh.seek(0)

    return StreamingResponse(fh, media_type=meta.get("mimeType", "application/octet-stream"))


@app.get("/drive/file/{file_id}/download")
def drive_file_download(file_id: str):
    """
    Force a browser download with a filename (attachment).
    """
    try:
        svc = _drive()
    except ReauthRequired:
        return _reauth_json()

    meta = svc.files().get(fileId=file_id, fields="name,mimeType").execute()
    name = meta.get("name", f"{file_id}.bin")
    mime = meta.get("mimeType", "application/octet-stream")

    fh = BytesIO()
    request = svc.files().get_media(fileId=file_id)
    downloader = MediaIoBaseDownload(fh, request)
    done = False
    while not done:
        _, done = downloader.next_chunk()
    fh.seek(0)

    headers = {"Content-Disposition": f'attachment; filename="{name}"'}
    return StreamingResponse(fh, media_type=mime, headers=headers)


# ---------- Image helpers for thumbnail/preview ----------
def _open_image(raw: bytes) -> Image.Image:
    img = Image.open(BytesIO(raw))
    img.load()
    return img


def _to_jpeg_bytes(img: Image.Image, quality: int = 85) -> BytesIO:
    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")
    buf = BytesIO()
    img.save(buf, format="JPEG", quality=quality, optimize=True)
    buf.seek(0)
    return buf


def _download_file_bytes(svc, file_id: str) -> bytes:  # ← fixed: str, not "string"
    fh = BytesIO()
    req = svc.files().get_media(fileId=file_id)
    dl = MediaIoBaseDownload(fh, req)
    done = False
    while not done:
        _, done = dl.next_chunk()
    fh.seek(0)
    return fh.getvalue()


@app.get("/drive/file/{file_id}/thumbnail")
def drive_thumbnail(file_id: str, s: int = Query(600, ge=64, le=2000)):
    """
    Small JPEG thumbnail for grid cards.
    """
    try:
        svc = _drive()
    except ReauthRequired:
        return _reauth_json()

    try:
        raw = _download_file_bytes(svc, file_id)
        img = _open_image(raw)
        img.thumbnail((s, s))
        buf = _to_jpeg_bytes(img, quality=80)
        headers = {"Cache-Control": "public, max-age=86400"}
        return StreamingResponse(buf, media_type="image/jpeg", headers=headers)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"thumbnail failed: {e}")


@app.get("/drive/file/{file_id}/preview")
def drive_preview(file_id: str, w: int = Query(1600, ge=400, le=4096)):
    """
    Resized JPEG for fast lightbox preview.
    """
    try:
        svc = _drive()
    except ReauthRequired:
        return _reauth_json()

    try:
        raw = _download_file_bytes(svc, file_id)
        img = _open_image(raw)
        if img.width > w and img.width > 0:
            h = round(img.height * (w / img.width))
            img = img.resize((w, h), Image.LANCZOS)
        buf = _to_jpeg_bytes(img, quality=85)
        headers = {"Cache-Control": "public, max-age=86400"}
        return StreamingResponse(buf, media_type="image/jpeg", headers=headers)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"preview failed: {e}")
