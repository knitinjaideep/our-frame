"""
Assembles the home feed response from cached DB data + Drive sync.
"""
from __future__ import annotations

from datetime import datetime, timezone
from sqlmodel import Session

from core.config import settings
from repositories import album_repo, photo_repo, favorites_repo
from schemas.home_feed import HomeFeedResponse, MemoryStats, ThrowbackGroup
from schemas.photo import PhotoResponse
from schemas.album import AlbumSummary
from models.photo import DrivePhoto
from models.album import DriveAlbum


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


def _to_album_summary(a: DriveAlbum) -> AlbumSummary:
    return AlbumSummary(
        id=a.id,
        name=a.name,
        cover_photo_id=a.cover_photo_id,
        photo_count=a.photo_count,
        thumbnail_url=_photo_url(a.cover_photo_id) if a.cover_photo_id else None,
    )


def get_home_feed(session: Session) -> HomeFeedResponse:
    fav_ids = favorites_repo.get_all_photo_ids(session)
    albums = album_repo.get_root_albums(session)

    # Hero: pick up to 15 photos from albums that have a cover
    hero_photos: list[PhotoResponse] = []
    for album in albums:
        if album.cover_photo_id and len(hero_photos) < 15:
            photos = photo_repo.get_by_folder(session, album.id)
            for p in photos[:3]:
                if len(hero_photos) >= 15:
                    break
                hero_photos.append(_to_photo_resp(p, fav_ids))

    # Featured albums: those with cover photos, up to 6
    featured = [a for a in albums if a.cover_photo_id][:6]

    # Recent albums: last synced, up to 4
    recent = sorted(
        [a for a in albums if a.last_synced],
        key=lambda a: a.last_synced,
        reverse=True,
    )[:4]

    # Throwbacks: photos from same month+day in prior years
    now = datetime.now(tz=timezone.utc)
    throwback_photos_raw = photo_repo.get_by_month_day(session, now.month, now.day)
    current_year = now.year

    # Group by year, exclude current year
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

    # Stats
    all_photos = photo_repo.count_all(session)
    all_albums = album_repo.count_all(session)
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
        total_albums=all_albums,
        total_favorites=all_favs,
        oldest_year=oldest,
        newest_year=newest,
    )

    return HomeFeedResponse(
        hero_photos=hero_photos,
        recent_albums=[_to_album_summary(a) for a in recent],
        featured_albums=[_to_album_summary(a) for a in featured],
        throwbacks=throwbacks,
        stats=stats,
    )
