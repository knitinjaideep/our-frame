from __future__ import annotations

import logging
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

from fastapi import HTTPException
from fastapi.responses import FileResponse, RedirectResponse, Response
from google.auth.transport.requests import AuthorizedSession
from google.oauth2.credentials import Credentials
from sqlmodel import Session

from core.config import settings
from drive.image_utils import open_image, to_jpeg_bytes
from drive.service import download_file_bytes, get_drive_service
from google_drive_client import get_credentials
from models.media import MediaDerivative, MediaItem
from repositories import media_repo
from services import media_storage_service, workspace_service
from services.drive_connect_service import get_drive_service_for_workspace, load_drive_credentials


logger = logging.getLogger(__name__)

PHOTO_DERIVATIVE_SIZES = {
    "thumbnail": 400,
    "grid": 900,
    "preview": 1800,
}
VIDEO_POSTER_KIND = "poster"
VIDEO_POSTER_SIZE = 900
VIDEO_PLAYBACK_KIND = "playback"
VIDEO_PLAYBACK_HEIGHT = 720

# Kinds cheap enough to source from Google's pre-rendered CDN thumbnail
# instead of downloading and decoding the full original. "preview" is
# intentionally excluded — the lightbox wants full-original quality, and
# it's only paid when a user actually opens an image.
_CDN_THUMBNAIL_ELIGIBLE_KINDS = ("thumbnail", "grid")
# Cap how large a size we'll ask Google's CDN to render, regardless of the
# 2x request multiplier below.
_DRIVE_THUMBNAIL_SIZE_CAP = 2048
# The CDN fetch is a best-effort shortcut with a full-original fallback behind
# it, so it gets a tighter timeout than the poster path: a hung CDN request
# must not eat the whole serverless request budget before the fallback starts.
_DRIVE_THUMBNAIL_SHORTCUT_TIMEOUT = 10

# Google Drive thumbnail links end in a resize parameter, e.g. "...=s220" or
# "...=s220-c" (the "-c" requests a center-cropped square). Matches only at
# the end of the URL so we don't rewrite anything that isn't in this exact
# resizable form.
_DRIVE_THUMBNAIL_SIZE_RE = re.compile(r"=s\d+(-c)?$")


def _cache_root() -> Path:
    root = Path(settings.media_cache_root)
    if not root.is_absolute():
        root = Path(__file__).resolve().parent.parent / root
    return root


def _safe_segment(value: str) -> str:
    return re.sub(r"[^A-Za-z0-9_.-]", "_", value)


def _error_detail(exc: Exception) -> str:
    return str(exc)[:500]


def _drive_service_for(session: Session, media: MediaItem):
    """
    Resolve a Drive service for this media item.

    Workspace-scoped items use the workspace's DB-stored DriveConnection —
    the only credential source that works on read-only/serverless hosts.
    Legacy rows (workspace_id is None) fall back to the token.json client
    so local development keeps working unchanged.
    """
    if media.workspace_id is not None:
        return get_drive_service_for_workspace(session, media.workspace_id)
    return get_drive_service()


def _storage_key(media: MediaItem, kind: str) -> str:
    if media.id is None:
        raise ValueError("Media item has no primary key")
    folder = "videos" if media.media_type == "video" else "photos"
    extension = "mp4" if kind == VIDEO_PLAYBACK_KIND else "jpg"
    return f"{folder}/{media.id}-{_safe_segment(media.drive_file_id)}/{kind}.{extension}"


def _path_for_key(storage_key: str) -> Path:
    return _cache_root() / storage_key


def derivative_path(derivative: MediaDerivative) -> Path:
    if derivative.storage_backend != "local":
        raise ValueError(f"Unsupported derivative storage backend: {derivative.storage_backend}")
    return _path_for_key(derivative.storage_key)


# A cached redirect must expire before the signed URL it points at, otherwise a
# browser could reuse a redirect whose target has already expired.
_SIGNED_REDIRECT_MAX_AGE = max(media_storage_service.SIGNED_URL_TTL_SECONDS - 60, 0)


def build_derivative_response(derivative: MediaDerivative) -> Response:
    """
    Build the HTTP response that serves a ready derivative's bytes.

    Local derivatives are streamed directly from disk. Supabase-backed
    derivatives are served via a short-lived redirect to a signed URL so
    the Supabase CDN handles Range requests and large payloads instead of
    proxying bytes through the app server.
    """
    if derivative.storage_backend == "local":
        return FileResponse(
            derivative_path(derivative),
            media_type=derivative.content_type,
            headers={"Cache-Control": "private, max-age=31536000, immutable"},
        )
    if derivative.storage_backend == "supabase":
        try:
            url = media_storage_service.create_signed_url(derivative.storage_key)
        except RuntimeError as exc:
            raise HTTPException(status_code=502, detail=f"Could not create signed URL: {exc}") from exc
        # Short private cache so a grid re-render reuses the redirect instead of
        # issuing a fresh Supabase sign round trip per thumbnail per page view.
        return RedirectResponse(
            url,
            status_code=307,
            headers={"Cache-Control": f"private, max-age={_SIGNED_REDIRECT_MAX_AGE}"},
        )
    raise HTTPException(
        status_code=500,
        detail=f"Unsupported derivative storage backend: {derivative.storage_backend}",
    )


def _persist_derivative(output_key: str, data: bytes, content_type: str) -> int:
    """
    Persist final derivative bytes according to the configured storage backend
    and return the byte size that was persisted.
    """
    if settings.media_storage_backend == "local":
        output_path = _path_for_key(output_key)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_bytes(data)
        return output_path.stat().st_size
    if settings.media_storage_backend == "supabase":
        media_storage_service.upload_derivative_bytes(output_key, data, content_type)
        return len(data)
    raise ValueError(f"Unsupported media storage backend: {settings.media_storage_backend}")


def _ready_existing_derivative(
    session: Session,
    media: MediaItem,
    kind: str,
) -> MediaDerivative | None:
    derivative = media_repo.get_derivative(session, media.id, kind) if media.id else None
    if not derivative or derivative.status != "ready":
        return None
    if derivative.storage_backend == "local":
        return derivative if derivative_path(derivative).exists() else None
    # Non-local backends (e.g. supabase) are trusted based on status alone —
    # an existence check would cost a network round trip on every cache hit.
    return derivative


def _all_photo_derivatives_ready(session: Session, media: MediaItem) -> bool:
    if media.id is None:
        return False
    return all(_ready_existing_derivative(session, media, kind) for kind in PHOTO_DERIVATIVE_SIZES)


def _drive_thumbnail_url_at_size(thumbnail_url: str, size: int) -> str | None:
    """
    Google's Drive thumbnail links end in a resize parameter (e.g. "=s220").
    Swapping that for a larger value returns a pre-rendered JPEG from Google's
    CDN — far cheaper than downloading and decoding the original, and it
    sidesteps HEIC decoding entirely since Google always returns JPEG.
    Returns None when the URL isn't in the expected resizable form.

    Note this drops a trailing "-c" (center-crop-to-square) suffix rather
    than preserving it: our photo derivatives fit the source's original
    aspect ratio inside a max_size x max_size box (see
    `_write_photo_derivative`), so a pre-cropped square source would
    silently lose part of the image instead of just being downscaled.
    """
    if not thumbnail_url or not _DRIVE_THUMBNAIL_SIZE_RE.search(thumbnail_url):
        return None
    return _DRIVE_THUMBNAIL_SIZE_RE.sub(f"=s{size}", thumbnail_url)


def _url_free_error_summary(exc: Exception) -> str:
    """
    Short, URL-free description of a failed HTTP call, safe to log.

    `str(exc)` is deliberately not used here: requests/urllib3 error messages
    embed the full request URL, and Drive thumbnail links are private media
    URLs that must never reach the logs.
    """
    status = getattr(getattr(exc, "response", None), "status_code", None)
    if status is not None:
        return f"{type(exc).__name__} status={status}"
    return type(exc).__name__


def _photo_source_bytes_for_kind(session: Session, media: MediaItem, kind: str) -> bytes:
    """
    Choose the cheapest reliable source of raw image bytes for `kind`.

    thumbnail/grid: prefer Google's pre-rendered CDN thumbnail JPEG, requested
    at roughly 2x the final derivative size (capped). The extra pixels are not
    for the browser — `_write_photo_derivative` still caps output at the
    configured size — they give the downscale enough source detail to average
    away the CDN JPEG's own compression artifacts. Falls back to the full
    original when the stored thumbnail URL isn't in the expected resizable
    form, or when the CDN fetch fails for any reason (e.g. an expired or
    unauthorized link) — the fallback must always succeed independent of the
    CDN shortcut.

    preview: always uses the full original. This is the lightbox image, and
    it's now only paid when a user opens it, not on every grid render.
    """
    if kind in _CDN_THUMBNAIL_ELIGIBLE_KINDS:
        target_size = min(PHOTO_DERIVATIVE_SIZES[kind] * 2, _DRIVE_THUMBNAIL_SIZE_CAP)
        cdn_url = _drive_thumbnail_url_at_size(media.drive_thumbnail_url or "", target_size)
        if cdn_url:
            try:
                return _download_drive_thumbnail(
                    session,
                    media,
                    cdn_url,
                    timeout=_DRIVE_THUMBNAIL_SHORTCUT_TIMEOUT,
                )
            except Exception as exc:
                # Fall through to the full-original download below. Log enough
                # to notice systematic CDN breakage (which would otherwise show
                # up only as unexplained slowness) without emitting the private
                # thumbnail URL or anything derived from it.
                logger.warning(
                    "photo derivative: Drive CDN thumbnail fetch failed "
                    "(media_id=%s kind=%s error=%s); falling back to full original",
                    media.id,
                    kind,
                    _url_free_error_summary(exc),
                )

    svc = _drive_service_for(session, media)
    return download_file_bytes(svc, media.drive_file_id)


def _write_photo_derivative(media: MediaItem, kind: str, raw: bytes) -> tuple[str, int, int, int]:
    img = open_image(raw)
    max_size = PHOTO_DERIVATIVE_SIZES[kind]
    if img.width > max_size or img.height > max_size:
        img.thumbnail((max_size, max_size))

    jpeg = to_jpeg_bytes(img, quality=82 if kind == "thumbnail" else 86)
    data = jpeg.getvalue()
    output_key = _storage_key(media, kind)
    size = _persist_derivative(output_key, data, "image/jpeg")
    return output_key, img.width, img.height, size


def _write_video_poster(media: MediaItem, raw: bytes) -> tuple[str, int, int, int]:
    img = open_image(raw)
    if img.width > VIDEO_POSTER_SIZE or img.height > VIDEO_POSTER_SIZE:
        img.thumbnail((VIDEO_POSTER_SIZE, VIDEO_POSTER_SIZE))

    jpeg = to_jpeg_bytes(img, quality=84)
    data = jpeg.getvalue()
    output_key = _storage_key(media, VIDEO_POSTER_KIND)
    size = _persist_derivative(output_key, data, "image/jpeg")
    return output_key, img.width, img.height, size


def _drive_credentials_for(session: Session, media: MediaItem) -> Credentials:
    """Credentials matching `_drive_service_for`, for direct Drive HTTP calls."""
    if media.workspace_id is not None:
        conn = workspace_service.get_drive_connection(session, media.workspace_id)
        if not conn or conn.connection_status != "active":
            raise ValueError(f"Workspace {media.workspace_id} has no active Drive connection")
        return load_drive_credentials(conn)
    return get_credentials()


def _download_drive_thumbnail(
    session: Session,
    media: MediaItem,
    thumbnail_url: str,
    *,
    timeout: int = 30,
) -> bytes:
    creds = _drive_credentials_for(session, media)
    # AuthorizedSession refreshes an expired access token before sending. The
    # stored workspace access token is usually stale by the time a poster is
    # generated, so a raw Bearer header would 401 and fail the derivative.
    response = AuthorizedSession(creds).get(thumbnail_url, timeout=timeout)
    response.raise_for_status()
    return response.content


def _extract_video_poster_with_ffmpeg(session: Session, media: MediaItem) -> bytes:
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise RuntimeError("ffmpeg is not installed; cannot generate video poster")

    svc = _drive_service_for(session, media)
    video_bytes = download_file_bytes(svc, media.drive_file_id)
    with tempfile.TemporaryDirectory() as tmp:
        source = Path(tmp) / "source"
        poster = Path(tmp) / "poster.jpg"
        source.write_bytes(video_bytes)
        result = subprocess.run(
            [
                ffmpeg,
                "-hide_banner",
                "-loglevel",
                "error",
                "-y",
                "-ss",
                "1",
                "-i",
                str(source),
                "-frames:v",
                "1",
                "-vf",
                f"scale='min({VIDEO_POSTER_SIZE},iw)':-2",
                str(poster),
            ],
            capture_output=True,
            text=True,
            timeout=120,
            check=False,
        )
        if result.returncode != 0:
            detail = (result.stderr or result.stdout or "ffmpeg poster extraction failed").strip()
            raise RuntimeError(detail[:500])
        return poster.read_bytes()


def _probe_video_dimensions(path: Path) -> tuple[int | None, int | None]:
    ffprobe = shutil.which("ffprobe")
    if not ffprobe:
        return None, None

    result = subprocess.run(
        [
            ffprobe,
            "-v",
            "error",
            "-select_streams",
            "v:0",
            "-show_entries",
            "stream=width,height",
            "-of",
            "csv=s=x:p=0",
            str(path),
        ],
        capture_output=True,
        text=True,
        timeout=30,
        check=False,
    )
    if result.returncode != 0:
        return None, None
    value = result.stdout.strip()
    if "x" not in value:
        return None, None
    width, height = value.split("x", 1)
    try:
        return int(width), int(height)
    except ValueError:
        return None, None


def _transcode_video_to_mp4(session: Session, media: MediaItem) -> tuple[str, int | None, int | None, int]:
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise RuntimeError("ffmpeg is not installed; cannot generate MP4 playback derivative")

    svc = _drive_service_for(session, media)
    video_bytes = download_file_bytes(svc, media.drive_file_id)
    output_key = _storage_key(media, VIDEO_PLAYBACK_KIND)

    with tempfile.TemporaryDirectory() as tmp:
        source = Path(tmp) / "source"
        transcoded = Path(tmp) / "playback.mp4"
        source.write_bytes(video_bytes)
        result = subprocess.run(
            [
                ffmpeg,
                "-hide_banner",
                "-loglevel",
                "error",
                "-y",
                "-i",
                str(source),
                "-map",
                "0:v:0",
                "-map",
                "0:a?",
                "-vf",
                f"scale=-2:'min({VIDEO_PLAYBACK_HEIGHT},trunc(ih/2)*2)'",
                "-c:v",
                "libx264",
                "-preset",
                "veryfast",
                "-crf",
                "23",
                "-pix_fmt",
                "yuv420p",
                "-c:a",
                "aac",
                "-b:a",
                "128k",
                "-movflags",
                "+faststart",
                str(transcoded),
            ],
            capture_output=True,
            text=True,
            timeout=900,
            check=False,
        )
        if result.returncode != 0:
            detail = (result.stderr or result.stdout or "ffmpeg MP4 transcode failed").strip()
            raise RuntimeError(detail[:500])

        width, height = _probe_video_dimensions(transcoded)
        data = transcoded.read_bytes()

    size = _persist_derivative(output_key, data, "video/mp4")
    return output_key, width, height, size


def get_or_create_photo_derivative_for_media(
    session: Session,
    media: MediaItem,
    kind: str,
) -> MediaDerivative:
    """
    Return a cached photo derivative, generating it on first request.

    Phase 3 intentionally keeps this request-triggered; Phase 6 moves work into
    a processing queue while preserving this cache-first read path.
    """
    if kind not in PHOTO_DERIVATIVE_SIZES:
        raise HTTPException(status_code=404, detail=f"Unsupported photo derivative kind: {kind}")

    if media.media_type != "image":
        raise HTTPException(status_code=400, detail="Photo derivative requested for non-image media")
    if media.id is None:
        raise HTTPException(status_code=500, detail="Media item has no primary key")

    existing = _ready_existing_derivative(session, media, kind)
    if existing:
        return existing

    media.processing_status = "processing"
    media.processing_error = None
    session.add(media)
    session.commit()

    try:
        raw = _photo_source_bytes_for_kind(session, media, kind)
        output_key, width, height, size = _write_photo_derivative(media, kind, raw)
        derivative = media_repo.upsert_derivative(
            session,
            media_item_id=media.id,
            kind=kind,
            storage_backend=settings.media_storage_backend,
            storage_key=output_key,
            content_type="image/jpeg",
            width=width,
            height=height,
            size=size,
            status="ready",
            error=None,
        )

        # Only the requested kind was generated here, so the item stays "queued"
        # until thumbnail/grid/preview all exist. That is honest for the item as
        # a whole; the background processor
        # (`media_processing_service.process_media_queue`) is what fills in the
        # remaining kinds, and it must keep requesting every missing kind or
        # items would never reach "ready".
        media.processing_status = "ready" if _all_photo_derivatives_ready(session, media) else "queued"
        media.processing_error = None
        session.add(media)
        session.commit()
        return derivative
    except HTTPException:
        raise
    except Exception as exc:
        detail = _error_detail(exc)
        media.processing_status = "failed"
        media.processing_error = detail
        session.add(media)
        session.commit()
        if media.id is not None:
            media_repo.upsert_derivative(
                session,
                media_item_id=media.id,
                kind=kind,
                storage_backend=settings.media_storage_backend,
                storage_key=_storage_key(media, kind),
                content_type="image/jpeg",
                status="failed",
                error=detail,
            )
        raise HTTPException(status_code=502, detail=f"Could not generate derivative: {detail}") from exc


def get_or_create_video_poster_for_media(
    session: Session,
    media: MediaItem,
) -> MediaDerivative:
    """Return a cached video poster, generating it from Drive thumbnail or ffmpeg."""
    if media.media_type != "video":
        raise HTTPException(status_code=400, detail="Video poster requested for non-video media")
    if media.id is None:
        raise HTTPException(status_code=500, detail="Media item has no primary key")

    existing = _ready_existing_derivative(session, media, VIDEO_POSTER_KIND)
    if existing:
        return existing

    media.processing_status = "processing"
    media.processing_error = None
    session.add(media)
    session.commit()

    try:
        raw = (
            _download_drive_thumbnail(session, media, media.drive_thumbnail_url)
            if media.drive_thumbnail_url
            else _extract_video_poster_with_ffmpeg(session, media)
        )
        output_key, width, height, size = _write_video_poster(media, raw)
        derivative = media_repo.upsert_derivative(
            session,
            media_item_id=media.id,
            kind=VIDEO_POSTER_KIND,
            storage_backend=settings.media_storage_backend,
            storage_key=output_key,
            content_type="image/jpeg",
            width=width,
            height=height,
            size=size,
            status="ready",
            error=None,
        )
        media.processing_status = "ready"
        media.processing_error = None
        session.add(media)
        session.commit()
        return derivative
    except HTTPException:
        raise
    except Exception as exc:
        detail = _error_detail(exc)
        media.processing_status = "failed"
        media.processing_error = detail
        session.add(media)
        session.commit()
        media_repo.upsert_derivative(
            session,
            media_item_id=media.id,
            kind=VIDEO_POSTER_KIND,
            storage_backend=settings.media_storage_backend,
            storage_key=_storage_key(media, VIDEO_POSTER_KIND),
            content_type="image/jpeg",
            status="failed",
            error=detail,
        )
        raise HTTPException(status_code=502, detail=f"Could not generate video poster: {detail}") from exc


def get_or_create_video_playback_for_media(
    session: Session,
    media: MediaItem,
) -> MediaDerivative:
    """Return a browser-safe cached MP4 derivative, transcoding on first request."""
    if media.media_type != "video":
        raise HTTPException(status_code=400, detail="Video playback requested for non-video media")
    if media.id is None:
        raise HTTPException(status_code=500, detail="Media item has no primary key")

    existing = _ready_existing_derivative(session, media, VIDEO_PLAYBACK_KIND)
    if existing:
        return existing

    media.processing_status = "processing"
    media.processing_error = None
    session.add(media)
    session.commit()

    try:
        output_key, width, height, size = _transcode_video_to_mp4(session, media)
        derivative = media_repo.upsert_derivative(
            session,
            media_item_id=media.id,
            kind=VIDEO_PLAYBACK_KIND,
            storage_backend=settings.media_storage_backend,
            storage_key=output_key,
            content_type="video/mp4",
            width=width,
            height=height,
            size=size,
            status="ready",
            error=None,
        )
        media.processing_status = "ready"
        media.processing_error = None
        session.add(media)
        session.commit()
        return derivative
    except HTTPException:
        raise
    except Exception as exc:
        detail = _error_detail(exc)
        media.processing_status = "failed"
        media.processing_error = detail
        session.add(media)
        session.commit()
        media_repo.upsert_derivative(
            session,
            media_item_id=media.id,
            kind=VIDEO_PLAYBACK_KIND,
            storage_backend=settings.media_storage_backend,
            storage_key=_storage_key(media, VIDEO_PLAYBACK_KIND),
            content_type="video/mp4",
            status="failed",
            error=detail,
        )
        raise HTTPException(status_code=502, detail=f"Could not generate video playback: {detail}") from exc
