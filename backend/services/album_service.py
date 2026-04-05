"""
Album service: DB-first reads.

Google Drive sync is handled by sync_service (on startup + manual trigger).
This service only reads from the DB and does a targeted shallow sync when
a user opens a specific album detail page (to keep photo lists fresh).
"""
from __future__ import annotations

from sqlmodel import Session

from models.album import DriveAlbum
from models.photo import DrivePhoto
from repositories import album_repo, photo_repo
from schemas.album import AlbumSummary, AlbumDetail, AlbumsListResponse
from schemas.photo import PhotoResponse
from services.sync_service import sync_folder_shallow
from core.exceptions import ReauthRequired, DriveError


def _photo_url(photo_id: str, size: int = 600) -> str:
    return f"/drive/file/{photo_id}/thumbnail?s={size}"


def _preview_url(photo_id: str, width: int = 1600) -> str:
    return f"/drive/file/{photo_id}/preview?w={width}"


def _to_photo_response(p: DrivePhoto, fav_ids: set[str]) -> PhotoResponse:
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


def _to_album_summary(album: DriveAlbum) -> AlbumSummary:
    return AlbumSummary(
        id=album.id,
        name=album.name,
        cover_photo_id=album.cover_photo_id,
        photo_count=album.photo_count,
        thumbnail_url=_photo_url(album.cover_photo_id) if album.cover_photo_id else None,
    )


def get_root_albums(session: Session) -> AlbumsListResponse:
    """Return root-level albums from DB (excluded folders filtered out)."""
    albums = album_repo.get_root_albums(session)
    summaries = [_to_album_summary(a) for a in albums]
    return AlbumsListResponse(albums=summaries, total=len(summaries))


def get_album_detail(
    session: Session,
    album_id: str,
    fav_ids: set[str],
) -> AlbumDetail:
    """
    Return album detail from DB.
    Triggers a shallow sync of just this folder to keep photos fresh.
    Falls back gracefully to stale cache if Drive is unreachable.
    """
    # Shallow sync this specific album on open (bounded cost — one folder)
    try:
        sync_folder_shallow(session, album_id)
    except (ReauthRequired, DriveError):
        pass  # serve stale cache

    album = album_repo.get_by_id(session, album_id)
    photos = photo_repo.get_by_folder(session, album_id)
    subfolders_raw = album_repo.get_by_parent(session, album_id)

    album_summary = _to_album_summary(album) if album else AlbumSummary(
        id=album_id, name="Album", cover_photo_id=None, photo_count=None, thumbnail_url=None
    )

    return AlbumDetail(
        album=album_summary,
        photos=[_to_photo_response(p, fav_ids) for p in photos],
        subfolders=[_to_album_summary(a) for a in subfolders_raw],
    )
