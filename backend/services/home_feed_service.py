"""
Assembles the home feed response from DB data.

Sync is handled by sync_service (startup + manual trigger).
This service is read-only — it simply queries the DB.

excluded albums are filtered out by the repository layer.

Phase 2 shape: hero_photos + throwbacks + stats only.
Favorites are fetched separately by the frontend hook.
"""
from __future__ import annotations

from datetime import datetime, timezone
from sqlmodel import Session

from repositories import album_repo, photo_repo, favorites_repo
from schemas.home_feed import HomeFeedResponse, MemoryStats, ThrowbackGroup
from schemas.photo import PhotoResponse
from models.photo import DrivePhoto


def _photo_url(photo_id: str, size: int = 600) -> str:
    return f"/drive/file/{photo_id}/thumbnail?s={size}"


def _preview_url(photo_id: str, width: int = 1600) -> str:
    return f"/drive/file/{photo_id}/preview?w={width}"


def _to_photo_resp(p: DrivePhoto, fav_ids: set[str]) -> PhotoResponse:
    return PhotoResponse(
        id=p.id,
        name=p.name,
        mime_type=p.mime_type,
        created_time=p.created_time,
        thumbnail_url=_photo_url(p.id),
        preview_url=_preview_url(p.id),
        is_favorite=p.id in fav_ids,
        width=p.width,
        height=p.height,
    )


def _is_hero_worthy(p: DrivePhoto) -> bool:
    """
    Filter for hero-quality photos:
    - Images only (no video in the hero slideshow)
    - At least 800px wide (no tiny thumbnails stretched full-screen)
    """
    if p.mime_type and p.mime_type.startswith("video/"):
        return False
    if p.width and p.width < 800:
        return False
    return True


def _hero_score(p: DrivePhoto) -> float:
    """
    Score a photo for hero candidacy. Higher = better.
    Rewards landscape orientation and larger resolution.
    """
    if p.width and p.height and p.height > 0:
        aspect = p.width / p.height
        # 16:9 landscape ≈ 1.78 scores best; square/portrait penalised
        landscape_bonus = min(aspect / 1.5, 1.5)
    else:
        landscape_bonus = 0.5
    size_bonus = min((p.width or 0) / 2000, 1.0)
    return landscape_bonus + size_bonus


def get_home_feed(session: Session) -> HomeFeedResponse:
    fav_ids = favorites_repo.get_all_photo_ids(session)
    albums = album_repo.get_root_albums(session)  # excluded already filtered

    # ── Hero photos ──────────────────────────────────────────────────────────
    # Collect candidates from albums that have a cover photo,
    # cap at 4 per album for variety, score by landscape preference.
    hero_candidates: list[DrivePhoto] = []
    for album in albums:
        if not album.cover_photo_id:
            continue
        photos = photo_repo.get_by_folder(session, album.id)
        worthy = [p for p in photos if _is_hero_worthy(p)]
        worthy.sort(key=_hero_score, reverse=True)
        hero_candidates.extend(worthy[:4])

    hero_candidates.sort(key=_hero_score, reverse=True)
    hero_photos = [_to_photo_resp(p, fav_ids) for p in hero_candidates[:15]]

    # ── Throwbacks: same month+day in prior years ─────────────────────────────
    now = datetime.now(tz=timezone.utc)
    throwback_photos_raw = photo_repo.get_by_month_day(session, now.month, now.day)
    current_year = now.year

    year_groups: dict[int, list[DrivePhoto]] = {}
    for p in throwback_photos_raw:
        if p.created_time and p.created_time.year < current_year:
            year = p.created_time.year
            year_groups.setdefault(year, []).append(p)

    throwbacks = []
    for year in sorted(year_groups.keys(), reverse=True)[:3]:
        years_ago = current_year - year
        label = f"{years_ago} year{'s' if years_ago != 1 else ''} ago"
        throwbacks.append(
            ThrowbackGroup(
                year=year,
                label=label,
                photos=[_to_photo_resp(p, fav_ids) for p in year_groups[year][:6]],
            )
        )

    # ── Stats ─────────────────────────────────────────────────────────────────
    all_photos = photo_repo.count_all(session)
    all_albums_count = album_repo.count_all(session)
    all_favs = len(fav_ids)

    years = [
        p.created_time.year
        for album in albums
        for p in photo_repo.get_by_folder(session, album.id)
        if p.created_time
    ]
    oldest = min(years) if years else None
    newest = max(years) if years else None

    stats = MemoryStats(
        total_photos=all_photos,
        total_albums=all_albums_count,
        total_favorites=all_favs,
        oldest_year=oldest,
        newest_year=newest,
    )

    return HomeFeedResponse(
        hero_photos=hero_photos,
        throwbacks=throwbacks,
        stats=stats,
    )
