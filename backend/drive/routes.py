# backend/drive/routes.py

from typing import Optional
import os
import logging
import time
import mimetypes
from io import BytesIO

from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import StreamingResponse, Response
from googleapiclient.errors import HttpError
from PIL import Image

from config import ROOT_FOLDER_ID as CONFIG_ROOT_ID
from .service import get_drive_service, download_file_bytes, ReauthRequired
from .image_utils import open_image, to_jpeg_bytes
from responses import reauth_json

logger = logging.getLogger(__name__)


def _download_with_retry(svc, file_id: str, max_attempts: int = 3) -> bytes:
    """
    Download file bytes from Drive with retry on transient errors (429, 500, 503).
    Raises HttpError if all attempts fail.
    """
    last_exc = None
    for attempt in range(1, max_attempts + 1):
        try:
            return download_file_bytes(svc, file_id)
        except HttpError as e:
            status = e.resp.status if hasattr(e, 'resp') else 0
            if status in (429, 500, 503) and attempt < max_attempts:
                wait = 2 ** (attempt - 1)  # 1s, 2s backoff
                logger.warning(
                    "[drive] transient error %s for file_id=%s attempt=%d/%d — retrying in %ds",
                    status, file_id, attempt, max_attempts, wait,
                )
                time.sleep(wait)
                last_exc = e
                continue
            raise
    raise last_exc  # type: ignore[misc]

router = APIRouter()

# Root Google Drive folder:
# 1. Try GOOGLE_DRIVE_ROOT_FOLDER from env
# 2. else use config.ROOT_FOLDER_ID
# 3. else fall back to "root"
ROOT_FOLDER_ID = os.getenv("GOOGLE_DRIVE_ROOT_FOLDER", CONFIG_ROOT_ID or "root")


def _ensure_drive():
  """
  Helper to get an authenticated Drive service or return a reauth JSON.

  Frontend can check:
    if (data.needsAuth && data.authUrl) window.location.href = API(data.authUrl)
  """
  try:
    svc = get_drive_service()
    return svc, None
  except ReauthRequired:
    return None, reauth_json()


# ---------------------------
# GET /drive/children
# ---------------------------

@router.get("/children")
def list_children(parentId: Optional[str] = None):
  """
  Returns folders + image/video files under a parent folder.

  Response shape:
    {
      "parentId": string,
      "folders": [{ id, name }],
      "files":   [{ id, name, mimeType, ... }]
    }
  """
  svc, reauth = _ensure_drive()
  if reauth is not None:
    return reauth

  parent_id = parentId or ROOT_FOLDER_ID
  if not parent_id:
    raise HTTPException(400, "ROOT_FOLDER_ID not set and parentId missing")

  q = (
    f"'{parent_id}' in parents and trashed = false and ("
    "mimeType = 'application/vnd.google-apps.folder' OR "
    "mimeType CONTAINS 'image/' OR "
    "mimeType CONTAINS 'video/'"
    ")"
  )

  fields = (
    "files("
    "id,name,mimeType,webViewLink,thumbnailLink,parents,"
    "createdTime,modifiedTime,size,imageMediaMetadata,videoMediaMetadata"
    "),nextPageToken"
  )

  try:
    resp = (
      svc.files()
      .list(
        q=q,
        fields=fields,
        pageSize=200,
        supportsAllDrives=True,
        includeItemsFromAllDrives=True,
        orderBy="name_natural",
        spaces="drive",
      )
      .execute()
    )
  except HttpError as e:
    raise HTTPException(status_code=502, detail=f"Drive error: {e}")

  files = resp.get("files", [])

  folders: list[dict] = []
  photos: list[dict] = []

  for f in files:
    mime = f.get("mimeType", "")
    if mime == "application/vnd.google-apps.folder":
      folders.append(
        {
          "id": f["id"],
          "name": f.get("name", ""),
        }
      )
    elif mime.startswith("image/") or mime.startswith("video/"):
      photos.append(
        {
          "id": f["id"],
          "name": f.get("name", ""),
          "mimeType": mime,
          "webViewLink": f.get("webViewLink"),
          "thumbnailLink": f.get("thumbnailLink"),
          "createdTime": f.get("createdTime"),
          "modifiedTime": f.get("modifiedTime"),
          "size": f.get("size"),
          "imageMediaMetadata": f.get("imageMediaMetadata"),
          "videoMediaMetadata": f.get("videoMediaMetadata"),
        }
      )

  return {
    "parentId": parent_id,
    "folders": folders,
    "files": photos,
  }


# ---------------------------
# GET /drive/file/{id}/thumbnail?s=600
# ---------------------------

@router.get("/file/{file_id}/thumbnail")
def thumbnail(file_id: str, s: int = Query(600, ge=64, le=2000)):
  """
  Returns a JPEG thumbnail (max size s×s) for a Drive image file.
  Only called for image files — video files have thumbnail_url=None
  and are served via /stream instead.

  HEIC/HEIF & other formats are handled via open_image(), which should
  be configured with pillow-heif in drive/image_utils.py.
  """
  svc, reauth = _ensure_drive()
  if reauth is not None:
    return reauth

  logger.debug("[drive] thumbnail request file_id=%s size=%d", file_id, s)

  try:
    raw = _download_with_retry(svc, file_id)
  except HttpError as e:
    logger.error("[drive] thumbnail download FAILED file_id=%s error=%s", file_id, e)
    raise HTTPException(status_code=502, detail=f"Drive download error: {e}")

  try:
    img = open_image(raw)
    img.thumbnail((s, s))
    jpeg_bytes = to_jpeg_bytes(img, quality=80)
  except Exception as e:
    logger.error("[drive] thumbnail processing FAILED file_id=%s error=%s", file_id, e)
    raise HTTPException(status_code=500, detail=f"thumbnail failed: {e}")

  logger.debug("[drive] thumbnail OK file_id=%s", file_id)
  return StreamingResponse(
    jpeg_bytes,
    media_type="image/jpeg",
    headers={"Cache-Control": "public, max-age=31536000"},
  )


# ---------------------------
# GET /drive/file/{id}/preview?w=1600
# ---------------------------

@router.get("/file/{file_id}/preview")
def preview(file_id: str, w: int = Query(1600, ge=400, le=4096)):
  """
  Larger JPEG preview for the lightbox.
  Frontend calls previewUrl(photo.id, 1600) for this.

  HEIC/HEIF & other formats are handled via open_image().
  """
  svc, reauth = _ensure_drive()
  if reauth is not None:
    return reauth

  logger.debug("[drive] preview request file_id=%s width=%d", file_id, w)

  try:
    raw = _download_with_retry(svc, file_id)
  except HttpError as e:
    logger.error("[drive] preview download FAILED file_id=%s error=%s", file_id, e)
    raise HTTPException(status_code=502, detail=f"Drive download error: {e}")

  try:
    img = open_image(raw)
    if img.width > w and img.width > 0:
      h = round(img.height * (w / img.width))
      img = img.resize((w, h), Image.LANCZOS)
    jpeg_bytes = to_jpeg_bytes(img, quality=85)
  except Exception as e:
    logger.error("[drive] preview processing FAILED file_id=%s mime_hint=%s error=%s",
                 file_id, _sniff_format(raw[:16]), e)
    raise HTTPException(status_code=500, detail=f"preview failed: {e}")

  logger.debug("[drive] preview OK file_id=%s", file_id)
  return StreamingResponse(
    jpeg_bytes,
    media_type="image/jpeg",
    headers={"Cache-Control": "public, max-age=31536000"},
  )


def _sniff_format(header: bytes) -> str:
  """Return a quick file-format hint from the first 16 bytes (for logging)."""
  if header[:4] == b'\x00\x00\x00\x18' or header[4:8] in (b'ftyp', b'heic', b'heix', b'mif1'):
    return "heic/heif"
  if header[:8] == b'\x89PNG\r\n\x1a\n':
    return "png"
  if header[:3] == b'\xff\xd8\xff':
    return "jpeg"
  if header[:4] in (b'RIFF', b'WEBP'):
    return "webp"
  if header[:2] in (b'BM',):
    return "bmp"
  return f"unknown({header[:4].hex()})"


# ---------------------------
# GET /drive/file/{id}/content
# ---------------------------

@router.get("/file/{file_id}/content")
def file_content(file_id: str):
  """
  Raw file bytes. Your frontend uses this as a fallback src in some cases.
  """
  svc, reauth = _ensure_drive()
  if reauth is not None:
    return reauth

  try:
    raw = download_file_bytes(svc, file_id)
  except HttpError as e:
    raise HTTPException(status_code=502, detail=f"Drive download error: {e}")

  return StreamingResponse(
    BytesIO(raw),
    media_type="application/octet-stream",
  )


# ---------------------------
# GET /drive/file/{id}/download
# ---------------------------

@router.get("/file/{file_id}/download")
def download(file_id: str):
  """
  Download the original file (used by the Download button in Gallery).
  """
  svc, reauth = _ensure_drive()
  if reauth is not None:
    return reauth

  try:
    meta = svc.files().get(fileId=file_id, fields="name,mimeType").execute()
    raw = download_file_bytes(svc, file_id)
  except HttpError as e:
    raise HTTPException(status_code=502, detail=f"Drive download error: {e}")

  filename = meta.get("name", "download")
  mime = meta.get("mimeType", "application/octet-stream")

  return StreamingResponse(
    BytesIO(raw),
    media_type=mime,
    headers={
      "Content-Disposition": f'attachment; filename="{filename}"'
    },
  )


# ---------------------------
# GET /drive/file/{id}/stream
# ---------------------------

@router.get("/file/{file_id}/stream")
def stream_video(file_id: str, request: Request):
  """
  Stream a video file with HTTP range request support so browsers can
  seek, scrub, and play without downloading the whole file first.
  """
  svc, reauth = _ensure_drive()
  if reauth is not None:
    return reauth

  try:
    meta = svc.files().get(fileId=file_id, fields="name,mimeType,size").execute()
    raw = download_file_bytes(svc, file_id)
  except HttpError as e:
    raise HTTPException(status_code=502, detail=f"Drive download error: {e}")

  mime = meta.get("mimeType", "video/mp4")
  total = len(raw)

  range_header = request.headers.get("range")
  if range_header:
    # Parse "bytes=start-end"
    try:
      byte_range = range_header.replace("bytes=", "").strip()
      start_str, end_str = byte_range.split("-")
      start = int(start_str)
      end = int(end_str) if end_str else total - 1
    except Exception:
      raise HTTPException(status_code=400, detail="Invalid Range header")

    end = min(end, total - 1)
    chunk = raw[start : end + 1]
    return Response(
      content=chunk,
      status_code=206,
      media_type=mime,
      headers={
        "Content-Range": f"bytes {start}-{end}/{total}",
        "Accept-Ranges": "bytes",
        "Content-Length": str(len(chunk)),
        "Cache-Control": "public, max-age=3600",
      },
    )

  return Response(
    content=raw,
    status_code=200,
    media_type=mime,
    headers={
      "Accept-Ranges": "bytes",
      "Content-Length": str(total),
      "Cache-Control": "public, max-age=3600",
    },
  )
