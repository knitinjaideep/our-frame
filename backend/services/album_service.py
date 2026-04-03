"""
Album service: syncs Drive folder data into DB and serves album responses.
Google Drive remains the source of truth; DB is a cache + enrichment layer.
"""
from __future__ import annotations

from datetime import datetime
from sqlmodel import Session

from core.config import settings
from core.exceptions import ReauthRequired
from models.album import DriveAlbum
from models.photo import DrivePhoto
from repositories import album_repo, photo_repo
from schemas.album import AlbumSummary, AlbumDetail, AlbumsListResponse
from schemas.photo import PhotoResponse
from services.drive_service import list_children


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


def sync_album(session: Session, folder_id: str, parent_id: str | None = None) -> DriveAlbum:
    """
    Fetch one folder's children from Drive, cache albums + photos in DB.
    Returns the DriveAlbum record.
    """
    data = list_children(folder_id)

    # Upsert sub-folders as albums
    for f in data["folders"]:
        album_repo.upsert(
            session,
            DriveAlbum(
                id=f["id"],
                name=f["name"],
                parent_id=folder_id,
                last_synced=datetime.utcnow(),
            ),
        )

    # Upsert photos
    cover_photo_id = None
    for idx, p in enumerate(data["files"]):
        created = None
        if p.get("createdTime"):
            try:
                created = datetime.fromisoformat(p["createdTime"].replace("Z", "+00:00"))
            except Exception:
                pass

        photo = DrivePhoto(
            id=p["id"],
            name=p["name"],
            mime_type=p["mimeType"],
            parent_folder_id=folder_id,
            created_time=created,
            size=int(p["size"]) if p.get("size") else None,
            width=p.get("width"),
            height=p.get("height"),
            web_view_link=p.get("webViewLink"),
        )
        photo_repo.upsert(session, photo)
        if idx == 0:
            cover_photo_id = p["id"]

    # Upsert this album itself
    album = album_repo.upsert(
        session,
        DriveAlbum(
            id=folder_id,
            name="",           # caller sets name if known
            parent_id=parent_id,
            cover_photo_id=cover_photo_id,
            photo_count=len(data["files"]),
            last_synced=datetime.utcnow(),
        ),
    )
    return album


def get_root_albums(session: Session) -> AlbumsListResponse:
    root_id = settings.effective_root_folder

    # Sync from Drive, then return from DB
    try:
        data = list_children(root_id)
        for f in data["folders"]:
            album_repo.upsert(
                session,
                DriveAlbum(
                    id=f["id"],
                    name=f["name"],
                    parent_id=None,
                    last_synced=datetime.utcnow(),
                ),
            )
    except ReauthRequired:
        pass  # serve stale cache if Drive is unavailable

    albums = album_repo.get_root_albums(session)

    # Backfill cover photos for albums that don't have one yet
    for album in albums:
        if not album.cover_photo_id:
            try:
                children = list_children(album.id)
                if children["files"]:
                    first = children["files"][0]
                    album.cover_photo_id = first["id"]
                    album.photo_count = len(children["files"])
                    album_repo.upsert(session, album)
            except Exception:
                pass

    summaries = [_to_album_summary(a) for a in albums]
    return AlbumsListResponse(albums=summaries, total=len(summaries))


def get_album_detail(
    session: Session,
    album_id: str,
    fav_ids: set[str],
) -> AlbumDetail:
    """Sync one album from Drive and return detail response."""
    try:
        data = list_children(album_id)

        # Update sub-albums
        for f in data["folders"]:
            album_repo.upsert(
                session,
                DriveAlbum(id=f["id"], name=f["name"], parent_id=album_id),
            )

        # Update photos
        cover_id = None
        for idx, p in enumerate(data["files"]):
            created = None
            if p.get("createdTime"):
                try:
                    created = datetime.fromisoformat(p["createdTime"].replace("Z", "+00:00"))
                except Exception:
                    pass
            dr = DrivePhoto(
                id=p["id"],
                name=p["name"],
                mime_type=p["mimeType"],
                parent_folder_id=album_id,
                created_time=created,
                size=int(p["size"]) if p.get("size") else None,
                width=p.get("width"),
                height=p.get("height"),
                web_view_link=p.get("webViewLink"),
            )
            photo_repo.upsert(session, dr)
            if idx == 0:
                cover_id = p["id"]

        # Update album record
        existing = album_repo.get_by_id(session, album_id)
        name = existing.name if existing else ""
        album_repo.upsert(
            session,
            DriveAlbum(
                id=album_id,
                name=name,
                cover_photo_id=cover_id,
                photo_count=len(data["files"]),
                last_synced=datetime.utcnow(),
            ),
        )
    except Exception:
        pass  # fall through to cached data

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
