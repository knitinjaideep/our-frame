"""
Sync service: synchronises Google Drive folder structure into the DB.

Strategy
--------
- Drive is the upstream source of truth.
- DB is the operational read layer.
- On app startup: run a lightweight sync if root was not synced in the last
  SYNC_STALE_SECONDS seconds.  This keeps data reasonably fresh without hitting
  Drive on every request.
- Manual sync: POST /sync/drive triggers a full rescan immediately.
- Album-detail syncs: when a user opens a specific album we do a shallow sync of
  just that one folder so photos stay up to date.

The sync does NOT touch excluded albums further than marking them (exclusion is
a UI layer concern — the folder stays in DB but is filtered at query time).
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone, timedelta
from sqlmodel import Session

from core.config import settings
from core.exceptions import ReauthRequired, DriveError
from models.album import DriveAlbum
from models.section_mapping import SectionMapping
from repositories import album_repo, photo_repo
from services.drive_service import list_children, get_drive_client

logger = logging.getLogger(__name__)

# How old a root sync can be before we re-sync on startup
SYNC_STALE_SECONDS = 3600  # 1 hour


# ── helpers ───────────────────────────────────────────────────────────────────

def _utcnow() -> datetime:
    return datetime.now(tz=timezone.utc)


def _is_stale(last_synced: datetime | None, threshold_seconds: int = SYNC_STALE_SECONDS) -> bool:
    if last_synced is None:
        return True
    # normalise to UTC
    if last_synced.tzinfo is None:
        last_synced = last_synced.replace(tzinfo=timezone.utc)
    return (_utcnow() - last_synced).total_seconds() > threshold_seconds


def _upsert_album_from_drive(
    session: Session,
    folder_id: str,
    name: str,
    parent_id: str | None,
    drive_modified_time: datetime | None = None,
) -> DriveAlbum:
    existing = album_repo.get_by_id(session, folder_id)
    now = _utcnow()

    if existing:
        # Only update fields that Drive owns; preserve app-controlled fields
        # (excluded, section) unless they haven't been set.
        existing.name = name
        existing.parent_id = parent_id
        if drive_modified_time:
            existing.drive_modified_time = drive_modified_time
        existing.last_synced = now
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing

    album = DriveAlbum(
        id=folder_id,
        name=name,
        parent_id=parent_id,
        drive_modified_time=drive_modified_time,
        last_synced=now,
    )
    session.add(album)
    session.commit()
    session.refresh(album)
    return album


def _apply_section_mapping(session: Session, album: DriveAlbum) -> None:
    """If a SectionMapping row exists for this folder, stamp album.section."""
    from sqlmodel import select
    stmt = select(SectionMapping).where(SectionMapping.folder_id == album.id)
    mapping = session.exec(stmt).first()
    if mapping and album.section != mapping.section_key:
        album.section = mapping.section_key
        session.add(album)
        session.commit()


# ── core sync routines ────────────────────────────────────────────────────────

def sync_folder_shallow(session: Session, folder_id: str) -> dict:
    """
    Sync ONE folder's immediate children from Drive into the DB.
    Updates sub-folder records and photo records.
    Returns summary dict.
    """
    now = _utcnow()
    data = list_children(folder_id)

    # Upsert sub-folders
    for f in data["folders"]:
        modified = None
        if f.get("modifiedTime"):
            try:
                modified = datetime.fromisoformat(f["modifiedTime"].replace("Z", "+00:00"))
            except Exception:
                pass
        _upsert_album_from_drive(session, f["id"], f["name"], folder_id, modified)

    # Update child_count on the parent album
    parent = album_repo.get_by_id(session, folder_id)
    if parent:
        parent.child_count = len(data["folders"])

    # Upsert photos
    cover_photo_id: str | None = None
    for idx, p in enumerate(data["files"]):
        created = None
        if p.get("createdTime"):
            try:
                created = datetime.fromisoformat(p["createdTime"].replace("Z", "+00:00"))
            except Exception:
                pass
        modified = None
        if p.get("modifiedTime"):
            try:
                modified = datetime.fromisoformat(p["modifiedTime"].replace("Z", "+00:00"))
            except Exception:
                pass

        from models.photo import DrivePhoto
        photo = DrivePhoto(
            id=p["id"],
            name=p["name"],
            mime_type=p["mimeType"],
            parent_folder_id=folder_id,
            created_time=created,
            modified_time=modified,
            size=int(p["size"]) if p.get("size") else None,
            width=p.get("width"),
            height=p.get("height"),
            web_view_link=p.get("webViewLink"),
        )
        photo_repo.upsert(session, photo)
        if idx == 0:
            cover_photo_id = p["id"]

    # Update the album record we just synced
    if parent:
        if cover_photo_id and not parent.cover_photo_id:
            parent.cover_photo_id = cover_photo_id
        parent.photo_count = len(data["files"])
        parent.last_synced = now
        session.add(parent)
        session.commit()

    return {
        "folder_id": folder_id,
        "folders_synced": len(data["folders"]),
        "photos_synced": len(data["files"]),
    }


def sync_root(session: Session) -> dict:
    """
    Full sync of root → child albums.
    - Upserts all root-level folders.
    - For each root folder, does a shallow sync to get photos + sub-folders.
    - Applies section mappings.
    - Does NOT recurse into sub-sub-folders (keep it bounded).
    Returns a summary.
    """
    root_id = settings.effective_root_folder
    if not root_id:
        logger.warning("sync_root: no root folder configured, skipping")
        return {"skipped": True, "reason": "no root folder configured"}

    logger.info("sync_root: starting full Drive sync from root=%s", root_id)
    now = _utcnow()
    total_folders = 0
    total_photos = 0

    try:
        root_data = list_children(root_id)
    except ReauthRequired:
        logger.warning("sync_root: not authenticated, serving stale cache")
        return {"skipped": True, "reason": "not authenticated"}
    except DriveError as e:
        logger.error("sync_root: Drive error: %s", e)
        return {"skipped": True, "reason": str(e)}

    # Upsert top-level album folders
    root_folders = root_data["folders"]
    for f in root_folders:
        modified = None
        if f.get("modifiedTime"):
            try:
                modified = datetime.fromisoformat(f["modifiedTime"].replace("Z", "+00:00"))
            except Exception:
                pass
        album = _upsert_album_from_drive(session, f["id"], f["name"], None, modified)
        _apply_section_mapping(session, album)
        total_folders += 1

    # Shallow-sync each top-level album (get their photos + sub-folders)
    synced_ids = {f["id"] for f in root_folders}
    sub_folder_ids: list[str] = []
    for f in root_folders:
        try:
            result = sync_folder_shallow(session, f["id"])
            total_photos += result["photos_synced"]
            total_folders += result["folders_synced"]
            # Collect sub-folders so we can sync one level deeper
            children = album_repo.get_by_parent(session, f["id"])
            sub_folder_ids.extend(c.id for c in children)
        except (ReauthRequired, DriveError) as e:
            logger.warning("sync_root: skipping folder %s: %s", f["id"], e)

    # Sync sub-albums (root → album → sub-album) so nested photos are loaded
    sub_sub_folder_ids: list[str] = []
    for sub_id in sub_folder_ids:
        try:
            result = sync_folder_shallow(session, sub_id)
            total_photos += result["photos_synced"]
            total_folders += result["folders_synced"]
            # Collect one more level for deep structures like Videos/Arjun/...
            grandchildren = album_repo.get_by_parent(session, sub_id)
            sub_sub_folder_ids.extend(c.id for c in grandchildren)
        except (ReauthRequired, DriveError) as e:
            logger.warning("sync_root: skipping sub-folder %s: %s", sub_id, e)

    # Sync one more level deep (root → album → sub-album → sub-sub-album)
    # This covers structures like Videos/Arjun/2024/video.mp4
    for sub_sub_id in sub_sub_folder_ids:
        try:
            result = sync_folder_shallow(session, sub_sub_id)
            total_photos += result["photos_synced"]
            total_folders += result["folders_synced"]
        except (ReauthRequired, DriveError) as e:
            logger.warning("sync_root: skipping sub-sub-folder %s: %s", sub_sub_id, e)

    logger.info(
        "sync_root: done — %d folders, %d photos synced",
        total_folders,
        total_photos,
    )
    return {
        "synced_at": now.isoformat(),
        "root_folders": len(root_folders),
        "total_folders": total_folders,
        "total_photos": total_photos,
    }


def maybe_sync_on_startup(session: Session) -> None:
    """
    Called at app startup. Runs a full sync only if:
    - There are no root albums in DB (first run), OR
    - The most recently synced root album is older than SYNC_STALE_SECONDS.

    This avoids expensive Drive reads on every restart while keeping data fresh.
    """
    root_albums = album_repo.get_root_albums(session)

    if not root_albums:
        logger.info("maybe_sync_on_startup: no albums in DB, running initial sync")
        sync_root(session)
        return

    most_recent_sync = max(
        (a.last_synced for a in root_albums if a.last_synced),
        default=None,
    )

    if _is_stale(most_recent_sync):
        logger.info(
            "maybe_sync_on_startup: last sync=%s is stale, re-syncing",
            most_recent_sync,
        )
        sync_root(session)
    else:
        logger.info(
            "maybe_sync_on_startup: last sync=%s is fresh, skipping",
            most_recent_sync,
        )
