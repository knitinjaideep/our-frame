"""
Slideshow service.

Logic:
  - If favorites exist → return all favorited photos in random order
  - If no favorites → fallback to top 15 recent landscape photos
"""
from __future__ import annotations

import random
from sqlmodel import Session, select

from models.photo import DrivePhoto
from models.favorite import Favorite
from repositories import photo_repo
from schemas.photo import PhotoResponse


def _photo_url(photo_id: str, size: int = 600) -> str:
    return f"/drive/file/{photo_id}/thumbnail?s={size}"


def _preview_url(photo_id: str, width: int = 1600) -> str:
    return f"/drive/file/{photo_id}/preview?w={width}"


def _to_photo_resp(p: DrivePhoto, fav_ids: set[str]) -> PhotoResponse:
    is_video = p.mime_type and p.mime_type.startswith("video/")
    return PhotoResponse(
        id=p.id,
        name=p.name,
        mime_type=p.mime_type,
        created_time=p.created_time,
        thumbnail_url=None if is_video else _photo_url(p.id),
        preview_url=_preview_url(p.id),
        is_favorite=p.id in fav_ids,
        width=p.width,
        height=p.height,
    )


def _is_slideshow_worthy(p: DrivePhoto) -> bool:
    """Images only, at least 800px wide."""
    if p.mime_type and p.mime_type.startswith("video/"):
        return False
    if p.width and p.width < 800:
        return False
    return True


def _score(p: DrivePhoto) -> float:
    if p.width and p.height and p.height > 0:
        aspect = p.width / p.height
        landscape_bonus = min(aspect / 1.5, 1.5)
    else:
        landscape_bonus = 0.5
    size_bonus = min((p.width or 0) / 2000, 1.0)
    return landscape_bonus + size_bonus


def get_slideshow_photos(session: Session) -> list[PhotoResponse]:
    """
    Returns photos for the hero slideshow.
    Priority: favorited images → fallback to top scored recent images.
    """
    fav_ids: set[str] = set(session.exec(select(Favorite.photo_id)).all())

    if fav_ids:
        # Fetch all favorited photos, shuffle for variety
        rows = session.exec(
            select(DrivePhoto).where(DrivePhoto.id.in_(fav_ids))
        ).all()
        worthy = [p for p in rows if _is_slideshow_worthy(p)]
        random.shuffle(worthy)
        if worthy:
            return [_to_photo_resp(p, fav_ids) for p in worthy]

    # Fallback: recent wide photos across all albums
    all_photos = session.exec(
        select(DrivePhoto).order_by(DrivePhoto.created_time.desc())
    ).all()
    worthy = [p for p in all_photos if _is_slideshow_worthy(p)]
    worthy.sort(key=_score, reverse=True)
    return [_to_photo_resp(p, fav_ids) for p in worthy[:15]]
