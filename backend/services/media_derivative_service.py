from __future__ import annotations

import re
import shutil
import subprocess
import tempfile
from pathlib import Path

from fastapi import HTTPException
import requests
from sqlmodel import Session

from core.config import settings
from drive.image_utils import open_image, to_jpeg_bytes
from drive.service import download_file_bytes, get_drive_service
from google_drive_client import get_credentials
from models.media import MediaDerivative, MediaItem
from repositories import media_repo


PHOTO_DERIVATIVE_SIZES = {
    "thumbnail": 400,
    "grid": 900,
    "preview": 1800,
}
VIDEO_POSTER_KIND = "poster"
VIDEO_POSTER_SIZE = 900


def _cache_root() -> Path:
    root = Path(settings.media_cache_root)
    if not root.is_absolute():
        root = Path(__file__).resolve().parent.parent / root
    return root


def _safe_segment(value: str) -> str:
    return re.sub(r"[^A-Za-z0-9_.-]", "_", value)


def _storage_key(media: MediaItem, kind: str) -> str:
    if media.id is None:
        raise ValueError("Media item has no primary key")
    folder = "videos" if media.media_type == "video" else "photos"
    return f"{folder}/{media.id}-{_safe_segment(media.drive_file_id)}/{kind}.jpg"


def _path_for_key(storage_key: str) -> Path:
    return _cache_root() / storage_key


def derivative_path(derivative: MediaDerivative) -> Path:
    if derivative.storage_backend != "local":
        raise ValueError(f"Unsupported derivative storage backend: {derivative.storage_backend}")
    return _path_for_key(derivative.storage_key)


def _ready_existing_derivative(
    session: Session,
    media: MediaItem,
    kind: str,
) -> MediaDerivative | None:
    derivative = media_repo.get_derivative(session, media.id, kind) if media.id else None
    if not derivative or derivative.status != "ready":
        return None
    if derivative.storage_backend == "local" and derivative_path(derivative).exists():
        return derivative
    return None


def _all_photo_derivatives_ready(session: Session, media: MediaItem) -> bool:
    if media.id is None:
        return False
    return all(_ready_existing_derivative(session, media, kind) for kind in PHOTO_DERIVATIVE_SIZES)


def _write_photo_derivative(media: MediaItem, kind: str, raw: bytes) -> tuple[str, int, int, int]:
    img = open_image(raw)
    max_size = PHOTO_DERIVATIVE_SIZES[kind]
    if img.width > max_size or img.height > max_size:
        img.thumbnail((max_size, max_size))

    jpeg = to_jpeg_bytes(img, quality=82 if kind == "thumbnail" else 86)
    output_key = _storage_key(media, kind)
    output_path = _path_for_key(output_key)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_bytes(jpeg.getvalue())
    return output_key, img.width, img.height, output_path.stat().st_size


def _write_video_poster(media: MediaItem, raw: bytes) -> tuple[str, int, int, int]:
    img = open_image(raw)
    if img.width > VIDEO_POSTER_SIZE or img.height > VIDEO_POSTER_SIZE:
        img.thumbnail((VIDEO_POSTER_SIZE, VIDEO_POSTER_SIZE))

    jpeg = to_jpeg_bytes(img, quality=84)
    output_key = _storage_key(media, VIDEO_POSTER_KIND)
    output_path = _path_for_key(output_key)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_bytes(jpeg.getvalue())
    return output_key, img.width, img.height, output_path.stat().st_size


def _download_drive_thumbnail(thumbnail_url: str) -> bytes:
    creds = get_credentials()
    response = requests.get(
        thumbnail_url,
        headers={"Authorization": f"Bearer {creds.token}"},
        timeout=30,
    )
    response.raise_for_status()
    return response.content


def _extract_video_poster_with_ffmpeg(media: MediaItem) -> bytes:
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise RuntimeError("ffmpeg is not installed; cannot generate video poster")

    svc = get_drive_service()
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


def get_or_create_photo_derivative(
    session: Session,
    drive_file_id: str,
    kind: str,
) -> MediaDerivative:
    media = media_repo.get_item_by_drive_file(session, drive_file_id)
    if not media:
        raise HTTPException(status_code=404, detail="Media item not found. Run Drive sync first.")
    return get_or_create_photo_derivative_for_media(session, media, kind)


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
        svc = get_drive_service()
        raw = download_file_bytes(svc, media.drive_file_id)

        for derivative_kind in PHOTO_DERIVATIVE_SIZES:
            if _ready_existing_derivative(session, media, derivative_kind):
                continue
            output_key, width, height, size = _write_photo_derivative(media, derivative_kind, raw)
            media_repo.upsert_derivative(
                session,
                media_item_id=media.id,
                kind=derivative_kind,
                storage_backend="local",
                storage_key=output_key,
                content_type="image/jpeg",
                width=width,
                height=height,
                size=size,
                status="ready",
                error=None,
            )

        derivative = _ready_existing_derivative(session, media, kind)
        if derivative is None:
            raise RuntimeError(f"Derivative {kind} was not created")

        media.processing_status = "ready" if _all_photo_derivatives_ready(session, media) else "queued"
        media.processing_error = None
        session.add(media)
        session.commit()
        return derivative
    except HTTPException:
        raise
    except Exception as exc:
        media.processing_status = "failed"
        media.processing_error = str(exc)
        session.add(media)
        session.commit()
        if media.id is not None:
            media_repo.upsert_derivative(
                session,
                media_item_id=media.id,
                kind=kind,
                storage_backend="local",
                storage_key=_storage_key(media, kind),
                content_type="image/jpeg",
                status="failed",
                error=str(exc),
            )
        raise HTTPException(status_code=502, detail=f"Could not generate derivative: {exc}") from exc


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
            _download_drive_thumbnail(media.drive_thumbnail_url)
            if media.drive_thumbnail_url
            else _extract_video_poster_with_ffmpeg(media)
        )
        output_key, width, height, size = _write_video_poster(media, raw)
        derivative = media_repo.upsert_derivative(
            session,
            media_item_id=media.id,
            kind=VIDEO_POSTER_KIND,
            storage_backend="local",
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
        media.processing_status = "failed"
        media.processing_error = str(exc)
        session.add(media)
        session.commit()
        media_repo.upsert_derivative(
            session,
            media_item_id=media.id,
            kind=VIDEO_POSTER_KIND,
            storage_backend="local",
            storage_key=_storage_key(media, VIDEO_POSTER_KIND),
            content_type="image/jpeg",
            status="failed",
            error=str(exc),
        )
        raise HTTPException(status_code=502, detail=f"Could not generate video poster: {exc}") from exc
