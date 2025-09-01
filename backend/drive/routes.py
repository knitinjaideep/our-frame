from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from io import BytesIO

from config import ROOT_FOLDER_ID
from drive.service import get_drive_service, download_file_bytes, ReauthRequired
from drive.image_utils import open_image, to_jpeg_bytes
from utils.responses import reauth_json

router = APIRouter()

# ---------- Folder browsing ----------
@router.get("/children")
def drive_children(parentId: Optional[str] = None, pageToken: Optional[str] = None):
    """
    Return subfolders and image files for a folder.
    If parentId omitted, uses ROOT_FOLDER_ID.
    """
    parent = parentId or ROOT_FOLDER_ID
    if not parent:
        raise HTTPException(400, "ROOT_FOLDER_ID not set and parentId missing")

    try:
        svc = get_drive_service()
    except ReauthRequired:
        return reauth_json()

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


# ---------- File streaming ----------
@router.get("/file/{file_id}/content")
def drive_file_content(file_id: str):
    """
    Return the original file bytes inline with the correct mime type.
    Perfect for <img src="..."> in fullscreen preview.
    """
    try:
        svc = get_drive_service()
    except ReauthRequired:
        return reauth_json()

    meta = svc.files().get(fileId=file_id, fields="name,mimeType").execute()

    raw = download_file_bytes(svc, file_id)
    fh = BytesIO(raw)

    return StreamingResponse(fh, media_type=meta.get("mimeType", "application/octet-stream"))


@router.get("/file/{file_id}/download")
def drive_file_download(file_id: str):
    """
    Force a browser download with a filename (attachment).
    """
    try:
        svc = get_drive_service()
    except ReauthRequired:
        return reauth_json()

    meta = svc.files().get(fileId=file_id, fields="name,mimeType").execute()
    name = meta.get("name", f"{file_id}.bin")
    mime = meta.get("mimeType", "application/octet-stream")

    raw = download_file_bytes(svc, file_id)
    fh = BytesIO(raw)

    headers = {"Content-Disposition": f'attachment; filename="{name}"'}
    return StreamingResponse(fh, media_type=mime, headers=headers)


# ---------- Image thumbnails & previews ----------
@router.get("/file/{file_id}/thumbnail")
def drive_thumbnail(file_id: str, s: int = Query(600, ge=64, le=2000)):
    """
    Small JPEG thumbnail for grid cards.
    """
    try:
        svc = get_drive_service()
    except ReauthRequired:
        return reauth_json()

    try:
        raw = download_file_bytes(svc, file_id)
        img = open_image(raw)
        img.thumbnail((s, s))
        buf = to_jpeg_bytes(img, quality=80)
        headers = {"Cache-Control": "public, max-age=86400"}
        return StreamingResponse(buf, media_type="image/jpeg", headers=headers)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"thumbnail failed: {e}")


@router.get("/file/{file_id}/preview")
def drive_preview(file_id: str, w: int = Query(1600, ge=400, le=4096)):
    """
    Resized JPEG for fast lightbox preview.
    """
    try:
        svc = get_drive_service()
    except ReauthRequired:
        return reauth_json()

    try:
        raw = download_file_bytes(svc, file_id)
        img = open_image(raw)
        if img.width > w and img.width > 0:
            h = round(img.height * (w / img.width))
            img = img.resize((w, h), Image.LANCZOS)
        buf = to_jpeg_bytes(img, quality=85)
        headers = {"Cache-Control": "public, max-age=86400"}
        return StreamingResponse(buf, media_type="image/jpeg", headers=headers)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"preview failed: {e}")
